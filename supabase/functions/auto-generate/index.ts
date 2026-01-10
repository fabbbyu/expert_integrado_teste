import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar autenticação (opcional para auto-generate, mas melhor ter)
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        global: {
          headers: { Authorization: authHeader },
        },
      })
      const { error: authError } = await supabaseAuth.auth.getUser(token)
      if (authError) {
        console.warn('Erro de autenticação em auto-generate:', authError)
        // Não bloqueia, mas loga o erro
      }
    }

    const { leadId, newStageId } = await req.json()

    if (!leadId || !newStageId) {
      return new Response(
        JSON.stringify({ error: 'leadId e newStageId são obrigatórios' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Buscar lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      throw new Error('Lead não encontrado')
    }

    // Buscar campanhas ativas com esta etapa como gatilho
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('workspace_id', lead.workspace_id)
      .eq('is_active', true)
      .eq('trigger_stage_id', newStageId)

    if (campaignsError) {
      throw new Error('Erro ao buscar campanhas')
    }

    if (!campaigns || campaigns.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhuma campanha com gatilho nesta etapa' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Gerar mensagens para cada campanha (em background)
    const results = []
    for (const campaign of campaigns) {
      try {
        // Chamar a função generate-message internamente
        const leadData = {
          nome: lead.name,
          email: lead.email || 'Não informado',
          telefone: lead.phone || 'Não informado',
          empresa: lead.company || 'Não informado',
          cargo: lead.position || 'Não informado',
          origem: lead.source || 'Não informado',
        }

        if (lead.custom_data && typeof lead.custom_data === 'object') {
          const customData = lead.custom_data as Record<string, any>
          Object.entries(customData).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
              leadData[key] = value
            }
          })
        }

        const promptText = `
Você é um assistente de vendas especializado em criar mensagens personalizadas.

CONTEXTO DA CAMPANHA:
${campaign.context}

INSTRUÇÕES DE ESCRITA:
${campaign.prompt}

DADOS DO LEAD:
${JSON.stringify(leadData, null, 2)}

TAREFA:
Gere 3 variações de mensagem personalizada para este lead, considerando:
- O contexto da campanha
- As instruções de escrita fornecidas
- Os dados específicos do lead

FORMATO DE RESPOSTA:
Retorne um JSON com um array chamado "messages" contendo as 3 variações:
{
  "messages": [
    "Primeira variação da mensagem...",
    "Segunda variação da mensagem...",
    "Terceira variação da mensagem..."
  ]
}
`

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'Você é um assistente especializado em criar mensagens de vendas personalizadas. Sempre retorne apenas JSON válido.',
              },
              {
                role: 'user',
                content: promptText,
              },
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        })

        if (!openaiResponse.ok) {
          throw new Error('Erro na API OpenAI')
        }

        const openaiData = await openaiResponse.json()
        const content = openaiData.choices[0]?.message?.content || ''

        let messages: string[] = []
        try {
          const parsed = JSON.parse(content)
          messages = parsed.messages || []
        } catch {
          const lines = content.split('\n').filter((line: string) => line.trim())
          messages = lines.slice(0, 3)
        }

        if (messages.length > 0) {
          await supabase.from('generated_messages').insert({
            lead_id: leadId,
            campaign_id: campaign.id,
            messages: messages,
          })

          results.push({ campaignId: campaign.id, success: true })
        }
      } catch (error) {
        console.error(`Erro ao gerar para campanha ${campaign.id}:`, error)
        results.push({ campaignId: campaign.id, success: false })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        campaignsProcessed: results.length,
        results,
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      }
    )
  } catch (error: any) {
    console.error('Erro na função:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro ao gerar mensagens automaticamente',
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      }
    )
  }
})

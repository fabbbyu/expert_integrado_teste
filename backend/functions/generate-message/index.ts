import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const { leadId, campaignId } = await req.json()

    if (!leadId || !campaignId) {
      return new Response(
        JSON.stringify({ error: 'leadId e campaignId são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Buscar dados do lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        funnel_stages (
          name
        )
      `)
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      throw new Error('Lead não encontrado')
    }

    // Buscar campanha
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      throw new Error('Campanha não encontrada')
    }

    // Construir prompt para OpenAI
    const leadData = {
      nome: lead.name,
      email: lead.email || 'Não informado',
      telefone: lead.phone || 'Não informado',
      empresa: lead.company || 'Não informado',
      cargo: lead.position || 'Não informado',
      origem: lead.source || 'Não informado',
      etapa: lead.funnel_stages?.name || 'Não informado',
    }

    // Adicionar campos personalizados se existirem
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

    // Chamar OpenAI API
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
      const errorData = await openaiResponse.json()
      throw new Error(`Erro na API OpenAI: ${errorData.error?.message || 'Erro desconhecido'}`)
    }

    const openaiData = await openaiResponse.json()
    const content = openaiData.choices[0]?.message?.content || ''

    // Tentar parsear JSON da resposta
    let messages: string[] = []
    try {
      const parsed = JSON.parse(content)
      messages = parsed.messages || []
    } catch {
      // Se não for JSON válido, tentar extrair mensagens do texto
      const lines = content.split('\n').filter((line: string) => line.trim())
      messages = lines.slice(0, 3)
    }

    if (messages.length === 0) {
      messages = ['Erro ao gerar mensagem. Tente novamente.']
    }

    // Salvar mensagens geradas no banco
    const { data: savedMessage, error: saveError } = await supabase
      .from('generated_messages')
      .insert({
        lead_id: leadId,
        campaign_id: campaignId,
        messages: messages,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Erro ao salvar mensagens:', saveError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        messages: messages,
        generated_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Erro na função:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro ao gerar mensagens',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})


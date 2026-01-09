'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  position: string | null
  source: string | null
  notes: string | null
  stage_id: string
  funnel_stages: {
    id: string
    name: string
  } | null
}

interface Campaign {
  id: string
  name: string
  is_active: boolean
}

interface GeneratedMessage {
  id: string
  messages: string[]
  generated_at: string
  campaign_id: string
  campaigns: {
    name: string
  } | null
}

export default function LeadDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const leadId = params.id as string
  const [lead, setLead] = useState<Lead | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('')
  const [generatedMessages, setGeneratedMessages] = useState<GeneratedMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const workspaceId = localStorage.getItem('currentWorkspaceId')
      if (!workspaceId) {
        router.push('/workspaces')
        return
      }
      setCurrentWorkspaceId(workspaceId)
      if (user && leadId) {
        loadLead(workspaceId)
        loadCampaigns(workspaceId)
        loadGeneratedMessages()
      }
    }
  }, [user, leadId, router])

  const loadLead = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          funnel_stages (
            id,
            name
          )
        `)
        .eq('id', leadId)
        .eq('workspace_id', workspaceId)
        .single()

      if (error) throw error
      setLead(data)
    } catch (error) {
      console.error('Erro ao carregar lead:', error)
      router.push('/leads')
    } finally {
      setLoading(false)
    }
  }

  const loadCampaigns = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, is_active')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCampaigns(data || [])
      if (data && data.length > 0) {
        setSelectedCampaignId(data[0].id)
      }
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error)
    }
  }

  const loadGeneratedMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_messages')
        .select(`
          id,
          messages,
          generated_at,
          campaign_id,
          campaigns (
            name
          )
        `)
        .eq('lead_id', leadId)
        .order('generated_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setGeneratedMessages(data || [])
    } catch (error) {
      console.error('Erro ao carregar mensagens geradas:', error)
    }
  }

  const generateMessages = async () => {
    if (!selectedCampaignId) {
      alert('Selecione uma campanha')
      return
    }

    setGenerating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      const { data, error } = await supabase.functions.invoke('generate-message', {
        body: {
          leadId: leadId,
          campaignId: selectedCampaignId,
        },
      })

      if (error) throw error

      if (data.messages) {
        await loadGeneratedMessages()
        alert('Mensagens geradas com sucesso!')
      } else {
        throw new Error('Erro ao gerar mensagens')
      }
    } catch (error: any) {
      console.error('Erro ao gerar mensagens:', error)
      alert(error.message || 'Erro ao gerar mensagens. Tente novamente.')
    } finally {
      setGenerating(false)
    }
  }

  const sendMessage = async (message: string) => {
    try {
      // Mover lead para etapa "Tentando Contato"
      const { data: stages } = await supabase
        .from('funnel_stages')
        .select('id')
        .eq('workspace_id', currentWorkspaceId)
        .eq('name', 'Tentando Contato')
        .single()

      if (stages) {
        await supabase
          .from('leads')
          .update({ stage_id: stages.id })
          .eq('id', leadId)

        // Marcar mensagem como enviada
        const latestMessage = generatedMessages[0]
        if (latestMessage) {
          await supabase
            .from('generated_messages')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', latestMessage.id)
        }

        alert('Mensagem enviada! Lead movido para "Tentando Contato"')
        router.push('/leads')
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      alert('Erro ao enviar mensagem')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Mensagem copiada!')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Lead não encontrado</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-4">
          <Link
            href="/leads"
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Voltar para Leads
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold">{lead.name}</h1>
              {lead.company && (
                <p className="text-gray-600 mt-1">{lead.company}</p>
              )}
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              {lead.funnel_stages?.name || 'Sem etapa'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Informações de Contato</h3>
              <div className="space-y-2">
                {lead.email && (
                  <p>
                    <span className="font-medium">Email:</span> {lead.email}
                  </p>
                )}
                {lead.phone && (
                  <p>
                    <span className="font-medium">Telefone:</span> {lead.phone}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Informações Profissionais</h3>
              <div className="space-y-2">
                {lead.position && (
                  <p>
                    <span className="font-medium">Cargo:</span> {lead.position}
                  </p>
                )}
                {lead.source && (
                  <p>
                    <span className="font-medium">Origem:</span> {lead.source}
                  </p>
                )}
              </div>
            </div>
          </div>

          {lead.notes && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Observações</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t">
            <h2 className="text-2xl font-bold mb-4">Gerar Mensagens com IA</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecionar Campanha
              </label>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {campaigns.length === 0 ? (
                  <option value="">Nenhuma campanha ativa</option>
                ) : (
                  campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              onClick={generateMessages}
              disabled={generating || !selectedCampaignId || campaigns.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              {generating ? 'Gerando...' : 'Gerar Mensagens'}
            </button>

            {generatedMessages.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Mensagens Geradas</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {generatedMessages[0].campaigns?.name} - Gerado em{' '}
                  {new Date(generatedMessages[0].generated_at).toLocaleString('pt-BR')}
                </p>
                {generatedMessages[0].messages.map((message, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm text-gray-500">
                        Variação {index + 1}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(message)}
                          className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded"
                        >
                          Copiar
                        </button>
                        <button
                          onClick={() => sendMessage(message)}
                          className="text-sm text-green-600 hover:text-green-700 px-2 py-1 hover:bg-green-50 rounded"
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{message}</p>
                  </div>
                ))}
                <button
                  onClick={generateMessages}
                  disabled={generating || !selectedCampaignId}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Regenerar mensagens
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


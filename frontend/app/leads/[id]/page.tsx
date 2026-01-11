'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createActivityLog } from '@/lib/utils/activity-log'
import { translateError } from '@/lib/utils/error-translations'

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  position: string | null
  source: string | null
  notes: string | null
  custom_data: Record<string, any> | null
  assigned_to: string | null
  stage_id: string
  funnel_stages: {
    id: string
    name: string
  } | null
  users: {
    full_name: string | null
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

interface ActivityLog {
  id: string
  action_type: string
  details: Record<string, any>
  created_at: string
  user_id: string
  users: {
    full_name: string | null
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
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
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
        loadActivityLogs()
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
          ),
          users (
            full_name
          )
        `)
        .eq('id', leadId)
        .eq('workspace_id', workspaceId)
        .single()

      if (error) throw error
      
      // Transformar relacionamentos de array para objeto único
      if (data) {
        const transformedLead = {
          ...data,
          funnel_stages: Array.isArray(data.funnel_stages) 
            ? (data.funnel_stages[0] || null)
            : data.funnel_stages,
          users: Array.isArray(data.users) 
            ? (data.users[0] || null)
            : data.users
        }
        setLead(transformedLead)
      }
    } catch (error) {
      console.error('Erro ao carregar lead:', error)
      router.push('/leads')
    } finally {
      setLoading(false)
    }
  }

  const getCustomFieldsData = () => {
    if (!lead?.custom_data || typeof lead.custom_data !== 'object') return null
    return lead.custom_data
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
      
      // Transformar campaigns de array para objeto único
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        campaigns: Array.isArray(item.campaigns) 
          ? (item.campaigns[0] || null)
          : item.campaigns
      }))
      
      setGeneratedMessages(transformedData)
    } catch (error) {
      console.error('Erro ao carregar mensagens geradas:', error)
    }
  }

  const loadActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          id,
          action_type,
          details,
          created_at,
          user_id,
          users (
            full_name
          )
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      
      // Transformar users de array para objeto único
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        users: Array.isArray(item.users) 
          ? (item.users[0] || null)
          : item.users
      }))
      
      setActivityLogs(transformedData)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    }
  }

  const formatActivityMessage = (log: ActivityLog) => {
    const userName = log.users?.full_name || 'Usuário'
    const date = new Date(log.created_at).toLocaleString('pt-BR')

    switch (log.action_type) {
      case 'lead_created':
        return `${userName} criou este lead em ${date}`
      case 'lead_updated':
        return `${userName} atualizou o lead em ${date}`
      case 'stage_changed':
        const oldStage = log.details.old_stage || 'Etapa anterior'
        const newStage = log.details.new_stage || 'Nova etapa'
        return `${userName} moveu de "${oldStage}" para "${newStage}" em ${date}`
      case 'message_generated':
        const campaignName = log.details.campaign_name || 'Campanha'
        return `${userName} gerou mensagens da campanha "${campaignName}" em ${date}`
      case 'message_sent':
        return `${userName} enviou uma mensagem em ${date}`
      case 'assigned':
        const assignedTo = log.details.assigned_to_name || 'alguém'
        return `${userName} atribuiu para ${assignedTo} em ${date}`
      default:
        return `${userName} realizou uma ação em ${date}`
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

      console.log('Chamando Edge Function generate-message...')
      console.log('Lead ID:', leadId)
      console.log('Campaign ID:', selectedCampaignId)
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Session token:', session.access_token ? 'Presente' : 'Ausente')

      const { data, error } = await supabase.functions.invoke('generate-message', {
        body: {
          leadId: leadId,
          campaignId: selectedCampaignId,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      console.log('Resposta da função:', { data, error })

      if (error) {
        console.error('Erro detalhado:', error)
        throw error
      }

      if (data && data.messages) {
        await loadGeneratedMessages()
        
        // Registrar atividade
        if (user?.id) {
          const campaign = campaigns.find((c) => c.id === selectedCampaignId)
          await createActivityLog({
            leadId,
            userId: user.id,
            actionType: 'message_generated',
            details: {
              campaign_name: campaign?.name || '',
            },
          })
          await loadActivityLogs()
        }
        
        alert('Mensagens geradas com sucesso!')
      } else {
        throw new Error('Erro ao gerar mensagens: resposta inválida')
      }
    } catch (error: any) {
      console.error('Erro completo ao gerar mensagens:', error)
      console.error('Tipo do erro:', typeof error)
      console.error('Mensagem do erro:', error?.message)
      console.error('Código do erro:', error?.code)
      alert(translateError(error) || `Erro ao gerar mensagens: ${error?.message || 'Erro desconhecido'}`)
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

        // Registrar atividade
        if (user?.id) {
          await createActivityLog({
            leadId,
            userId: user.id,
            actionType: 'message_sent',
            details: {},
          })
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600 font-medium">Carregando...</p>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600 font-medium">Lead não encontrado</p>
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

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{lead.name}</h1>
              {lead.company && (
                <p className="text-gray-700 mt-1 font-medium">{lead.company}</p>
              )}
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-semibold">
              {lead.funnel_stages?.name || 'Sem etapa'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Informações de Contato</h3>
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
              <h3 className="text-sm font-bold text-gray-900 mb-2">Informações Profissionais</h3>
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
                {lead.assigned_to && lead.users && (
                  <p>
                    <span className="font-medium">Responsável:</span>{' '}
                    {lead.users.full_name || 'Sem nome'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {lead.notes && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Observações</h3>
              <p className="text-gray-800 whitespace-pre-wrap font-medium">{lead.notes}</p>
            </div>
          )}

          {getCustomFieldsData() && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Campos Personalizados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(getCustomFieldsData() || {}).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-semibold text-sm text-gray-900">{key}:</span>{' '}
                    <span className="text-gray-800 font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Gerar Mensagens com IA</h2>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
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
                <p className="text-sm text-gray-700 mb-4 font-medium">
                  {generatedMessages[0].campaigns?.name} - Gerado em{' '}
                  {new Date(generatedMessages[0].generated_at).toLocaleString('pt-BR')}
                </p>
                {generatedMessages[0].messages.map((message, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm text-gray-700 font-medium">
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
                    <p className="text-gray-800 whitespace-pre-wrap font-medium">{message}</p>
                  </div>
                ))}
                <button
                  onClick={generateMessages}
                  disabled={generating || !selectedCampaignId}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Regenerar mensagens
                </button>
              </div>
            )}
          </div>

          {/* Histórico de Atividades */}
          <div className="mt-8 pt-6 border-t">
            <h2 className="text-2xl font-bold mb-4">Histórico de Atividades</h2>
            {activityLogs.length === 0 ? (
              <p className="text-gray-700 font-medium">Nenhuma atividade registrada ainda.</p>
            ) : (
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <p className="text-sm text-gray-800 font-medium">{formatActivityMessage(log)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


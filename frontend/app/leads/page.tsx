'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createActivityLog } from '@/lib/utils/activity-log'
import { translateError } from '@/lib/utils/error-translations'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import StageColumn from '@/components/StageColumn'
import LeadCard from '@/components/LeadCard'

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  position: string | null
  source: string | null
  custom_data: Record<string, any> | null
  assigned_to: string | null
  stage_id: string
  funnel_stages: {
    name: string
  } | null
}

interface Stage {
  id: string
  name: string
  order: number
  required_fields: string[]
}

export default function LeadsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [workspaceMembers, setWorkspaceMembers] = useState<Array<{ id: string; full_name: string | null }>>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStage, setFilterStage] = useState<string>('')
  const [filterAssigned, setFilterAssigned] = useState<string>('')
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Precisa mover pelo menos 8px para ativar o drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const workspaceId = localStorage.getItem('currentWorkspaceId')
      if (!workspaceId) {
        router.push('/workspaces')
        return
      }
      setCurrentWorkspaceId(workspaceId)
      loadData(workspaceId)
    }
  }, [user, router])

  const loadData = async (workspaceId: string) => {
    try {
      // Carregar etapas
      const { data: stagesData, error: stagesError } = await supabase
        .from('funnel_stages')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('order')

      if (stagesError) throw stagesError
      
      // Converter required_fields de JSONB para array
      const formattedStages = (stagesData || []).map((stage: any) => ({
        ...stage,
        required_fields: Array.isArray(stage.required_fields) 
          ? stage.required_fields 
          : [],
      }))
      
      setStages(formattedStages)

      // Carregar leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          email,
          phone,
          company,
          position,
          source,
          custom_data,
          assigned_to,
          stage_id,
          funnel_stages (
            name
          )
        `)
        .eq('workspace_id', workspaceId)

      if (leadsError) throw leadsError
      setAllLeads(leadsData || [])
      setLeads(leadsData || [])

      // Carregar membros do workspace
      const { data: membersData, error: membersError } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspaceId)

      if (!membersError && membersData && membersData.length > 0) {
        // Buscar dados dos usuários separadamente
        const userIds = membersData.map((m: any) => m.user_id)
        const { data: usersData } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', userIds)

        setWorkspaceMembers(usersData || [])
      } else {
        setWorkspaceMembers([])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Aplicar filtros e busca
    let filtered = [...allLeads]

    // Busca por nome ou empresa
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(term) ||
          (lead.company && lead.company.toLowerCase().includes(term)) ||
          (lead.email && lead.email.toLowerCase().includes(term))
      )
    }

    // Filtro por etapa
    if (filterStage) {
      filtered = filtered.filter((lead) => lead.stage_id === filterStage)
    }

    // Filtro por responsável
    if (filterAssigned) {
      filtered = filtered.filter((lead) => lead.assigned_to === filterAssigned)
    }

    setLeads(filtered)
  }, [searchTerm, filterStage, filterAssigned, allLeads])

  const getLeadsByStage = (stageId: string) => {
    return leads.filter((lead) => lead.stage_id === stageId)
  }

  const validateRequiredFields = async (lead: Lead, stage: Stage): Promise<string[]> => {
    const missingFields: string[] = []
    const fieldMap: Record<string, string> = {
      name: 'Nome',
      email: 'Email',
      phone: 'Telefone',
      company: 'Empresa',
      position: 'Cargo',
    }

    // Buscar nomes dos campos personalizados
    const customFieldsMap: Record<string, string> = {}
    if (currentWorkspaceId) {
      try {
        const { data: customFields } = await supabase
          .from('custom_fields')
          .select('name')
          .eq('workspace_id', currentWorkspaceId)

        customFields?.forEach((field) => {
          customFieldsMap[field.name] = field.name
        })
      } catch (error) {
        console.error('Erro ao buscar campos personalizados:', error)
      }
    }

    stage.required_fields.forEach((field) => {
      // Verificar campos padrão
      if (fieldMap[field]) {
        const value = lead[field as keyof Lead]
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          missingFields.push(fieldMap[field])
        }
      } else {
        // Verificar campos personalizados
        const customValue = lead.custom_data?.[field]
        if (!customValue || (typeof customValue === 'string' && customValue.trim() === '')) {
          missingFields.push(customFieldsMap[field] || field)
        }
      }
    })

    return missingFields
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const leadId = active.id as string
    const newStageId = over.id as string

    // Buscar lead e etapa destino
    const lead = leads.find((l) => l.id === leadId)
    const targetStage = stages.find((s) => s.id === newStageId)

    if (!lead || !targetStage) return

    // Validar campos obrigatórios
    const missingFields = await validateRequiredFields(lead, targetStage)
    
    if (missingFields.length > 0) {
      alert(
        `Não é possível mover este lead para "${targetStage.name}".\n\n` +
        `Campos obrigatórios faltando:\n${missingFields.join('\n')}\n\n` +
        `Preencha os campos antes de mover.`
      )
      return
    }

    // Atualizar localmente primeiro (otimista)
    setLeads((prevLeads) =>
      prevLeads.map((l) =>
        l.id === leadId ? { ...l, stage_id: newStageId } : l
      )
    )

    // Atualizar no banco
    try {
      const { error } = await supabase
        .from('leads')
        .update({ stage_id: newStageId })
        .eq('id', leadId)

      if (error) throw error

      // Registrar atividade
      if (user?.id) {
        const oldStage = stages.find((s) => s.id === lead.stage_id)
        await createActivityLog({
          leadId,
          userId: user.id,
          actionType: 'stage_changed',
          details: {
            old_stage: oldStage?.name || '',
            new_stage: targetStage.name,
          },
        })
      }

      // Verificar se há campanhas com gatilho nesta etapa e gerar automaticamente
      try {
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id')
          .eq('workspace_id', currentWorkspaceId)
          .eq('is_active', true)
          .eq('trigger_stage_id', newStageId)

        if (campaigns && campaigns.length > 0) {
          // Chamar função de geração automática em background (não bloquear UI)
          supabase.functions.invoke('auto-generate', {
            body: {
              leadId: leadId,
              newStageId: newStageId,
            },
          }).catch((err) => {
            console.error('Erro ao gerar mensagens automaticamente:', err)
            // Não mostrar erro para o usuário, é em background
          })
        }
      } catch (autoGenError) {
        // Ignorar erros de geração automática, não é crítico
        console.error('Erro na geração automática:', autoGenError)
      }
    } catch (error) {
      console.error('Erro ao mover lead:', error)
      alert(translateError(error as Error) || 'Erro ao mover lead. Tente novamente.')
      // Reverter se der erro
      loadData(currentWorkspaceId!)
    }
  }

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
              <p className="text-gray-700 mt-2 font-medium">Gerencie seus leads</p>
            </div>
            <Link
              href="/leads/new"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Novo Lead
            </Link>
          </div>

          {/* Filtros e Busca */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Buscar
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nome, empresa ou email..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Filtrar por Etapa
                </label>
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todas as etapas</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Filtrar por Responsável
                </label>
                <select
                  value={filterAssigned}
                  onChange={(e) => setFilterAssigned(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos</option>
                  {workspaceMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name || 'Sem nome'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {(searchTerm || filterStage || filterAssigned) && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilterStage('')
                    setFilterAssigned('')
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Board Kanban com drag and drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {stages.map((stage) => {
              const stageLeads = getLeadsByStage(stage.id)
              return (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  leads={stageLeads}
                />
              )
            })}
          </div>
          <DragOverlay>
            {activeId ? (
              <LeadCard
                lead={leads.find((l) => l.id === activeId)!}
                isDragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        {stages.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-700 font-medium">Carregando etapas...</p>
          </div>
        )}
      </div>
    </div>
  )
}


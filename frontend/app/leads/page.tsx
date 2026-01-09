'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  company: string | null
  stage_id: string
  funnel_stages: {
    name: string
  } | null
}

interface Stage {
  id: string
  name: string
  order: number
}

export default function LeadsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor),
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
      setStages(stagesData || [])

      // Carregar leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          email,
          company,
          stage_id,
          funnel_stages (
            name
          )
        `)
        .eq('workspace_id', workspaceId)

      if (leadsError) throw leadsError
      setLeads(leadsData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLeadsByStage = (stageId: string) => {
    return leads.filter((lead) => lead.stage_id === stageId)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const leadId = active.id as string
    const newStageId = over.id as string

    // Atualizar localmente primeiro (otimista)
    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead.id === leadId ? { ...lead, stage_id: newStageId } : lead
      )
    )

    // Atualizar no banco
    try {
      const { error } = await supabase
        .from('leads')
        .update({ stage_id: newStageId })
        .eq('id', leadId)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao mover lead:', error)
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Leads</h1>
            <p className="text-gray-600 mt-2">Gerencie seus leads</p>
          </div>
          <Link
            href="/leads/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Novo Lead
          </Link>
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
            <p className="text-gray-600">Carregando etapas...</p>
          </div>
        )}
      </div>
    </div>
  )
}


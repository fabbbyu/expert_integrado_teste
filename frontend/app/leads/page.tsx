'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

        {/* Board Kanban simples */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {stages.map((stage) => {
            const stageLeads = getLeadsByStage(stage.id)
            return (
              <div key={stage.id} className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-4 text-sm">
                  {stage.name} ({stageLeads.length})
                </h3>
                <div className="space-y-2">
                  {stageLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className="block p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                    >
                      <p className="font-medium text-sm">{lead.name}</p>
                      {lead.company && (
                        <p className="text-xs text-gray-500 mt-1">{lead.company}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {stages.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Carregando etapas...</p>
          </div>
        )}
      </div>
    </div>
  )
}


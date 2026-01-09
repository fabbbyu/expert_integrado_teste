'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  totalLeads: number
  leadsByStage: Array<{
    stage_name: string
    count: number
  }>
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    leadsByStage: [],
  })
  const [loading, setLoading] = useState(true)
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const workspaceId = localStorage.getItem('currentWorkspaceId')
      if (!workspaceId) {
        router.push('/workspaces')
        return
      }
      setCurrentWorkspaceId(workspaceId)
      loadStats(workspaceId)
    }
  }, [user, router])

  const loadStats = async (workspaceId: string) => {
    try {
      // Buscar total de leads
      const { count: totalLeads, error: leadsError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)

      if (leadsError) throw leadsError

      // Buscar leads por etapa
      const { data: leadsData, error: stagesError } = await supabase
        .from('leads')
        .select(`
          stage_id,
          funnel_stages (
            name
          )
        `)
        .eq('workspace_id', workspaceId)

      if (stagesError) throw stagesError

      // Agrupar por etapa
      const stageCounts: Record<string, number> = {}
      leadsData?.forEach((lead: any) => {
        const stageName = lead.funnel_stages?.name || 'Sem etapa'
        stageCounts[stageName] = (stageCounts[stageName] || 0) + 1
      })

      const leadsByStage = Object.entries(stageCounts).map(([stage_name, count]) => ({
        stage_name,
        count,
      }))

      setStats({
        totalLeads: totalLeads || 0,
        leadsByStage,
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-2">Visão geral do seu workspace</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total de Leads</h3>
            <p className="text-3xl font-bold">{stats.totalLeads}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Leads por Etapa</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {stats.leadsByStage.map((item) => (
              <div key={item.stage_name} className="text-center">
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="text-sm text-gray-600 mt-1">{item.stage_name}</p>
              </div>
            ))}
          </div>
        </div>

        {stats.totalLeads === 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">Ainda não há leads cadastrados</p>
            <button
              onClick={() => router.push('/leads/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Criar primeiro lead
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


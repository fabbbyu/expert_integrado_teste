'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface DashboardStats {
  totalLeads: number
  leadsByStage: Array<{
    stage_name: string
    count: number
  }>
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const workspaceId = localStorage.getItem('currentWorkspaceId')
      if (!workspaceId) {
        router.push('/workspaces')
      }
    }
  }, [user, router])

  const workspaceId =
    typeof window !== 'undefined' ? localStorage.getItem('currentWorkspaceId') : null

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', workspaceId],
    queryFn: async () => {
      if (!workspaceId) throw new Error('Workspace não selecionado')

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
        // Transformar funnel_stages de array para objeto único
        const funnelStage = Array.isArray(lead.funnel_stages) 
          ? (lead.funnel_stages[0] || null)
          : lead.funnel_stages
        const stageName = funnelStage?.name || 'Sem etapa'
        stageCounts[stageName] = (stageCounts[stageName] || 0) + 1
      })

      const leadsByStage = Object.entries(stageCounts).map(([stage_name, count]) => ({
        stage_name,
        count,
      }))

      return {
        totalLeads: totalLeads || 0,
        leadsByStage,
      }
    },
    enabled: !!workspaceId,
  })

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Nenhum workspace selecionado</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-700 mt-2 font-medium">Visão geral do seu workspace</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Total de Leads</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalLeads}</p>
          </div>
        </div>

        {stats.totalLeads > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Gráfico de Barras */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Leads por Etapa (Barras)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.leadsByStage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="stage_name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de Pizza */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Leads por Etapa (Pizza)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.leadsByStage}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.stage_name}: ${entry.count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {stats.leadsByStage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="mt-8 bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
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


'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Campaign {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

export default function CampaignsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const workspaceId = localStorage.getItem('currentWorkspaceId')
      if (!workspaceId) {
        router.push('/workspaces')
        return
      }
      setCurrentWorkspaceId(workspaceId)
      loadCampaigns(workspaceId)
    }
  }, [user, router])

  const loadCampaigns = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (campaignId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ is_active: !currentStatus })
        .eq('id', campaignId)

      if (error) throw error
      loadCampaigns(currentWorkspaceId!)
    } catch (error) {
      console.error('Erro ao atualizar campanha:', error)
      alert('Erro ao atualizar campanha')
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Campanhas</h1>
            <p className="text-gray-600 mt-2">Gerencie suas campanhas de abordagem</p>
          </div>
          <Link
            href="/campaigns/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Nova Campanha
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">Ainda não há campanhas cadastradas</p>
            <Link
              href="/campaigns/new"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
            >
              Criar primeira campanha
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{campaign.name}</h3>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      campaign.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {campaign.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Criada em {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center text-sm"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => toggleActive(campaign.id, campaign.is_active)}
                    className={`px-4 py-2 rounded text-sm ${
                      campaign.is_active
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {campaign.is_active ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


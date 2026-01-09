'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/navigation'

interface Stage {
  id: string
  name: string
  order: number
}

export default function NewLeadPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    source: '',
    notes: '',
    stage_id: '',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const workspaceId = localStorage.getItem('currentWorkspaceId')
      if (!workspaceId) {
        router.push('/workspaces')
        return
      }
      setCurrentWorkspaceId(workspaceId)
      loadStages(workspaceId)
    }
  }, [user, router])

  const loadStages = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('funnel_stages')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('order')

      if (error) throw error
      setStages(data || [])
      // Selecionar primeira etapa por padrão
      if (data && data.length > 0) {
        setFormData((prev) => ({ ...prev, stage_id: data[0].id }))
      }
    } catch (error) {
      console.error('Erro ao carregar etapas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentWorkspaceId || !formData.stage_id) return

    setSaving(true)
    try {
      const { data: newLead, error } = await supabase
        .from('leads')
        .insert({
          workspace_id: currentWorkspaceId,
          ...formData,
        })
        .select()
        .single()

      if (error) throw error

      // Verificar se há campanhas com gatilho nesta etapa e gerar automaticamente
      try {
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id')
          .eq('workspace_id', currentWorkspaceId)
          .eq('is_active', true)
          .eq('trigger_stage_id', formData.stage_id)

        if (campaigns && campaigns.length > 0 && newLead) {
          // Chamar função de geração automática em background
          supabase.functions.invoke('auto-generate', {
            body: {
              leadId: newLead.id,
              newStageId: formData.stage_id,
            },
          }).catch((err) => {
            console.error('Erro ao gerar mensagens automaticamente:', err)
          })
        }
      } catch (autoGenError) {
        console.error('Erro na geração automática:', autoGenError)
      }

      router.push('/leads')
    } catch (error) {
      console.error('Erro ao criar lead:', error)
      alert('Erro ao criar lead. Tente novamente.')
    } finally {
      setSaving(false)
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
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold mb-6">Novo Lead</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empresa
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origem
              </label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="Ex: Site, LinkedIn, Indicação..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Etapa
              </label>
              <select
                required
                value={formData.stage_id}
                onChange={(e) => setFormData({ ...formData, stage_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Criar Lead'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


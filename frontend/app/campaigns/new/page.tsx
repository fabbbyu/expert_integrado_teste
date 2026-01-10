'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/navigation'

interface Stage {
  id: string
  name: string
}

export default function NewCampaignPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    context: '',
    prompt: '',
    trigger_stage_id: '',
    is_active: true,
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
        .select('id, name')
        .eq('workspace_id', workspaceId)
        .order('order')

      if (error) throw error
      setStages(data || [])
    } catch (error) {
      console.error('Erro ao carregar etapas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentWorkspaceId) return

    setSaving(true)
    try {
      const { error } = await supabase.from('campaigns').insert({
        workspace_id: currentWorkspaceId,
        name: formData.name,
        context: formData.context,
        prompt: formData.prompt,
        trigger_stage_id: formData.trigger_stage_id || null,
        is_active: formData.is_active,
      })

      if (error) throw error

      router.push('/campaigns')
    } catch (error) {
      console.error('Erro ao criar campanha:', error)
      alert('Erro ao criar campanha. Tente novamente.')
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
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">Nova Campanha</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Nome da Campanha *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Black Friday 2024"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Contexto *
              </label>
              <p className="text-xs text-gray-600 mb-2 font-medium">
                Informações sobre a oferta, produto, período, etc. que a IA usará para gerar mensagens
              </p>
              <textarea
                required
                value={formData.context}
                onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                rows={6}
                placeholder="Ex: Estamos com uma oferta especial de Black Friday. Desconto de 30% em todos os planos. Válido até 30/11/2024..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Prompt de Geração *
              </label>
              <p className="text-xs text-gray-600 mb-2 font-medium">
                Instruções para a IA: tom de voz, formato, persona, etc.
              </p>
              <textarea
                required
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                rows={8}
                placeholder={`Ex: Você é um vendedor consultivo e amigável. Escreva uma mensagem:
- Tom: Profissional mas caloroso
- Tamanho: 2-3 parágrafos
- Use os dados do lead (nome, empresa, cargo)
- Seja específico sobre a oferta
- Inclua um call-to-action claro`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Etapa Gatilho (opcional)
              </label>
              <p className="text-xs text-gray-600 mb-2 font-medium">
                Se selecionada, mensagens serão geradas automaticamente quando lead chegar nesta etapa
              </p>
              <select
                value={formData.trigger_stage_id}
                onChange={(e) => setFormData({ ...formData, trigger_stage_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Nenhuma (geração manual apenas)</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 font-semibold">
                Campanha ativa
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Criar Campanha'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 font-semibold"
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


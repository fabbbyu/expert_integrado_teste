'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/navigation'

interface Stage {
  id: string
  name: string
  order: number
  required_fields: string[]
}

interface FieldOption {
  value: string
  label: string
}

export default function FunnelConfigPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [customFields, setCustomFields] = useState<FieldOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const standardFields: FieldOption[] = [
    { value: 'name', label: 'Nome' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Telefone' },
    { value: 'company', label: 'Empresa' },
    { value: 'position', label: 'Cargo' },
  ]

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

      const formattedStages = (stagesData || []).map((stage: any) => ({
        ...stage,
        required_fields: Array.isArray(stage.required_fields)
          ? stage.required_fields
          : [],
      }))

      setStages(formattedStages)

      // Carregar campos personalizados
      const { data: customFieldsData, error: customFieldsError } = await supabase
        .from('custom_fields')
        .select('name')
        .eq('workspace_id', workspaceId)

      if (customFieldsError) throw customFieldsError

      const customFieldsOptions = (customFieldsData || []).map((field) => ({
        value: field.name,
        label: field.name,
      }))

      setCustomFields(customFieldsOptions)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleRequiredField = async (stageId: string, field: string) => {
    const stage = stages.find((s) => s.id === stageId)
    if (!stage) return

    const currentFields = stage.required_fields || []
    const newFields = currentFields.includes(field)
      ? currentFields.filter((f) => f !== field)
      : [...currentFields, field]

    setSaving(true)
    try {
      const { error } = await supabase
        .from('funnel_stages')
        .update({ required_fields: newFields })
        .eq('id', stageId)

      if (error) throw error

      // Atualizar localmente
      setStages((prev) =>
        prev.map((s) =>
          s.id === stageId ? { ...s, required_fields: newFields } : s
        )
      )
    } catch (error) {
      console.error('Erro ao atualizar campos obrigatórios:', error)
      alert('Erro ao atualizar. Tente novamente.')
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

  const allFields = [...standardFields, ...customFields]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold mb-6">Configuração do Funil</h1>
          <p className="text-gray-600 mb-6">
            Configure quais campos são obrigatórios para cada etapa do funil
          </p>

          <div className="space-y-6">
            {stages.map((stage) => (
              <div key={stage.id} className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">{stage.name}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Campos obrigatórios para esta etapa:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {allFields.map((field) => {
                    const isRequired = stage.required_fields.includes(field.value)
                    return (
                      <label
                        key={field.value}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isRequired}
                          onChange={() => toggleRequiredField(stage.id, field.value)}
                          disabled={saving}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{field.label}</span>
                      </label>
                    )
                  })}
                </div>
                {stage.required_fields.length === 0 && (
                  <p className="text-sm text-gray-400 mt-2 italic">
                    Nenhum campo obrigatório configurado
                  </p>
                )}
              </div>
            ))}
          </div>

          {stages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">Carregando etapas...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


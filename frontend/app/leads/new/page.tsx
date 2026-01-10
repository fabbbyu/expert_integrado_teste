'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { createActivityLog } from '@/lib/utils/activity-log'
import { leadSchema, type LeadFormData } from '@/lib/validations/lead'
import { translateError } from '@/lib/utils/error-translations'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'

interface Stage {
  id: string
  name: string
  order: number
}

interface CustomField {
  id: string
  name: string
  type: 'text' | 'number' | 'date' | 'select'
  options: string[] | null
}

interface User {
  id: string
  full_name: string | null
}

export default function NewLeadPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [workspaceMembers, setWorkspaceMembers] = useState<User[]>([])
  const [customData, setCustomData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      source: '',
      notes: '',
      stage_id: '',
      assigned_to: '',
    },
  })

  const stageId = watch('stage_id')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const workspaceId = localStorage.getItem('currentWorkspaceId')
      if (!workspaceId) {
        router.push('/workspaces')
        return
      }
      setCurrentWorkspaceId(workspaceId)
      loadStages(workspaceId)
      loadCustomFields(workspaceId)
      loadWorkspaceMembers(workspaceId)
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
        setValue('stage_id', data[0].id)
      }
    } catch (error) {
      console.error('Erro ao carregar etapas:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomFields = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at')

      if (error) throw error
      setCustomFields(data || [])
    } catch (error) {
      console.error('Erro ao carregar campos personalizados:', error)
    }
  }

  const loadWorkspaceMembers = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          user_id,
          users (
            id,
            full_name
          )
        `)
        .eq('workspace_id', workspaceId)

      if (error) throw error

      const members = (data || [])
        .map((item: any) => item.users)
        .filter((user: any) => user !== null)

      setWorkspaceMembers(members)
    } catch (error) {
      console.error('Erro ao carregar membros:', error)
    }
  }

  const onSubmit = async (data: LeadFormData) => {
    if (!currentWorkspaceId || !data.stage_id) return

    setSaving(true)
    try {
      const { data: newLead, error } = await supabase
        .from('leads')
        .insert({
          workspace_id: currentWorkspaceId,
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          company: data.company || null,
          position: data.position || null,
          source: data.source || null,
          notes: data.notes || null,
          stage_id: data.stage_id,
          assigned_to: data.assigned_to || null,
          custom_data: Object.keys(customData).length > 0 ? customData : null,
        })
        .select()
        .single()

      if (error) throw error

      // Registrar atividade
      if (user?.id && newLead) {
        await createActivityLog({
          leadId: newLead.id,
          userId: user.id,
          actionType: 'lead_created',
          details: {},
        })
      }

      // Verificar se há campanhas com gatilho nesta etapa e gerar automaticamente
      try {
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id')
          .eq('workspace_id', currentWorkspaceId)
          .eq('is_active', true)
          .eq('trigger_stage_id', data.stage_id)

        if (campaigns && campaigns.length > 0 && newLead) {
          // Chamar função de geração automática em background
          supabase.functions.invoke('auto-generate', {
            body: {
              leadId: newLead.id,
              newStageId: data.stage_id,
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
      alert(translateError(error) || 'Erro ao criar lead. Tente novamente.')
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
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">Novo Lead</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name" className="mb-1">
                Nome *
              </Label>
              <Input
                id="name"
                {...register('name')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="mb-1">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="mb-1">
                  Telefone
                </Label>
                <Input id="phone" type="tel" {...register('phone')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company" className="mb-1">
                  Empresa
                </Label>
                <Input id="company" type="text" {...register('company')} />
              </div>

              <div>
                <Label htmlFor="position" className="mb-1">
                  Cargo
                </Label>
                <Input id="position" type="text" {...register('position')} />
              </div>
            </div>

            <div>
              <Label htmlFor="source" className="mb-1">
                Origem
              </Label>
              <Input
                id="source"
                type="text"
                {...register('source')}
                placeholder="Ex: Site, LinkedIn, Indicação..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stage_id" className="mb-1">
                  Etapa *
                </Label>
                <select
                  id="stage_id"
                  {...register('stage_id')}
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
                {errors.stage_id && (
                  <p className="text-sm text-red-500 mt-1">{errors.stage_id.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="assigned_to" className="mb-1">
                  Responsável
                </Label>
                <select
                  id="assigned_to"
                  {...register('assigned_to')}
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <option value="">Nenhum</option>
                  {workspaceMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name || 'Sem nome'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="mb-1">
                Observações
              </Label>
              <Textarea id="notes" rows={4} {...register('notes')} />
            </div>

            {/* Campos Personalizados */}
            {customFields.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Campos Personalizados</h3>
                <div className="space-y-4">
                  {customFields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        {field.name}
                      </label>
                      {field.type === 'text' && (
                        <input
                          type="text"
                          value={customData[field.name] || ''}
                          onChange={(e) =>
                            setCustomData({ ...customData, [field.name]: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                      {field.type === 'number' && (
                        <input
                          type="number"
                          value={customData[field.name] || ''}
                          onChange={(e) =>
                            setCustomData({ ...customData, [field.name]: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                      {field.type === 'date' && (
                        <input
                          type="date"
                          value={customData[field.name] || ''}
                          onChange={(e) =>
                            setCustomData({ ...customData, [field.name]: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                      {field.type === 'select' && field.options && (
                        <select
                          value={customData[field.name] || ''}
                          onChange={(e) =>
                            setCustomData({ ...customData, [field.name]: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Selecione...</option>
                          {field.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? 'Salvando...' : 'Criar Lead'}
              </Button>
              <Button
                type="button"
                onClick={() => router.back()}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


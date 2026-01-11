'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/navigation'

interface CustomField {
  id: string
  name: string
  type: 'text' | 'number' | 'date' | 'select'
  options: string[] | null
  created_at: string
}

export default function CustomFieldsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)
  const [fields, setFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingField, setEditingField] = useState<CustomField | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    type: 'text' as 'text' | 'number' | 'date' | 'select',
    options: '',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const workspaceId = localStorage.getItem('currentWorkspaceId')
      if (!workspaceId) {
        router.push('/workspaces')
        return
      }
      setCurrentWorkspaceId(workspaceId)
      loadFields(workspaceId)
    }
  }, [user, router])

  const loadFields = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFields(data || [])
    } catch (error) {
      console.error('Erro ao carregar campos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentWorkspaceId) return

    try {
      const options = formData.type === 'select' && formData.options
        ? formData.options.split(',').map((opt) => opt.trim()).filter(Boolean)
        : null

      if (editingField) {
        // Editar campo existente
        const { error } = await supabase
          .from('custom_fields')
          .update({
            name: formData.name,
            type: formData.type,
            options: options ? options : null,
          })
          .eq('id', editingField.id)

        if (error) throw error
      } else {
        // Criar novo campo
        const { error } = await supabase.from('custom_fields').insert({
          workspace_id: currentWorkspaceId,
          name: formData.name,
          type: formData.type,
          options: options,
        })

        if (error) throw error
      }

      setFormData({ name: '', type: 'text', options: '' })
      setShowForm(false)
      setEditingField(null)
      loadFields(currentWorkspaceId)
    } catch (error) {
      console.error('Erro ao salvar campo:', error)
      alert('Erro ao salvar campo. Tente novamente.')
    }
  }

  const handleEdit = (field: CustomField) => {
    setEditingField(field)
    setFormData({
      name: field.name,
      type: field.type,
      options: field.options ? field.options.join(', ') : '',
    })
    setShowForm(true)
  }

  const handleDelete = async (fieldId: string) => {
    if (!confirm('Tem certeza que deseja excluir este campo?')) return

    try {
      const { error } = await supabase
        .from('custom_fields')
        .delete()
        .eq('id', fieldId)

      if (error) throw error
      loadFields(currentWorkspaceId!)
    } catch (error) {
      console.error('Erro ao excluir campo:', error)
      alert('Erro ao excluir campo')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600 font-medium">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Campos Personalizados</h1>
              <p className="text-gray-700 mt-2 font-medium">
                Crie campos adicionais para seus leads
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm)
                setEditingField(null)
                setFormData({ name: '', type: 'text', options: '' })
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {showForm ? 'Cancelar' : '+ Novo Campo'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Nome do Campo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Segmento, Faturamento Anual..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Tipo *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as 'text' | 'number' | 'date' | 'select',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="text">Texto</option>
                    <option value="number">Número</option>
                    <option value="date">Data</option>
                    <option value="select">Seleção (opções)</option>
                  </select>
                </div>

                {formData.type === 'select' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      Opções (separadas por vírgula) *
                    </label>
                    <input
                      type="text"
                      required={formData.type === 'select'}
                      value={formData.options}
                      onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                      placeholder="Ex: Pequeno, Médio, Grande"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    {editingField ? 'Salvar Alterações' : 'Criar Campo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingField(null)
                      setFormData({ name: '', type: 'text', options: '' })
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          )}

          {fields.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-700 mb-4 font-medium">Ainda não há campos personalizados</p>
              <p className="text-sm text-gray-600 font-medium">
                Crie campos para coletar informações específicas dos seus leads
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded border"
                >
                  <div>
                    <p className="font-medium">{field.name}</p>
                    <p className="text-sm text-gray-700 font-medium">
                      Tipo: {field.type}
                      {field.options && ` (${field.options.length} opções)`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(field)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(field.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-700 font-semibold"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


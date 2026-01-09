'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'

interface Workspace {
  id: string
  name: string
  created_at: string
}

export default function WorkspacesPage() {
  const { user, loading: authLoading } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      loadWorkspaces()
    }
  }, [user])

  const loadWorkspaces = async () => {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          workspace_id,
          workspaces (
            id,
            name,
            created_at
          )
        `)
        .eq('user_id', user?.id)

      if (error) throw error

      const formattedWorkspaces = (data || []).map((item: any) => ({
        id: item.workspaces.id,
        name: item.workspaces.name,
        created_at: item.workspaces.created_at,
      }))

      setWorkspaces(formattedWorkspaces)
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error)
    } finally {
      setLoading(false)
    }
  }

  const createWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkspaceName.trim()) return

    try {
      // Criar workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({ name: newWorkspaceName })
        .select()
        .single()

      if (workspaceError) throw workspaceError

      // Adicionar usuário como admin do workspace
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user?.id,
          role: 'admin',
        })

      if (memberError) throw memberError

      // Criar perfil do usuário se não existir
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: user?.id,
          full_name: user?.email?.split('@')[0] || '',
        })

      if (profileError && profileError.code !== '23505') {
        console.error('Erro ao criar perfil:', profileError)
      }

      setNewWorkspaceName('')
      setShowCreateForm(false)
      loadWorkspaces()
    } catch (error) {
      console.error('Erro ao criar workspace:', error)
      alert('Erro ao criar workspace. Tente novamente.')
    }
  }

  const selectWorkspace = (workspaceId: string) => {
    // Salvar workspace atual no localStorage
    localStorage.setItem('currentWorkspaceId', workspaceId)
    router.push('/dashboard')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold mb-6">Workspaces</h1>

          {workspaces.length === 0 && !showCreateForm ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Você ainda não tem workspaces</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Criar primeiro workspace
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {showCreateForm ? 'Cancelar' : '+ Criar workspace'}
                </button>
              </div>

              {showCreateForm && (
                <form onSubmit={createWorkspace} className="mb-6 p-4 bg-gray-50 rounded">
                  <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="Nome do workspace"
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Criar
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    onClick={() => selectWorkspace(workspace.id)}
                    className="p-6 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md cursor-pointer transition"
                  >
                    <h3 className="text-xl font-semibold mb-2">{workspace.name}</h3>
                    <p className="text-sm text-gray-500">
                      Criado em {new Date(workspace.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


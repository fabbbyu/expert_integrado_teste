'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import Link from 'next/link'
import { translateError } from '@/lib/utils/error-translations'

interface Workspace {
  id: string
  name: string
  created_at: string
  role?: string
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
          role,
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
        role: item.role,
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
      // Verificar se usuário está autenticado
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        alert('Você precisa estar logado para criar um workspace')
        return
      }
      
      console.log('Usuário autenticado:', currentUser.id)
      
      // Tentar usar função RPC primeiro (bypassa RLS)
      const { data: workspaceId, error: rpcError } = await supabase.rpc('create_workspace', {
        workspace_name: newWorkspaceName
      })

      let workspace

      if (rpcError) {
        console.log('RPC não disponível, tentando método direto:', rpcError)
        
        // Fallback: tentar método direto
        const { data: workspaceData, error: workspaceError } = await supabase
          .from('workspaces')
          .insert({ name: newWorkspaceName })
          .select()
          .single()

        if (workspaceError) {
          console.error('Erro ao criar workspace - detalhes:', workspaceError)
          throw workspaceError
        }

        workspace = workspaceData

        // Pequeno delay para garantir que o workspace foi criado no banco
        await new Promise(resolve => setTimeout(resolve, 100))

        // Adicionar usuário como admin do workspace
        const { error: memberError } = await supabase
          .from('workspace_members')
          .insert({
            workspace_id: workspace.id,
            user_id: user?.id,
            role: 'admin',
          })

        if (memberError) {
          console.error('Erro detalhado ao adicionar membro:', memberError)
          throw memberError
        }
      } else {
        // RPC funcionou, buscar workspace criado
        const { data: workspaceData } = await supabase
          .from('workspaces')
          .select()
          .eq('id', workspaceId)
          .single()
        
        if (!workspaceData) {
          throw new Error('Workspace criado mas não encontrado')
        }
        
        workspace = workspaceData
      }

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
    } catch (error: any) {
      console.error('Erro completo ao criar workspace:', error)
      console.error('Tipo do erro:', typeof error)
      console.error('Mensagem do erro:', error?.message)
      console.error('Código do erro:', error?.code)
      console.error('Detalhes do erro:', error?.details)
      console.error('Hint do erro:', error?.hint)
      
      let errorMessage = 'Erro desconhecido'
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.error_description) {
        errorMessage = error.error_description
      } else if (typeof error === 'string') {
        errorMessage = error
      } else {
        try {
          errorMessage = JSON.stringify(error)
        } catch {
          errorMessage = String(error)
        }
      }
      
      alert(translateError(error) || `Erro ao criar workspace: ${errorMessage}`)
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
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">Workspaces</h1>

          {workspaces.length === 0 && !showCreateForm ? (
            <div className="text-center py-12">
              <p className="text-gray-700 mb-4 font-medium">Você ainda não tem workspaces</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm font-semibold"
              >
                Criar primeiro workspace
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm font-semibold"
                >
                  {showCreateForm ? 'Cancelar' : '+ Criar workspace'}
                </button>
              </div>

              {showCreateForm && (
                <form onSubmit={createWorkspace} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="Nome do workspace"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-md mb-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm font-semibold"
                  >
                    Criar
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-lg transition-all bg-white"
                  >
                    <div
                      onClick={() => selectWorkspace(workspace.id)}
                      className="cursor-pointer mb-3"
                    >
                      <h3 className="text-xl font-bold mb-2 text-gray-900">{workspace.name}</h3>
                      <p className="text-sm text-gray-700 font-medium">
                        Criado em {new Date(workspace.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      {workspace.role === 'admin' && (
                        <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-semibold">
                          Admin
                        </span>
                      )}
                    </div>
                    {workspace.role === 'admin' && (
                      <Link
                        href={`/workspaces/${workspace.id}/invites`}
                        onClick={(e) => e.stopPropagation()}
                        className="block w-full text-center px-3 py-2 text-sm bg-gray-100 text-gray-900 rounded-md hover:bg-blue-50 hover:text-blue-700 font-semibold transition-colors"
                      >
                        Gerenciar Convites
                      </Link>
                    )}
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


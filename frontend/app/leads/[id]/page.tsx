'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  position: string | null
  source: string | null
  notes: string | null
  stage_id: string
  funnel_stages: {
    id: string
    name: string
  } | null
}

export default function LeadDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const leadId = params.id as string
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && leadId) {
      loadLead()
    }
  }, [user, leadId])

  const loadLead = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          funnel_stages (
            id,
            name
          )
        `)
        .eq('id', leadId)
        .single()

      if (error) throw error
      setLead(data)
    } catch (error) {
      console.error('Erro ao carregar lead:', error)
      router.push('/leads')
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

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Lead não encontrado</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-4">
          <Link
            href="/leads"
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Voltar para Leads
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold">{lead.name}</h1>
              {lead.company && (
                <p className="text-gray-600 mt-1">{lead.company}</p>
              )}
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              {lead.funnel_stages?.name || 'Sem etapa'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Informações de Contato</h3>
              <div className="space-y-2">
                {lead.email && (
                  <p>
                    <span className="font-medium">Email:</span> {lead.email}
                  </p>
                )}
                {lead.phone && (
                  <p>
                    <span className="font-medium">Telefone:</span> {lead.phone}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Informações Profissionais</h3>
              <div className="space-y-2">
                {lead.position && (
                  <p>
                    <span className="font-medium">Cargo:</span> {lead.position}
                  </p>
                )}
                {lead.source && (
                  <p>
                    <span className="font-medium">Origem:</span> {lead.source}
                  </p>
                )}
              </div>
            </div>
          </div>

          {lead.notes && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Observações</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-gray-500">
              A geração de mensagens com IA será adicionada aqui
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


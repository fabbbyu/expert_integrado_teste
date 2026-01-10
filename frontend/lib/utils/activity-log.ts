import { supabase } from '@/lib/supabase/client'

interface CreateActivityLogParams {
  leadId: string
  userId: string
  actionType: string
  details?: Record<string, any>
}

export async function createActivityLog({
  leadId,
  userId,
  actionType,
  details = {},
}: CreateActivityLogParams) {
  try {
    // Primeiro, garantir que o usuário existe em public.users
    // Se não existir, criar registro básico
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (!existingUser) {
      // Criar registro básico do usuário se não existir
      await supabase.from('users').insert({
        id: userId,
        full_name: null,
        created_at: new Date().toISOString(),
      }).catch(() => {
        // Ignorar erro se já existir (race condition)
      })
    }

    // Agora inserir o log de atividade
    const { error } = await supabase.from('activity_logs').insert({
      lead_id: leadId,
      user_id: userId,
      action_type: actionType,
      details,
    })

    if (error) {
      console.error('Erro ao registrar atividade:', error)
    }
  } catch (error) {
    console.error('Erro ao registrar atividade:', error)
  }
}


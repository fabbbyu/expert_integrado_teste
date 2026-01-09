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


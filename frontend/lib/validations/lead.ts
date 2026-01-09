import { z } from 'zod'

export const leadSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  stage_id: z.string().min(1, 'Etapa é obrigatória'),
  assigned_to: z.string().optional(),
})

export type LeadFormData = z.infer<typeof leadSchema>


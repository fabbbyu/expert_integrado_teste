'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import LeadCard from './LeadCard'

interface Stage {
  id: string
  name: string
  order: number
}

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  position: string | null
  source: string | null
  assigned_to: string | null
  custom_data: Record<string, any> | null
  stage_id: string
}

interface StageColumnProps {
  stage: Stage
  leads: Lead[]
}

export default function StageColumn({ stage, leads }: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`bg-white rounded-lg shadow p-4 min-h-[200px] ${
        isOver ? 'bg-blue-50 border-2 border-blue-500' : ''
      }`}
    >
      <h3 className="font-semibold mb-4 text-sm">
        {stage.name} ({leads.length})
      </h3>
      <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}


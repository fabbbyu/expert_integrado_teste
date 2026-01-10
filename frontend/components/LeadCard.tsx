'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'

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

interface LeadCardProps {
  lead: Lead
  isDragging?: boolean
}

export default function LeadCard({ lead, isDragging = false }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging || isDragging ? 0.5 : 1,
  }

  if (isDragging) {
    return (
      <div
        style={style}
        className="p-3 bg-white border-2 border-blue-300 rounded-md shadow-lg"
      >
        <p className="font-semibold text-sm text-gray-900">{lead.name}</p>
        {lead.company && (
          <p className="text-xs text-gray-700 mt-1 font-medium">{lead.company}</p>
        )}
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="p-3 bg-white border-2 border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 shadow-sm"
    >
      <div {...listeners} className="cursor-grab active:cursor-grabbing">
        <Link href={`/leads/${lead.id}`} className="block">
          <p className="font-semibold text-sm text-gray-900">{lead.name}</p>
          {lead.company && (
            <p className="text-xs text-gray-700 mt-1 font-medium">{lead.company}</p>
          )}
        </Link>
      </div>
    </div>
  )
}


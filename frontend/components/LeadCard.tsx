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
        className="p-3 bg-gray-50 rounded shadow-lg"
      >
        <p className="font-medium text-sm">{lead.name}</p>
        {lead.company && (
          <p className="text-xs text-gray-500 mt-1">{lead.company}</p>
        )}
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing"
    >
      <Link href={`/leads/${lead.id}`} className="block">
        <p className="font-medium text-sm">{lead.name}</p>
        {lead.company && (
          <p className="text-xs text-gray-500 mt-1">{lead.company}</p>
        )}
      </Link>
    </div>
  )
}


import React from 'react'

type VisitStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

interface VisitStatusIndicatorProps {
  status: VisitStatus
}

const statusConfig: Record<
  VisitStatus,
  { label: string; icon: string; colorClasses: string }
> = {
  pending: {
    label: 'Pendiente',
    icon: '⏳',
    colorClasses: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  confirmed: {
    label: 'Confirmada',
    icon: '✅',
    colorClasses: 'bg-green-100 text-green-800 border-green-300',
  },
  completed: {
    label: 'Completada',
    icon: '🏁',
    colorClasses: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  cancelled: {
    label: 'Cancelada',
    icon: '❌',
    colorClasses: 'bg-red-100 text-red-800 border-red-300',
  },
}

export default function VisitStatusIndicator({ status }: VisitStatusIndicatorProps) {
  const { label, icon, colorClasses } = statusConfig[status]

  return (
    <span
      data-testid="visit-status"
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${colorClasses}`}
    >
      <span data-testid="visit-status-icon" role="img" aria-label={label}>
        {icon}
      </span>
      <span data-testid="visit-status-label">{label}</span>
    </span>
  )
}

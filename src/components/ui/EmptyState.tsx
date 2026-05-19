import type { ReactNode } from 'react'
import { Croissant } from 'lucide-react'

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}

export function EmptyState({ action, description, icon, title }: EmptyStateProps) {
  return (
    <div className="soft-card flex flex-col items-center gap-3 p-8 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-cream-100 text-caramel-300">
        {icon ?? <Croissant size={30} />}
      </div>
      <div>
        <p className="font-semibold text-cocoa-700">{title}</p>
        {description ? <p className="mt-1 text-sm text-cocoa-500/75">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

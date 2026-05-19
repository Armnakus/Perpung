import type { ReactNode } from 'react'
import clsx from 'clsx'

type StatCardProps = {
  title: string
  value: string
  helper?: string
  icon: ReactNode
  tone?: 'pink' | 'cream' | 'green' | 'brown'
}

const toneClasses = {
  pink: 'bg-rosemilk-100 text-rosemilk-400',
  cream: 'bg-cream-100 text-caramel-300',
  green: 'bg-mintcream text-emerald-600',
  brown: 'bg-cocoa-600 text-cream-50',
}

export function StatCard({ helper, icon, title, tone = 'pink', value }: StatCardProps) {
  return (
    <article className="soft-card animate-float-in p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-cocoa-500/75">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-cocoa-700">{value}</p>
          {helper ? <p className="mt-1 text-xs text-cocoa-500/65">{helper}</p> : null}
        </div>
        <div className={clsx('grid size-11 shrink-0 place-items-center rounded-2xl', toneClasses[tone])}>
          {icon}
        </div>
      </div>
    </article>
  )
}

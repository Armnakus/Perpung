import type { ReactNode } from 'react'
import { X } from 'lucide-react'

type ModalProps = {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
}

export function Modal({ children, description, footer, onClose, open, title }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-cocoa-900/35 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-t-[2rem] bg-cream-50 shadow-soft sm:rounded-[2rem]">
        <div className="flex items-start justify-between gap-4 border-b border-cream-200/80 bg-white/80 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-cocoa-700">{title}</h2>
            {description ? <p className="mt-1 text-sm text-cocoa-500/75">{description}</p> : null}
          </div>
          <button
            aria-label="ปิด"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-cream-100 text-cocoa-600 transition hover:bg-rosemilk-100"
            type="button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[calc(92vh-9rem)] overflow-y-auto px-5 py-5">{children}</div>
        {footer ? <div className="border-t border-cream-200/80 bg-white/75 px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  )
}

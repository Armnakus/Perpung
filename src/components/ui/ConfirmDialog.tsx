import { AlertTriangle } from 'lucide-react'
import { CuteButton } from './CuteButton'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  confirmLabel = 'ลบรายการ',
  description,
  loading,
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-cocoa-900/40 px-5 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-soft">
        <div className="grid size-12 place-items-center rounded-full bg-rose-100 text-rose-600">
          <AlertTriangle size={24} />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-cocoa-700">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-cocoa-500/80">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <CuteButton variant="secondary" onClick={onCancel}>
            ยกเลิก
          </CuteButton>
          <CuteButton loading={loading} variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </CuteButton>
        </div>
      </div>
    </div>
  )
}

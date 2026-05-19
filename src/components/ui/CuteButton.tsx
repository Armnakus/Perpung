import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

type CuteButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  loading?: boolean
}

export function CuteButton({
  children,
  className,
  disabled,
  icon,
  loading,
  size = 'md',
  variant = 'primary',
  ...props
}: CuteButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        {
          'bg-rosemilk-300 text-white shadow-button hover:bg-rosemilk-400': variant === 'primary',
          'border border-cream-200 bg-white text-cocoa-600 shadow-sm hover:bg-cream-50':
            variant === 'secondary',
          'bg-transparent text-cocoa-600 hover:bg-cream-100': variant === 'ghost',
          'bg-rose-100 text-rose-700 hover:bg-rose-200': variant === 'danger',
          'px-3 py-2 text-sm': size === 'sm',
          'px-5 py-3 text-sm': size === 'md',
          'px-6 py-4 text-base': size === 'lg',
        },
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={18} /> : icon}
      {children}
    </button>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, LogOut, Settings, UserRound } from 'lucide-react'
import { AppLogo } from '../ui/AppLogo'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useAuth } from '../../hooks/useAuth'
import { useStoreSettings } from '../../hooks/useStoreSettings'
import { formatDateThai } from '../../lib/format'

export function AccountMenu() {
  const [open, setOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { signOut, user } = useAuth()
  const settings = useStoreSettings()
  const lastSignIn = user?.last_sign_in_at ? formatDateThai(new Date(user.last_sign_in_at)) : 'ยังไม่มีข้อมูล'

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          aria-expanded={open}
          aria-label="เมนูบัญชีผู้ใช้"
          className="grid size-12 place-items-center rounded-full border border-white/80 bg-white/80 text-cocoa-600 shadow-card backdrop-blur transition hover:bg-cream-50 active:scale-[0.97]"
          type="button"
          onClick={() => setOpen((current) => !current)}
        >
          <UserRound size={21} />
        </button>

        {open ? (
          <div className="absolute right-0 top-14 z-50 w-[min(20rem,calc(100vw-2rem))] animate-float-in rounded-[1.75rem] border border-white/80 bg-white/95 p-3 shadow-soft backdrop-blur">
            <div className="rounded-[1.5rem] bg-cream-50 p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white shadow-sm">
                  <AppLogo className="h-9 w-9" variant="mark" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-cocoa-700">{settings.shopName}</p>
                  <p className="truncate text-xs text-cocoa-500/65">{user?.email ?? 'ไม่พบอีเมล'}</p>
                </div>
              </div>
              <div className="mt-3 rounded-[1.25rem] bg-white/75 px-3 py-2">
                <p className="text-[11px] font-medium text-cocoa-500/60">เข้าใช้งานครั้งล่าสุด</p>
                <p className="mt-0.5 text-xs font-semibold text-cocoa-700">{lastSignIn}</p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <Link
                className="flex items-center justify-between rounded-[1.25rem] px-4 py-3 text-sm font-semibold text-cocoa-700 transition hover:bg-rosemilk-100"
                to="/settings"
                onClick={() => setOpen(false)}
              >
                <span className="inline-flex items-center gap-2">
                  <Settings size={17} />
                  ไปหน้าตั้งค่า
                </span>
                <ChevronRight size={17} />
              </Link>
              <button
                className="flex w-full items-center justify-between rounded-[1.25rem] px-4 py-3 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                type="button"
                onClick={() => {
                  setOpen(false)
                  setConfirmLogout(true)
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <LogOut size={17} />
                  ออกจากระบบ
                </span>
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        confirmLabel="ออกจากระบบ"
        description="คุณจะกลับไปที่หน้า Login และต้องเข้าสู่ระบบใหม่อีกครั้งเมื่อต้องการใช้งาน"
        open={confirmLogout}
        title="ออกจากระบบ?"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false)
          void signOut()
        }}
      />
    </>
  )
}

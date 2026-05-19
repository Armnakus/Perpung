import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import {
  Download,
  KeyRound,
  LogOut,
  Save,
  ShieldCheck,
  Store,
  UserRound,
} from 'lucide-react'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { CuteButton } from '../components/ui/CuteButton'
import { AppLogo } from '../components/ui/AppLogo'
import { useAuth } from '../hooks/useAuth'
import { useStoreSettings } from '../hooks/useStoreSettings'
import { formatBaht, formatDateThai, formatNumber } from '../lib/format'
import { saveStoreSettings, type StoreSettings } from '../lib/storeSettings'
import { isSupabaseConfigured, missingSupabaseMessage, supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type SettingsFormState = {
  shopName: string
  ownerName: string
  dailyPieceTarget: string
  monthlyRevenueTarget: string
}

const backupTables: (keyof Database['public']['Tables'])[] = [
  'products',
  'ingredients',
  'product_ingredients',
  'income_transactions',
  'expense_transactions',
]

export function SettingsPage() {
  const settings = useStoreSettings()
  const { signOut, user } = useAuth()
  const [form, setForm] = useState<SettingsFormState>(() => toFormState(settings))
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const lastSignIn = user?.last_sign_in_at ? formatDateThai(new Date(user.last_sign_in_at)) : 'ยังไม่มีข้อมูล'

  const handleSaveSettings = (event: FormEvent) => {
    event.preventDefault()
    setSavingProfile(true)

    const nextSettings: StoreSettings = {
      shopName: form.shopName.trim() || 'per.pung',
      ownerName: form.ownerName.trim(),
      dailyPieceTarget: Math.max(0, Number(form.dailyPieceTarget || 0)),
      monthlyRevenueTarget: Math.max(0, Number(form.monthlyRevenueTarget || 0)),
    }

    saveStoreSettings(nextSettings)
    setForm(toFormState(nextSettings))
    setSavingProfile(false)
    toast.success('บันทึกการตั้งค่าร้านแล้ว')
  }

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault()

    if (!isSupabaseConfigured) {
      toast.error(missingSupabaseMessage)
      return
    }

    if (newPassword.length < 6) {
      toast.error('รหัสผ่านใหม่ควรมีอย่างน้อย 6 ตัวอักษร')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน')
      return
    }

    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    toast.success('เปลี่ยนรหัสผ่านแล้ว')
  }

  const handleExportData = async () => {
    if (!user) return

    if (!isSupabaseConfigured) {
      toast.error(missingSupabaseMessage)
      return
    }

    setExporting(true)
    const backup: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      app: 'per.pung Store Manager',
      shop_settings: settings,
    }

    for (const table of backupTables) {
      const { data, error } = await supabase.from(table).select('*').eq('user_id', user.id)

      if (error) {
        setExporting(false)
        toast.error(`สำรองข้อมูล ${table} ไม่สำเร็จ`)
        return
      }

      backup[table] = data ?? []
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `perpung-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)

    setExporting(false)
    toast.success('ดาวน์โหลดไฟล์สำรองข้อมูลแล้ว')
  }

  return (
    <div className="space-y-5">
      <section className="soft-card overflow-hidden">
        <div className="bg-gradient-to-br from-rosemilk-100 via-white to-cream-100 p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid size-20 shrink-0 place-items-center rounded-[1.75rem] bg-white/85 shadow-sm">
                <AppLogo className="h-14 w-14" variant="mark" />
              </div>
              <div>
                <p className="text-sm font-medium text-cocoa-500/70">ร้านของคุณ</p>
                <h2 className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-cocoa-700">
                  {settings.shopName}
                </h2>
                <p className="mt-1 text-sm text-cocoa-500/70">
                  {settings.ownerName ? `ดูแลโดย ${settings.ownerName}` : 'ตั้งค่าข้อมูลร้านให้เหมาะกับการใช้งานประจำวัน'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-72">
              <MetricBox label="เป้าขาย/วัน" value={`${formatNumber(settings.dailyPieceTarget)} ชิ้น`} />
              <MetricBox label="เป้ารายรับ/เดือน" value={formatBaht(settings.monthlyRevenueTarget)} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <SettingsCard
          description="ชื่อร้านและเป้าหมายนี้จะใช้ใน UI ของแอป เพื่อให้ dashboard ดูเป็นร้านของคุณมากขึ้น"
          icon={<Store size={22} />}
          title="ข้อมูลร้าน"
        >
          <form className="space-y-4" onSubmit={handleSaveSettings}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">ชื่อร้าน</span>
                <input
                  className="field-input mt-2"
                  value={form.shopName}
                  onChange={(event) => setForm((current) => ({ ...current, shopName: event.target.value }))}
                  placeholder="per.pung"
                  required
                />
              </label>
              <label className="block">
                <span className="field-label">ชื่อเจ้าของ/ผู้ดูแล</span>
                <input
                  className="field-input mt-2"
                  value={form.ownerName}
                  onChange={(event) => setForm((current) => ({ ...current, ownerName: event.target.value }))}
                  placeholder="เช่น คุณปุ้ง"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">เป้าหมายจำนวนชิ้นต่อวัน</span>
                <input
                  className="field-input mt-2"
                  min="0"
                  type="number"
                  value={form.dailyPieceTarget}
                  onChange={(event) => setForm((current) => ({ ...current, dailyPieceTarget: event.target.value }))}
                />
              </label>
              <label className="block">
                <span className="field-label">เป้าหมายรายรับต่อเดือน</span>
                <input
                  className="field-input mt-2"
                  min="0"
                  step="0.01"
                  type="number"
                  value={form.monthlyRevenueTarget}
                  onChange={(event) => setForm((current) => ({ ...current, monthlyRevenueTarget: event.target.value }))}
                />
              </label>
            </div>

            <CuteButton className="w-full sm:w-auto" icon={<Save size={18} />} loading={savingProfile} size="lg" type="submit">
              บันทึกข้อมูลร้าน
            </CuteButton>
          </form>
        </SettingsCard>

        <SettingsCard
          description="ดูบัญชีที่กำลังใช้งาน และออกจากระบบได้จากตรงนี้"
          icon={<UserRound size={22} />}
          title="บัญชีผู้ใช้"
        >
          <div className="rounded-[1.75rem] bg-cream-50 p-4">
            <p className="text-xs font-medium text-cocoa-500/65">Email</p>
            <p className="mt-1 break-words font-semibold text-cocoa-700">{user?.email}</p>
          </div>
          <div className="mt-3 rounded-[1.75rem] bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-cocoa-500/65">เข้าใช้งานครั้งล่าสุด</p>
            <p className="mt-1 font-semibold text-cocoa-700">{lastSignIn}</p>
          </div>
          <CuteButton
            className="mt-4 w-full"
            icon={<LogOut size={18} />}
            size="lg"
            variant="danger"
            onClick={() => setConfirmLogout(true)}
          >
            ออกจากระบบ
          </CuteButton>
        </SettingsCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <SettingsCard
          description="เปลี่ยนรหัสผ่านของบัญชี Supabase Auth ที่ใช้เข้าแอป"
          icon={<KeyRound size={22} />}
          title="ความปลอดภัย"
        >
          <form className="space-y-4" onSubmit={handleChangePassword}>
            <label className="block">
              <span className="field-label">รหัสผ่านใหม่</span>
              <input
                className="field-input mt-2"
                minLength={6}
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
              />
            </label>
            <label className="block">
              <span className="field-label">ยืนยันรหัสผ่านใหม่</span>
              <input
                className="field-input mt-2"
                minLength={6}
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="พิมพ์รหัสผ่านอีกครั้ง"
              />
            </label>
            <CuteButton className="w-full sm:w-auto" icon={<ShieldCheck size={18} />} loading={savingPassword} type="submit">
              เปลี่ยนรหัสผ่าน
            </CuteButton>
          </form>
        </SettingsCard>

        <SettingsCard
          description="ดาวน์โหลดข้อมูลร้านทั้งหมดเป็นไฟล์ JSON เก็บไว้ส่วนตัว"
          icon={<Download size={22} />}
          title="สำรองข้อมูล"
        >
          <div className="rounded-[1.75rem] bg-cream-50 p-4 text-sm leading-6 text-cocoa-500/75">
            ไฟล์สำรองจะรวมเมนู วัตถุดิบ สูตร รายรับ รายจ่าย และการตั้งค่าร้านในเครื่องนี้
          </div>
          <CuteButton
            className="mt-4 w-full sm:w-auto"
            icon={<Download size={18} />}
            loading={exporting}
            size="lg"
            variant="secondary"
            onClick={handleExportData}
          >
            ดาวน์โหลดไฟล์สำรอง
          </CuteButton>
        </SettingsCard>
      </section>

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
    </div>
  )
}

function SettingsCard({
  children,
  description,
  icon,
  title,
}: {
  children: React.ReactNode
  description: string
  icon: React.ReactNode
  title: string
}) {
  return (
    <section className="soft-card p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-rosemilk-100 text-rosemilk-400">
          {icon}
        </div>
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-cocoa-500/70">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] bg-white/80 px-4 py-3 shadow-sm">
      <p className="text-xs text-cocoa-500/65">{label}</p>
      <p className="mt-1 font-semibold text-cocoa-700">{value}</p>
    </div>
  )
}

function toFormState(settings: StoreSettings): SettingsFormState {
  return {
    shopName: settings.shopName,
    ownerName: settings.ownerName,
    dailyPieceTarget: String(settings.dailyPieceTarget),
    monthlyRevenueTarget: String(settings.monthlyRevenueTarget),
  }
}

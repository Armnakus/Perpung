import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Edit3, Plus, Receipt, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { CuteButton } from '../components/ui/CuteButton'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../hooks/useAuth'
import {
  formatBaht,
  formatDateThai,
  formatMonthThai,
  getMonthRange,
  toInputDate,
  toInputMonth,
} from '../lib/format'
import { isSupabaseConfigured, missingSupabaseMessage, supabase } from '../lib/supabase'
import type { ExpenseTransaction } from '../types/database'

const categories = [
  'วัตถุดิบ',
  'บรรจุภัณฑ์',
  'อุปกรณ์',
  'ค่าขนส่ง',
  'ค่าใช้จ่ายอื่น ๆ',
] as const

const categoryStyles: Record<string, string> = {
  วัตถุดิบ: 'bg-rosemilk-100 text-rose-700',
  บรรจุภัณฑ์: 'bg-cream-100 text-cocoa-600',
  อุปกรณ์: 'bg-mintcream text-emerald-700',
  ค่าขนส่ง: 'bg-caramel-100 text-cocoa-600',
  'ค่าใช้จ่ายอื่น ๆ': 'bg-white text-cocoa-500 ring-1 ring-cream-200',
}

type ExpenseFormState = {
  expense_date: string
  category: string
  title: string
  amount: string
  note: string
}

const defaultForm = (): ExpenseFormState => ({
  expense_date: toInputDate(),
  category: 'วัตถุดิบ',
  title: '',
  amount: '',
  note: '',
})

export function ExpensesPage() {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<'day' | 'month'>('month')
  const [selectedDate, setSelectedDate] = useState(toInputDate())
  const [selectedMonth, setSelectedMonth] = useState(toInputMonth())
  const [categoryFilter, setCategoryFilter] = useState('ทั้งหมด')
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ExpenseTransaction | null>(null)
  const [deleting, setDeleting] = useState<ExpenseTransaction | null>(null)
  const [form, setForm] = useState<ExpenseFormState>(defaultForm)

  const range = useMemo(() => {
    if (viewMode === 'day') return { start: selectedDate, end: selectedDate }
    return getMonthRange(selectedMonth)
  }, [selectedDate, selectedMonth, viewMode])

  const loadExpenses = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false)
      return
    }

    setLoading(true)
    let query = supabase
      .from('expense_transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('expense_date', range.start)
      .lte('expense_date', range.end)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (categoryFilter !== 'ทั้งหมด') {
      query = query.eq('category', categoryFilter)
    }

    const { data, error } = await query

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    setExpenses((data ?? []) as ExpenseTransaction[])
    setLoading(false)
  }, [categoryFilter, range.end, range.start, user])

  useEffect(() => {
    void loadExpenses()
  }, [loadExpenses])

  const totalExpense = expenses.reduce((total, expense) => total + expense.amount, 0)

  const openCreate = () => {
    setEditing(null)
    setForm({
      ...defaultForm(),
      expense_date: viewMode === 'day' ? selectedDate : toInputDate(),
    })
    setModalOpen(true)
  }

  const openEdit = (expense: ExpenseTransaction) => {
    setEditing(expense)
    setForm({
      expense_date: expense.expense_date,
      category: expense.category,
      title: expense.title,
      amount: String(expense.amount),
      note: expense.note ?? '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return

    setSaving(true)
    const payload = {
      user_id: user.id,
      expense_date: form.expense_date,
      category: form.category,
      title: form.title.trim(),
      amount: Number(form.amount || 0),
      note: form.note.trim() || null,
    }

    const result = editing
      ? await supabase
          .from('expense_transactions')
          .update(payload)
          .eq('id', editing.id)
          .eq('user_id', user.id)
      : await supabase.from('expense_transactions').insert(payload)

    setSaving(false)

    if (result.error) {
      toast.error(result.error.message)
      return
    }

    toast.success(editing ? 'แก้ไขรายจ่ายแล้ว' : 'เพิ่มรายจ่ายแล้ว')
    setModalOpen(false)
    await loadExpenses()
  }

  const handleDelete = async () => {
    if (!user || !deleting) return

    setSaving(true)
    const { error } = await supabase
      .from('expense_transactions')
      .delete()
      .eq('id', deleting.id)
      .eq('user_id', user.id)
    setSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('ลบรายจ่ายแล้ว')
    setDeleting(null)
    await loadExpenses()
  }

  if (!isSupabaseConfigured) {
    return <EmptyState title="ยังไม่ได้เชื่อม Supabase" description={missingSupabaseMessage} icon={<Receipt size={28} />} />
  }

  return (
    <div className="space-y-5">
      <section className="soft-card p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm text-cocoa-500/70">
              {viewMode === 'month' ? formatMonthThai(selectedMonth) : formatDateThai(selectedDate)}
            </p>
            <h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-cocoa-700">
              {formatBaht(totalExpense)}
            </h2>
            <p className="mt-1 text-sm text-cocoa-500/70">ยอดรวมรายจ่ายในช่วงที่เลือก</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:items-end">
            <label className="block">
              <span className="field-label">รูปแบบช่วงเวลา</span>
              <select
                className="field-input mt-2"
                value={viewMode}
                onChange={(event) => setViewMode(event.target.value as 'day' | 'month')}
              >
                <option value="month">รายเดือน</option>
                <option value="day">รายวัน</option>
              </select>
            </label>
            <label className="block">
              <span className="field-label">{viewMode === 'month' ? 'เลือกเดือน' : 'เลือกวันที่'}</span>
              <input
                className="field-input mt-2"
                type={viewMode === 'month' ? 'month' : 'date'}
                value={viewMode === 'month' ? selectedMonth : selectedDate}
                onChange={(event) =>
                  viewMode === 'month' ? setSelectedMonth(event.target.value) : setSelectedDate(event.target.value)
                }
              />
            </label>
            <label className="block">
              <span className="field-label">หมวดหมู่</span>
              <select className="field-input mt-2" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option>ทั้งหมด</option>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <CuteButton className="w-full sm:w-auto" icon={<Plus size={18} />} size="lg" onClick={openCreate}>
              + เพิ่มรายจ่าย
            </CuteButton>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="soft-card p-6 text-center text-cocoa-500">กำลังโหลดรายจ่าย...</div>
      ) : expenses.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {expenses.map((expense) => (
            <article key={expense.id} className="soft-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={clsx('inline-flex rounded-full px-3 py-1 text-xs font-semibold', categoryStyles[expense.category])}>
                    {expense.category}
                  </span>
                  <h2 className="mt-3 text-lg font-semibold text-cocoa-700">{expense.title}</h2>
                  <p className="mt-1 text-sm text-cocoa-500/70">{formatDateThai(expense.expense_date)}</p>
                </div>
                <p className="text-xl font-semibold text-cocoa-700">{formatBaht(expense.amount)}</p>
              </div>
              {expense.note ? <p className="mt-3 rounded-[1.25rem] bg-cream-50 px-4 py-3 text-sm text-cocoa-500/75">{expense.note}</p> : null}
              <div className="mt-4 flex gap-2">
                <CuteButton className="flex-1" icon={<Edit3 size={16} />} variant="secondary" onClick={() => openEdit(expense)}>
                  แก้ไข
                </CuteButton>
                <CuteButton className="flex-1" icon={<Trash2 size={16} />} variant="danger" onClick={() => setDeleting(expense)}>
                  ลบ
                </CuteButton>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="ยังไม่มีรายจ่ายในช่วงนี้"
          description="ลองเพิ่มค่าวัตถุดิบ บรรจุภัณฑ์ หรือค่าใช้จ่ายอื่น ๆ เพื่อดูสรุปค่าใช้จ่ายร้าน"
          action={<CuteButton icon={<Plus size={18} />} onClick={openCreate}>เพิ่มรายจ่าย</CuteButton>}
          icon={<Receipt size={28} />}
        />
      )}

      <Modal
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <CuteButton className="w-full sm:w-auto" variant="secondary" onClick={() => setModalOpen(false)}>
              ยกเลิก
            </CuteButton>
            <CuteButton className="w-full sm:w-auto" loading={saving} type="submit" form="expense-form">
              บันทึก
            </CuteButton>
          </div>
        }
        open={modalOpen}
        title={editing ? 'แก้ไขรายจ่าย' : '+ เพิ่มรายจ่าย'}
        onClose={() => setModalOpen(false)}
      >
        <form className="space-y-4" id="expense-form" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">วันที่</span>
              <input
                className="field-input mt-2"
                type="date"
                value={form.expense_date}
                onChange={(event) => setForm((current) => ({ ...current, expense_date: event.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="field-label">หมวดหมู่</span>
              <select
                className="field-input mt-2"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="field-label">ชื่อรายการ</span>
            <input
              className="field-input mt-2"
              placeholder="เช่น กล้วยหอม, กล่องชานอ้อย"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
          </label>

          <label className="block">
            <span className="field-label">จำนวนเงิน</span>
            <input
              className="field-input mt-2"
              min="0"
              step="0.01"
              type="number"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              required
            />
          </label>

          <label className="block">
            <span className="field-label">หมายเหตุ (optional)</span>
            <textarea
              className="field-input mt-2 min-h-28 resize-none"
              placeholder="รายละเอียดเพิ่มเติม"
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
            />
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        description="รายการรายจ่ายนี้จะถูกนำออกจาก Dashboard และยอดรวมรายจ่าย"
        loading={saving}
        open={Boolean(deleting)}
        title="ลบรายจ่ายนี้?"
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Edit3, Plus, Trash2, Wallet } from 'lucide-react'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { CuteButton } from '../components/ui/CuteButton'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../hooks/useAuth'
import { calculateSaleTotals } from '../lib/calculations'
import { formatBaht, formatDateThai, formatNumber, toInputDate } from '../lib/format'
import { isSupabaseConfigured, missingSupabaseMessage, supabase } from '../lib/supabase'
import type { IncomeTransaction, Product } from '../types/database'

type IncomeWithProduct = IncomeTransaction & {
  products: Pick<Product, 'name' | 'selling_price' | 'product_cost'> | null
}

type IncomeFormState = {
  sale_date: string
  product_id: string
  quantity: string
  price_per_item: string
}

const defaultForm = (): IncomeFormState => ({
  sale_date: toInputDate(),
  product_id: '',
  quantity: '1',
  price_per_item: '0',
})

export function IncomePage() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(toInputDate())
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<IncomeWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<IncomeWithProduct | null>(null)
  const [deleting, setDeleting] = useState<IncomeWithProduct | null>(null)
  const [form, setForm] = useState<IncomeFormState>(defaultForm)

  const loadData = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false)
      return
    }

    setLoading(true)
    const [productsResult, transactionsResult] = await Promise.all([
      supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true }),
      supabase
        .from('income_transactions')
        .select('*, products(name, selling_price, product_cost)')
        .eq('user_id', user.id)
        .eq('sale_date', selectedDate)
        .order('created_at', { ascending: false }),
    ])

    if (productsResult.error || transactionsResult.error) {
      toast.error(productsResult.error?.message || transactionsResult.error?.message || 'โหลดข้อมูลไม่สำเร็จ')
      setLoading(false)
      return
    }

    setProducts((productsResult.data ?? []) as Product[])
    setTransactions((transactionsResult.data ?? []) as IncomeWithProduct[])
    setLoading(false)
  }, [selectedDate, user])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const selectedProduct = products.find((product) => product.id === form.product_id)
  const computedTotals = useMemo(
    () =>
      calculateSaleTotals(
        Number(form.quantity || 0),
        Number(form.price_per_item || 0),
        selectedProduct?.product_cost ?? 0,
      ),
    [form.price_per_item, form.quantity, selectedProduct?.product_cost],
  )

  const summary = useMemo(
    () => ({
      income: transactions.reduce((total, item) => total + item.total_income, 0),
      quantity: transactions.reduce((total, item) => total + item.quantity, 0),
      profit: transactions.reduce((total, item) => total + item.estimated_profit, 0),
    }),
    [transactions],
  )

  const openCreate = () => {
    const firstProduct = products[0]
    setEditing(null)
    setForm({
      ...defaultForm(),
      sale_date: selectedDate,
      product_id: firstProduct?.id ?? '',
      price_per_item: String(firstProduct?.selling_price ?? 0),
    })
    setModalOpen(true)
  }

  const openEdit = (transaction: IncomeWithProduct) => {
    setEditing(transaction)
    setForm({
      sale_date: transaction.sale_date,
      product_id: transaction.product_id,
      quantity: String(transaction.quantity),
      price_per_item: String(transaction.price_per_item),
    })
    setModalOpen(true)
  }

  const handleProductChange = (productId: string) => {
    const product = products.find((item) => item.id === productId)
    setForm((current) => ({
      ...current,
      product_id: productId,
      price_per_item: String(product?.selling_price ?? 0),
    }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    if (!selectedProduct) {
      toast.error('กรุณาเลือกเมนูก่อนบันทึก')
      return
    }

    setSaving(true)
    const payload = {
      user_id: user.id,
      sale_date: form.sale_date,
      product_id: form.product_id,
      quantity: Number(form.quantity),
      price_per_item: Number(form.price_per_item),
      total_income: computedTotals.totalIncome,
      estimated_cost: computedTotals.estimatedCost,
      estimated_profit: computedTotals.estimatedProfit,
    }

    const result = editing
      ? await supabase
          .from('income_transactions')
          .update(payload)
          .eq('id', editing.id)
          .eq('user_id', user.id)
      : await supabase.from('income_transactions').insert(payload)

    setSaving(false)

    if (result.error) {
      toast.error(result.error.message)
      return
    }

    toast.success(editing ? 'แก้ไขยอดขายแล้ว' : 'เพิ่มยอดขายแล้ว')
    setModalOpen(false)
    setSelectedDate(form.sale_date)
    await loadData()
  }

  const handleDelete = async () => {
    if (!user || !deleting) return
    setSaving(true)
    const { error } = await supabase
      .from('income_transactions')
      .delete()
      .eq('id', deleting.id)
      .eq('user_id', user.id)
    setSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('ลบยอดขายแล้ว')
    setDeleting(null)
    await loadData()
  }

  if (!isSupabaseConfigured) {
    return <EmptyState title="ยังไม่ได้เชื่อม Supabase" description={missingSupabaseMessage} icon={<Wallet size={28} />} />
  }

  return (
    <div className="space-y-5">
      <section className="soft-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryPill label="ยอดรวมวันที่เลือก" value={formatBaht(summary.income)} />
            <SummaryPill label="จำนวนชิ้น" value={`${formatNumber(summary.quantity)} ชิ้น`} />
            <SummaryPill label="กำไรประมาณ" value={formatBaht(summary.profit)} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block">
              <span className="field-label">เลือกวันที่</span>
              <input
                className="field-input mt-2"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </label>
            <CuteButton className="w-full sm:w-auto" icon={<Plus size={18} />} size="lg" onClick={openCreate}>
              + เพิ่มยอดขาย
            </CuteButton>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="soft-card p-6 text-center text-cocoa-500">กำลังโหลดรายรับ...</div>
      ) : transactions.length ? (
        <>
          <div className="hidden overflow-hidden rounded-[2rem] bg-white/[0.85] shadow-card lg:block">
            <table className="w-full">
              <thead className="bg-cream-100/70">
                <tr>
                  <th className="table-head">เมนู</th>
                  <th className="table-head">วันที่</th>
                  <th className="table-head">จำนวน</th>
                  <th className="table-head">รายรับรวม</th>
                  <th className="table-head">กำไรประมาณ</th>
                  <th className="table-head text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="table-cell font-medium">{transaction.products?.name ?? 'เมนูที่ถูกลบ'}</td>
                    <td className="table-cell">{formatDateThai(transaction.sale_date)}</td>
                    <td className="table-cell">{formatNumber(transaction.quantity)} ชิ้น</td>
                    <td className="table-cell font-semibold">{formatBaht(transaction.total_income)}</td>
                    <td className="table-cell text-emerald-700">{formatBaht(transaction.estimated_profit)}</td>
                    <td className="table-cell">
                      <div className="flex justify-end gap-2">
                        <CuteButton icon={<Edit3 size={16} />} size="sm" variant="secondary" onClick={() => openEdit(transaction)}>
                          แก้ไข
                        </CuteButton>
                        <CuteButton icon={<Trash2 size={16} />} size="sm" variant="danger" onClick={() => setDeleting(transaction)}>
                          ลบ
                        </CuteButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 lg:hidden">
            {transactions.map((transaction) => (
              <article key={transaction.id} className="soft-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-cocoa-700">{transaction.products?.name ?? 'เมนูที่ถูกลบ'}</h2>
                    <p className="mt-1 text-sm text-cocoa-500/70">{formatDateThai(transaction.sale_date)}</p>
                  </div>
                  <span className="rounded-full bg-rosemilk-100 px-3 py-1 text-xs font-semibold text-rosemilk-400">
                    {formatNumber(transaction.quantity)} ชิ้น
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <SummaryPill label="รายรับรวม" value={formatBaht(transaction.total_income)} />
                  <SummaryPill label="กำไรประมาณ" value={formatBaht(transaction.estimated_profit)} />
                </div>
                <div className="mt-4 flex gap-2">
                  <CuteButton className="flex-1" icon={<Edit3 size={16} />} variant="secondary" onClick={() => openEdit(transaction)}>
                    แก้ไข
                  </CuteButton>
                  <CuteButton className="flex-1" icon={<Trash2 size={16} />} variant="danger" onClick={() => setDeleting(transaction)}>
                    ลบ
                  </CuteButton>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="ยังไม่มีรายรับในวันนี้"
          description="เริ่มจากเพิ่มเมนูในหน้าต้นทุนเมนู แล้วกลับมาบันทึกยอดขายได้เลย"
          action={<CuteButton icon={<Plus size={18} />} onClick={openCreate}>เพิ่มยอดขาย</CuteButton>}
        />
      )}

      <Modal
        description="เลือกเมนู จำนวนชิ้น แล้วระบบจะคำนวณรายรับ ต้นทุน และกำไรให้ทันที"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <CuteButton className="w-full sm:w-auto" variant="secondary" onClick={() => setModalOpen(false)}>
              ยกเลิก
            </CuteButton>
            <CuteButton className="w-full sm:w-auto" loading={saving} type="submit" form="income-form">
              บันทึก
            </CuteButton>
          </div>
        }
        open={modalOpen}
        title={editing ? 'แก้ไขยอดขาย' : '+ เพิ่มยอดขาย'}
        onClose={() => setModalOpen(false)}
      >
        <form className="space-y-4" id="income-form" onSubmit={handleSubmit}>
          <label className="block">
            <span className="field-label">วันที่ขาย</span>
            <input
              className="field-input mt-2"
              type="date"
              value={form.sale_date}
              onChange={(event) => setForm((current) => ({ ...current, sale_date: event.target.value }))}
              required
            />
          </label>

          <label className="block">
            <span className="field-label">เลือกสินค้า/เมนู</span>
            <select
              className="field-input mt-2"
              value={form.product_id}
              onChange={(event) => handleProductChange(event.target.value)}
              required
            >
              <option value="">เลือกเมนู</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">จำนวนชิ้น</span>
              <input
                className="field-input mt-2"
                min="1"
                type="number"
                value={form.quantity}
                onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="field-label">ราคาขายต่อชิ้น</span>
              <input
                className="field-input mt-2"
                min="0"
                step="0.01"
                type="number"
                value={form.price_per_item}
                onChange={(event) => setForm((current) => ({ ...current, price_per_item: event.target.value }))}
                required
              />
            </label>
          </div>

          <div className="grid gap-3 rounded-[1.75rem] bg-white p-4 sm:grid-cols-3">
            <SummaryPill label="รายรับรวม" value={formatBaht(computedTotals.totalIncome)} />
            <SummaryPill label="ต้นทุนรวม" value={formatBaht(computedTotals.estimatedCost)} />
            <SummaryPill label="กำไรประมาณ" value={formatBaht(computedTotals.estimatedProfit)} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        description="รายการขายนี้จะถูกลบออกจากรายงานรายรับและ Dashboard ด้วย"
        loading={saving}
        open={Boolean(deleting)}
        title="ลบรายการขายนี้?"
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] bg-cream-50 px-4 py-3">
      <p className="text-xs text-cocoa-500/65">{label}</p>
      <p className="mt-1 font-semibold text-cocoa-700">{value}</p>
    </div>
  )
}

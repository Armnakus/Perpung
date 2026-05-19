import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Edit3, Package, Plus, Search, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { CuteButton } from '../components/ui/CuteButton'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../hooks/useAuth'
import { calculateCostPerUnit } from '../lib/calculations'
import { formatBaht, formatNumber } from '../lib/format'
import { isSupabaseConfigured, missingSupabaseMessage, supabase } from '../lib/supabase'
import type { Ingredient } from '../types/database'

type IngredientFormState = {
  name: string
  purchase_price: string
  purchase_quantity: string
  unit: string
  note: string
}

const defaultForm = (): IngredientFormState => ({
  name: '',
  purchase_price: '',
  purchase_quantity: '',
  unit: 'g',
  note: '',
})

export function IngredientsPage() {
  const { user } = useAuth()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [deleting, setDeleting] = useState<Ingredient | null>(null)
  const [form, setForm] = useState<IngredientFormState>(defaultForm)

  const loadIngredients = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    setIngredients((data ?? []) as Ingredient[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    void loadIngredients()
  }, [loadIngredients])

  const filteredIngredients = useMemo(
    () =>
      ingredients.filter((ingredient) =>
        ingredient.name.toLocaleLowerCase('th-TH').includes(search.toLocaleLowerCase('th-TH')),
      ),
    [ingredients, search],
  )

  const costPerUnit = calculateCostPerUnit(
    Number(form.purchase_price || 0),
    Number(form.purchase_quantity || 0),
  )

  const openCreate = () => {
    setEditing(null)
    setForm(defaultForm())
    setModalOpen(true)
  }

  const openEdit = (ingredient: Ingredient) => {
    setEditing(ingredient)
    setForm({
      name: ingredient.name,
      purchase_price: String(ingredient.purchase_price),
      purchase_quantity: String(ingredient.purchase_quantity),
      unit: ingredient.unit,
      note: ingredient.note ?? '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return

    const purchaseQuantity = Number(form.purchase_quantity || 0)
    if (purchaseQuantity <= 0) {
      toast.error('ปริมาณที่ซื้อต้องมากกว่า 0')
      return
    }

    setSaving(true)
    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      purchase_price: Number(form.purchase_price || 0),
      purchase_quantity: purchaseQuantity,
      unit: form.unit.trim(),
      cost_per_unit: costPerUnit,
      note: form.note.trim() || null,
    }

    const result = editing
      ? await supabase
          .from('ingredients')
          .update(payload)
          .eq('id', editing.id)
          .eq('user_id', user.id)
      : await supabase.from('ingredients').insert(payload)

    setSaving(false)

    if (result.error) {
      toast.error(result.error.message)
      return
    }

    toast.success(editing ? 'แก้ไขวัตถุดิบแล้ว' : 'เพิ่มวัตถุดิบแล้ว')
    setModalOpen(false)
    await loadIngredients()
  }

  const handleDelete = async () => {
    if (!user || !deleting) return

    setSaving(true)
    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', deleting.id)
      .eq('user_id', user.id)
    setSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('ลบวัตถุดิบแล้ว')
    setDeleting(null)
    await loadIngredients()
  }

  if (!isSupabaseConfigured) {
    return <EmptyState title="ยังไม่ได้เชื่อม Supabase" description={missingSupabaseMessage} icon={<Package size={28} />} />
  }

  return (
    <div className="space-y-5">
      <section className="soft-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <label className="block w-full lg:max-w-md">
            <span className="field-label">ค้นหาวัตถุดิบ</span>
            <span className="relative mt-2 block">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cocoa-500/45" size={18} />
              <input
                className="field-input pl-11"
                placeholder="เช่น Nutella, กล้วย, แป้ง"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </span>
          </label>
          <CuteButton className="w-full sm:w-auto" icon={<Plus size={18} />} size="lg" onClick={openCreate}>
            + เพิ่มวัตถุดิบ
          </CuteButton>
        </div>
      </section>

      {loading ? (
        <div className="soft-card p-6 text-center text-cocoa-500">กำลังโหลดวัตถุดิบ...</div>
      ) : filteredIngredients.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredIngredients.map((ingredient) => (
            <article key={ingredient.id} className="soft-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-cocoa-700">{ingredient.name}</h2>
                  <p className="mt-1 text-sm text-cocoa-500/70">
                    ซื้อ {formatBaht(ingredient.purchase_price)} / {formatNumber(ingredient.purchase_quantity, 2)} {ingredient.unit}
                  </p>
                </div>
                <div className="grid size-11 place-items-center rounded-2xl bg-cream-100 text-caramel-300">
                  <Package size={22} />
                </div>
              </div>
              <div className="mt-4 rounded-[1.5rem] bg-rosemilk-100 px-4 py-3">
                <p className="text-xs font-medium text-rosemilk-400">ต้นทุนต่อหน่วย</p>
                <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-cocoa-700">
                  {formatBaht(ingredient.cost_per_unit)}
                  <span className="text-sm font-medium text-cocoa-500/70"> / {ingredient.unit}</span>
                </p>
              </div>
              {ingredient.note ? <p className="mt-3 text-sm text-cocoa-500/70">{ingredient.note}</p> : null}
              <div className="mt-4 flex gap-2">
                <CuteButton className="flex-1" icon={<Edit3 size={16} />} variant="secondary" onClick={() => openEdit(ingredient)}>
                  แก้ไข
                </CuteButton>
                <CuteButton className="flex-1" icon={<Trash2 size={16} />} variant="danger" onClick={() => setDeleting(ingredient)}>
                  ลบ
                </CuteButton>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title={search ? 'ไม่พบวัตถุดิบที่ค้นหา' : 'ยังไม่มีวัตถุดิบ'}
          description="เพิ่มวัตถุดิบพร้อมราคาซื้อและปริมาณ เพื่อให้ระบบคำนวณต้นทุนต่อหน่วยอัตโนมัติ"
          action={<CuteButton icon={<Plus size={18} />} onClick={openCreate}>เพิ่มวัตถุดิบ</CuteButton>}
          icon={<Package size={28} />}
        />
      )}

      <Modal
        description="ระบบจะคำนวณต้นทุนต่อหน่วยจากราคาซื้อหารด้วยปริมาณที่ซื้อ"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <CuteButton className="w-full sm:w-auto" variant="secondary" onClick={() => setModalOpen(false)}>
              ยกเลิก
            </CuteButton>
            <CuteButton className="w-full sm:w-auto" loading={saving} type="submit" form="ingredient-form">
              บันทึก
            </CuteButton>
          </div>
        }
        open={modalOpen}
        title={editing ? 'แก้ไขวัตถุดิบ' : '+ เพิ่มวัตถุดิบ'}
        onClose={() => setModalOpen(false)}
      >
        <form className="space-y-4" id="ingredient-form" onSubmit={handleSubmit}>
          <label className="block">
            <span className="field-label">ชื่อวัตถุดิบ</span>
            <input
              className="field-input mt-2"
              placeholder="เช่น Nutella, กล้วยหอม"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="field-label">ราคาที่ซื้อ</span>
              <input
                className="field-input mt-2"
                min="0"
                step="0.01"
                type="number"
                value={form.purchase_price}
                onChange={(event) => setForm((current) => ({ ...current, purchase_price: event.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="field-label">ปริมาณที่ซื้อ</span>
              <input
                className="field-input mt-2"
                min="0.01"
                step="0.01"
                type="number"
                value={form.purchase_quantity}
                onChange={(event) => setForm((current) => ({ ...current, purchase_quantity: event.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="field-label">หน่วย</span>
              <input
                className="field-input mt-2"
                placeholder="g, ml, ชิ้น"
                value={form.unit}
                onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
                required
              />
            </label>
          </div>

          <div className="rounded-[1.75rem] bg-white p-4">
            <p className="text-sm text-cocoa-500/70">ต้นทุนต่อหน่วย</p>
            <p className="mt-1 text-2xl font-semibold text-cocoa-700">
              {formatBaht(costPerUnit)}
              <span className="text-sm font-medium text-cocoa-500/70"> / {form.unit || 'หน่วย'}</span>
            </p>
          </div>

          <label className="block">
            <span className="field-label">หมายเหตุ (optional)</span>
            <textarea
              className="field-input mt-2 min-h-28 resize-none"
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
            />
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        description="ถ้าวัตถุดิบนี้อยู่ในสูตรเมนู ระบบจะลบออกจากสูตรนั้นด้วย และต้นทุนเมนูจะถูกคำนวณใหม่"
        loading={saving}
        open={Boolean(deleting)}
        title="ลบวัตถุดิบนี้?"
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

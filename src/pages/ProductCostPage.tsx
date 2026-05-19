import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Calculator, Edit3, Plus, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { CuteButton } from '../components/ui/CuteButton'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../hooks/useAuth'
import { calculateMarginPercent, getProfitBadge, roundMoney } from '../lib/calculations'
import { formatBaht, formatNumber } from '../lib/format'
import { isSupabaseConfigured, missingSupabaseMessage, supabase } from '../lib/supabase'
import type { Ingredient, Product, ProductIngredient } from '../types/database'

type RecipeWithIngredient = ProductIngredient & {
  ingredients: Pick<Ingredient, 'name' | 'unit' | 'cost_per_unit'> | null
}

type ProductWithRecipe = Product & {
  recipe: RecipeWithIngredient[]
}

type RecipeFormRow = {
  ingredient_id: string
  quantity_used: string
}

type ProductFormState = {
  name: string
  selling_price: string
  recipe: RecipeFormRow[]
}

const emptyRecipeRow = (): RecipeFormRow => ({ ingredient_id: '', quantity_used: '' })

const defaultForm = (): ProductFormState => ({
  name: '',
  selling_price: '',
  recipe: [emptyRecipeRow()],
})

export function ProductCostPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState<ProductWithRecipe[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProductWithRecipe | null>(null)
  const [deleting, setDeleting] = useState<ProductWithRecipe | null>(null)
  const [form, setForm] = useState<ProductFormState>(defaultForm)

  const loadData = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false)
      return
    }

    setLoading(true)
    const [productsResult, ingredientsResult, recipeResult] = await Promise.all([
      supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('ingredients')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true }),
      supabase
        .from('product_ingredients')
        .select('*, ingredients(name, unit, cost_per_unit)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),
    ])

    const firstError = productsResult.error || ingredientsResult.error || recipeResult.error

    if (firstError) {
      toast.error(firstError.message)
      setLoading(false)
      return
    }

    const recipes = (recipeResult.data ?? []) as RecipeWithIngredient[]
    const recipeByProduct = recipes.reduce<Record<string, RecipeWithIngredient[]>>((acc, row) => {
      acc[row.product_id] ??= []
      acc[row.product_id].push(row)
      return acc
    }, {})

    setProducts(
      ((productsResult.data ?? []) as Product[]).map((product) => ({
        ...product,
        recipe: recipeByProduct[product.id] ?? [],
      })),
    )
    setIngredients((ingredientsResult.data ?? []) as Ingredient[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const recipeBreakdown = useMemo(
    () =>
      form.recipe
        .map((row) => {
          const ingredient = ingredients.find((item) => item.id === row.ingredient_id)
          const quantityUsed = Number(row.quantity_used || 0)
          return {
            ingredient,
            ingredient_id: row.ingredient_id,
            quantity_used: quantityUsed,
            ingredient_cost: roundMoney((ingredient?.cost_per_unit ?? 0) * quantityUsed),
          }
        })
        .filter((row) => row.ingredient_id && row.quantity_used > 0),
    [form.recipe, ingredients],
  )

  const productCost = roundMoney(recipeBreakdown.reduce((total, row) => total + row.ingredient_cost, 0))
  const sellingPrice = Number(form.selling_price || 0)
  const profitPerItem = roundMoney(sellingPrice - productCost)
  const marginPercent = calculateMarginPercent(sellingPrice, productCost)

  const openCreate = () => {
    setEditing(null)
    setForm(defaultForm())
    setModalOpen(true)
  }

  const openEdit = (product: ProductWithRecipe) => {
    setEditing(product)
    setForm({
      name: product.name,
      selling_price: String(product.selling_price),
      recipe: product.recipe.length
        ? product.recipe.map((row) => ({
            ingredient_id: row.ingredient_id,
            quantity_used: String(row.quantity_used),
          }))
        : [emptyRecipeRow()],
    })
    setModalOpen(true)
  }

  const updateRecipeRow = (index: number, row: Partial<RecipeFormRow>) => {
    setForm((current) => ({
      ...current,
      recipe: current.recipe.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...row } : item,
      ),
    }))
  }

  const removeRecipeRow = (index: number) => {
    setForm((current) => ({
      ...current,
      recipe: current.recipe.length === 1 ? [emptyRecipeRow()] : current.recipe.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return

    const cleanRecipe = recipeBreakdown.filter((row) => row.ingredient)
    if (!form.name.trim()) {
      toast.error('กรุณาใส่ชื่อเมนู')
      return
    }

    setSaving(true)
    let productId = editing?.id

    if (editing) {
      const { error } = await supabase
        .from('products')
        .update({
          name: form.name.trim(),
          selling_price: sellingPrice,
          product_cost: productCost,
        })
        .eq('id', editing.id)
        .eq('user_id', user.id)

      if (error) {
        setSaving(false)
        toast.error(error.message)
        return
      }
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          name: form.name.trim(),
          selling_price: sellingPrice,
          product_cost: productCost,
        })
        .select()
        .single()

      if (error) {
        setSaving(false)
        toast.error(error.message)
        return
      }

      productId = data.id
    }

    if (!productId) {
      setSaving(false)
      toast.error('ไม่พบรหัสเมนู')
      return
    }

    const deleteResult = await supabase
      .from('product_ingredients')
      .delete()
      .eq('product_id', productId)
      .eq('user_id', user.id)

    if (deleteResult.error) {
      setSaving(false)
      toast.error(deleteResult.error.message)
      return
    }

    if (cleanRecipe.length) {
      const insertResult = await supabase.from('product_ingredients').insert(
        cleanRecipe.map((row) => ({
          user_id: user.id,
          product_id: productId,
          ingredient_id: row.ingredient_id,
          quantity_used: row.quantity_used,
          ingredient_cost: row.ingredient_cost,
        })),
      )

      if (insertResult.error) {
        setSaving(false)
        toast.error(insertResult.error.message)
        return
      }
    }

    const updateCostResult = await supabase
      .from('products')
      .update({ product_cost: productCost })
      .eq('id', productId)
      .eq('user_id', user.id)

    setSaving(false)

    if (updateCostResult.error) {
      toast.error(updateCostResult.error.message)
      return
    }

    toast.success(editing ? 'แก้ไขต้นทุนเมนูแล้ว' : 'เพิ่มเมนูแล้ว')
    setModalOpen(false)
    await loadData()
  }

  const handleDelete = async () => {
    if (!user || !deleting) return

    setSaving(true)
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', deleting.id)
      .eq('user_id', user.id)
    setSaving(false)

    if (error) {
      toast.error('ลบไม่ได้เพราะเมนูนี้อาจมีรายการขายผูกอยู่')
      return
    }

    toast.success('ลบเมนูแล้ว')
    setDeleting(null)
    await loadData()
  }

  if (!isSupabaseConfigured) {
    return <EmptyState title="ยังไม่ได้เชื่อม Supabase" description={missingSupabaseMessage} icon={<Calculator size={28} />} />
  }

  return (
    <div className="space-y-5">
      <section className="soft-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="section-title">เมนูครอฟเฟิลของร้าน</h2>
            <p className="mt-1 text-sm text-cocoa-500/70">เพิ่มสูตรวัตถุดิบเพื่อคำนวณต้นทุนต่อชิ้นแบบใช้งานจริง</p>
          </div>
          <CuteButton className="w-full sm:w-auto" icon={<Plus size={18} />} size="lg" onClick={openCreate}>
            + เพิ่มเมนูสินค้า
          </CuteButton>
        </div>
      </section>

      {loading ? (
        <div className="soft-card p-6 text-center text-cocoa-500">กำลังโหลดต้นทุนเมนู...</div>
      ) : products.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {products.map((product) => {
            const badge = getProfitBadge(product.selling_price, product.product_cost)
            const profit = roundMoney(product.selling_price - product.product_cost)
            const margin = calculateMarginPercent(product.selling_price, product.product_cost)

            return (
              <article key={product.id} className="soft-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={clsx('inline-flex rounded-full px-3 py-1 text-xs font-semibold', badge.className)}>
                      {badge.label}
                    </span>
                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-cocoa-700">{product.name}</h2>
                    <p className="mt-1 text-sm text-cocoa-500/70">ราคาขาย {formatBaht(product.selling_price)}</p>
                  </div>
                  <div className="grid size-12 place-items-center rounded-2xl bg-rosemilk-100 text-rosemilk-400">
                    <Calculator size={24} />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <CostBox label="ต้นทุนรวม" value={formatBaht(product.product_cost)} />
                  <CostBox label="กำไร/ชิ้น" value={formatBaht(profit)} />
                  <CostBox label="Margin" value={`${formatNumber(margin, 2)}%`} />
                </div>

                <div className="mt-5 rounded-[1.75rem] bg-cream-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-cocoa-700">Breakdown ต้นทุน</p>
                  {product.recipe.length ? (
                    <div className="space-y-2">
                      {product.recipe.map((row) => (
                        <div key={row.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-cocoa-600">
                            {row.ingredients?.name ?? 'วัตถุดิบที่ถูกลบ'} · {formatNumber(row.quantity_used, 2)} {row.ingredients?.unit ?? ''}
                          </span>
                          <span className="font-semibold text-cocoa-700">{formatBaht(row.ingredient_cost)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-cocoa-500/70">ยังไม่มีสูตรวัตถุดิบ</p>
                  )}
                </div>

                <div className="mt-5 flex gap-2">
                  <CuteButton className="flex-1" icon={<Edit3 size={16} />} variant="secondary" onClick={() => openEdit(product)}>
                    แก้ไข
                  </CuteButton>
                  <CuteButton className="flex-1" icon={<Trash2 size={16} />} variant="danger" onClick={() => setDeleting(product)}>
                    ลบ
                  </CuteButton>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title="ยังไม่มีเมนูสินค้า"
          description="สร้างเมนู เช่น Nutella Banana แล้วเลือกวัตถุดิบในสูตรเพื่อคำนวณต้นทุน"
          action={<CuteButton icon={<Plus size={18} />} onClick={openCreate}>เพิ่มเมนูแรก</CuteButton>}
          icon={<Calculator size={28} />}
        />
      )}

      <Modal
        description="เลือกวัตถุดิบหลายรายการแล้วใส่ปริมาณที่ใช้ต่อ 1 เมนู"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <CuteButton className="w-full sm:w-auto" variant="secondary" onClick={() => setModalOpen(false)}>
              ยกเลิก
            </CuteButton>
            <CuteButton className="w-full sm:w-auto" loading={saving} type="submit" form="product-cost-form">
              บันทึกเมนู
            </CuteButton>
          </div>
        }
        open={modalOpen}
        title={editing ? 'แก้ไขเมนู' : '+ เพิ่มเมนูสินค้า'}
        onClose={() => setModalOpen(false)}
      >
        {ingredients.length ? (
          <form className="space-y-5" id="product-cost-form" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">ชื่อเมนู</span>
                <input
                  className="field-input mt-2"
                  placeholder="เช่น Nutella Banana"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>
              <label className="block">
                <span className="field-label">ราคาขาย</span>
                <input
                  className="field-input mt-2"
                  min="0"
                  step="0.01"
                  type="number"
                  value={form.selling_price}
                  onChange={(event) => setForm((current) => ({ ...current, selling_price: event.target.value }))}
                  required
                />
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-cocoa-700">รายการวัตถุดิบในสูตร</p>
                <CuteButton
                  icon={<Plus size={16} />}
                  size="sm"
                  variant="secondary"
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, recipe: [...current.recipe, emptyRecipeRow()] }))}
                >
                  เพิ่มวัตถุดิบ
                </CuteButton>
              </div>

              {form.recipe.map((row, index) => {
                const ingredient = ingredients.find((item) => item.id === row.ingredient_id)
                const lineCost = roundMoney((ingredient?.cost_per_unit ?? 0) * Number(row.quantity_used || 0))

                return (
                  <div key={`${index}-${row.ingredient_id}`} className="rounded-[1.75rem] bg-white p-4 shadow-sm">
                    <div className="grid gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end">
                      <label className="block">
                        <span className="field-label">วัตถุดิบ</span>
                        <select
                          className="field-input mt-2"
                          value={row.ingredient_id}
                          onChange={(event) => updateRecipeRow(index, { ingredient_id: event.target.value })}
                          required
                        >
                          <option value="">เลือกวัตถุดิบ</option>
                          {ingredients.map((ingredientOption) => (
                            <option key={ingredientOption.id} value={ingredientOption.id}>
                              {ingredientOption.name} ({formatBaht(ingredientOption.cost_per_unit)}/{ingredientOption.unit})
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="field-label">จำนวนที่ใช้</span>
                        <input
                          className="field-input mt-2"
                          min="0"
                          step="0.01"
                          type="number"
                          value={row.quantity_used}
                          onChange={(event) => updateRecipeRow(index, { quantity_used: event.target.value })}
                          required
                        />
                      </label>
                      <CuteButton type="button" variant="ghost" onClick={() => removeRecipeRow(index)}>
                        ลบ
                      </CuteButton>
                    </div>
                    <p className="mt-3 text-sm text-cocoa-500/75">
                      ต้นทุนวัตถุดิบนี้: <span className="font-semibold text-cocoa-700">{formatBaht(lineCost)}</span>
                      {ingredient ? ` · หน่วย ${ingredient.unit}` : ''}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="grid gap-3 rounded-[1.75rem] bg-rosemilk-100 p-4 sm:grid-cols-3">
              <CostBox label="ต้นทุนรวมต่อชิ้น" value={formatBaht(productCost)} />
              <CostBox label="กำไรต่อชิ้น" value={formatBaht(profitPerItem)} />
              <CostBox label="Margin" value={`${formatNumber(marginPercent, 2)}%`} />
            </div>
          </form>
        ) : (
          <EmptyState
            title="ต้องเพิ่มวัตถุดิบก่อน"
            description="ไปเพิ่มวัตถุดิบอย่างน้อย 1 รายการ แล้วกลับมาสร้างสูตรเมนู"
            action={<CuteButton onClick={() => navigate('/ingredients')}>ไปหน้าวัตถุดิบ</CuteButton>}
            icon={<Calculator size={28} />}
          />
        )}
      </Modal>

      <ConfirmDialog
        description="ถ้าเมนูนี้เคยถูกใช้ในรายการขาย ระบบจะไม่อนุญาตให้ลบเพื่อรักษาประวัติรายรับ"
        loading={saving}
        open={Boolean(deleting)}
        title="ลบเมนูนี้?"
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function CostBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] bg-white/75 px-4 py-3">
      <p className="text-xs text-cocoa-500/65">{label}</p>
      <p className="mt-1 font-semibold text-cocoa-700">{value}</p>
    </div>
  )
}

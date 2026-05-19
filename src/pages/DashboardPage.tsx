import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartNoAxesColumnIncreasing, Receipt, ShoppingBag, TrendingUp, Wallet } from 'lucide-react'
import { StatCard } from '../components/ui/StatCard'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseConfigured, missingSupabaseMessage, supabase } from '../lib/supabase'
import {
  formatBaht,
  formatDateThai,
  formatNumber,
  formatShortDate,
  getLastDays,
  getMonthRange,
  toInputDate,
  toInputMonth,
} from '../lib/format'
import type { ExpenseTransaction, IncomeTransaction, Product } from '../types/database'

type IncomeWithProduct = IncomeTransaction & {
  products: Pick<Product, 'name' | 'selling_price' | 'product_cost'> | null
}

type TopProduct = {
  name: string
  quantity: number
  income: number
}

const sum = <T,>(items: T[], selector: (item: T) => number) =>
  items.reduce((total, item) => total + selector(item), 0)

function topProducts(rows: IncomeWithProduct[]) {
  const grouped = rows.reduce<Record<string, TopProduct>>((acc, row) => {
    const key = row.product_id
    acc[key] ??= {
      name: row.products?.name ?? 'เมนูที่ถูกลบ',
      quantity: 0,
      income: 0,
    }
    acc[key].quantity += row.quantity
    acc[key].income += row.total_income
    return acc
  }, {})

  return Object.values(grouped)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3)
}

export function DashboardPage() {
  const { user } = useAuth()
  const [incomesMonth, setIncomesMonth] = useState<IncomeWithProduct[]>([])
  const [incomesSevenDays, setIncomesSevenDays] = useState<IncomeWithProduct[]>([])
  const [expensesMonth, setExpensesMonth] = useState<ExpenseTransaction[]>([])
  const [latestIncomes, setLatestIncomes] = useState<IncomeWithProduct[]>([])
  const [latestExpenses, setLatestExpenses] = useState<ExpenseTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false)
      return
    }

    const loadDashboard = async () => {
      setLoading(true)
      const today = toInputDate()
      const monthRange = getMonthRange(toInputMonth())
      const sevenDays = getLastDays(7)

      const [monthIncomeResult, sevenIncomeResult, monthExpenseResult, latestIncomeResult, latestExpenseResult] =
        await Promise.all([
          supabase
            .from('income_transactions')
            .select('*, products(name, selling_price, product_cost)')
            .eq('user_id', user.id)
            .gte('sale_date', monthRange.start)
            .lte('sale_date', monthRange.end)
            .order('sale_date', { ascending: false }),
          supabase
            .from('income_transactions')
            .select('*, products(name, selling_price, product_cost)')
            .eq('user_id', user.id)
            .gte('sale_date', sevenDays[0])
            .lte('sale_date', today)
            .order('sale_date', { ascending: true }),
          supabase
            .from('expense_transactions')
            .select('*')
            .eq('user_id', user.id)
            .gte('expense_date', monthRange.start)
            .lte('expense_date', monthRange.end)
            .order('expense_date', { ascending: false }),
          supabase
            .from('income_transactions')
            .select('*, products(name, selling_price, product_cost)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('expense_transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5),
        ])

      const firstError =
        monthIncomeResult.error ||
        sevenIncomeResult.error ||
        monthExpenseResult.error ||
        latestIncomeResult.error ||
        latestExpenseResult.error

      if (firstError) {
        toast.error(firstError.message)
        setLoading(false)
        return
      }

      setIncomesMonth((monthIncomeResult.data ?? []) as IncomeWithProduct[])
      setIncomesSevenDays((sevenIncomeResult.data ?? []) as IncomeWithProduct[])
      setExpensesMonth((monthExpenseResult.data ?? []) as ExpenseTransaction[])
      setLatestIncomes((latestIncomeResult.data ?? []) as IncomeWithProduct[])
      setLatestExpenses((latestExpenseResult.data ?? []) as ExpenseTransaction[])
      setLoading(false)
    }

    void loadDashboard()
  }, [user])

  const today = toInputDate()
  const todayIncomes = incomesMonth.filter((item) => item.sale_date === today)
  const todayExpenses = expensesMonth.filter((item) => item.expense_date === today)
  const monthIncome = sum(incomesMonth, (item) => item.total_income)
  const monthExpense = sum(expensesMonth, (item) => item.amount)
  const monthSalesProfit = sum(incomesMonth, (item) => item.estimated_profit)
  const todaySalesProfit = sum(todayIncomes, (item) => item.estimated_profit)

  const sevenDayIncomeChart = useMemo(
    () =>
      getLastDays(7).map((date) => ({
        date,
        label: formatShortDate(date),
        income: sum(
          incomesSevenDays.filter((item) => item.sale_date === date),
          (item) => item.total_income,
        ),
      })),
    [incomesSevenDays],
  )

  const sevenDayQuantityChart = useMemo(
    () =>
      getLastDays(7).map((date) => ({
        date,
        label: formatShortDate(date),
        quantity: sum(
          incomesSevenDays.filter((item) => item.sale_date === date),
          (item) => item.quantity,
        ),
      })),
    [incomesSevenDays],
  )

  if (!isSupabaseConfigured) {
    return (
      <EmptyState
        title="ยังไม่ได้เชื่อม Supabase"
        description={missingSupabaseMessage}
        icon={<Wallet size={28} />}
      />
    )
  }

  if (loading) {
    return <div className="soft-card p-6 text-center text-cocoa-500">กำลังโหลด Dashboard...</div>
  }

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          helper={`${formatNumber(sum(todayIncomes, (item) => item.quantity))} ชิ้น`}
          icon={<ShoppingBag size={22} />}
          title="ขายวันนี้"
          tone="pink"
          value={`${formatNumber(sum(todayIncomes, (item) => item.quantity))} ชิ้น`}
        />
        <StatCard
          helper={formatDateThai(today)}
          icon={<Wallet size={22} />}
          title="รายรับวันนี้"
          tone="cream"
          value={formatBaht(sum(todayIncomes, (item) => item.total_income))}
        />
        <StatCard
          helper="หลังหักต้นทุนเมนูและรายจ่าย"
          icon={<TrendingUp size={22} />}
          title="กำไรวันนี้"
          tone="green"
          value={formatBaht(todaySalesProfit - sum(todayExpenses, (item) => item.amount))}
        />
        <StatCard
          helper={`${todayExpenses.length} รายการ`}
          icon={<Receipt size={22} />}
          title="รายจ่ายวันนี้"
          tone="brown"
          value={formatBaht(sum(todayExpenses, (item) => item.amount))}
        />
      </section>

      <section className="soft-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-rosemilk-100 text-rosemilk-400">
            <ChartNoAxesColumnIncreasing size={21} />
          </div>
          <div>
            <h2 className="section-title">สรุปเดือนนี้</h2>
            <p className="text-sm text-cocoa-500/70">ตัวเลขรวมของเดือนปัจจุบัน</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <MiniSummary label="รายรับเดือนนี้" value={formatBaht(monthIncome)} />
          <MiniSummary label="รายจ่ายเดือนนี้" value={formatBaht(monthExpense)} />
          <MiniSummary label="กำไรเดือนนี้" value={formatBaht(monthSalesProfit - monthExpense)} />
          <MiniSummary label="จำนวนชิ้นที่ขาย" value={`${formatNumber(sum(incomesMonth, (item) => item.quantity))} ชิ้น`} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="กราฟยอดขายย้อนหลัง 7 วัน" subtitle="รายรับแต่ละวัน">
          <ResponsiveContainer height={250} width="100%">
            <AreaChart data={sevenDayIncomeChart}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#f48fa1" stopOpacity={0.52} />
                  <stop offset="95%" stopColor="#f48fa1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1dfc1" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#8f5f46', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#8f5f46', fontSize: 12 }} tickLine={false} axisLine={false} width={54} />
              <Tooltip formatter={(value) => formatBaht(Number(value))} />
              <Area dataKey="income" stroke="#f48fa1" fill="url(#incomeGradient)" strokeWidth={3} type="monotone" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="กราฟจำนวนชิ้นที่ขายย้อนหลัง 7 วัน" subtitle="จำนวนครอฟเฟิลที่ขายได้">
          <ResponsiveContainer height={250} width="100%">
            <BarChart data={sevenDayQuantityChart}>
              <CartesianGrid stroke="#f1dfc1" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#8f5f46', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#8f5f46', fontSize: 12 }} tickLine={false} axisLine={false} width={44} />
              <Tooltip formatter={(value) => `${formatNumber(Number(value))} ชิ้น`} />
              <Bar dataKey="quantity" fill="#e7a85c" radius={[14, 14, 6, 6]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <TopProductsCard title="เมนูขายดีวันนี้" products={topProducts(todayIncomes)} />
        <TopProductsCard title="เมนูขายดีเดือนนี้" products={topProducts(incomesMonth)} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <LatestList
          empty="ยังไม่มีรายรับล่าสุด"
          items={latestIncomes.map((item) => ({
            id: item.id,
            title: item.products?.name ?? 'เมนูที่ถูกลบ',
            subtitle: `${formatDateThai(item.sale_date)} · ${item.quantity} ชิ้น`,
            value: formatBaht(item.total_income),
          }))}
          title="รายรับล่าสุด"
        />
        <LatestList
          empty="ยังไม่มีรายจ่ายล่าสุด"
          items={latestExpenses.map((item) => ({
            id: item.id,
            title: item.title,
            subtitle: `${formatDateThai(item.expense_date)} · ${item.category}`,
            value: formatBaht(item.amount),
          }))}
          title="รายจ่ายล่าสุด"
        />
      </section>
    </div>
  )
}

function MiniSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] bg-cream-50 px-4 py-3">
      <p className="text-xs text-cocoa-500/65">{label}</p>
      <p className="mt-1 text-lg font-semibold text-cocoa-700">{value}</p>
    </div>
  )
}

function ChartCard({
  children,
  subtitle,
  title,
}: {
  children: React.ReactNode
  subtitle: string
  title: string
}) {
  return (
    <section className="soft-card p-5">
      <h2 className="section-title">{title}</h2>
      <p className="mb-4 mt-1 text-sm text-cocoa-500/70">{subtitle}</p>
      {children}
    </section>
  )
}

function TopProductsCard({ products, title }: { products: TopProduct[]; title: string }) {
  return (
    <section className="soft-card p-5">
      <h2 className="section-title">{title}</h2>
      <div className="mt-4 space-y-3">
        {products.length ? (
          products.map((product, index) => (
            <div key={product.name} className="flex items-center justify-between rounded-[1.5rem] bg-cream-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-full bg-rosemilk-100 text-sm font-semibold text-rosemilk-400">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-cocoa-700">{product.name}</p>
                  <p className="text-xs text-cocoa-500/65">{formatBaht(product.income)}</p>
                </div>
              </div>
              <p className="font-semibold text-cocoa-700">{formatNumber(product.quantity)} ชิ้น</p>
            </div>
          ))
        ) : (
          <p className="rounded-[1.5rem] bg-cream-50 px-4 py-5 text-center text-sm text-cocoa-500/70">
            ยังไม่มีข้อมูลขาย
          </p>
        )}
      </div>
    </section>
  )
}

function LatestList({
  empty,
  items,
  title,
}: {
  empty: string
  items: { id: string; title: string; subtitle: string; value: string }[]
  title: string
}) {
  return (
    <section className="soft-card p-5">
      <h2 className="section-title">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 rounded-[1.5rem] bg-white px-4 py-3 shadow-sm">
              <div>
                <p className="font-medium text-cocoa-700">{item.title}</p>
                <p className="text-xs text-cocoa-500/65">{item.subtitle}</p>
              </div>
              <p className="shrink-0 font-semibold text-cocoa-700">{item.value}</p>
            </div>
          ))
        ) : (
          <p className="rounded-[1.5rem] bg-cream-50 px-4 py-5 text-center text-sm text-cocoa-500/70">{empty}</p>
        )}
      </div>
    </section>
  )
}

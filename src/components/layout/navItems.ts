import {
  Calculator,
  Home,
  Package,
  Receipt,
  Settings,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  label: string
  path: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: Home },
  { label: 'รายรับ', path: '/income', icon: Wallet },
  { label: 'รายจ่าย', path: '/expenses', icon: Receipt },
  { label: 'วัตถุดิบ', path: '/ingredients', icon: Package },
  { label: 'ต้นทุน', path: '/product-costs', icon: Calculator },
  { label: 'ตั้งค่า', path: '/settings', icon: Settings },
]

export const primaryNavItems = navItems.slice(0, 5)

export const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'ภาพรวมร้าน',
    subtitle: 'สรุปรายรับ รายจ่าย และเมนูขายดีของ per.pung',
  },
  '/income': {
    title: 'รายรับ',
    subtitle: 'บันทึกยอดขายครอฟเฟิลแต่ละเมนู',
  },
  '/expenses': {
    title: 'รายจ่าย',
    subtitle: 'เก็บค่าใช้จ่ายร้านแบบเป็นหมวดหมู่',
  },
  '/ingredients': {
    title: 'ราคาวัตถุดิบ',
    subtitle: 'คำนวณต้นทุนต่อหน่วยให้พร้อมใช้ในสูตร',
  },
  '/product-costs': {
    title: 'ต้นทุนเมนู',
    subtitle: 'คำนวณต้นทุน กำไร และ margin ต่อชิ้น',
  },
  '/settings': {
    title: 'ตั้งค่า',
    subtitle: 'จัดการข้อมูลร้าน บัญชี และการสำรองข้อมูล',
  },
}

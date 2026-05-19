import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { useStoreSettings } from '../../hooks/useStoreSettings'
import { AppLogo } from '../ui/AppLogo'
import { primaryNavItems } from './navItems'

export function Sidebar() {
  const settings = useStoreSettings()

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/70 bg-white/55 px-5 py-6 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="rounded-[1.75rem] bg-cream-50 p-4 shadow-sm">
        <AppLogo className="mx-auto h-auto w-40" />
        <p className="mt-2 text-center text-xs font-medium text-cocoa-500/70">{settings.shopName} Store Manager</p>
      </div>

      <nav className="mt-8 space-y-2">
        {primaryNavItems.map((item) => (
          <NavLink
            key={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition',
                isActive
                  ? 'bg-rosemilk-100 text-cocoa-700 shadow-sm'
                  : 'text-cocoa-500 hover:bg-cream-100 hover:text-cocoa-700',
              )
            }
            to={item.path}
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-[1.75rem] bg-white/70 p-4 text-center text-xs leading-5 text-cocoa-500/65 shadow-sm">
        พร้อมจัดการร้านวันนี้
      </div>
    </aside>
  )
}

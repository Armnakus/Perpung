import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { primaryNavItems } from './navItems'

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/80 bg-white/[0.92] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_36px_rgba(116,71,47,0.12)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {primaryNavItems.map((item) => (
          <NavLink
            key={item.path}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition',
                isActive
                  ? 'bg-rosemilk-100 text-cocoa-700'
                  : 'text-cocoa-500/75 hover:bg-cream-100',
              )
            }
            to={item.path}
          >
            <item.icon size={21} />
            <span>{item.label === 'Dashboard' ? 'Home' : item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

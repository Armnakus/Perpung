import { useLocation } from 'react-router-dom'
import { useStoreSettings } from '../../hooks/useStoreSettings'
import { AppLogo } from '../ui/AppLogo'
import { AccountMenu } from './AccountMenu'
import { pageTitles } from './navItems'

export function Header() {
  const { pathname } = useLocation()
  const settings = useStoreSettings()
  const page = pageTitles[pathname] ?? pageTitles['/']

  return (
    <header className="mb-5 sm:mb-7">
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex min-w-0 max-w-full items-center gap-3 rounded-[1.75rem] bg-white/70 p-2.5 pr-4 shadow-sm backdrop-blur lg:rounded-full lg:py-2">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cream-50 lg:size-10">
            <AppLogo className="h-9 w-9 lg:h-8 lg:w-8" variant="mark" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-cocoa-700">{settings.shopName}</p>
            <p className="truncate text-[11px] font-medium text-cocoa-500/65 lg:text-xs">Store Manager</p>
          </div>
        </div>
        <AccountMenu />
      </div>

      <div className="mt-4 sm:mt-5">
        <h1 className="text-[1.8rem] font-semibold leading-tight tracking-[-0.05em] text-cocoa-700 sm:text-4xl">
          {page.title}
        </h1>
        <p className="mt-1 max-w-2xl text-[13px] leading-6 text-cocoa-500/75 sm:text-sm">{page.subtitle}</p>
      </div>
    </header>
  )
}

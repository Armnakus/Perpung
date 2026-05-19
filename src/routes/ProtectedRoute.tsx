import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AppLogo } from '../components/ui/AppLogo'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="soft-card flex w-full max-w-sm flex-col items-center gap-4 p-8 text-center">
          <div className="grid size-14 animate-soft-pulse place-items-center rounded-full bg-rosemilk-100">
            <AppLogo className="h-10 w-10" variant="mark" />
          </div>
          <p className="font-medium text-cocoa-600">กำลังเตรียมร้านให้พร้อม...</p>
        </div>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

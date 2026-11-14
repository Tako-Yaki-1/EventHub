import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'

export default function GuestRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <Loader2 className="size-6 animate-spin text-primary" aria-label="Loading" />
      </div>
    )
  }

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />

  return <Outlet />
}

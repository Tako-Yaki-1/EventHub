import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page">
      <Loader2 className="size-6 animate-spin text-primary" aria-label="Loading" />
    </div>
  )
}

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (role === 'admin' && user.role !== 'admin') return <Navigate to="/" replace />
  if (role === 'student' && user.role !== 'student') return <Navigate to="/admin" replace />

  return <Outlet />
}

import { Link, Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import Logo from '../components/ui/Logo'
import Tabs from '../components/ui/Tabs'
import { useAuth } from '../features/auth/AuthContext'

const tabs = [
  { label: 'Analytics', to: '/admin', end: true },
  { label: 'Events', to: '/admin/events' },
  { label: 'AI', to: '/admin/ai' },
  { label: 'Audit log', to: '/admin/audit' },
  { label: 'Users', to: '/admin/users' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-card-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/admin" aria-label="EventHub admin home">
              <Logo />
            </Link>
            <span className="rounded-full bg-tab-active px-3 py-1 text-xs font-semibold text-ink">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted sm:block">{user?.name}</span>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              className="flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-tile hover:text-ink"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-3">
          <Tabs items={tabs} />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

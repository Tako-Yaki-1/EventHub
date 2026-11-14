import { Link, Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import Logo from '../components/ui/Logo'
import Tabs from '../components/ui/Tabs'
import { useAuth } from '../features/auth/AuthContext'

const tabs = [
  { label: 'Home', to: '/', end: true },
  { label: 'Events', to: '/events' },
  { label: 'My Registrations', to: '/my-registrations' },
]

export default function StudentLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const initials = user?.name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-card-border bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" aria-label="EventHub home">
            <Logo />
          </Link>
          <Tabs items={tabs} className="hidden md:flex" />
          <div className="flex items-center gap-1">
            <span className="hidden max-w-40 truncate text-sm text-muted sm:block">{user?.name}</span>
            <Link
              to="/profile"
              className="flex size-9 items-center justify-center rounded-full bg-tile text-sm font-semibold text-ink transition hover:bg-tab-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label="Edit profile"
              title="Edit profile"
            >
              {initials}
            </Link>
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
        <div className="mx-auto max-w-3xl px-4 pb-3 md:hidden">
          <Tabs items={tabs} />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

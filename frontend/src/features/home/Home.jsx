import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell, CalendarDays, ClipboardList, Search } from 'lucide-react'
import { listEvents } from '../../api/events'
import { useAuth } from '../auth/AuthContext'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import EventCard from '../events/EventCard'

const shortcuts = [
  { label: 'Browse Events', to: '/events', icon: CalendarDays },
  { label: 'My Registrations', to: '/my-registrations', icon: ClipboardList },
  { label: 'Notifications', to: '/notifications', icon: Bell },
]

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [term, setTerm] = useState('')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['events', { when: 'upcoming', perPage: 5 }],
    queryFn: () => listEvents({ when: 'upcoming', per_page: 5 }),
  })

  const events = data?.data ?? []

  const handleSearch = (event) => {
    event.preventDefault()
    navigate(term.trim() ? `/events?q=${encodeURIComponent(term.trim())}` : '/events')
  }

  return (
    <div className="space-y-6">
      <section className="rounded-card bg-welcome p-5">
        <h1 className="text-xl font-semibold text-ink">Welcome, {user?.name}!</h1>
        <p className="mt-1 text-sm text-muted">
          {user?.year_section || 'Campus events, all in one place'}
        </p>

        <form onSubmit={handleSearch} className="mt-4 flex gap-2">
          <label htmlFor="home-search" className="sr-only">
            Search events
          </label>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-placeholder"
              aria-hidden="true"
            />
            <input
              id="home-search"
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search events, organizers, or venues"
              className="h-11 w-full rounded-input border border-input-border bg-white pr-3 pl-9 text-sm text-ink placeholder:text-placeholder focus:border-primary focus:outline-none"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </section>

      <section aria-labelledby="shortcuts-heading">
        <h2 id="shortcuts-heading" className="sr-only">
          Shortcuts
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {shortcuts.map(({ label, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col gap-2 rounded-card border border-card-border bg-white p-4 transition hover:border-primary/40 hover:bg-welcome/40"
            >
              <span className="flex size-10 items-center justify-center rounded-card bg-tile">
                <Icon className="size-5 text-primary" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-ink">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="upcoming-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="upcoming-heading" className="text-base font-semibold text-ink">
            Upcoming Events
          </h2>
          <Link to="/events" className="text-sm font-medium text-link hover:underline">
            View All
          </Link>
        </div>

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        )}

        {isError && (
          <EmptyState
            icon={CalendarDays}
            title="Could not load events"
            description="Check that the API is running, then try again."
            action={<Button onClick={() => refetch()}>Try again</Button>}
          />
        )}

        {!isLoading && !isError && events.length === 0 && (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming events"
            description="New campus events will appear here as organizers publish them."
          />
        )}

        {!isLoading && !isError && events.length > 0 && (
          <div className="space-y-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

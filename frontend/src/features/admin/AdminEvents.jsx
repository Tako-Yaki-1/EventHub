import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays,
  CalendarX2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Users,
  XCircle,
} from 'lucide-react'
import { cancelEvent } from '../../api/admin'
import { listEvents } from '../../api/events'
import Button from '../../components/ui/Button'
import Dialog from '../../components/ui/Dialog'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { formatDateRange } from '../../lib/dates'
import { errorMessage } from '../../lib/errors'

function StatusBadge({ status }) {
  if (status === 'cancelled') {
    return (
      <span className="rounded-full bg-tile px-2.5 py-1 text-xs font-semibold text-muted">
        Cancelled
      </span>
    )
  }

  return (
    <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-semibold text-success">
      Published
    </span>
  )
}

export default function AdminEvents() {
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [target, setTarget] = useState(null)

  const query = searchParams.get('q') ?? ''
  const status = searchParams.get('status') === 'cancelled' ? 'cancelled' : 'published'
  const page = Number(searchParams.get('page') ?? 1)
  const [term, setTerm] = useState(query)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-events', { q: query, status, page }],
    queryFn: () =>
      listEvents({
        q: query || undefined,
        status,
        when: 'all',
        page,
        per_page: 12,
      }),
  })

  const cancelMutation = useMutation({
    mutationFn: (eventId) => cancelEvent(eventId),
    onSuccess: () => {
      toast.success('Event cancelled.')
      setTarget(null)
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not cancel the event.'))
      setTarget(null)
    },
  })

  const events = data?.data ?? []
  const meta = data?.meta

  const updateParams = (next) => {
    const params = new URLSearchParams(searchParams)

    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    setSearchParams(params)
  }

  const handleSearch = (event) => {
    event.preventDefault()
    updateParams({ q: term.trim(), page: 1 })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Events</h1>
          <p className="mt-1 text-sm text-muted">Create, edit, and cancel campus events.</p>
        </div>
        <Link to="/admin/events/new">
          <Button>
            <Plus className="size-4" aria-hidden="true" />
            New event
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
        <label htmlFor="admin-events-search" className="sr-only">
          Search events
        </label>
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-placeholder"
            aria-hidden="true"
          />
          <input
            id="admin-events-search"
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search events"
            className="h-11 w-full rounded-input border border-input-border bg-white pr-3 pl-9 text-sm text-ink placeholder:text-placeholder focus:border-primary focus:outline-none"
          />
        </div>

        <label htmlFor="admin-events-status" className="sr-only">
          Filter by status
        </label>
        <select
          id="admin-events-status"
          value={status}
          onChange={(event) => updateParams({ status: event.target.value, page: 1 })}
          className="h-11 rounded-input border border-input-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none"
        >
          <option value="published">Published</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <Button type="submit">Search</Button>
      </form>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      )}

      {isError && (
        <EmptyState
          icon={CalendarX2}
          title="Could not load events"
          description="Check that the API is running, then try again."
          action={<Button onClick={() => refetch()}>Try again</Button>}
        />
      )}

      {!isLoading && !isError && events.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title={status === 'cancelled' ? 'No cancelled events' : 'No events yet'}
          description={
            query
              ? `Nothing matched "${query}". Try a different search.`
              : 'Create the first event so students have something to register for.'
          }
          action={
            <Link to="/admin/events/new">
              <Button>New event</Button>
            </Link>
          }
        />
      )}

      {!isLoading && !isError && events.length > 0 && (
        <div className="space-y-3">
          {events.map((event) => (
            <article
              key={event.id}
              className="rounded-card border border-card-border bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-ink">{event.title}</h2>
                    <StatusBadge status={event.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {formatDateRange(event.starts_at, event.ends_at)}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {event.location}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <Users className="size-3.5" aria-hidden="true" />
                    {event.registered_count} of {event.capacity} registered
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link to={`/admin/events/${event.id}/edit`}>
                    <Button variant="secondary" size="sm">
                      <Pencil className="size-3.5" aria-hidden="true" />
                      Edit
                    </Button>
                  </Link>
                  <Link to={`/admin/events/${event.id}/attendees`}>
                    <Button variant="secondary" size="sm">
                      <Users className="size-3.5" aria-hidden="true" />
                      Attendees
                    </Button>
                  </Link>
                  {event.status === 'published' && new Date(event.starts_at) > new Date() && (
                    <Button variant="danger" size="sm" onClick={() => setTarget(event)}>
                      <XCircle className="size-3.5" aria-hidden="true" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            disabled={meta.current_page <= 1}
            onClick={() => updateParams({ page: meta.current_page - 1 })}
          >
            Previous
          </Button>
          <span className="text-sm text-muted">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={meta.current_page >= meta.last_page}
            onClick={() => updateParams({ page: meta.current_page + 1 })}
          >
            Next
          </Button>
        </div>
      )}

      <Dialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title="Cancel this event?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)}>
              Keep
            </Button>
            <Button
              variant="danger"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate(target.id)}
            >
              Confirm
            </Button>
          </>
        }
      >
        {target?.title} — students will no longer see it in the upcoming list, and new registrations
        are blocked. Existing registrations stay in the history.
      </Dialog>
    </div>
  )
}

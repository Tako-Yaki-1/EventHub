import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CalendarX2, Users } from 'lucide-react'
import { listAttendees } from '../../api/admin'
import { getEvent } from '../../api/events'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import { formatDateRange, formatDateTime } from '../../lib/dates'

function AttendeeStatus({ status }) {
  if (status === 'cancelled') {
    return (
      <span className="rounded-full bg-tile px-2.5 py-1 text-xs font-semibold text-muted">
        Cancelled
      </span>
    )
  }

  return (
    <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-semibold text-success">
      Registered
    </span>
  )
}

export default function EventAttendees() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const statusParam = searchParams.get('status')
  const status = ['cancelled', 'all'].includes(statusParam) ? statusParam : 'registered'
  const page = Number(searchParams.get('page') ?? 1)

  const eventQuery = useQuery({
    queryKey: ['admin-event', String(id)],
    queryFn: () => getEvent(id),
  })

  const attendeesQuery = useQuery({
    queryKey: ['admin-attendees', String(id), { status, page }],
    queryFn: () => listAttendees(id, { status, page, per_page: 20 }),
  })

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

  const attendees = attendeesQuery.data?.data ?? []
  const meta = attendeesQuery.data?.meta

  return (
    <div className="space-y-5">
      <div>
        <Link
          to="/admin/events"
          className="inline-flex items-center gap-1 text-sm font-medium text-link hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to events
        </Link>

        {eventQuery.isLoading ? (
          <Skeleton className="mt-3 h-7 w-64" />
        ) : (
          <>
            <h1 className="mt-2 text-xl font-semibold text-ink">
              {eventQuery.data?.title ?? 'Attendees'}
            </h1>
            {eventQuery.data && (
              <p className="mt-1 text-sm text-muted">
                {formatDateRange(eventQuery.data.starts_at, eventQuery.data.ends_at)} ·{' '}
                {eventQuery.data.location}
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="attendee-status" className="text-sm font-medium text-ink">
          Show
        </label>
        <select
          id="attendee-status"
          value={status}
          onChange={(changeEvent) =>
            updateParams({ status: changeEvent.target.value, page: 1 })
          }
          className="h-10 rounded-input border border-input-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none"
        >
          <option value="registered">Registered</option>
          <option value="cancelled">Cancelled</option>
          <option value="all">All</option>
        </select>
      </div>

      {attendeesQuery.isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      )}

      {attendeesQuery.isError && (
        <EmptyState
          icon={CalendarX2}
          title="Could not load attendees"
          description="Check that the API is running, then try again."
          action={<Button onClick={() => attendeesQuery.refetch()}>Try again</Button>}
        />
      )}

      {!attendeesQuery.isLoading && !attendeesQuery.isError && attendees.length === 0 && (
        <EmptyState
          icon={Users}
          title="No attendees to show"
          description={
            status === 'registered'
              ? 'Nobody has registered for this event yet.'
              : 'No registrations match this filter.'
          }
        />
      )}

      {attendees.length > 0 && (
        <ul className="space-y-3">
          {attendees.map((attendee) => (
            <li
              key={attendee.id}
              className="rounded-card border border-card-border bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink">{attendee.full_name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {attendee.student_id} · {attendee.year_section || 'Unspecified'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{attendee.email}</p>
                </div>
                <div className="text-right">
                  <AttendeeStatus status={attendee.status} />
                  <p className="mt-1 text-xs text-muted">
                    Registered {formatDateTime(attendee.registered_at)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
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
    </div>
  )
}

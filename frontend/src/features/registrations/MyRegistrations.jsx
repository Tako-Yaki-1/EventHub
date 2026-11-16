import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarX2, CheckCircle2, ClipboardList, Clock, History, MapPin, XCircle } from 'lucide-react'
import { cancelRegistration, listMyRegistrations } from '../../api/registrations'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Dialog from '../../components/ui/Dialog'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { formatDate, formatTimeRange } from '../../lib/dates'
import { errorMessage } from '../../lib/errors'
import CalendarTile from '../events/CalendarTile'

function RegistrationCard({ registration, onCancel }) {
  const { event } = registration

  return (
    <article className="rounded-card border border-card-border bg-white p-4">
      <div className="flex items-start gap-3">
        <CalendarTile startsAt={event.starts_at} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-ink">{event.title}</h3>
            {registration.status === 'registered' ? (
              <Badge icon={CheckCircle2}>Registered</Badge>
            ) : (
              <span className="rounded-full bg-tile px-2.5 py-1 text-xs font-semibold text-muted">
                Cancelled
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">
            {formatDate(event.starts_at)} · {formatTimeRange(event.starts_at, event.ends_at)}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <MapPin className="size-3.5" aria-hidden="true" />
            {event.location}
          </p>
        </div>
        {onCancel && registration.status === 'registered' && (
          <Button variant="danger" size="sm" onClick={() => onCancel(registration)}>
            Cancel registration
          </Button>
        )}
      </div>
    </article>
  )
}

function Pagination({ label, meta, onChange }) {
  if (!meta || meta.last_page <= 1) return null

  return (
    <div className="flex items-center justify-between">
      <Button
        variant="secondary"
        size="sm"
        disabled={meta.current_page <= 1}
        onClick={() => onChange(meta.current_page - 1)}
        aria-label={`Previous ${label} page`}
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
        onClick={() => onChange(meta.current_page + 1)}
        aria-label={`Next ${label} page`}
      >
        Next
      </Button>
    </div>
  )
}

function Section({ id, title, icon: Icon, items, meta, empty, onCancel, onPage }) {
  return (
    <section className="space-y-3" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="flex items-center gap-1.5 text-base font-semibold text-ink">
        <Icon className="size-4 text-muted" aria-hidden="true" />
        {title}
      </h2>

      {items.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        items.map((registration) => (
          <RegistrationCard
            key={registration.id}
            registration={registration}
            onCancel={onCancel}
          />
        ))
      )}

      <Pagination label={title} meta={meta} onChange={onPage} />
    </section>
  )
}

export default function MyRegistrations() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [target, setTarget] = useState(null)
  const [pages, setPages] = useState({ upcoming: 1, past: 1, cancelled: 1 })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-registrations', pages],
    queryFn: () =>
      listMyRegistrations({
        upcoming_page: pages.upcoming,
        past_page: pages.past,
        cancelled_page: pages.cancelled,
      }),
  })

  const cancelMutation = useMutation({
    mutationFn: (registrationId) => cancelRegistration(registrationId),
    onSuccess: () => {
      toast.success('Registration cancelled.')
      setTarget(null)
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event'] })
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not cancel your registration.'))
      setTarget(null)
    },
  })

  const upcoming = data?.upcoming?.data ?? []
  const past = data?.past?.data ?? []
  const cancelled = data?.cancelled?.data ?? []
  const total =
    (data?.upcoming?.meta?.total ?? 0) +
    (data?.past?.meta?.total ?? 0) +
    (data?.cancelled?.meta?.total ?? 0)

  const setPage = (section, page) =>
    setPages((current) => ({ ...current, [section]: page }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">My Registrations</h1>
        <p className="mt-1 text-sm text-muted">Everything you signed up for, in one place.</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )}

      {isError && (
        <EmptyState
          icon={CalendarX2}
          title="Could not load your registrations"
          description="Check that the API is running, then try again."
          action={<Button onClick={() => refetch()}>Try again</Button>}
        />
      )}

      {!isLoading && !isError && total === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No registrations yet"
          description="Browse upcoming events and register for one you like."
          action={
            <Link to="/events">
              <Button>Browse Events</Button>
            </Link>
          }
        />
      )}

      {!isLoading && !isError && total > 0 && (
        <>
          <Section
            id="upcoming"
            title="Upcoming"
            icon={Clock}
            items={upcoming}
            meta={data?.upcoming?.meta}
            empty="No upcoming events right now."
            onCancel={setTarget}
            onPage={(page) => setPage('upcoming', page)}
          />

          <Section
            id="past"
            title="Past"
            icon={History}
            items={past}
            meta={data?.past?.meta}
            empty="No past events yet."
            onPage={(page) => setPage('past', page)}
          />

          <Section
            id="cancelled"
            title="Cancelled"
            icon={XCircle}
            items={cancelled}
            meta={data?.cancelled?.meta}
            empty="No cancelled registrations."
            onPage={(page) => setPage('cancelled', page)}
          />
        </>
      )}

      <Dialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title="Cancel this registration?"
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
        {target?.event?.title} — your slot will be released to other students.
      </Dialog>
    </div>
  )
}

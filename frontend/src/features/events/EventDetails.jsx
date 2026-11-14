import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  Clock,
  MapPin,
  User,
} from 'lucide-react'
import { getEvent } from '../../api/events'
import { cancelRegistration } from '../../api/registrations'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Dialog from '../../components/ui/Dialog'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { formatDate, formatTimeRange } from '../../lib/dates'
import { errorMessage } from '../../lib/errors'
import CalendarTile from './CalendarTile'
import RegisterForm from './RegisterForm'

export default function EventDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  const { data: event, isLoading, isError, refetch } = useQuery({
    queryKey: ['event', String(id)],
    queryFn: () => getEvent(id),
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelRegistration(event.my_registration.id),
    onSuccess: () => {
      toast.success('Registration cancelled.')
      setConfirmingCancel(false)
      queryClient.invalidateQueries({ queryKey: ['event', String(id)] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] })
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not cancel your registration.'))
      setConfirmingCancel(false)
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (isError) {
    return (
      <EmptyState
        icon={CalendarX2}
        title="Event not found"
        description="It may have been cancelled or removed."
        action={<Button onClick={() => refetch()}>Try again</Button>}
      />
    )
  }

  const isRegistered = event.my_registration?.status === 'registered'
  const hasStarted = new Date(event.starts_at) <= new Date()
  const isFull = event.slots_left <= 0
  const fillPercent = Math.min(100, Math.round((event.registered_count / event.capacity) * 100))

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-tile hover:text-ink"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
      </button>

      <section className="rounded-card border border-card-border bg-welcome p-5">
        <div className="flex items-start gap-3">
          <CalendarTile startsAt={event.starts_at} />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-ink">{event.title}</h1>
            <p className="mt-1 text-sm text-muted">
              {formatDate(event.starts_at)} · {formatTimeRange(event.starts_at, event.ends_at)}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
              <MapPin className="size-4" aria-hidden="true" />
              {event.location}
            </p>
            <p className="mt-0.5 text-sm text-muted">{event.organizer}</p>
          </div>
        </div>
      </section>

      <section className="rounded-card border border-card-border bg-white p-5">
        <h2 className="text-base font-semibold text-ink">About</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{event.description}</p>

        <dl className="mt-4 space-y-3 border-t border-card-border pt-4 text-sm">
          <div className="flex items-start gap-2">
            <dt className="sr-only">Date</dt>
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <dd>{formatDate(event.starts_at)}</dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="sr-only">Time</dt>
            <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <dd>{formatTimeRange(event.starts_at, event.ends_at)}</dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="sr-only">Location</dt>
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <dd>{event.location}</dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="sr-only">Organizer</dt>
            <User className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <dd>{event.organizer}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-card border border-card-border bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Slots</h2>
          <span className="text-sm font-semibold text-ink">
            {event.slots_left} of {event.capacity} left
          </span>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-tile"
          role="progressbar"
          aria-valuenow={fillPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Event capacity used"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${fillPercent}%` }} />
        </div>
      </section>

      <section className="rounded-card border border-card-border bg-white p-5">
        <h2 className="text-base font-semibold text-ink">
          {isRegistered ? 'Your registration' : 'Register for this event'}
        </h2>

        {isRegistered ? (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Badge icon={CheckCircle2}>Registered</Badge>
            <Button variant="danger" onClick={() => setConfirmingCancel(true)}>
              Cancel registration
            </Button>
          </div>
        ) : hasStarted ? (
          <p className="mt-2 text-sm text-muted">
            This event has already started, so registration is closed.
          </p>
        ) : isFull ? (
          <p className="mt-2 text-sm text-danger">
            This event is full. Check the Events page for other upcoming events.
          </p>
        ) : (
          <div className="mt-3">
            <RegisterForm event={event} />
          </div>
        )}
      </section>

      <p className="text-center text-sm text-muted">
        <Link to="/events" className="text-link hover:underline">
          Browse all events
        </Link>
      </p>

      <Dialog
        open={confirmingCancel}
        onClose={() => setConfirmingCancel(false)}
        title="Cancel this registration?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmingCancel(false)}>
              Keep
            </Button>
            <Button
              variant="danger"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              Confirm
            </Button>
          </>
        }
      >
        Your slot will be released to other students. You can register again if space is available.
      </Dialog>
    </div>
  )
}

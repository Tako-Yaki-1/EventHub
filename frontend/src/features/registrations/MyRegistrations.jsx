import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarX2, CheckCircle2, ClipboardList, MapPin, XCircle } from 'lucide-react'
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
        {registration.status === 'registered' && (
          <Button variant="danger" size="sm" onClick={() => onCancel(registration)}>
            Cancel registration
          </Button>
        )}
      </div>
    </article>
  )
}

export default function MyRegistrations() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [target, setTarget] = useState(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: listMyRegistrations,
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

  const registrations = data?.data ?? []
  const registered = registrations.filter((item) => item.status === 'registered')
  const cancelled = registrations.filter((item) => item.status === 'cancelled')

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

      {!isLoading && !isError && registrations.length === 0 && (
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

      {registered.length > 0 && (
        <section className="space-y-3" aria-labelledby="registered-heading">
          <h2 id="registered-heading" className="text-base font-semibold text-ink">
            Registered
          </h2>
          {registered.map((registration) => (
            <RegistrationCard
              key={registration.id}
              registration={registration}
              onCancel={setTarget}
            />
          ))}
        </section>
      )}

      {cancelled.length > 0 && (
        <section className="space-y-3" aria-labelledby="cancelled-heading">
          <h2 id="cancelled-heading" className="flex items-center gap-1.5 text-base font-semibold text-ink">
            <XCircle className="size-4 text-muted" aria-hidden="true" />
            Cancelled
          </h2>
          {cancelled.map((registration) => (
            <RegistrationCard
              key={registration.id}
              registration={registration}
              onCancel={setTarget}
            />
          ))}
        </section>
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

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CalendarX2, Save } from 'lucide-react'
import { cancelEvent, createEvent, updateEvent } from '../../api/admin'
import { getEvent } from '../../api/events'
import Button from '../../components/ui/Button'
import Dialog from '../../components/ui/Dialog'
import EmptyState from '../../components/ui/EmptyState'
import Input from '../../components/ui/Input'
import Skeleton from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { fromDateTimeLocal, toDateTimeLocal } from '../../lib/dates'
import { errorMessage, fieldErrors } from '../../lib/errors'

const emptyValues = {
  title: '',
  description: '',
  organizer: '',
  location: '',
  starts_at: '',
  ends_at: '',
  capacity: 100,
}

export default function AdminEventForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [values, setValues] = useState(emptyValues)
  const [errors, setErrors] = useState({})
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  const {
    data: event,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-event', String(id)],
    queryFn: () => getEvent(id),
    enabled: isEdit,
  })

  useEffect(() => {
    if (!event) return

    setValues({
      title: event.title,
      description: event.description,
      organizer: event.organizer,
      location: event.location,
      starts_at: toDateTimeLocal(event.starts_at),
      ends_at: toDateTimeLocal(event.ends_at),
      capacity: event.capacity,
    })
  }, [event])

  const saveMutation = useMutation({
    mutationFn: (payload) => (isEdit ? updateEvent(id, payload) : createEvent(payload)),
    onSuccess: () => {
      toast.success(isEdit ? 'Event updated.' : 'Event created.')
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['admin-event', String(id)] })
      navigate('/admin/events')
    },
    onError: (error) => {
      const fields = fieldErrors(error)
      setErrors(
        Object.fromEntries(
          Object.entries(fields).map(([field, messages]) => [field, messages[0]]),
        ),
      )
      toast.error(errorMessage(error, 'Could not save the event.'))
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelEvent(id),
    onSuccess: () => {
      toast.success('Event cancelled.')
      setConfirmingCancel(false)
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['admin-event', String(id)] })
      navigate('/admin/events')
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not cancel the event.'))
      setConfirmingCancel(false)
    },
  })

  const handleChange = (changeEvent) => {
    setValues((current) => ({ ...current, [changeEvent.target.name]: changeEvent.target.value }))
  }

  const handleSubmit = (submitEvent) => {
    submitEvent.preventDefault()
    setErrors({})

    saveMutation.mutate({
      ...values,
      capacity: Number(values.capacity),
      starts_at: fromDateTimeLocal(values.starts_at),
      ends_at: fromDateTimeLocal(values.ends_at),
    })
  }

  if (isEdit && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (isEdit && isError) {
    return (
      <EmptyState
        icon={CalendarX2}
        title="Event not found"
        description="It may have been removed. Go back to the events list."
        action={
          <Button onClick={() => refetch()}>Try again</Button>
        }
      />
    )
  }

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
        <h1 className="mt-2 text-xl font-semibold text-ink">
          {isEdit ? 'Edit event' : 'New event'}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Times are in your local timezone and stored as UTC.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-card border border-card-border bg-white p-4"
        noValidate
      >
        <Input
          label="Title"
          name="title"
          value={values.title}
          onChange={handleChange}
          error={errors.title}
          required
        />

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-ink">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={values.description}
            onChange={handleChange}
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={errors.description ? 'description-error' : undefined}
            className={`w-full rounded-input border bg-white px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none ${
              errors.description ? 'border-danger-border' : 'border-input-border'
            }`}
            required
          />
          {errors.description && (
            <p id="description-error" className="mt-1 text-xs text-danger">
              {errors.description}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Organizer"
            name="organizer"
            value={values.organizer}
            onChange={handleChange}
            error={errors.organizer}
            required
          />
          <Input
            label="Location"
            name="location"
            value={values.location}
            onChange={handleChange}
            error={errors.location}
            required
          />
          <Input
            label="Starts at"
            name="starts_at"
            type="datetime-local"
            value={values.starts_at}
            onChange={handleChange}
            error={errors.starts_at}
            required
          />
          <Input
            label="Ends at"
            name="ends_at"
            type="datetime-local"
            value={values.ends_at}
            onChange={handleChange}
            error={errors.ends_at}
            required
          />
          <Input
            label="Capacity"
            name="capacity"
            type="number"
            min={1}
            max={10000}
            value={values.capacity}
            onChange={handleChange}
            error={errors.capacity}
            hint="Cannot be lower than the number of registered students."
            required
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border pt-4">
          <div className="flex gap-2">
            <Button type="submit" loading={saveMutation.isPending}>
              <Save className="size-4" aria-hidden="true" />
              {isEdit ? 'Save changes' : 'Create event'}
            </Button>
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>

          {isEdit && event?.status === 'published' && (
            <Button variant="danger" onClick={() => setConfirmingCancel(true)}>
              Cancel event
            </Button>
          )}
        </div>
      </form>

      <Dialog
        open={confirmingCancel}
        onClose={() => setConfirmingCancel(false)}
        title="Cancel this event?"
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
        Students will no longer see it in the upcoming list, and new registrations are blocked.
        Existing registrations stay in the history.
      </Dialog>
    </div>
  )
}

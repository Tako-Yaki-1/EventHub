import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarCheck } from 'lucide-react'
import { registerForEvent } from '../../api/registrations'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../auth/AuthContext'
import { errorMessage, fieldErrors } from '../../lib/errors'

export default function RegisterForm({ event }) {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [values, setValues] = useState({
    full_name: user?.name ?? '',
    student_id: user?.student_id ?? '',
    year_section: user?.year_section ?? '',
    email: user?.email ?? '',
    confirmed_attendance: false,
  })
  const [errors, setErrors] = useState({})

  const mutation = useMutation({
    mutationFn: (payload) => registerForEvent(event.id, payload),
    onSuccess: () => {
      toast.success('You are registered.')
      queryClient.invalidateQueries({ queryKey: ['event', String(event.id)] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] })
    },
    onError: (error) => {
      const fields = fieldErrors(error)
      setErrors(
        Object.fromEntries(
          Object.entries(fields).map(([field, messages]) => [field, messages[0]]),
        ),
      )
      toast.error(errorMessage(error, 'Could not complete your registration.'))
    },
  })

  const handleChange = (changeEvent) => {
    const { name, value, type, checked } = changeEvent.target
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (submitEvent) => {
    submitEvent.preventDefault()
    setErrors({})
    mutation.mutate(values)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Full Name"
          name="full_name"
          value={values.full_name}
          onChange={handleChange}
          error={errors.full_name}
          required
        />
        <Input
          label="Student ID"
          name="student_id"
          value={values.student_id}
          onChange={handleChange}
          error={errors.student_id}
          required
        />
        <Input
          label="Year & Section"
          name="year_section"
          placeholder="BSIT 3B"
          value={values.year_section}
          onChange={handleChange}
          error={errors.year_section}
          required
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
      </div>

      <div>
        <label className="flex items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="confirmed_attendance"
            checked={values.confirmed_attendance}
            onChange={handleChange}
            className="mt-0.5 size-4 rounded border-input-border accent-primary"
          />
          I confirm that I will attend this event
        </label>
        {errors.confirmed_attendance && (
          <p className="mt-1 text-xs text-danger">{errors.confirmed_attendance}</p>
        )}
      </div>

      <Button type="submit" loading={mutation.isPending} disabled={!values.confirmed_attendance}>
        <CalendarCheck className="size-4" aria-hidden="true" />
        Register
      </Button>
    </form>
  )
}

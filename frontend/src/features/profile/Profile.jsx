import { useState } from 'react'
import { GraduationCap, Hash, Lock, Mail, User } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { errorMessage, fieldErrors } from '../../lib/errors'
import { useAuth } from '../auth/AuthContext'

const emptyPasswords = {
  current_password: '',
  password: '',
  password_confirmation: '',
}

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const toast = useToast()

  const [values, setValues] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    student_id: user?.student_id ?? '',
    year_section: user?.year_section ?? '',
    ...emptyPasswords,
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    const payload = {
      name: values.name,
      email: values.email,
      student_id: values.student_id,
      year_section: values.year_section,
    }

    if (values.password) {
      payload.current_password = values.current_password
      payload.password = values.password
      payload.password_confirmation = values.password_confirmation
    }

    try {
      await updateProfile(payload)
      setValues((current) => ({ ...current, ...emptyPasswords }))
      toast.success('Profile updated.')
    } catch (error) {
      const fields = fieldErrors(error)
      setErrors(
        Object.fromEntries(
          Object.entries(fields).map(([field, messages]) => [field, messages[0]]),
        ),
      )
      toast.error(errorMessage(error, 'Could not update your profile.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Edit Profile</h1>
        <p className="mt-1 text-sm text-muted">
          Keep your details current so event forms fill in correctly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <section
          aria-labelledby="details-heading"
          className="rounded-card border border-card-border bg-white p-4"
        >
          <h2 id="details-heading" className="text-base font-semibold text-ink">
            Personal details
          </h2>
          <div className="mt-3 space-y-4">
            <Input
              label="Full Name"
              name="name"
              icon={User}
              autoComplete="name"
              value={values.name}
              onChange={handleChange}
              error={errors.name}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              icon={Mail}
              autoComplete="email"
              value={values.email}
              onChange={handleChange}
              error={errors.email}
              required
            />
            <Input
              label="Student ID"
              name="student_id"
              icon={Hash}
              value={values.student_id}
              onChange={handleChange}
              error={errors.student_id}
              required
            />
            <Input
              label="Year & Section"
              name="year_section"
              icon={GraduationCap}
              placeholder="BSIT 3B"
              value={values.year_section}
              onChange={handleChange}
              error={errors.year_section}
            />
          </div>
        </section>

        <section
          aria-labelledby="password-heading"
          className="rounded-card border border-card-border bg-white p-4"
        >
          <h2 id="password-heading" className="text-base font-semibold text-ink">
            Change password
          </h2>
          <p className="mt-1 text-sm text-muted">Leave these blank to keep your current password.</p>
          <div className="mt-3 space-y-4">
            <Input
              label="Current Password"
              name="current_password"
              type="password"
              icon={Lock}
              autoComplete="current-password"
              value={values.current_password}
              onChange={handleChange}
              error={errors.current_password}
            />
            <Input
              label="New Password"
              name="password"
              type="password"
              icon={Lock}
              autoComplete="new-password"
              hint="At least 8 characters."
              value={values.password}
              onChange={handleChange}
              error={errors.password}
            />
            <Input
              label="Confirm New Password"
              name="password_confirmation"
              type="password"
              icon={Lock}
              autoComplete="new-password"
              value={values.password_confirmation}
              onChange={handleChange}
              error={errors.password_confirmation}
            />
          </div>
        </section>

        <Button type="submit" loading={submitting} className="w-full sm:w-auto">
          Save changes
        </Button>
      </form>
    </div>
  )
}

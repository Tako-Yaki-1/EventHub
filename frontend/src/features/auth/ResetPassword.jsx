import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import AuthLayout from '../../layouts/AuthLayout'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { resetPassword } from '../../api/auth'
import { errorMessage, fieldErrors } from '../../lib/errors'

export default function ResetPassword() {
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const emailParam = searchParams.get('email') ?? ''

  const [values, setValues] = useState({
    email: emailParam,
    password: '',
    password_confirmation: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const validLink = Boolean(token && emailParam)

  const handleChange = (event) => {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    try {
      await resetPassword({ ...values, token })
      toast.success('Password reset. Log in with your new password.')
      navigate('/login', { replace: true })
    } catch (requestError) {
      const fields = fieldErrors(requestError)
      setErrors(
        Object.fromEntries(
          Object.entries(fields).map(([field, messages]) => [field, messages[0]]),
        ),
      )
      toast.error(errorMessage(requestError, 'Could not reset your password.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <section className="rounded-card border border-card-border bg-welcome p-5">
        <h2 className="text-lg font-semibold text-ink">Choose a new password</h2>
        <p className="mt-0.5 text-sm text-muted">
          {validLink
            ? 'Use at least 8 characters.'
            : 'This reset link is incomplete or expired.'}
        </p>

        {validLink ? (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
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
              label="New Password"
              name="password"
              type="password"
              icon={Lock}
              autoComplete="new-password"
              value={values.password}
              onChange={handleChange}
              error={errors.password}
              required
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
              required
            />

            <Button type="submit" loading={submitting} className="w-full">
              Reset password
            </Button>
          </form>
        ) : (
          <Button className="mt-5 w-full" onClick={() => navigate('/forgot-password')}>
            Request a new link
          </Button>
        )}

        <p className="mt-4 text-center text-sm text-muted">
          <Link to="/login" className="font-medium text-link hover:underline">
            Back to log in
          </Link>
        </p>
      </section>
    </AuthLayout>
  )
}

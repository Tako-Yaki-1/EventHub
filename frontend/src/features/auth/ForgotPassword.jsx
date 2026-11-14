import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import AuthLayout from '../../layouts/AuthLayout'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { forgotPassword } from '../../api/auth'
import { errorMessage, fieldErrors } from '../../lib/errors'

export default function ForgotPassword() {
  const toast = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await forgotPassword(email)
      setSent(true)
      toast.success('Check your email for the reset link.')
    } catch (requestError) {
      setError(fieldErrors(requestError).email?.[0] ?? '')
      toast.error(errorMessage(requestError, 'Could not send the reset link.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <section className="rounded-card border border-card-border bg-welcome p-5">
        <h2 className="text-lg font-semibold text-ink">Reset password</h2>
        <p className="mt-0.5 text-sm text-muted">
          {sent
            ? 'If that email is registered, a reset link is on its way.'
            : 'Enter your email and we will send you a reset link.'}
        </p>

        {sent ? (
          <div className="mt-5 space-y-4">
            <p className="rounded-card border border-card-border bg-white p-3 text-sm text-muted">
              The link expires in 60 minutes. Check your spam folder if you do not see it.
            </p>
            <Button className="w-full" onClick={() => navigate('/login')}>
              Back to log in
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <Input
              label="Email"
              name="email"
              type="email"
              icon={Mail}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={error}
              required
            />

            <Button type="submit" loading={submitting} className="w-full">
              Send reset link
            </Button>
          </form>
        )}

        {!sent && (
          <p className="mt-4 text-center text-sm text-muted">
            Remembered it?{' '}
            <Link to="/login" className="font-medium text-link hover:underline">
              Log in
            </Link>
          </p>
        )}
      </section>
    </AuthLayout>
  )
}

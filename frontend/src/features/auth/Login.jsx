import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import AuthLayout from '../../layouts/AuthLayout'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from './AuthContext'
import { errorMessage, fieldErrors } from '../../lib/errors'

export default function Login() {
  const { login, sessionMessage } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [values, setValues] = useState({ login: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    try {
      const user = await login(values)
      const fallback = user.role === 'admin' ? '/admin' : '/'
      navigate(location.state?.from?.pathname ?? fallback, { replace: true })
    } catch (error) {
      const fields = fieldErrors(error)
      setErrors({
        login: fields.login?.[0],
        password: fields.password?.[0],
      })
      toast.error(errorMessage(error, 'Could not log you in.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <section className="rounded-card border border-card-border bg-welcome p-5">
        <h2 className="text-lg font-semibold text-ink">Welcome back</h2>
        <p className="mt-0.5 text-sm text-muted">Log in to register for campus events.</p>

        {sessionMessage && (
          <p role="status" className="mt-3 rounded-btn border border-danger-border bg-white px-3 py-2 text-sm text-danger">
            {sessionMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          <Input
            label="Student ID or Email"
            name="login"
            type="text"
            autoComplete="username"
            icon={Mail}
            value={values.login}
            onChange={handleChange}
            error={errors.login}
            required
          />
          <Input
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            icon={Lock}
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            required
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="flex size-8 items-center justify-center rounded-full text-placeholder hover:text-ink"
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            }
          />

          <div className="-mt-1 text-right">
            <Link to="/forgot-password" className="text-sm font-medium text-link hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" loading={submitting} className="w-full">
            Log In
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          New here?{' '}
          <Link to="/signup" className="font-medium text-link hover:underline">
            Create an account
          </Link>
        </p>
      </section>
    </AuthLayout>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, Hash, Lock, Mail, User } from 'lucide-react'
import AuthLayout from '../../layouts/AuthLayout'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from './AuthContext'
import { errorMessage, fieldErrors } from '../../lib/errors'

const emptyValues = {
  name: '',
  email: '',
  student_id: '',
  year_section: '',
  password: '',
  password_confirmation: '',
}

export default function Signup() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [values, setValues] = useState(emptyValues)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    try {
      await register(values)
      toast.success('Account created. Welcome to EventHub!')
      navigate('/', { replace: true })
    } catch (error) {
      const fields = fieldErrors(error)
      setErrors(
        Object.fromEntries(
          Object.entries(fields).map(([field, messages]) => [field, messages[0]]),
        ),
      )
      toast.error(errorMessage(error, 'Could not create your account.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <section className="rounded-card border border-card-border bg-welcome p-5">
        <h2 className="text-lg font-semibold text-ink">Create an account</h2>
        <p className="mt-0.5 text-sm text-muted">Use your school email and student ID.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
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
          <Input
            label="Password"
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
            label="Confirm Password"
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
            Create Account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-link hover:underline">
            Log in
          </Link>
        </p>
      </section>
    </AuthLayout>
  )
}

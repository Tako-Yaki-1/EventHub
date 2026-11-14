import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-primary text-white hover:opacity-90',
  secondary: 'border border-input-border bg-white text-ink hover:bg-welcome',
  danger: 'border border-danger-border bg-white text-danger hover:bg-danger/5',
  ghost: 'text-link hover:bg-tile',
}

const sizes = {
  md: 'h-11 px-4 text-sm',
  sm: 'h-9 px-3 text-sm',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-btn font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}

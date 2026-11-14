import { useId } from 'react'

export default function Input({
  label,
  name,
  error,
  hint,
  icon: Icon,
  trailing,
  className = '',
  id,
  ...props
}) {
  const generatedId = useId()
  const inputId = id ?? name ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-placeholder"
            aria-hidden="true"
          />
        )}
        <input
          id={inputId}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`h-11 w-full rounded-input border bg-white px-3 text-sm text-ink placeholder:text-placeholder focus:border-primary focus:outline-none ${
            Icon ? 'pl-9' : ''
          } ${trailing ? 'pr-10' : ''} ${error ? 'border-danger-border' : 'border-input-border'}`}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-2 flex items-center">{trailing}</div>}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
      {!error && hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

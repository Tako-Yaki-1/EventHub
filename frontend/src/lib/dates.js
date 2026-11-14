export function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatTimeRange(startsAt, endsAt) {
  return `${formatTime(startsAt)} – ${formatTime(endsAt)}`
}

export function formatDateRange(startsAt, endsAt) {
  return `${formatDate(startsAt)}, ${formatTimeRange(startsAt, endsAt)}`
}

export function formatDateTime(iso) {
  return `${formatDate(iso)}, ${formatTime(iso)}`
}

export function eventDay(iso) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric' })
}

export function eventMonth(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short' }).toUpperCase()
}

export function toDateTimeLocal(iso) {
  if (!iso) return ''

  const date = new Date(iso)
  const pad = (value) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

export function fromDateTimeLocal(value) {
  return value ? new Date(value).toISOString() : ''
}

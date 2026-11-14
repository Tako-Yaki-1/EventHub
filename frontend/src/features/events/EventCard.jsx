import { Link } from 'react-router-dom'
import { ChevronRight, MapPin } from 'lucide-react'
import CalendarTile from './CalendarTile'
import { formatDate, formatTimeRange } from '../../lib/dates'

export default function EventCard({ event }) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="flex items-center gap-3 rounded-card border border-card-border bg-white p-3 transition hover:border-primary/40 hover:bg-welcome/40"
    >
      <CalendarTile startsAt={event.starts_at} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-ink">{event.title}</h3>
        <p className="mt-0.5 text-xs text-muted">
          {formatDate(event.starts_at)} · {formatTimeRange(event.starts_at, event.ends_at)}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
          <MapPin className="size-3.5" aria-hidden="true" />
          {event.location}
        </p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-placeholder" aria-hidden="true" />
    </Link>
  )
}

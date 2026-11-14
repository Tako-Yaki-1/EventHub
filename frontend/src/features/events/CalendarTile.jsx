import { eventDay, eventMonth } from '../../lib/dates'

export default function CalendarTile({ startsAt, className = '' }) {
  return (
    <div
      className={`flex size-14 shrink-0 flex-col items-center justify-center rounded-card bg-tile ${className}`}
      aria-hidden="true"
    >
      <span className="text-[11px] font-semibold tracking-wide text-primary">
        {eventMonth(startsAt)}
      </span>
      <span className="text-xl font-bold leading-none text-ink">{eventDay(startsAt)}</span>
    </div>
  )
}

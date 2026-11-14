import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Search } from 'lucide-react'
import { listEvents } from '../../api/events'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import EventCard from './EventCard'

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const when = searchParams.get('when') === 'past' ? 'past' : 'upcoming'
  const page = Number(searchParams.get('page') ?? 1)

  const [term, setTerm] = useState(query)

  useEffect(() => {
    setTerm(query)
  }, [query])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['events', { q: query, when, page }],
    queryFn: () => listEvents({ q: query || undefined, when, page }),
  })

  const events = data?.data ?? []
  const meta = data?.meta

  const updateParams = (next) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })
    setSearchParams(params)
  }

  const handleSearch = (event) => {
    event.preventDefault()
    updateParams({ q: term.trim(), page: 1 })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">Events</h1>
        <p className="mt-1 text-sm text-muted">Find something worth showing up for.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <label htmlFor="events-search" className="sr-only">
          Search events
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-placeholder"
            aria-hidden="true"
          />
          <input
            id="events-search"
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search events"
            className="h-11 w-full rounded-input border border-input-border bg-white pr-3 pl-9 text-sm text-ink placeholder:text-placeholder focus:border-primary focus:outline-none"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="flex gap-1" role="group" aria-label="Filter events by date">
        <button
          type="button"
          onClick={() => updateParams({ when: 'upcoming', page: 1 })}
          aria-pressed={when === 'upcoming'}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            when === 'upcoming' ? 'bg-tab-active text-ink' : 'text-muted hover:text-ink'
          }`}
        >
          Upcoming
        </button>
        <button
          type="button"
          onClick={() => updateParams({ when: 'past', page: 1 })}
          aria-pressed={when === 'past'}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            when === 'past' ? 'bg-tab-active text-ink' : 'text-muted hover:text-ink'
          }`}
        >
          Past
        </button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      )}

      {isError && (
        <EmptyState
          icon={CalendarDays}
          title="Could not load events"
          description="Check that the API is running, then try again."
          action={<Button onClick={() => refetch()}>Try again</Button>}
        />
      )}

      {!isLoading && !isError && events.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title={when === 'past' ? 'No past events' : 'No events found'}
          description={
            query
              ? `Nothing matched "${query}". Try a different search.`
              : 'Events will appear here once organizers publish them.'
          }
        />
      )}

      {!isLoading && !isError && events.length > 0 && (
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            disabled={meta.current_page <= 1}
            onClick={() => updateParams({ page: meta.current_page - 1 })}
          >
            Previous
          </Button>
          <span className="text-sm text-muted">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={meta.current_page >= meta.last_page}
            onClick={() => updateParams({ page: meta.current_page + 1 })}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

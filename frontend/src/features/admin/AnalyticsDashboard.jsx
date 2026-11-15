import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  Info,
  Percent,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  getByYearSection,
  getEventsPerformance,
  getInsights,
  getRegistrationsOverTime,
  getSummary,
  getTopEvents,
} from '../../api/analytics'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import KpiCard from './KpiCard'
import ChartCard from './ChartCard'
import AiSummaryCard from './AiSummaryCard'

const axisTick = { fontSize: 11, fill: 'var(--color-muted)' }
const chartHeight = 240

function shortDate(value) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function shortTitle(value) {
  return value.length > 22 ? `${value.slice(0, 22)}…` : value
}

export default function AnalyticsDashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const [summary, overTime, performance, topEvents, byYearSection, insights] =
        await Promise.all([
          getSummary(),
          getRegistrationsOverTime(30),
          getEventsPerformance(),
          getTopEvents(5),
          getByYearSection(),
          getInsights(),
        ])

      return { summary, overTime, performance, topEvents, byYearSection, insights }
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    )
  }

  if (isError) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Could not load the dashboard"
        description="Check that the API is running, then try again."
        action={<Button onClick={() => refetch()}>Try again</Button>}
      />
    )
  }

  const { summary, overTime, performance, topEvents, byYearSection, insights } = data
  const hasOverTime = overTime.data.some(
    (point) => point.registrations > 0 || point.cancellations > 0,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Analytics</h1>
        <p className="mt-1 text-sm text-muted">How your campus events are doing right now.</p>
      </div>

      <AiSummaryCard />

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-5">        <KpiCard icon={CalendarDays} label="Total events" value={summary.total_events} />
        <KpiCard
          icon={CalendarPlus}
          label="Upcoming events"
          value={summary.upcoming_events}
          hint="Published"
        />
        <KpiCard
          icon={Users}
          label="Active registrations"
          value={summary.active_registrations}
        />
        <KpiCard
          icon={Percent}
          label="Cancellation rate"
          value={`${Math.round(summary.cancellation_rate * 100)}%`}
          hint="Of all registrations"
        />
        <KpiCard
          icon={ClipboardList}
          label="Average fill rate"
          value={`${Math.round(summary.average_fill_rate * 100)}%`}
          hint="Upcoming events"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Registrations per day"
          caption="Sign-ups over the last 30 days. A flat line means nobody is hearing about your events."
          empty={!hasOverTime}
        >
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={overTime.data} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-card-border)" />
              <XAxis dataKey="date" tick={axisTick} tickFormatter={shortDate} minTickGap={24} />
              <YAxis tick={axisTick} allowDecimals={false} />
              <Tooltip labelFormatter={(value) => shortDate(value)} />
              <Line
                type="monotone"
                dataKey="registrations"
                name="Registrations"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Fill rate per upcoming event"
          caption="Registered students against capacity — longest bars fill first, so short bars need promotion."
          empty={performance.length === 0}
        >
          <ResponsiveContainer
            width="100%"
            height={Math.max(chartHeight, performance.length * 34)}
          >
            <BarChart
              data={performance}
              layout="vertical"
              margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-card-border)" />
              <XAxis type="number" tick={axisTick} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="title"
                tick={axisTick}
                tickFormatter={shortTitle}
                interval={0}
                width={130}
              />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="registered"
                name="Registered"
                fill="var(--color-primary)"
                radius={[0, 4, 4, 0]}
              />
              <Bar
                dataKey="capacity"
                name="Capacity"
                fill="var(--color-placeholder)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Registrations by year and section"
          caption="Which classes show up. If one section is missing, ask its officers to share the next event."
          empty={byYearSection.length === 0}
        >
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={byYearSection} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-card-border)" />
              <XAxis dataKey="year_section" tick={axisTick} />
              <YAxis tick={axisTick} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="registrations" name="Registrations" fill="var(--color-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Top 5 events by registrations"
          caption="Your strongest draws. Reuse their format, speakers, or time slot for the next event."
          empty={topEvents.length === 0}
        >
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={topEvents}
              layout="vertical"
              margin={{ top: 4, right: 12, bottom: 0, left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-card-border)" />
              <XAxis type="number" tick={axisTick} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="title"
                tick={axisTick}
                tickFormatter={shortTitle}
                width={130}
              />
              <Tooltip />
              <Bar
                dataKey="registrations"
                name="Registrations"
                fill="var(--color-primary)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <section className="rounded-card border border-card-border bg-white p-4">
        <h2 className="text-sm font-semibold text-ink">What needs attention</h2>

        {insights.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Nothing to flag right now. Events are filling at a healthy pace.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {insights.map((insight) => (
              <li key={`${insight.type}-${insight.event_id}`} className="flex items-start gap-2">
                {insight.severity === 'warning' ? (
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0 text-danger"
                    aria-hidden="true"
                  />
                ) : (
                  <Info className="mt-0.5 size-4 shrink-0 text-link" aria-hidden="true" />
                )}
                <div>
                  <p className="text-sm font-medium text-ink">{insight.title}</p>
                  <p className="text-xs text-muted">{insight.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

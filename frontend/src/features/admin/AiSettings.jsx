import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bot, SlidersHorizontal } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getAiSettings, getAiUsage, updateAiSettings } from '../../api/ai'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Input from '../../components/ui/Input'
import Skeleton from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { errorMessage } from '../../lib/errors'
import ChartCard from './ChartCard'

const axisTick = { fontSize: 11, fill: 'var(--color-muted)' }

function shortDate(value) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function AiSettings() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState(null)

  const settingsQuery = useQuery({ queryKey: ['ai-settings'], queryFn: getAiSettings })
  const usageQuery = useQuery({ queryKey: ['ai-usage'], queryFn: () => getAiUsage(30) })

  const settings = settingsQuery.data
  const form = draft ?? settings

  const save = useMutation({
    mutationFn: updateAiSettings,
    onSuccess: () => {
      setDraft(null)
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] })
      toast.success('AI settings saved.')
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save the AI settings.')),
  })

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (settingsQuery.isError || !form) {
    return (
      <EmptyState
        icon={SlidersHorizontal}
        title="Could not load AI settings"
        description="Check that the API is running, then try again."
        action={<Button onClick={() => settingsQuery.refetch()}>Try again</Button>}
      />
    )
  }

  const change = (key, value) => setDraft({ ...form, [key]: value })
  const usage = usageQuery.data

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">AI settings</h1>
        <p className="mt-1 text-sm text-muted">
          Turn AI features on or off, set the per-user token budget, and watch usage.
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          save.mutate({
            enabled: form.enabled,
            assistant_enabled: form.assistant_enabled,
            summary_enabled: form.summary_enabled,
            daily_token_limit: Number(form.daily_token_limit),
          })
        }}
        className="space-y-4 rounded-card border border-card-border bg-white p-4"
      >
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Bot className="size-4 text-primary" aria-hidden="true" />
          Features
        </h2>

        <label className="flex items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => change('enabled', event.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span>
            <span className="font-medium">AI enabled</span>
            <span className="block text-xs text-muted">
              Master switch. Turning it off makes every feature use its fallback.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.assistant_enabled}
            onChange={(event) => change('assistant_enabled', event.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span>
            <span className="font-medium">Student assistant</span>
            <span className="block text-xs text-muted">
              &quot;Ask AI&quot; on the student side.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.summary_enabled}
            onChange={(event) => change('summary_enabled', event.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span>
            <span className="font-medium">Analytics summary</span>
            <span className="block text-xs text-muted">
              The AI summary card on the analytics dashboard.
            </span>
          </span>
        </label>

        <div className="max-w-xs">
          <Input
            label="Daily token limit per user"
            name="daily_token_limit"
            type="number"
            min="1"
            max="1000000"
            value={form.daily_token_limit}
            onChange={(event) => change('daily_token_limit', event.target.value)}
          />
        </div>

        {!form.configured && (
          <p className="text-xs text-muted">
            No AI key is configured, so both features use their fallbacks. Set AI_API_KEY and
            AI_MODEL in backend/.env to turn on real answers.
          </p>
        )}

        <div className="flex items-center gap-2">
          <Button type="submit" loading={save.isPending}>
            Save settings
          </Button>
          {draft && (
            <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
              Discard
            </Button>
          )}
        </div>
      </form>

      <section aria-labelledby="ai-usage-heading" className="space-y-4">
        <div>
          <h2 id="ai-usage-heading" className="text-base font-semibold text-ink">
            Usage, last 30 days
          </h2>
          {usage && (
            <p className="mt-1 text-sm text-muted">
              {usage.totals.requests.toLocaleString()} requests ·{' '}
              {usage.totals.tokens.toLocaleString()} tokens
            </p>
          )}
        </div>

        {usageQuery.isLoading && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        )}

        {usageQuery.isError && (
          <EmptyState
            icon={SlidersHorizontal}
            title="Could not load AI usage"
            action={<Button onClick={() => usageQuery.refetch()}>Try again</Button>}
          />
        )}

        {usage && (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard
                title="Tokens per day"
                caption="Spend across both features. A sudden jump usually means repeated summary clicks."
                empty={usage.by_day.length === 0}
              >
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={usage.by_day} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-card-border)" />
                    <XAxis dataKey="day" tick={axisTick} tickFormatter={shortDate} minTickGap={24} />
                    <YAxis tick={axisTick} allowDecimals={false} />
                    <Tooltip labelFormatter={(value) => shortDate(value)} />
                    <Bar dataKey="tokens" name="Tokens" fill="var(--color-primary)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Requests by status"
                caption="Blocked and rate-limited requests never reached the provider."
                empty={usage.by_status.length === 0}
              >
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={usage.by_status}
                    layout="vertical"
                    margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-card-border)" />
                    <XAxis type="number" tick={axisTick} allowDecimals={false} />
                    <YAxis type="category" dataKey="status" tick={axisTick} width={90} />
                    <Tooltip />
                    <Bar dataKey="requests" name="Requests" fill="var(--color-primary)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="overflow-x-auto rounded-card border border-card-border bg-white">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="border-b border-card-border text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Top user</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Requests</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Tokens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {usage.top_users.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-muted">
                        No AI requests yet.
                      </td>
                    </tr>
                  )}
                  {usage.top_users.map((user) => (
                    <tr key={user.user_id}>
                      <td className="px-4 py-3 font-medium text-ink">{user.name}</td>
                      <td className="px-4 py-3 text-muted">{user.requests.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted">{user.tokens.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

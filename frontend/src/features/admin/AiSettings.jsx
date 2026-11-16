import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Bot, CheckCircle2, PlugZap, SlidersHorizontal } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getAiSettings, getAiUsage, testAiConnection, updateAiSettings } from '../../api/ai'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Input from '../../components/ui/Input'
import Skeleton from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { formatDateTime } from '../../lib/dates'
import { errorMessage } from '../../lib/errors'
import ChartCard from './ChartCard'

const axisTick = { fontSize: 11, fill: 'var(--color-muted)' }

const errorHints = {
  not_configured:
    'Set AI_API_KEY and AI_MODEL in backend/.env, run php artisan config:clear, then restart the API.',
  ai_disabled: 'AI is switched off. Turn on the master switch above.',
  auth_failed: 'The provider rejected the key. Check AI_API_KEY for typos or an expired key.',
  model_not_found: 'The provider does not know AI_MODEL. Use the exact model id from the provider.',
  rate_limited_upstream: 'The provider is rate limiting this key. Wait a minute, then test again.',
  provider_error: 'The provider had a server problem. Try again in a moment.',
  bad_request: 'The provider rejected the request. Check AI_MODEL and AI_BASE_URL.',
  timeout: 'The provider did not answer in time. Check the network or raise AI_TIMEOUT_SECONDS.',
  invalid_response: 'The provider did not answer with JSON. Check AI_BASE_URL.',
  empty_response: 'The provider returned an empty answer. Try another model.',
}

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

  const connectionTest = useMutation({
    mutationFn: testAiConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] })
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] })
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not test the AI connection.')),
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
  const lastError = settings?.last_error
  const testResult = connectionTest.data

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

      <section
        aria-labelledby="ai-connection-heading"
        className="space-y-3 rounded-card border border-card-border bg-white p-4"
      >
        <h2
          id="ai-connection-heading"
          className="flex items-center gap-2 text-sm font-semibold text-ink"
        >
          <PlugZap className="size-4 text-primary" aria-hidden="true" />
          Provider connection
        </h2>

        <p className="text-sm text-ink">
          {form.configured
            ? `Configured: ${form.driver} driver, model ${form.model}.`
            : 'Not configured: set AI_API_KEY and AI_MODEL in backend/.env.'}
        </p>

        {lastError && (
          <div className="rounded-btn border border-danger-border bg-page px-3 py-2 text-sm">
            <p className="flex items-center gap-1.5 font-medium text-danger">
              <AlertCircle className="size-4" aria-hidden="true" />
              Last provider error: {lastError.code}
              {lastError.http_status ? ` (HTTP ${lastError.http_status})` : ''}
            </p>
            <p className="mt-1 text-xs text-muted">
              {formatDateTime(lastError.at)}
              {lastError.message ? ` · ${lastError.message}` : ''}
            </p>
            {errorHints[lastError.code] && (
              <p className="mt-1 text-xs text-muted">{errorHints[lastError.code]}</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            loading={connectionTest.isPending}
            onClick={() => connectionTest.mutate()}
          >
            Test connection
          </Button>
          <span className="text-xs text-muted">
            Sends one tiny prompt, up to 20 output tokens. It counts in usage and the audit log.
          </span>
        </div>

        {testResult?.ok && (
          <p className="flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Connected to {testResult.model} in {testResult.latency_ms} ms.
          </p>
        )}

        {testResult && !testResult.ok && (
          <div className="rounded-btn border border-danger-border bg-page px-3 py-2 text-sm">
            <p className="font-medium text-danger">
              The test failed: {testResult.error_code}
              {testResult.http_status ? ` (HTTP ${testResult.http_status})` : ''}
            </p>
            {errorHints[testResult.error_code] && (
              <p className="mt-1 text-xs text-muted">{errorHints[testResult.error_code]}</p>
            )}
          </div>
        )}
      </section>

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

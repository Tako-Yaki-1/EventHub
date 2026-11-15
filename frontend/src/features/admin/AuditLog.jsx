import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ScrollText, ShieldCheck } from 'lucide-react'
import { listAuditLogs, verifyAuditLog } from '../../api/admin'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Input from '../../components/ui/Input'
import Skeleton from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { formatDateTime } from '../../lib/dates'
import { errorMessage } from '../../lib/errors'

const emptyFilters = { action: '', user_id: '', result: '', from: '', to: '' }

const resultStyles = {
  success: 'bg-success-bg text-success',
  failed: 'bg-danger/10 text-danger',
  denied: 'bg-tile text-ink',
}

export default function AuditLog() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState(emptyFilters)
  const [applied, setApplied] = useState(emptyFilters)
  const [page, setPage] = useState(1)

  const params = { ...applied, page, per_page: 20 }
  Object.keys(params).forEach((key) => {
    if (params[key] === '' || params[key] === null) delete params[key]
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => listAuditLogs(params),
  })

  const verify = useMutation({
    mutationFn: verifyAuditLog,
    onSuccess: (result) => {
      if (result.intact) {
        toast.success(
          `Log intact — ${result.checked} ${result.checked === 1 ? 'entry' : 'entries'} checked.`,
        )
      } else {
        toast.error(`Log chain broken at entry ${result.broken_at}.`)
      }
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not verify the log.')),
  })

  const handleChange = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setPage(1)
    setApplied(filters)
  }

  const handleReset = () => {
    setFilters(emptyFilters)
    setApplied(emptyFilters)
    setPage(1)
  }

  const logs = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Audit log</h1>
          <p className="mt-1 text-sm text-muted">
            Append-only record of sign-ins, admin actions, and denied requests.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          loading={verify.isPending}
          onClick={() => verify.mutate()}
        >
          <ShieldCheck className="size-4" aria-hidden="true" />
          Verify log
        </Button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-3 rounded-card border border-card-border bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <Input
          label="Action"
          name="action"
          placeholder="auth.login"
          value={filters.action}
          onChange={handleChange}
        />
        <Input
          label="User ID"
          name="user_id"
          type="number"
          min="1"
          value={filters.user_id}
          onChange={handleChange}
        />
        <div>
          <label htmlFor="audit-result" className="mb-1.5 block text-sm font-medium text-ink">
            Result
          </label>
          <select
            id="audit-result"
            name="result"
            value={filters.result}
            onChange={handleChange}
            className="h-11 w-full rounded-input border border-input-border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none"
          >
            <option value="">All results</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="denied">Denied</option>
          </select>
        </div>
        <Input label="From" name="from" type="date" value={filters.from} onChange={handleChange} />
        <Input label="To" name="to" type="date" value={filters.to} onChange={handleChange} />

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <Button type="submit" size="sm">
            Apply filters
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </form>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      )}

      {isError && (
        <EmptyState
          icon={ScrollText}
          title="Could not load the audit log"
          description="Check the API and try again."
          action={<Button onClick={() => refetch()}>Try again</Button>}
        />
      )}

      {!isLoading && !isError && logs.length === 0 && (
        <EmptyState
          icon={ScrollText}
          title="No audit entries"
          description="Nothing matches these filters yet. Clear them to see the whole log."
          action={<Button variant="secondary" onClick={handleReset}>Reset filters</Button>}
        />
      )}

      {!isLoading && !isError && logs.length > 0 && (
        <div className="overflow-x-auto rounded-card border border-card-border bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-card-border text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Time</th>
                <th scope="col" className="px-4 py-3 font-semibold">User</th>
                <th scope="col" className="px-4 py-3 font-semibold">Action</th>
                <th scope="col" className="px-4 py-3 font-semibold">Result</th>
                <th scope="col" className="px-4 py-3 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-4 py-3 text-ink">{log.user?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-ink">{log.action}</span>
                    {log.entity_type && (
                      <span className="ml-2 text-xs text-placeholder">
                        {log.entity_type.split('\\').pop()}#{log.entity_id}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${resultStyles[log.result] ?? 'bg-tile text-ink'}`}
                    >
                      {log.result}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{log.ip_address ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            Page {meta.current_page} of {meta.last_page}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={meta.current_page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

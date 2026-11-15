import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Users } from 'lucide-react'
import { listUsers, revokeUserTokens } from '../../api/admin'
import Button from '../../components/ui/Button'
import Dialog from '../../components/ui/Dialog'
import EmptyState from '../../components/ui/EmptyState'
import Input from '../../components/ui/Input'
import Skeleton from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { formatDateTime } from '../../lib/dates'
import { errorMessage } from '../../lib/errors'

export default function AdminUsers() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [term, setTerm] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pending, setPending] = useState(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-users', { search, page }],
    queryFn: () => listUsers({ q: search || undefined, page, per_page: 20 }),
  })

  const revoke = useMutation({
    mutationFn: revokeUserTokens,
    onSuccess: (result) => {
      setPending(null)
      toast.success(
        result.revoked === 1 ? '1 session revoked.' : `${result.revoked} sessions revoked.`,
      )
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error) => {
      setPending(null)
      toast.error(errorMessage(error, 'Could not revoke those sessions.'))
    },
  })

  const handleSearch = (event) => {
    event.preventDefault()
    setPage(1)
    setSearch(term.trim())
  }

  const users = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">Users</h1>
        <p className="mt-1 text-sm text-muted">
          Everyone with an account, their active sessions, and a force-logout action.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-2">
        <Input
          label="Search by name or email"
          name="q"
          icon={Search}
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          className="min-w-60 flex-1"
        />
        <Button type="submit" size="sm">
          Search
        </Button>
        {search && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setTerm('')
              setSearch('')
              setPage(1)
            }}
          >
            Clear
          </Button>
        )}
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
          icon={Users}
          title="Could not load users"
          description="Check the API and try again."
          action={<Button onClick={() => refetch()}>Try again</Button>}
        />
      )}

      {!isLoading && !isError && users.length === 0 && (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Try a different name or email."
        />
      )}

      {!isLoading && !isError && users.length > 0 && (
        <div className="overflow-x-auto rounded-card border border-card-border bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-card-border text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Name</th>
                <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                <th scope="col" className="px-4 py-3 font-semibold">Role</th>
                <th scope="col" className="px-4 py-3 font-semibold">Sessions</th>
                <th scope="col" className="px-4 py-3 font-semibold">Last activity</th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium text-ink">{user.name}</td>
                  <td className="px-4 py-3 text-muted">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-tile px-2.5 py-1 text-xs font-semibold text-ink">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{user.active_sessions_count}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {user.last_activity_at ? formatDateTime(user.last_activity_at) : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setPending(user)}
                      aria-label={`Revoke sessions for ${user.name}`}
                    >
                      Revoke sessions
                    </Button>
                  </td>
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

      <Dialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title="Revoke all sessions?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={revoke.isPending}
              onClick={() => revoke.mutate(pending.id)}
            >
              Revoke sessions
            </Button>
          </>
        }
      >
        {pending && (
          <>
            <strong className="text-ink">{pending.name}</strong> will be signed out everywhere and
            will need to log in again. This action is recorded in the audit log.
          </>
        )}
      </Dialog>
    </div>
  )
}

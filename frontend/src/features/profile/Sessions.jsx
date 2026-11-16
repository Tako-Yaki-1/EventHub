import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MonitorSmartphone } from 'lucide-react'
import { listSessions, revokeSession } from '../../api/auth'
import Button from '../../components/ui/Button'
import Dialog from '../../components/ui/Dialog'
import Skeleton from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { formatDateTime } from '../../lib/dates'
import { errorMessage } from '../../lib/errors'
import { useAuth } from '../auth/AuthContext'

export default function Sessions() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [pending, setPending] = useState(null)

  const { data: sessions = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['sessions'],
    queryFn: listSessions,
  })

  const currentId = sessions.find((session) => session.is_current)?.id

  const revoke = useMutation({
    mutationFn: revokeSession,
    onSuccess: async (_, sessionId) => {
      setPending(null)
      queryClient.invalidateQueries({ queryKey: ['sessions'] })

      if (sessionId === currentId) {
        await logout()
        navigate('/login', { replace: true })
        return
      }

      toast.success('Session revoked.')
    },
    onError: (error) => {
      setPending(null)
      toast.error(errorMessage(error, 'Could not revoke that session.'))
    },
  })

  return (
    <section
      aria-labelledby="sessions-heading"
      className="rounded-card border border-card-border bg-white p-4"
    >
      <h2 id="sessions-heading" className="text-base font-semibold text-ink">
        Where you&apos;re logged in
      </h2>
      <p className="mt-1 text-sm text-muted">
        Devices with an active login. Revoke anything you don&apos;t recognise.
      </p>

      {isLoading && (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      )}

      {isError && (
        <p className="mt-3 text-sm text-muted">
          Could not load your sessions.{' '}
          <button type="button" onClick={() => refetch()} className="font-medium text-link hover:underline">
            Try again
          </button>
        </p>
      )}

      {!isLoading && !isError && sessions.length === 0 && (
        <p className="mt-3 text-sm text-muted">No active sessions.</p>
      )}

      {!isLoading && !isError && sessions.length > 0 && (
        <ul className="mt-3 divide-y divide-card-border">
          {sessions.map((session) => (
            <li key={session.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tile">
                  <MonitorSmartphone className="size-4 text-primary" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {session.name}
                    {session.is_current && (
                      <span className="ml-2 rounded-full bg-success-bg px-2 py-0.5 text-xs font-semibold text-success">
                        This device
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Signed in {formatDateTime(session.created_at)}
                    {session.last_used_at
                      ? ` · Last used ${formatDateTime(session.last_used_at)}`
                      : ' · Not used yet'}
                  </p>
                  {session.expires_at && (
                    <p className="text-xs text-muted">
                      Expires {formatDateTime(session.expires_at)}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setPending(session)}
                aria-label={`Revoke ${session.name}`}
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title="Revoke session?"
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
              Revoke
            </Button>
          </>
        }
      >
        {pending && (
          <>
            Sign out of <strong className="text-ink">{pending.name}</strong>?{' '}
            {pending.is_current
              ? 'This is this device, so you will be logged out.'
              : 'That device will need to log in again.'}
          </>
        )}
      </Dialog>
    </section>
  )
}

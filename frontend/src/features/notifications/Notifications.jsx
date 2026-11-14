import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, BellOff, Check } from 'lucide-react'
import { listNotifications, markNotificationRead } from '../../api/notifications'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { formatDateTime } from '../../lib/dates'
import { errorMessage } from '../../lib/errors'

export default function Notifications() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => listNotifications(page),
  })

  const readMutation = useMutation({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (error) => toast.error(errorMessage(error, 'Could not mark it as read.')),
  })

  const notifications = data?.data ?? []
  const unreadCount = data?.unread_count ?? 0
  const meta = data?.meta

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Notifications</h1>
        <p className="mt-1 text-sm text-muted">
          {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up.'}
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      )}

      {isError && (
        <EmptyState
          icon={Bell}
          title="Could not load notifications"
          description="Check that the API is running, then try again."
          action={<Button onClick={() => refetch()}>Try again</Button>}
        />
      )}

      {!isLoading && !isError && notifications.length === 0 && (
        <EmptyState
          icon={BellOff}
          title="No notifications yet"
          description="Register for an event and updates will show up here."
        />
      )}

      {notifications.length > 0 && (
        <ul className="space-y-3">
          {notifications.map((notification) => {
            const unread = !notification.read_at

            return (
              <li
                key={notification.id}
                className={`rounded-card border p-4 ${
                  unread ? 'border-primary/30 bg-white' : 'border-card-border bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  {unread && (
                    <span
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                      aria-label="Unread"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className={`text-sm text-ink ${unread ? 'font-semibold' : 'font-medium'}`}>
                      {notification.title}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted">{notification.body}</p>
                    <p className="mt-1 text-xs text-placeholder">
                      {formatDateTime(notification.created_at)}
                    </p>
                  </div>
                  {unread && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Mark "${notification.title}" as read`}
                      loading={readMutation.isPending && readMutation.variables === notification.id}
                      onClick={() => readMutation.mutate(notification.id)}
                    >
                      <Check className="size-4" aria-hidden="true" />
                      Mark read
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </Button>
          <p className="text-sm text-muted">
            Page {meta.current_page} of {meta.last_page}
          </p>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= meta.last_page}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

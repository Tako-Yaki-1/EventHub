import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listNotifications, markNotificationRead } from '../../api/notifications'
import { renderWithProviders } from '../../test/renderWithProviders'
import Notifications from './Notifications'

vi.mock('../../api/notifications', () => ({
  listNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
}))

describe('Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listNotifications.mockResolvedValue({
      data: [
        {
          id: 1,
          title: 'Registration confirmed',
          body: 'You are registered for Tech Talk.',
          read_at: null,
          created_at: '2026-11-10T02:00:00.000000Z',
        },
        {
          id: 2,
          title: 'Event cancelled',
          body: 'Film Screening Night has been cancelled.',
          read_at: '2026-11-09T02:00:00.000000Z',
          created_at: '2026-11-08T02:00:00.000000Z',
        },
      ],
      unread_count: 1,
      meta: { current_page: 1, last_page: 1 },
    })
    markNotificationRead.mockResolvedValue({ id: 1 })
  })

  it('shows the unread count and marks a notification read', async () => {
    renderWithProviders(<Notifications />)

    expect(await screen.findByText('1 unread')).toBeInTheDocument()
    expect(screen.getByText('Event cancelled')).toBeInTheDocument()

    const buttons = screen.getAllByRole('button', { name: /mark .* as read/i })
    expect(buttons).toHaveLength(1)

    fireEvent.click(buttons[0])

    await waitFor(() => expect(markNotificationRead).toHaveBeenCalledWith(1))
  })
})

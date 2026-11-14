import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listEvents } from '../../api/events'
import { renderWithProviders, testUser } from '../../test/renderWithProviders'
import AdminEvents from './AdminEvents'

vi.mock('../../api/events', () => ({ listEvents: vi.fn() }))
vi.mock('../../api/admin', () => ({ cancelEvent: vi.fn() }))

const day = 24 * 60 * 60 * 1000

const baseEvent = {
  status: 'published',
  location: 'Main Hall',
  capacity: 50,
  registered_count: 3,
}

const futureEvent = {
  ...baseEvent,
  id: 1,
  title: 'Future Fair',
  starts_at: new Date(Date.now() + 3 * day).toISOString(),
  ends_at: new Date(Date.now() + 3 * day + 7200000).toISOString(),
}

const pastEvent = {
  ...baseEvent,
  id: 2,
  title: 'Past Party',
  starts_at: new Date(Date.now() - 3 * day).toISOString(),
  ends_at: new Date(Date.now() - 3 * day + 7200000).toISOString(),
}

describe('AdminEvents cancel button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listEvents.mockResolvedValue({
      data: [futureEvent, pastEvent],
      meta: { current_page: 1, last_page: 1 },
    })
  })

  it('only offers Cancel for events that have not started yet', async () => {
    renderWithProviders(<AdminEvents />, {
      path: '/admin/events',
      route: '/admin/events',
      user: { ...testUser, role: 'admin' },
    })

    const futureCard = (await screen.findByText('Future Fair')).closest('article')
    const pastCard = screen.getByText('Past Party').closest('article')

    expect(within(futureCard).getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(within(pastCard).queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    expect(within(pastCard).getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })
})

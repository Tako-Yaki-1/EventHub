import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getEvent } from '../../api/events'
import { renderWithProviders, testUser } from '../../test/renderWithProviders'
import AdminEventForm from './AdminEventForm'

vi.mock('../../api/events', () => ({ getEvent: vi.fn() }))
vi.mock('../../api/admin', () => ({
  cancelEvent: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
}))

const day = 24 * 60 * 60 * 1000

const event = {
  id: 1,
  title: 'Career Fair',
  description: 'Meet employers.',
  organizer: 'Student Affairs',
  location: 'Main Hall',
  capacity: 100,
  status: 'published',
  starts_at: new Date(Date.now() + 3 * day).toISOString(),
  ends_at: new Date(Date.now() + 3 * day + 7200000).toISOString(),
}

function renderForm() {
  return renderWithProviders(<AdminEventForm />, {
    path: '/admin/events/:id',
    route: '/admin/events/1',
    user: { ...testUser, role: 'admin' },
  })
}

describe('AdminEventForm cancel action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('offers Cancel event while the event has not started', async () => {
    getEvent.mockResolvedValue(event)

    renderForm()

    await screen.findByDisplayValue('Career Fair')
    expect(screen.getByRole('button', { name: 'Cancel event' })).toBeInTheDocument()
  })

  it('hides Cancel event once the event has started', async () => {
    getEvent.mockResolvedValue({
      ...event,
      starts_at: new Date(Date.now() - day).toISOString(),
      ends_at: new Date(Date.now() - day + 7200000).toISOString(),
    })

    renderForm()

    await screen.findByDisplayValue('Career Fair')
    expect(screen.queryByRole('button', { name: 'Cancel event' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
  })
})

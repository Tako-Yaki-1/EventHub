import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cancelRegistration, listMyRegistrations } from '../../api/registrations'
import { renderWithProviders } from '../../test/renderWithProviders'
import MyRegistrations from './MyRegistrations'

vi.mock('../../api/registrations', () => ({
  listMyRegistrations: vi.fn(),
  cancelRegistration: vi.fn(),
  registerForEvent: vi.fn(),
}))

const day = 24 * 60 * 60 * 1000

const baseEvent = {
  ends_at: new Date(Date.now() + 3 * day + 7200000).toISOString(),
  location: 'Main Hall',
}

const upcomingRegistration = {
  id: 10,
  status: 'registered',
  event: {
    ...baseEvent,
    id: 1,
    title: 'Tech Talk: Building Better Apps',
    starts_at: new Date(Date.now() + 3 * day).toISOString(),
  },
}

const pastRegistration = {
  id: 11,
  status: 'registered',
  event: {
    ...baseEvent,
    id: 2,
    title: 'Old Hackathon',
    starts_at: new Date(Date.now() - 3 * day).toISOString(),
    ends_at: new Date(Date.now() - 3 * day + 7200000).toISOString(),
  },
}

const cancelledRegistration = {
  id: 12,
  status: 'cancelled',
  cancelled_at: new Date(Date.now() - day).toISOString(),
  event: {
    ...baseEvent,
    id: 3,
    title: 'Cancelled Workshop',
    starts_at: new Date(Date.now() + 5 * day).toISOString(),
  },
}

function section(items = [], meta = {}) {
  return {
    data: items,
    meta: { current_page: 1, last_page: 1, total: items.length, ...meta },
  }
}

describe('MyRegistrations sections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listMyRegistrations.mockResolvedValue({
      upcoming: section([upcomingRegistration]),
      past: section([pastRegistration]),
      cancelled: section([cancelledRegistration]),
    })
    cancelRegistration.mockResolvedValue({
      message: 'Registration cancelled.',
      data: { ...upcomingRegistration, status: 'cancelled' },
    })
  })

  it('splits registrations into upcoming, past, and cancelled', async () => {
    renderWithProviders(<MyRegistrations />, {
      path: '/my-registrations',
      route: '/my-registrations',
    })

    expect(await screen.findByText('Tech Talk: Building Better Apps')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Upcoming', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Past', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cancelled', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Old Hackathon')).toBeInTheDocument()
    expect(screen.getByText('Cancelled Workshop')).toBeInTheDocument()
    expect(listMyRegistrations).toHaveBeenCalledWith({
      upcoming_page: 1,
      past_page: 1,
      cancelled_page: 1,
    })
  })

  it('keeps the registration when Keep is chosen', async () => {
    renderWithProviders(<MyRegistrations />, {
      path: '/my-registrations',
      route: '/my-registrations',
    })

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel registration' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Keep' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(cancelRegistration).not.toHaveBeenCalled()
  })

  it('cancels only after the confirmation is confirmed', async () => {
    renderWithProviders(<MyRegistrations />, {
      path: '/my-registrations',
      route: '/my-registrations',
    })

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel registration' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    await waitFor(() => expect(cancelRegistration).toHaveBeenCalledWith(10))
    expect(await screen.findByText('Registration cancelled.')).toBeInTheDocument()
  })

  it('never offers Cancel for a past or cancelled registration', async () => {
    renderWithProviders(<MyRegistrations />, {
      path: '/my-registrations',
      route: '/my-registrations',
    })

    const pastCard = (await screen.findByText('Old Hackathon')).closest('article')
    const cancelledCard = screen.getByText('Cancelled Workshop').closest('article')

    expect(within(pastCard).queryByRole('button', { name: 'Cancel registration' })).toBeNull()
    expect(within(cancelledCard).queryByRole('button', { name: 'Cancel registration' })).toBeNull()
    expect(screen.getAllByRole('button', { name: 'Cancel registration' })).toHaveLength(1)
  })

  it('paginates each section on its own', async () => {
    listMyRegistrations.mockResolvedValueOnce({
      upcoming: section([upcomingRegistration], { total: 13 }),
      past: section([pastRegistration], { last_page: 2, total: 13 }),
      cancelled: section([], { total: 0 }),
    })

    renderWithProviders(<MyRegistrations />, {
      path: '/my-registrations',
      route: '/my-registrations',
    })

    fireEvent.click(await screen.findByRole('button', { name: 'Next Past page' }))

    await waitFor(() =>
      expect(listMyRegistrations).toHaveBeenCalledWith({
        upcoming_page: 1,
        past_page: 2,
        cancelled_page: 1,
      }),
    )
  })
})

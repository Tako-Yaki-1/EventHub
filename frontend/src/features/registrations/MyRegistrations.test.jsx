import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cancelRegistration, listMyRegistrations } from '../../api/registrations'
import { renderWithProviders } from '../../test/renderWithProviders'
import MyRegistrations from './MyRegistrations'

vi.mock('../../api/registrations', () => ({
  listMyRegistrations: vi.fn(),
  cancelRegistration: vi.fn(),
  registerForEvent: vi.fn(),
}))

const registration = {
  id: 10,
  status: 'registered',
  event: {
    id: 1,
    title: 'Tech Talk: Building Better Apps',
    starts_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 7200000).toISOString(),
    location: 'Main Hall',
  },
}

describe('MyRegistrations cancel flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listMyRegistrations.mockResolvedValue({ data: [registration] })
    cancelRegistration.mockResolvedValue({
      message: 'Registration cancelled.',
      data: { ...registration, status: 'cancelled' },
    })
  })

  it('keeps the registration when Keep is chosen', async () => {
    renderWithProviders(<MyRegistrations />, {
      path: '/my-registrations',
      route: '/my-registrations',
    })

    expect(await screen.findByText(registration.event.title)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel registration' }))
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
})

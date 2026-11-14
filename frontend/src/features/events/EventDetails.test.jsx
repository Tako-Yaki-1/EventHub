import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getEvent } from '../../api/events'
import { registerForEvent } from '../../api/registrations'
import { renderWithProviders } from '../../test/renderWithProviders'
import EventDetails from './EventDetails'

vi.mock('../../api/events', () => ({
  getEvent: vi.fn(),
  listEvents: vi.fn(),
}))

vi.mock('../../api/registrations', () => ({
  registerForEvent: vi.fn(),
  cancelRegistration: vi.fn(),
  listMyRegistrations: vi.fn(),
}))

const event = {
  id: 1,
  title: 'Tech Talk: Building Better Apps',
  description: 'A practical talk on shipping better software.',
  organizer: 'Software Development Club',
  location: 'Main Hall',
  starts_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 7200000).toISOString(),
  capacity: 100,
  registered_count: 42,
  slots_left: 58,
  status: 'published',
  my_registration: null,
}

describe('EventDetails registration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getEvent.mockResolvedValue(event)
    registerForEvent.mockResolvedValue({ message: 'You are registered.' })
  })

  it('prefills the form, requires the confirmation, and registers', async () => {
    renderWithProviders(<EventDetails />, { path: '/events/:id', route: '/events/1' })

    expect(await screen.findByRole('heading', { name: event.title })).toBeInTheDocument()
    expect(screen.getByLabelText('Full Name')).toHaveValue('Jan Niño')
    expect(screen.getByLabelText('Student ID')).toHaveValue('2023-00123')

    const submit = screen.getByRole('button', { name: /^register$/i })
    expect(submit).toBeDisabled()

    fireEvent.click(screen.getByLabelText('I confirm that I will attend this event'))
    expect(submit).toBeEnabled()

    fireEvent.click(submit)

    await waitFor(() => expect(registerForEvent).toHaveBeenCalledTimes(1))
    expect(registerForEvent).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        full_name: 'Jan Niño',
        student_id: '2023-00123',
        confirmed_attendance: true,
      }),
    )
    expect(await screen.findByText('You are registered.')).toBeInTheDocument()
  })

  it('shows a registered badge instead of the form when already registered', async () => {
    getEvent.mockResolvedValue({
      ...event,
      my_registration: { id: 7, status: 'registered' },
    })

    renderWithProviders(<EventDetails />, { path: '/events/:id', route: '/events/1' })

    expect(await screen.findByText('Registered')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel registration' })).toBeInTheDocument()
    expect(screen.queryByLabelText('I confirm that I will attend this event')).not.toBeInTheDocument()
  })
})

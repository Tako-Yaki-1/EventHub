import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { askAssistant } from '../../api/ai'
import { renderWithProviders } from '../../test/renderWithProviders'
import Assistant from './Assistant'

vi.mock('../../api/ai', () => ({
  askAssistant: vi.fn(),
}))

const event = {
  id: 4,
  title: 'Robotics Meetup',
  description: 'Build a small robot.',
  organizer: 'CS Society',
  location: 'Computer Lab 1',
  starts_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  ends_at: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
  capacity: 30,
  registered_count: 5,
  slots_left: 25,
  status: 'published',
}

describe('Ask AI assistant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the answer, recommended events, the AI label, and the token hint', async () => {
    askAssistant.mockResolvedValue({
      source: 'ai',
      answer: 'Join the robotics meetup.',
      event_ids: [4],
      events: [event],
      remaining_tokens: 1234,
    })

    renderWithProviders(<Assistant />, { path: '/assistant', route: '/assistant' })

    fireEvent.change(screen.getByLabelText('Your question'), {
      target: { value: 'Any robotics events?' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ask' }))

    expect(await screen.findByText('Join the robotics meetup.')).toBeInTheDocument()
    expect(askAssistant).toHaveBeenCalledWith('Any robotics events?', expect.anything())
    expect(screen.getByText('AI-generated. It can be wrong, so check the event page.')).toBeInTheDocument()
    expect(screen.getByText('Robotics Meetup')).toBeInTheDocument()
    expect(screen.getByText('About 1,234 AI tokens left today.')).toBeInTheDocument()
  })

  it('shows the fallback message and renders model text as text, never HTML', async () => {
    askAssistant.mockResolvedValue({
      source: 'fallback',
      message: 'AI is unavailable right now, here are matching events.',
      answer: '<script>alert("x")</script>',
      event_ids: [],
      events: [],
      remaining_tokens: 900,
    })

    const { container } = renderWithProviders(<Assistant />, {
      path: '/assistant',
      route: '/assistant',
    })

    fireEvent.click(screen.getByRole('button', { name: 'What events are this week?' }))

    expect(
      await screen.findByText('AI is unavailable right now, here are matching events.'),
    ).toBeInTheDocument()
    expect(screen.getByText('<script>alert("x")</script>')).toBeInTheDocument()
    expect(container.querySelector('script')).toBeNull()
    expect(askAssistant).toHaveBeenCalledWith('What events are this week?', expect.anything())
  })
})


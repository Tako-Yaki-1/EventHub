import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { askAssistant } from '../../api/ai'
import { renderWithProviders, testUser } from '../../test/renderWithProviders'
import AssistantWidget from './AssistantWidget'

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

const answer = {
  source: 'ai',
  answer: 'Join the robotics meetup.',
  event_ids: [4],
  events: [event],
  remaining_tokens: 1234,
}

function renderWidget(options = {}) {
  return renderWithProviders(<AssistantWidget />, {
    path: '/',
    route: '/',
    ...options,
  })
}

function openPanel() {
  fireEvent.click(screen.getByRole('button', { name: 'Open EventHub assistant' }))
  return screen.getByRole('region', { name: 'EventHub Assistant' })
}

describe('Floating assistant widget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    askAssistant.mockResolvedValue(answer)
  })

  it('shows only for students, and never on the assistant page', () => {
    renderWidget()
    expect(screen.getByRole('button', { name: 'Open EventHub assistant' })).toBeInTheDocument()
  })

  it('stays hidden on the assistant page and for admins and guests', () => {
    const { unmount } = renderWidget({ route: '/assistant', path: '/assistant' })
    expect(screen.queryByRole('button', { name: 'Open EventHub assistant' })).toBeNull()
    unmount()

    const admin = renderWidget({ user: { ...testUser, role: 'admin' } })
    expect(screen.queryByRole('button', { name: 'Open EventHub assistant' })).toBeNull()
    admin.unmount()

    renderWidget({ user: null })
    expect(screen.queryByRole('button', { name: 'Open EventHub assistant' })).toBeNull()
  })

  it('greets the student by first name and offers three suggestions', () => {
    renderWidget()
    const panel = openPanel()

    expect(panel).toHaveTextContent('Hi Jan! Ask me about upcoming campus events.')
    expect(screen.getAllByRole('button', { name: /week|developer|almost full/ })).toHaveLength(3)
  })

  it('answers with the AI label, an event card, and the token hint', async () => {
    renderWidget()
    openPanel()

    fireEvent.click(screen.getByRole('button', { name: 'What events are this week?' }))

    expect(await screen.findByText('Join the robotics meetup.')).toBeInTheDocument()
    expect(
      screen.getByText('AI-generated. It can be wrong, so check the event page.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Robotics Meetup')).toBeInTheDocument()
    expect(screen.getByText('About 1,234 AI tokens left today.')).toBeInTheDocument()
  })

  it('renders model text as text, never HTML', async () => {
    askAssistant.mockResolvedValue({
      source: 'fallback',
      message: 'AI is unavailable right now, here are matching events.',
      answer: '<script>alert("x")</script>',
      event_ids: [],
      events: [],
    })

    const { container } = renderWidget()
    openPanel()

    fireEvent.click(screen.getByRole('button', { name: 'What events are this week?' }))

    expect(await screen.findByText('<script>alert("x")</script>')).toBeInTheDocument()
    expect(
      screen.getByText('AI is unavailable right now, here are matching events.'),
    ).toBeInTheDocument()
    expect(container.querySelector('script')).toBeNull()
  })

  it('shows a friendly message for a provider failure and no retry for a 4xx', async () => {
    askAssistant.mockRejectedValue({
      response: { status: 429, data: { message: 'Too many AI requests. Try again in a minute.' } },
    })

    renderWidget()
    openPanel()

    fireEvent.click(screen.getByRole('button', { name: 'What events are this week?' }))

    expect(
      await screen.findByText('Too many AI requests. Try again in a minute.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull()
  })

  it('offers Retry after a network failure without repeating the question', async () => {
    askAssistant.mockRejectedValueOnce(new Error('Network Error'))

    renderWidget()
    openPanel()

    fireEvent.click(screen.getByRole('button', { name: 'What events are this week?' }))

    expect(
      await screen.findByText('Could not reach the assistant. Check your connection and try again.'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('Join the robotics meetup.')).toBeInTheDocument()
    expect(askAssistant).toHaveBeenCalledTimes(2)
    expect(screen.getAllByText('What events are this week?')).toHaveLength(1)
  })

  it('clears the conversation with New chat', async () => {
    renderWidget()
    openPanel()

    fireEvent.click(screen.getByRole('button', { name: 'What events are this week?' }))
    expect(await screen.findByText('Join the robotics meetup.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'New chat' }))

    expect(screen.queryByText('Join the robotics meetup.')).toBeNull()
    expect(screen.getByText('Hi Jan! Ask me about upcoming campus events.')).toBeInTheDocument()
  })

  it('closes with Escape and returns focus to the launcher', () => {
    renderWidget()
    openPanel()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('region', { name: 'EventHub Assistant' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Open EventHub assistant' })).toHaveFocus()
  })
})

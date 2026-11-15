import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listSessions, revokeSession } from '../../api/auth'
import { renderWithProviders } from '../../test/renderWithProviders'
import Sessions from './Sessions'

vi.mock('../../api/auth', () => ({
  listSessions: vi.fn(),
  revokeSession: vi.fn(),
}))

const sessions = [
  {
    id: 11,
    name: 'web (Chrome on Windows)',
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    last_used_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
    is_current: true,
  },
  {
    id: 12,
    name: 'web (Safari on macOS)',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    last_used_at: null,
    expires_at: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    is_current: false,
  },
]

describe('Profile sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listSessions.mockResolvedValue(sessions)
    revokeSession.mockResolvedValue(undefined)
  })

  it('marks the current session and revokes another one after confirmation', async () => {
    renderWithProviders(<Sessions />, { path: '/profile', route: '/profile' })

    expect(await screen.findByText('web (Chrome on Windows)')).toBeInTheDocument()
    expect(screen.getByText('This device')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Revoke web (Safari on macOS)' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('web (Safari on macOS)')).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Revoke' }))

    await waitFor(() => expect(revokeSession).toHaveBeenCalledWith(12, expect.anything()))
    expect(await screen.findByText('Session revoked.')).toBeInTheDocument()
  })

  it('shows an empty state when there are no active sessions', async () => {
    listSessions.mockResolvedValue([])

    renderWithProviders(<Sessions />, { path: '/profile', route: '/profile' })

    expect(await screen.findByText('No active sessions.')).toBeInTheDocument()
  })
})

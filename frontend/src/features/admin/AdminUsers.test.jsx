import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listUsers, revokeUserTokens } from '../../api/admin'
import { renderWithProviders } from '../../test/renderWithProviders'
import AdminUsers from './AdminUsers'

vi.mock('../../api/admin', () => ({
  listUsers: vi.fn(),
  revokeUserTokens: vi.fn(),
}))

const student = {
  id: 5,
  name: 'Jan Niño',
  email: 'jan.nino@school.edu',
  role: 'student',
  student_id: '2023-00123',
  year_section: 'BSIT 3B',
  active_sessions_count: 2,
  last_activity_at: new Date().toISOString(),
}

describe('Admin users page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listUsers.mockResolvedValue({ data: [student], meta: { current_page: 1, last_page: 1 } })
    revokeUserTokens.mockResolvedValue({ message: 'Sessions revoked.', revoked: 2 })
  })

  it('lists users and force-logs-out one after confirmation', async () => {
    renderWithProviders(<AdminUsers />, { path: '/admin/users', route: '/admin/users' })

    expect(await screen.findByText('Jan Niño')).toBeInTheDocument()
    expect(screen.getByText('jan.nino@school.edu')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Revoke sessions for Jan Niño' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Jan Niño')).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Revoke sessions' }))

    await waitFor(() => expect(revokeUserTokens).toHaveBeenCalledWith(5, expect.anything()))
    expect(await screen.findByText('2 sessions revoked.')).toBeInTheDocument()
  })
})

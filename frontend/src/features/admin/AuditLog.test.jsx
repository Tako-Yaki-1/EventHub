import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listAuditLogs, verifyAuditLog } from '../../api/admin'
import { renderWithProviders } from '../../test/renderWithProviders'
import AuditLog from './AuditLog'

vi.mock('../../api/admin', () => ({
  listAuditLogs: vi.fn(),
  verifyAuditLog: vi.fn(),
}))

describe('Audit log page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listAuditLogs.mockResolvedValue({
      data: [],
      meta: { current_page: 1, last_page: 1 },
    })
    verifyAuditLog.mockResolvedValue({ intact: true, checked: 0, broken_at: null })
  })

  it('shows a clear empty state', async () => {
    renderWithProviders(<AuditLog />, { path: '/admin/audit', route: '/admin/audit' })

    expect(await screen.findByText('No audit entries')).toBeInTheDocument()
  })

  it('renders entries and verifies the hash chain', async () => {
    listAuditLogs.mockResolvedValue({
      data: [
        {
          id: 1,
          action: 'auth.login',
          result: 'failed',
          entity_type: 'App\\Models\\User',
          entity_id: 7,
          user: { id: 7, name: 'Jan Niño' },
          ip_address: '127.0.0.1',
          created_at: new Date().toISOString(),
        },
      ],
      meta: { current_page: 1, last_page: 1 },
    })
    verifyAuditLog.mockResolvedValue({ intact: true, checked: 1, broken_at: null })

    renderWithProviders(<AuditLog />, { path: '/admin/audit', route: '/admin/audit' })

    expect(await screen.findByText('auth.login')).toBeInTheDocument()
    expect(screen.getByText('Jan Niño')).toBeInTheDocument()
    expect(screen.getByText('failed')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Verify log' }))

    await waitFor(() => expect(verifyAuditLog).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Log intact — 1 entry checked.')).toBeInTheDocument()
  })
})

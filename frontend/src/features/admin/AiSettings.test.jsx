import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAiSettings, getAiUsage, testAiConnection, updateAiSettings } from '../../api/ai'
import { renderWithProviders, testUser } from '../../test/renderWithProviders'
import AiSettings from './AiSettings'

vi.mock('../../api/ai', () => ({
  getAiSettings: vi.fn(),
  getAiUsage: vi.fn(),
  updateAiSettings: vi.fn(),
  testAiConnection: vi.fn(),
}))

const settings = {
  enabled: true,
  assistant_enabled: true,
  summary_enabled: true,
  daily_token_limit: 20000,
  question_max_length: 500,
  driver: 'openai',
  model: 'test/model',
  configured: true,
  last_error: {
    code: 'auth_failed',
    http_status: 401,
    message: 'Incorrect API key provided: [redacted]',
    at: new Date().toISOString(),
  },
}

const usage = {
  totals: { requests: 2, tokens: 30 },
  by_day: [],
  by_status: [],
  top_users: [],
}

function renderSettings() {
  return renderWithProviders(<AiSettings />, {
    path: '/admin/ai',
    route: '/admin/ai',
    user: { ...testUser, role: 'admin' },
  })
}

describe('AI settings connection status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAiSettings.mockResolvedValue(settings)
    getAiUsage.mockResolvedValue(usage)
    updateAiSettings.mockResolvedValue({})
  })

  it('shows the configuration and the last provider error with a hint', async () => {
    renderSettings()

    expect(
      await screen.findByText('Last provider error: auth_failed (HTTP 401)'),
    ).toBeInTheDocument()
    expect(screen.getByText(/Incorrect API key provided/)).toBeInTheDocument()
    expect(screen.getByText(/The provider rejected the key/)).toBeInTheDocument()
    expect(screen.getByText('Configured: openai driver, model test/model.')).toBeInTheDocument()
  })

  it('tests the connection and reports success with the latency', async () => {
    testAiConnection.mockResolvedValue({
      ok: true,
      error_code: null,
      http_status: 200,
      latency_ms: 12,
      model: 'test/model',
    })

    renderSettings()

    fireEvent.click(await screen.findByRole('button', { name: 'Test connection' }))

    expect(await screen.findByText('Connected to test/model in 12 ms.')).toBeInTheDocument()
    expect(testAiConnection).toHaveBeenCalledTimes(1)
  })

  it('explains a not-configured test result', async () => {
    testAiConnection.mockResolvedValue({
      ok: false,
      error_code: 'not_configured',
      http_status: null,
      latency_ms: 1,
      model: '',
    })

    renderSettings()

    fireEvent.click(await screen.findByRole('button', { name: 'Test connection' }))

    expect(await screen.findByText('The test failed: not_configured')).toBeInTheDocument()
    expect(screen.getByText(/php artisan config:clear/)).toBeInTheDocument()
  })
})

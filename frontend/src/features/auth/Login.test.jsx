import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from './AuthContext'
import { ToastProvider } from '../../components/ui/Toast'
import { testUser } from '../../test/renderWithProviders'
import Login from './Login'

function renderLogin(login) {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthContext.Provider value={{ user: null, loading: false, login, logout: vi.fn() }}>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<div>Home page</div>} />
          </Routes>
        </ToastProvider>
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs in and redirects to the home page', async () => {
    const login = vi.fn().mockResolvedValue(testUser)
    renderLogin(login)

    fireEvent.change(screen.getByLabelText('Student ID or Email'), {
      target: { value: 'jan.nino@school.edu' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }))

    expect(await screen.findByText('Home page')).toBeInTheDocument()
    expect(login).toHaveBeenCalledWith({
      login: 'jan.nino@school.edu',
      password: 'password',
    })
  })

  it('shows the server message when the credentials are wrong', async () => {
    const login = vi.fn().mockRejectedValue({
      response: {
        status: 422,
        data: {
          message: 'These credentials do not match our records.',
          errors: { login: ['These credentials do not match our records.'] },
        },
      },
    })
    renderLogin(login)

    fireEvent.change(screen.getByLabelText('Student ID or Email'), {
      target: { value: 'jan.nino@school.edu' },
    })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }))

    await waitFor(() => expect(login).toHaveBeenCalled())
    expect(
      (await screen.findAllByText('These credentials do not match our records.')).length,
    ).toBeGreaterThan(0)
    expect(screen.getByLabelText('Password')).toHaveValue('wrong')
  })
})

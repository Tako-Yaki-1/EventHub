import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { ToastProvider } from '../components/ui/Toast'
import { AuthContext } from '../features/auth/AuthContext'

export const testUser = {
  id: 1,
  name: 'Jan Niño',
  email: 'jan.nino@school.edu',
  student_id: '2023-00123',
  year_section: 'BSIT 3B',
  role: 'student',
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

export function renderWithProviders(ui, { path = '/', route = '/', user = testUser, auth = {} } = {}) {
  const queryClient = createTestQueryClient()

  return render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthContext.Provider
            value={{
              user,
              loading: false,
              login: vi.fn(),
              updateProfile: vi.fn(),
              logout: vi.fn(),
              ...auth,
            }}
          >
            <Routes>
              <Route path={path} element={ui} />
              <Route path="*" element={<div>redirected</div>} />
            </Routes>
          </AuthContext.Provider>
        </ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

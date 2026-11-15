import api from './client'

export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials)
  return data
}

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload)
  return data
}

export async function me() {
  const { data } = await api.get('/auth/me')
  return data.data
}

export async function logout() {
  await api.post('/auth/logout')
}

export async function listSessions() {
  const { data } = await api.get('/auth/sessions')
  return data.data
}

export async function revokeSession(id) {
  await api.delete(`/auth/sessions/${id}`)
}

export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email })
  return data.message
}

export async function resetPassword(payload) {
  const { data } = await api.post('/auth/reset-password', payload)
  return data.message
}

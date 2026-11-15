import api from './client'

export async function createEvent(payload) {
  const { data } = await api.post('/events', payload)
  return data
}

export async function updateEvent(id, payload) {
  const { data } = await api.put(`/events/${id}`, payload)
  return data
}

export async function cancelEvent(id) {
  const { data } = await api.delete(`/events/${id}`)
  return data
}

export async function listAttendees(eventId, params) {
  const { data } = await api.get(`/events/${eventId}/registrations`, { params })
  return data
}

export async function listAuditLogs(params) {
  const { data } = await api.get('/admin/audit-logs', { params })
  return data
}

export async function verifyAuditLog() {
  const { data } = await api.post('/admin/audit-logs/verify')
  return data
}

export async function listUsers(params) {
  const { data } = await api.get('/admin/users', { params })
  return data
}

export async function revokeUserTokens(userId) {
  const { data } = await api.delete(`/admin/users/${userId}/tokens`)
  return data
}

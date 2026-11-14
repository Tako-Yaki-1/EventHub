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

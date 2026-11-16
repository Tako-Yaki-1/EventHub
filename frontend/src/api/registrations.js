import api from './client'

export async function listMyRegistrations(params) {
  const { data } = await api.get('/my/registrations', { params })
  return data
}

export async function registerForEvent(eventId, payload) {
  const { data } = await api.post(`/events/${eventId}/registrations`, payload)
  return data
}

export async function cancelRegistration(registrationId) {
  const { data } = await api.delete(`/registrations/${registrationId}`)
  return data
}

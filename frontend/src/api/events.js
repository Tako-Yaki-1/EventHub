import api from './client'

export async function listEvents(params) {
  const { data } = await api.get('/events', { params })
  return data
}

export async function getEvent(id) {
  const { data } = await api.get(`/events/${id}`)
  return data.data
}

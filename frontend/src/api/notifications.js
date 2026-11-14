import api from './client'

export async function listNotifications(page = 1) {
  const { data } = await api.get('/notifications', { params: { page } })
  return data
}

export async function markNotificationRead(id) {
  const { data } = await api.post(`/notifications/${id}/read`)
  return data.data
}

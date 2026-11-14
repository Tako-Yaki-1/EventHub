import api from './client'

export async function getSummary() {
  const { data } = await api.get('/admin/analytics/summary')
  return data
}

export async function getRegistrationsOverTime(days = 30) {
  const { data } = await api.get('/admin/analytics/registrations-over-time', { params: { days } })
  return data
}

export async function getEventsPerformance() {
  const { data } = await api.get('/admin/analytics/events-performance')
  return data.data
}

export async function getTopEvents(limit = 5) {
  const { data } = await api.get('/admin/analytics/top-events', { params: { limit } })
  return data.data
}

export async function getByYearSection() {
  const { data } = await api.get('/admin/analytics/by-year-section')
  return data.data
}

export async function getInsights() {
  const { data } = await api.get('/admin/analytics/insights')
  return data.data
}

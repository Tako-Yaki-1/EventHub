import api from './client'

export async function askAssistant(question) {
  const { data } = await api.post('/ai/assistant', { question })
  return data
}

export async function generateAnalyticsSummary() {
  const { data } = await api.post('/admin/ai/analytics-summary')
  return data
}

export async function getAiSettings() {
  const { data } = await api.get('/admin/ai/settings')
  return data.data
}

export async function updateAiSettings(values) {
  const { data } = await api.put('/admin/ai/settings', values)
  return data
}

export async function testAiConnection() {
  const { data } = await api.post('/admin/ai/test')
  return data
}

export async function getAiUsage(days = 30) {
  const { data } = await api.get('/admin/ai/usage', { params: { days } })
  return data
}

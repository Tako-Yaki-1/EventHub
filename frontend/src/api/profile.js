import api from './client'

export async function updateProfile(payload) {
  const { data } = await api.put('/profile', payload)
  return data.data
}

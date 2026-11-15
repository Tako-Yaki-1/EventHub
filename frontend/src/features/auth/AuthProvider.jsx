import { useCallback, useEffect, useMemo, useState } from 'react'
import * as authApi from '../../api/auth'
import { updateProfile as updateProfileRequest } from '../../api/profile'
import { clearToken, getToken, setToken } from '../../lib/token'
import { AuthContext } from './AuthContext'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionMessage, setSessionMessage] = useState(null)

  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }

    authApi
      .me()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null)
      setSessionMessage('Your session has expired. Please log in again.')
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  const login = useCallback(async (credentials) => {
    const { token, user: loggedInUser } = await authApi.login(credentials)
    setToken(token)
    setUser(loggedInUser)
    setSessionMessage(null)
    return loggedInUser
  }, [])

  const register = useCallback(async (payload) => {
    const { token, user: newUser } = await authApi.register(payload)
    setToken(token)
    setUser(newUser)
    setSessionMessage(null)
    return newUser
  }, [])

  const updateProfile = useCallback(async (payload) => {
    const updated = await updateProfileRequest(payload)
    setUser(updated)
    return updated
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // The token may already be revoked; clearing locally is enough.
    }
    clearToken()
    setUser(null)
    setSessionMessage(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, sessionMessage, login, register, updateProfile, logout }),
    [user, loading, sessionMessage, login, register, updateProfile, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

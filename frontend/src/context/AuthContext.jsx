import { createContext, useContext, useState } from 'react'
import { API } from '../api/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'))

  const login = async (email, password) => {
    const res = await API.post('/api/auth/login', { email, password })
    const { access_token } = res.data
    localStorage.setItem('token', access_token)
    setToken(access_token)
    return res.data
  }

  const register = async (name, email, password) => {
    const res = await API.post('/api/auth/register', { name, email, password })
    return res.data
  }

  const logout = async () => {
    try {
      await API.post('/api/auth/logout')
    } catch {
      // server-side logout is best-effort
    }
    localStorage.removeItem('token')
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

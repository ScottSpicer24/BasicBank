import { createContext, useContext, useState } from 'react'
import { API } from '../api/api'

// create a new context for the authentication context
// context in react is a way to share data between components without having to pass props down through multiple levels of the component tree
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'))

  // API: login and store the token in the local storage
  const login = async (email, password) => {
    const res = await API.post('/api/auth/login', { email, password })
    const { access_token } = res.data
    localStorage.setItem('token', access_token)
    setToken(access_token)
    return res.data
  }

  // API: register a new user and store the token in the local storage
  const register = async (name, email, password) => {
    const res = await API.post('/api/auth/register', { name, email, password })
    return res.data
  }

  // API: logout and remove the token from the local storage
  const logout = async () => {
    try {
      await API.post('/api/auth/logout')
    } catch {
      // server-side logout is best-effort
    }
    localStorage.removeItem('token')
    setToken(null)
  }

  //  exposes token, the three functions, and a convenience boolean isAuthenticated (!!token — true when a token exists, false otherwise). 
  // This is what components receive when they consume the context.return the authentication context provider
  return (
    <AuthContext.Provider value={{ token, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() { // custom hook to use the authentication context. 
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
} // Components just call const { login, logout } = useAuth() instead of importing both useContext and AuthContext.

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const SESSION_DURATION = 2 * 60 * 60 * 1000 // 2 hours in ms
const SESSION_START_KEY = 'session_start'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef(null)

  function clearSessionTimer() {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  function scheduleAutoSignOut() {
    clearSessionTimer()
    const sessionStart = parseInt(localStorage.getItem(SESSION_START_KEY) || '0', 10)
    const elapsed = Date.now() - sessionStart
    const remaining = SESSION_DURATION - elapsed

    if (remaining <= 0) {
      forceSignOut()
      return
    }

    timerRef.current = setTimeout(forceSignOut, remaining)
  }

  async function forceSignOut() {
    localStorage.removeItem(SESSION_START_KEY)
    await supabase.auth.signOut()
    setUser(null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        if (!localStorage.getItem(SESSION_START_KEY)) {
          localStorage.setItem(SESSION_START_KEY, Date.now().toString())
        }
        scheduleAutoSignOut()
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session) {
        clearSessionTimer()
        localStorage.removeItem(SESSION_START_KEY)
      }
    })

    return () => {
      subscription.unsubscribe()
      clearSessionTimer()
    }
  }, [])

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    localStorage.setItem(SESSION_START_KEY, Date.now().toString())
    scheduleAutoSignOut()
    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    localStorage.setItem(SESSION_START_KEY, Date.now().toString())
    scheduleAutoSignOut()
    return data
  }

  const signOut = async () => {
    clearSessionTimer()
    localStorage.removeItem(SESSION_START_KEY)
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

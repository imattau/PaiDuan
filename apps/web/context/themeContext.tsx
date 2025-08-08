'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type Mode = 'light' | 'dark' | 'system'
type ThemeCtx = {
  mode: Mode
  setMode: (m: Mode) => void
  toggleMode: () => void
  accent: string
  setAccent: (c: string) => void
}
const Ctx = createContext<ThemeCtx>({} as ThemeCtx)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>(() =>
    (typeof window !== 'undefined' && (localStorage.getItem('theme-mode') as Mode)) || 'system'
  )
  const [accent, setAccent] = useState<string>(() =>
    (typeof window !== 'undefined' && (localStorage.getItem('theme-accent') as string)) || '#3b82f6'
  )

  useEffect(() => {
    const root = document.documentElement
    const resolved =
      mode === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : mode
    root.classList.toggle('dark', resolved === 'dark')
    localStorage.setItem('theme-mode', mode)
  }, [mode])

  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const on = () => document.documentElement.classList.toggle('dark', mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [mode])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent)
    localStorage.setItem('theme-accent', accent)
  }, [accent])

  const toggleMode = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'))

  return (
    <Ctx.Provider value={{ mode, setMode, toggleMode, accent, setAccent }}>
      {children}
    </Ctx.Provider>
  )
}

export function useTheme() {
  return useContext(Ctx)
}

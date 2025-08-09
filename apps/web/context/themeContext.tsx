'use client'
import { createContext, useContext, useEffect, useState } from 'react'

function hexToHSL(hex: string) {
  hex = hex.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToHex(h: number, s: number, l: number) {
  s /= 100
  l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0,
    g = 0,
    b = 0
  if (h >= 0 && h < 60) {
    r = c
    g = x
    b = 0
  } else if (h < 120) {
    r = x
    g = c
    b = 0
  } else if (h < 180) {
    r = 0
    g = c
    b = x
  } else if (h < 240) {
    r = 0
    g = x
    b = c
  } else if (h < 300) {
    r = x
    g = 0
    b = c
  } else {
    r = c
    g = 0
    b = x
  }
  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)
  return (
    '#' +
    [r, g, b]
      .map((v) => {
        const hex = v.toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}

function adjustLightness(hex: string, amount: number) {
  const { h, s, l } = hexToHSL(hex)
  const nl = Math.min(100, Math.max(0, l + amount))
  return hslToHex(h, s, nl)
}

type Mode = 'light' | 'dark' | 'system'
type ThemeCtx = {
  mode: Mode
  setMode: (m: Mode) => void
  toggleMode: () => void
  accent: string
  setAccent: (c: string) => void
  accentHover: string
  setAccentHover: (c: string) => void
  accentActive: string
  setAccentActive: (c: string) => void
}
const Ctx = createContext<ThemeCtx>({} as ThemeCtx)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('system')
  const [accent, setAccentState] = useState<string>('#3b82f6')
  const [accentHover, setAccentHoverState] = useState<string>('#2563eb')
  const [accentActive, setAccentActiveState] = useState<string>('#1d4ed8')

  const setAccent = (c: string) => {
    setAccentState(c)
    setAccentHoverState(adjustLightness(c, -4))
    setAccentActiveState(adjustLightness(c, -8))
  }
  const setAccentHover = (c: string) => setAccentHoverState(c)
  const setAccentActive = (c: string) => setAccentActiveState(c)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedMode = localStorage.getItem('theme-mode') as Mode | null
    if (storedMode) setMode(storedMode)
    const storedAccent = localStorage.getItem('theme-accent-primary') as string | null
    const storedAccentHover = localStorage.getItem('theme-accent-hover') as string | null
    const storedAccentActive = localStorage.getItem('theme-accent-active') as string | null
    if (storedAccent) setAccent(storedAccent)
    if (storedAccentHover) setAccentHoverState(storedAccentHover)
    if (storedAccentActive) setAccentActiveState(storedAccentActive)
  }, [])

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
    const root = document.documentElement
    const apply = (name: string, color: string) => {
      const { h, s, l } = hexToHSL(color)
      root.style.setProperty(name, `${h} ${s}% ${l}%`)
    }
    apply('--accent-primary', accent)
    apply('--accent-hover', accentHover)
    apply('--accent-active', accentActive)
    localStorage.setItem('theme-accent-primary', accent)
    localStorage.setItem('theme-accent-hover', accentHover)
    localStorage.setItem('theme-accent-active', accentActive)
  }, [accent, accentHover, accentActive])

  const toggleMode = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'))

  return (
    <Ctx.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        accent,
        setAccent,
        accentHover,
        setAccentHover,
        accentActive,
        setAccentActive,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useTheme() {
  return useContext(Ctx)
}

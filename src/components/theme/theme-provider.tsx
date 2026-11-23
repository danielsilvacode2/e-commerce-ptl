'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('nero_theme') as Theme | null
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setThemeState(savedTheme)
        applyTheme(savedTheme)
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const initial = prefersDark ? 'dark' : 'light'
        setThemeState(initial)
        applyTheme(initial)
      }
    } catch {
      // fallback
    }
  }, [])

  function applyTheme(newTheme: Theme) {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.setAttribute('data-theme', newTheme)
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  function toggleTheme() {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light'
    setThemeState(nextTheme)
    try {
      localStorage.setItem('nero_theme', nextTheme)
    } catch {
      // fallback
    }
    applyTheme(nextTheme)
  }

  function setTheme(t: Theme) {
    setThemeState(t)
    try {
      localStorage.setItem('nero_theme', t)
    } catch {
      // fallback
    }
    applyTheme(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

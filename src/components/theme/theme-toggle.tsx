'use client'

import { useTheme } from './theme-provider'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-9 w-9" />
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      className="p-2 rounded-full border border-black/10 dark:border-white/15 bg-[#F2F0F1] dark:bg-[#222222] text-black dark:text-white hover:opacity-80 transition-colors flex items-center justify-center cursor-pointer"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-amber-300" />
      ) : (
        <Moon className="h-4 w-4 text-neutral-800" />
      )}
    </button>
  )
}

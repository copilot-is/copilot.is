'use client'

import { useEffect, useTransition, useState } from 'react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { IconMoon, IconSun, IconSunMoon } from '@/components/ui/icons'
import { Tooltip } from './ui/tooltip'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Tooltip
      content={
        theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'
      }
    >
      <Button
        disabled={isPending}
        variant="ghost"
        size="icon"
        className='hover:bg-background'
        onClick={() => {
          startTransition(() => {
            switch (theme) {
              case 'dark':
                setTheme('light')
                break
              case 'light':
                setTheme('system')
                break
              default:
                setTheme('dark')
                break
            }
          })
        }}
      >
        {mounted ? (
          <>
            {theme === 'dark' ? (
              <IconMoon className="transition-all h-5 w-5" />
            ) : theme === 'light' ? (
              <IconSun className="transition-all h-5 w-5" />
            ) : (
              <IconSunMoon className="transition-all h-5 w-5" />
            )}
          </>
        ) : (
          <IconSunMoon className="transition-all h-5 w-5" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
    </Tooltip>
  )
}

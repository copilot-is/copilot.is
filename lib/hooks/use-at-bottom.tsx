'use client'

import { useEffect, useState } from 'react'

export function useAtBottom() {
  const [isAtBottom, setIsAtBottom] = useState(false)

  const scrollToTop = () => {
    const mainElement = document.querySelector('main')
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const scrollToBottom = () => {
    const mainElement = document.querySelector('main')
    if (mainElement) {
      mainElement.scrollTo({
        top: mainElement.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  useEffect(() => {
    const mainElement = document.querySelector('main')

    const handleScroll = () => {
      if (mainElement) {
        setIsAtBottom(
          mainElement.clientHeight + mainElement.scrollTop >=
            mainElement.scrollHeight
        )
      }
    }

    if (mainElement) {
      handleScroll()
      scrollToBottom()
      mainElement.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      if (mainElement) {
        mainElement.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  return { isAtBottom, scrollToTop, scrollToBottom }
}

'use client'

import { useEffect, useState } from 'react'

type MediaQueryList = {
  matches: boolean
  addListener: (listener: () => void) => void
  removeListener: (listener: () => void) => void
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false)

  useEffect(() => {
    const mediaQueryList: MediaQueryList = window.matchMedia(query)

    const handleMediaQueryChange = () => {
      setMatches(mediaQueryList.matches)
    }

    mediaQueryList.addListener(handleMediaQueryChange)

    handleMediaQueryChange()

    return () => {
      mediaQueryList.removeListener(handleMediaQueryChange)
    }
  }, [query])

  return matches
}

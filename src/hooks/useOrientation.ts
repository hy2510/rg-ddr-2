import { useEffect, useState } from 'react'

export const useOrientation = () => {
  const getOrientation = () =>
    window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'

  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(getOrientation())

  useEffect(() => {
    const handleResize = () => {
      const newOrientation = getOrientation()
      setOrientation(newOrientation)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize) // 일부 브라우저 대응

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  return orientation
}
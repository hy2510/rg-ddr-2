import { useEffect, useState } from 'react'

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent
      const isMobileDevice =
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
      setIsMobile(isMobileDevice)
    }

    checkMobile()
  }, [])

  return isMobile
}
import { type RefObject, useEffect, useState } from 'react'

type UseVideoPlaybackParams = {
  videoRef: RefObject<HTMLVideoElement | null>
  enabled: boolean
  startAtTime?: number
  refreshKey?: unknown
}

type UseVideoPlaybackResult = {
  isVideoEnded: boolean
  isPaused: boolean
  isLoading: boolean
  restartVideoFromStart: () => void
  togglePlayPause: () => void
}

export function useVideoPlayback({
  videoRef,
  enabled,
  startAtTime,
  refreshKey,
}: UseVideoPlaybackParams): UseVideoPlaybackResult {
  const [isVideoEnded, setIsVideoEnded] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    if (!enabled) {
      return
    }
    const videoElement = videoRef.current
    if (!videoElement) {
      return
    }

    const handleEnded = () => {
      setIsVideoEnded(true)
      setIsPaused(true)
      setIsLoading(false)
    }
    const handlePlaying = () => {
      setIsVideoEnded(false)
      setIsPaused(false)
      setIsLoading(false)
    }
    const handlePause = () => setIsPaused(true)
    const handleWaiting = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleLoadStart = () => setIsLoading(true)

    videoElement.addEventListener('ended', handleEnded)
    videoElement.addEventListener('playing', handlePlaying)
    videoElement.addEventListener('pause', handlePause)
    videoElement.addEventListener('waiting', handleWaiting)
    videoElement.addEventListener('canplay', handleCanPlay)
    videoElement.addEventListener('loadstart', handleLoadStart)

    const startPlayback = () => {
      if (startAtTime !== undefined) {
        videoElement.currentTime = startAtTime
      }
      videoElement.play().catch((error: unknown) => {
        console.error('Auto-play failed:', error)
      })
    }

    if (startAtTime !== undefined && videoElement.readyState < 1) {
      videoElement.addEventListener('loadedmetadata', startPlayback, {
        once: true,
      })
    } else {
      startPlayback()
    }

    return () => {
      videoElement.removeEventListener('ended', handleEnded)
      videoElement.removeEventListener('playing', handlePlaying)
      videoElement.removeEventListener('pause', handlePause)
      videoElement.removeEventListener('waiting', handleWaiting)
      videoElement.removeEventListener('canplay', handleCanPlay)
      videoElement.removeEventListener('loadstart', handleLoadStart)
      videoElement.removeEventListener('loadedmetadata', startPlayback)
    }
  }, [enabled, videoRef, startAtTime, refreshKey])

  const restartVideoFromStart = () => {
    const videoElement = videoRef.current
    if (!videoElement) {
      return
    }
    videoElement.currentTime = 0
    videoElement.play().catch((error: unknown) => {
      console.error('Restart playback failed:', error)
    })
  }

  const togglePlayPause = () => {
    const videoElement = videoRef.current
    if (!videoElement) {
      return
    }
    if (videoElement.paused || videoElement.ended) {
      videoElement.play().catch((error: unknown) => {
        console.error('Play failed:', error)
      })
    } else {
      videoElement.pause()
    }
  }

  return {
    isVideoEnded,
    isPaused,
    isLoading,
    restartVideoFromStart,
    togglePlayPause,
  }
}

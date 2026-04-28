import { type RefObject, useEffect, useState } from 'react'

import {
  type CaptionCue,
  findCurrentCueStart,
  findNextCueStart,
  findPreviousCueStart,
} from '@components/dubbing/caption/captionTimeline'

type UseCaptionNavigationParams = {
  videoRef: RefObject<HTMLVideoElement | null>
  captionTimeline: CaptionCue[]
  enabled?: boolean
  refreshKey?: unknown
}

type UseCaptionNavigationResult = {
  goToPreviousCue: () => void
  goToNextCue: () => void
  replayCurrentCue: () => void
  isPreviousDisabled: boolean
  isNextDisabled: boolean
}

export function useCaptionNavigation({
  videoRef,
  captionTimeline,
  enabled = true,
  refreshKey,
}: UseCaptionNavigationParams): UseCaptionNavigationResult {
  const [isPreviousDisabled, setIsPreviousDisabled] = useState<boolean>(true)
  const [isNextDisabled, setIsNextDisabled] = useState<boolean>(false)

  useEffect(() => {
    if (!enabled) {
      return
    }
    const videoElement = videoRef.current
    if (!videoElement) {
      return
    }

    const updateAvailability = () => {
      const currentTime = videoElement.currentTime
      setIsPreviousDisabled(
        findPreviousCueStart(captionTimeline, currentTime) === null,
      )
      setIsNextDisabled(findNextCueStart(captionTimeline, currentTime) === null)
    }

    videoElement.addEventListener('timeupdate', updateAvailability)
    videoElement.addEventListener('seeked', updateAvailability)
    updateAvailability()

    return () => {
      videoElement.removeEventListener('timeupdate', updateAvailability)
      videoElement.removeEventListener('seeked', updateAvailability)
    }
  }, [captionTimeline, enabled, videoRef, refreshKey])

  const seekAndPlay = (time: number) => {
    const videoElement = videoRef.current
    if (!videoElement) {
      return
    }
    videoElement.currentTime = time
    videoElement.play().catch((error: unknown) => {
      console.error('Caption navigation play failed:', error)
    })
  }

  const goToPreviousCue = () => {
    const videoElement = videoRef.current
    if (!videoElement) {
      return
    }
    const previousStart = findPreviousCueStart(
      captionTimeline,
      videoElement.currentTime,
    )
    seekAndPlay(previousStart ?? 0)
  }

  const goToNextCue = () => {
    const videoElement = videoRef.current
    if (!videoElement) {
      return
    }
    const nextStart = findNextCueStart(
      captionTimeline,
      videoElement.currentTime,
    )
    if (nextStart === null) {
      return
    }
    seekAndPlay(nextStart)
  }

  const replayCurrentCue = () => {
    const videoElement = videoRef.current
    if (!videoElement) {
      return
    }
    const currentStart = findCurrentCueStart(
      captionTimeline,
      videoElement.currentTime,
    )
    if (currentStart === null) {
      return
    }
    seekAndPlay(currentStart)
  }

  return {
    goToPreviousCue,
    goToNextCue,
    replayCurrentCue,
    isPreviousDisabled,
    isNextDisabled,
  }
}

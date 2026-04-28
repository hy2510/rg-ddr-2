import { type RefObject, useEffect, useState } from 'react'

import {
  type CaptionCharacterImage,
  type CaptionCue,
  findCaptionCueByTime,
} from '@components/dubbing/caption/captionTimeline'

type UseCaptionSyncParams = {
  videoRef: RefObject<HTMLVideoElement | null>
  captionTimeline: CaptionCue[]
  defaultCaption: string
  enabled?: boolean
  refreshKey?: unknown
}

type UseCaptionSyncResult = {
  caption: string
  characterImage: CaptionCharacterImage | null
  captionIndex: number | null
  captionTotal: number
  activeCue: CaptionCue | null
}

export function useCaptionSync({
  videoRef,
  captionTimeline,
  defaultCaption,
  enabled = true,
  refreshKey,
}: UseCaptionSyncParams): UseCaptionSyncResult {
  const [caption, setCaption] = useState<string>(defaultCaption)
  const [characterImage, setCharacterImage] =
    useState<CaptionCharacterImage | null>(null)
  const [captionIndex, setCaptionIndex] = useState<number | null>(null)
  const [activeCue, setActiveCue] = useState<CaptionCue | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }
    const videoElement = videoRef.current
    if (!videoElement) {
      return
    }

    const updateCaption = () => {
      const currentTime = videoElement.currentTime
      const activeCue = findCaptionCueByTime(captionTimeline, currentTime)
      setCaption(activeCue?.text ?? defaultCaption)
      setCharacterImage(activeCue?.characterImage ?? null)
      setActiveCue(activeCue ?? null)

      if (captionTimeline.length === 0) {
        setCaptionIndex(null)
        return
      }
      let lastStartedIndex = -1
      for (let i = 0; i < captionTimeline.length; i += 1) {
        if (captionTimeline[i].start <= currentTime) {
          lastStartedIndex = i
        } else {
          break
        }
      }
      setCaptionIndex(lastStartedIndex < 0 ? 1 : lastStartedIndex + 1)
    }

    videoElement.addEventListener('timeupdate', updateCaption)
    videoElement.addEventListener('seeked', updateCaption)
    updateCaption()

    return () => {
      videoElement.removeEventListener('timeupdate', updateCaption)
      videoElement.removeEventListener('seeked', updateCaption)
    }
  }, [captionTimeline, defaultCaption, enabled, videoRef, refreshKey])

  return {
    caption,
    characterImage,
    captionIndex,
    captionTotal: captionTimeline.length,
    activeCue,
  }
}

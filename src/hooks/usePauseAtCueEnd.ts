import { type RefObject, useEffect } from 'react'

import { type CaptionCue } from '@components/dubbing/caption/captionTimeline'

type UsePauseAtCueEndParams = {
  videoRef: RefObject<HTMLVideoElement | null>
  captionTimeline: CaptionCue[]
  enabled?: boolean
  refreshKey?: unknown
}

// 큐 end에 도달하면 비디오를 일시정지한다.
// 정지 후에도 해당 큐의 자막/캐릭터 이미지가 화면에 유지되도록 currentTime을
// cue.end 직전(epsilon 이전)으로 스냅해 둔다. useCaptionSync 의
// findCaptionCueByTime 이 currentTime < cue.end 를 기준으로 활성 큐를
// 찾기 때문.
const CUE_END_EPSILON = 0.05

export function usePauseAtCueEnd({
  videoRef,
  captionTimeline,
  enabled = true,
  refreshKey,
}: UsePauseAtCueEndParams): void {
  useEffect(() => {
    if (!enabled) {
      return
    }
    const videoElement = videoRef.current
    if (!videoElement) {
      return
    }

    let lastTime = videoElement.currentTime

    // 자연스러운 재생에서 timeupdate 간격이 대략 250ms 내외이므로,
    // 그보다 현저히 큰 점프는 seek 로 간주하여 cue-end 판정을 건너뛴다.
    const SEEK_JUMP_THRESHOLD = 0.75

    const handleTimeUpdate = () => {
      if (videoElement.paused) {
        lastTime = videoElement.currentTime
        return
      }

      const currentTime = videoElement.currentTime

      // seek 로 인한 큰 점프는 cue-end 판정 대상에서 제외한다.
      if (currentTime - lastTime > SEEK_JUMP_THRESHOLD) {
        lastTime = currentTime
        return
      }

      const endedCue = captionTimeline.find(
        (cue) => cue.end > lastTime && cue.end <= currentTime,
      )

      if (endedCue) {
        videoElement.pause()
        const snapTime = Math.max(
          endedCue.start,
          endedCue.end - CUE_END_EPSILON,
        )
        videoElement.currentTime = snapTime
        lastTime = snapTime
        return
      }

      lastTime = currentTime
    }

    // seeking 은 currentTime 세팅 직후(시크 시작 시) 즉시 발생하므로
    // 이후 timeupdate 가 먼저 실행되더라도 lastTime 을 미리 맞춰둔다.
    const handleSeekingOrSeeked = () => {
      lastTime = videoElement.currentTime
    }

    videoElement.addEventListener('timeupdate', handleTimeUpdate)
    videoElement.addEventListener('seeking', handleSeekingOrSeeked)
    videoElement.addEventListener('seeked', handleSeekingOrSeeked)

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
      videoElement.removeEventListener('seeking', handleSeekingOrSeeked)
      videoElement.removeEventListener('seeked', handleSeekingOrSeeked)
    }
  }, [captionTimeline, enabled, videoRef, refreshKey])
}

import { useMemo, useRef, useState } from 'react'

import { WatchVideoLayout } from '@components/common/VideoLayout'
import { CaptionLayout } from '@components/dubbing/caption/CaptionLayout'
import type {
  CaptionCharacterImage,
  CaptionCue,
} from '@components/dubbing/caption/captionTimeline'
import ModalSelectMode from '@components/modals/ModalSelectMode'
import { useAppContext } from '@contexts/AppContext'
import { useCaptionNavigation } from '@hooks/useCaptionNavigation'
import { useCaptionSync } from '@hooks/useCaptionSync'
import { useVideoPlayback } from '@hooks/useVideoPlayback'
import type { IRecord, IResultPostStudy } from '@interfaces/IDubbing'
import { convertTimeToSec } from '@utils/common'

type WatchVideoProps = {
  handleSelectMode: (res: IResultPostStudy) => void
}

function buildCharacterImage(
  actorCsv: string,
): CaptionCharacterImage | undefined {
  const codes = actorCsv
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
  if (codes.length === 0) return undefined

  const fileName = (code: string) =>
    code.toLowerCase().endsWith('.png') ? code : `${code}.png`

  return {
    image1: fileName(codes[0] ?? ''),
    image2: codes[1] ? fileName(codes[1]) : '',
    image3: codes[2] ? fileName(codes[2]) : '',
    image4: codes[3] ? fileName(codes[3]) : '',
  }
}

function recordsToCaptionTimeline(
  records: IRecord[],
  studyMode: string,
): CaptionCue[] {
  const studyType = studyMode === 'Solo' ? 'single' : 'full'

  return [...records]
    .map((r) => {
      const start = convertTimeToSec(r.StartTime)
      const end = convertTimeToSec(r.EndTime)
      const cue: CaptionCue = {
        start,
        end: Math.max(end, start + 0.01),
        text: r.Sentence,
        studyType,
      }
      const characterImage = buildCharacterImage(r.Actor)
      if (
        characterImage &&
        (characterImage.image1 ||
          characterImage.image2 ||
          characterImage.image3 ||
          characterImage.image4)
      ) {
        cue.characterImage = characterImage
      }
      return cue
    })
    .sort((a, b) => a.start - b.start)
}

/** Dubbing 플로우 `watch-video` — DubbingRoom과 동일한 영상·캡션 UI + 기존 모드 선택 모달 */
export default function WatchVideo({ handleSelectMode }: WatchVideoProps) {
  const { detailContentInfo } = useAppContext()
  const [viewSelectMode, setViewSelectMode] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const captionTimeline = useMemo(
    () =>
      recordsToCaptionTimeline(
        detailContentInfo.Record ?? [],
        detailContentInfo.StudyMode,
      ),
    [detailContentInfo.Record, detailContentInfo.StudyMode],
  )

  const videoSrc = detailContentInfo.VideoPath
  const syncKey = `${videoSrc}|${captionTimeline.length}`

  const isVideoActive = true

  const { caption, characterImage, captionIndex, captionTotal, activeCue } =
    useCaptionSync({
      videoRef,
      captionTimeline,
      defaultCaption: '',
      enabled: isVideoActive,
      refreshKey: syncKey,
    })

  const {
    goToPreviousCue,
    goToNextCue,
    isNextDisabled: isNextCueDisabled,
  } = useCaptionNavigation({
    videoRef,
    captionTimeline,
    enabled: isVideoActive,
    refreshKey: syncKey,
  })

  const {
    isVideoEnded,
    isPaused,
    isLoading,
    restartVideoFromStart,
    togglePlayPause,
  } = useVideoPlayback({
    videoRef,
    enabled: isVideoActive,
    refreshKey: syncKey,
  })

  return (
    <>
      <WatchVideoLayout
        videoRef={videoRef}
        src={videoSrc}
        onClickRestart={isVideoEnded ? restartVideoFromStart : togglePlayPause}
        onClickNext={() => setViewSelectMode(true)}
        isPaused={isPaused}
        isVideoEnded={isVideoEnded}
        isLoading={isLoading}
        activeCue={activeCue}
      />
      <CaptionLayout
        caption={caption}
        characterImage={characterImage}
        captionIndex={captionIndex}
        captionTotal={captionTotal}
        onSkipBack={goToPreviousCue}
        onNext={goToNextCue}
        isNextDisabled={isNextCueDisabled}
      />

      {viewSelectMode && (
        <ModalSelectMode
          handleSelectMode={handleSelectMode}
          onClickClose={() => setViewSelectMode(false)}
        />
      )}
    </>
  )
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import styled from 'styled-components'

import soundCorrectionCorrect from '@assets/sounds/sound_correction_correct.mp3'
import soundCorrectionIncorrect from '@assets/sounds/sound_correction_incorrect.mp3'
import PopupLayout from '@components/common/PopupLayout'
import { DubbingCaptionLayout } from '@components/dubbing/caption/CaptionLayout'
import type {
  CaptionCharacterImage,
  CaptionCue,
} from '@components/dubbing/caption/captionTimeline'
import { TotalScore } from '@components/dubbing/TotalScore'
import Loading from '@components/Loading'
import { useAppContext } from '@contexts/AppContext'
import { useSoundContext } from '@contexts/SoundContext'
import { useCaptionNavigation } from '@hooks/useCaptionNavigation'
import { useCaptionSync } from '@hooks/useCaptionSync'
import { useCueRecording } from '@hooks/useCueRecording'
import { usePauseAtCueEnd } from '@hooks/usePauseAtCueEnd'
import { useVideoPlayback } from '@hooks/useVideoPlayback'
import type { CueResult, MyMovieEncodeState } from '@interfaces/dubbingTypes'
import { IAnswer } from '@interfaces/IDubbing'
import { IRecordResultData } from '@interfaces/ISpeak'
import { MainView } from '@pages/containers/WrapperContainer'
import { getUploadUrl, saveContent, uploadVideo } from '@services/api'
import { convertTimeToSec, makeAnswer, makeScoreData } from '@utils/common'
import {
  type MergeCueSegment,
  mergeMyMovieAndDownload,
} from '@utils/mergeMyMovie'

function buildCharacterImage(actorCsv: string): CaptionCharacterImage | null {
  const codes = actorCsv
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
  if (codes.length === 0) return null

  const fileName = (code: string) =>
    code.toLowerCase().endsWith('.png') ? code : `${code}.png`

  return {
    image1: fileName(codes[0] ?? ''),
    image2: codes[1] ? fileName(codes[1]) : '',
    image3: codes[2] ? fileName(codes[2]) : '',
    image4: codes[3] ? fileName(codes[3]) : '',
  }
}

/** Web Speech 매칭 결과로 저장·모달용 스코어 객체 생성 */
function buildCueMatchRecordResult(
  sentence: string,
  matched: number,
  total: number,
): IRecordResultData {
  const ratio = total > 0 ? matched / total : 0
  const total_score = Math.min(100, Math.max(0, Math.round(ratio * 100)))
  const words = sentence
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => ({
      word,
      phonemes: [{ phoneme: word, score: total_score }],
    }))

  return {
    speech_detected: true,
    best_answer: sentence,
    phoneme_result: {
      sentence_score: total_score,
      words,
    },
    score_weight: {
      accuracy: 40,
      intonation: 25,
      accent: 20,
      pause: 5,
      speed: 10,
    },
    score: {
      accuracy: ratio,
      intonation: ratio,
      accent: ratio,
      pause: ratio,
      speed: ratio,
    },
    weighted_score: {
      accuracy: Math.round(40 * ratio),
      intonation: Math.round(25 * ratio),
      accent: Math.round(20 * ratio),
      pause: Math.round(5 * ratio),
      speed: Math.round(10 * ratio),
    },
    total_score,
  }
}

type DubbingProps = {
  changeMainView: (view: MainView) => void
  onCompleteMyMovie?: (payload: {
    captionTimeline: CaptionCue[]
    cueResults: Record<number, CueResult>
  }) => void
}

export type RecordResultProps = {
  isPassed: boolean
  recordResult: IRecordResultData
}

type RecFileProps = { file: File; sentenceIndex: number }

const isFullMode = (studyMode: string) => {
  const normalized = String(studyMode).trim().toLowerCase()
  return normalized === 'full' || normalized === 'all'
}

const isLeadSentence = (lead: unknown) => {
  if (typeof lead === 'boolean') return lead
  if (typeof lead === 'number') return lead === 1
  if (typeof lead === 'string') {
    const normalized = lead.trim().toLowerCase()
    return (
      normalized === 'true' ||
      normalized === '1' ||
      normalized === 'y' ||
      normalized === 'yes'
    )
  }
  return false
}

export default function Dubbing({
  changeMainView,
  onCompleteMyMovie,
}: DubbingProps) {
  const {
    studyInfo,
    contentInfo,
    detailContentInfo,
    changeDetailContentInfo,
    setStudyInfo,
    resetContentInfo,
  } = useAppContext()
  const { audioList, playSound } = useSoundContext()

  const videoRef = useRef<HTMLVideoElement>(null)
  const isWorking = useRef(false)
  const detailContentInfoRef = useRef(detailContentInfo)
  detailContentInfoRef.current = detailContentInfo

  const captionTimelineRef = useRef<CaptionCue[]>([])
  const recordIndicesRef = useRef<number[]>([])

  const [recFiles, setRecFiles] = useState<RecFileProps[]>([])
  const [lineResults, setLineResults] = useState<
    Record<number, RecordResultProps>
  >({})
  const [cueResults, setCueResults] = useState<Record<number, CueResult>>({})
  const [showModalTotalScore, setShowModalTotalScore] = useState(false)
  const [encodeState, setEncodeState] = useState<MyMovieEncodeState>({
    status: 'idle',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [readyGoState, setReadyGoState] = useState<'idle' | 'ready' | 'go'>(
    'idle',
  )
  const [showMicUnavailable, setShowMicUnavailable] = useState(false)
  const readyGoTimersRef = useRef<number[]>([])

  const [outputFile, setOutputFile] = useState('')
  const outputFileRef = useRef('')
  outputFileRef.current = outputFile

  const clearOutputFile = useCallback(() => {
    setOutputFile((prev) => {
      if (prev.startsWith('blob:')) URL.revokeObjectURL(prev)
      return ''
    })
  }, [])

  const { cues: captionTimeline, recordIndices: recordIndicesForCue } =
    useMemo(() => {
      const cues: CaptionCue[] = []
      const recordIndices: number[] = []
      const studyMode = detailContentInfo.StudyMode

      detailContentInfo.Record.forEach((record, index) => {
        if (!isFullMode(studyMode) && !isLeadSentence(record.Lead)) return

        const img = buildCharacterImage(record.Actor)
        cues.push({
          start: convertTimeToSec(
            record.StartTime === '00:00.000' ? '00:00.001' : record.StartTime,
          ),
          end: convertTimeToSec(record.EndTime),
          text: record.Sentence,
          ...(img ? { characterImage: img } : {}),
          studyType: isFullMode(studyMode) ? 'full' : 'single',
        })
        recordIndices.push(index)
      })

      return { cues, recordIndices }
    }, [detailContentInfo.Record, detailContentInfo.StudyMode])

  captionTimelineRef.current = captionTimeline
  recordIndicesRef.current = recordIndicesForCue

  const refreshKey = `${detailContentInfo.LevelRoundId ?? ''}|${detailContentInfo.VideoPath}|${captionTimeline.length}`

  const { isPaused } = useVideoPlayback({
    videoRef,
    enabled: captionTimeline.length > 0,
    startAtTime: captionTimeline[0]?.start,
    refreshKey: detailContentInfo.VideoPath,
  })

  usePauseAtCueEnd({
    videoRef,
    captionTimeline,
    enabled: captionTimeline.length > 0,
    refreshKey,
  })

  const { caption, characterImage, activeCue } = useCaptionSync({
    videoRef,
    captionTimeline,
    defaultCaption: '',
    enabled: captionTimeline.length > 0,
    refreshKey,
  })

  const {
    goToNextCue,
    replayCurrentCue,
    isNextDisabled: isNextCueDisabled,
  } = useCaptionNavigation({
    videoRef,
    captionTimeline,
    enabled: captionTimeline.length > 0,
    refreshKey,
  })

  const unmuteVideo = useCallback(() => {
    const video = videoRef.current
    if (video) video.muted = false
  }, [])

  const handleReplayCue = useCallback(() => {
    unmuteVideo()
    replayCurrentCue()
  }, [replayCurrentCue, unmuteVideo])

  const handleNextCue = useCallback(() => {
    unmuteVideo()
    goToNextCue()
  }, [goToNextCue, unmuteVideo])

  const activeRecordIndex = useMemo(() => {
    if (!activeCue) return -1
    const ci = captionTimeline.findIndex(
      (c) => c.start === activeCue.start && c.end === activeCue.end,
    )
    return ci >= 0 ? recordIndicesForCue[ci]! : -1
  }, [activeCue, captionTimeline, recordIndicesForCue])

  const dubbableIndices = useMemo(
    () =>
      detailContentInfo.Record.map((r, i) => {
        if (
          !isFullMode(detailContentInfo.StudyMode) &&
          !isLeadSentence(r.Lead)
        ) {
          return -1
        }
        return i
      }).filter((i): i is number => i >= 0),
    [detailContentInfo.Record, detailContentInfo.StudyMode],
  )

  /**
   * 더빙 대상 문장마다 녹음(blob)이 있으면 전체 플로우 완료.
   * (CueResult/TotalScore 방식: STT 통과 여부와 무관하게 시도만 끝나면 진행)
   */
  const isRecordEnd =
    dubbableIndices.length > 0 &&
    dubbableIndices.every((i) => recFiles.some((f) => f.sentenceIndex === i))

  const canFinalizeMovie = isRecordEnd

  const recordResultForModal = useMemo((): RecordResultProps[] => {
    return detailContentInfo.Record.map((record, i) => {
      const hit = lineResults[i]
      if (hit) return hit
      return {
        isPassed: false,
        recordResult: buildCueMatchRecordResult(record?.Sentence ?? '', 0, 1),
      }
    })
  }, [detailContentInfo.Record, lineResults])

  const playCorrectionSfx = useCallback((passed: boolean) => {
    try {
      const src = passed ? soundCorrectionCorrect : soundCorrectionIncorrect
      const sfx = new Audio(src)
      sfx.volume = 0.85
      void sfx.play().catch(() => {})
    } catch {
      // noop
    }
  }, [])

  const handleRecordingComplete = useCallback(
    ({
      cue,
      matched,
      total,
      matchedIndexes,
    }: {
      cue: CaptionCue
      matched: number
      total: number
      matchedIndexes: number[]
    }) => {
      const cues = captionTimelineRef.current
      const ridxs = recordIndicesRef.current
      const ci = cues.findIndex(
        (c) => c.start === cue.start && c.end === cue.end,
      )
      const recordIdx = ci >= 0 ? ridxs[ci]! : -1
      if (recordIdx < 0) return

      const ratio = total > 0 ? matched / total : 0
      const passed = ratio > 0.5
      const synthetic = buildCueMatchRecordResult(cue.text, matched, total)
      setCueResults((prev) => ({
        ...prev,
        [cue.start]: {
          ...(prev[cue.start] ?? { audioBlob: undefined }),
          matched,
          total,
          matchedIndexes,
        },
      }))

      setLineResults((prev) => ({
        ...prev,
        [recordIdx]: { isPassed: passed, recordResult: synthetic },
      }))

      if (passed) {
        playSound(audioList.launchSound, 0, 0.1)
      } else {
        playSound(audioList.powerDownSound, 0, 0.25)
      }

      playCorrectionSfx(passed)
    },
    [
      audioList.launchSound,
      audioList.powerDownSound,
      playCorrectionSfx,
      playSound,
    ],
  )

  const handleRecordedAudioAvailable = useCallback(
    ({ cue, audioBlob }: { cue: CaptionCue; audioBlob: Blob }) => {
      const cues = captionTimelineRef.current
      const ridxs = recordIndicesRef.current
      const ci = cues.findIndex(
        (c) => c.start === cue.start && c.end === cue.end,
      )
      const recordIdx = ci >= 0 ? ridxs[ci]! : -1
      if (recordIdx < 0 || audioBlob.size === 0) return

      const ext = audioBlob.type.includes('webm')
        ? 'webm'
        : audioBlob.type.includes('mp4')
          ? 'm4a'
          : 'dat'
      const file = new File([audioBlob], `userAudio_${recordIdx}.${ext}`, {
        type: audioBlob.type || 'audio/webm',
      })

      setRecFiles((prev) => {
        const filtered = prev.filter((f) => f.sentenceIndex !== recordIdx)
        return [...filtered, { file, sentenceIndex: recordIdx }].sort(
          (a, b) => a.sentenceIndex - b.sentenceIndex,
        )
      })
      setCueResults((prev) => ({
        ...prev,
        [cue.start]: {
          ...(prev[cue.start] ?? { matched: 0, total: 0, matchedIndexes: [] }),
          audioBlob,
        },
      }))
    },
    [],
  )

  const {
    isRecording,
    hasRecorded,
    matchedWordIndexes,
    recordedAudioUrl,
    startRecording,
    playRecording,
  } = useCueRecording({
    videoRef,
    activeCue,
    enabled: captionTimeline.length > 0,
    onRecordingComplete: handleRecordingComplete,
    onRecordedAudioAvailable: handleRecordedAudioAvailable,
  })

  useEffect(() => {
    return () => {
      readyGoTimersRef.current.forEach((id) => window.clearTimeout(id))
      readyGoTimersRef.current = []
      if (outputFileRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(outputFileRef.current)
        outputFileRef.current = ''
      }
    }
  }, [])

  useEffect(() => {
    setLineResults({})
    setRecFiles([])
    setCueResults({})
    setEncodeState({ status: 'idle' })
    clearOutputFile()
    setShowModalTotalScore(false)
  }, [detailContentInfo.LevelRoundId, clearOutputFile])

  const lastCueStart = captionTimeline[captionTimeline.length - 1]?.start
  const isLastCue =
    activeCue != null &&
    lastCueStart != null &&
    activeCue.start === lastCueStart

  /** 현재 문장: 녹음 저장됨·방금 녹음 종료 — 통과(isPassed) 불필요 */
  const lineReadyForNext =
    activeRecordIndex >= 0 &&
    (recFiles.some((f) => f.sentenceIndex === activeRecordIndex) ||
      (hasRecorded && !isRecording))

  const canGoNext = lineReadyForNext || isRecordEnd

  const handleStartRecordingWithCountdown = useCallback(async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setShowMicUnavailable(true)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
    } catch (err) {
      console.warn('Microphone not available:', err)
      setShowMicUnavailable(true)
      return
    }

    readyGoTimersRef.current.forEach((id) => window.clearTimeout(id))
    readyGoTimersRef.current = []

    setReadyGoState('ready')
    const toGo = window.setTimeout(() => {
      setReadyGoState('go')
    }, 1000)
    const toStart = window.setTimeout(() => {
      setReadyGoState('idle')
      startRecording()
    }, 2000)
    readyGoTimersRef.current.push(toGo, toStart)
  }, [startRecording])

  const onClickSave = () => {
    if (encodeState.status === 'downloading' || !canFinalizeMovie) return
    clearOutputFile()
    setEncodeState({ status: 'idle' })
    setShowModalTotalScore(true)
  }

  const uploadAndSaveResult = useCallback(async () => {
    const answers: IAnswer[] = recordResultForModal.map((result, i) => {
      const scoreData = makeScoreData(result)
      return makeAnswer(
        `${detailContentInfo.Record[i]?.QuizNo ?? ''}`,
        scoreData,
        JSON.stringify(result.recordResult),
      )
    })

    changeIsLoading(true)
    try {
      if (studyInfo.User === 'student') {
        const uploadUrl = await getUploadUrl(
          detailContentInfo.StudyId,
          detailContentInfo.StudentHistoryId,
          detailContentInfo.LevelRoundId,
          contentInfo.LevelName,
          detailContentInfo.StudyMode,
        )
        await uploadVideo(outputFile, uploadUrl)

        const onCompleteSave = () => {
          if (detailContentInfo.GetableRgPoint > 0) {
            const rgPoint =
              detailContentInfo.StudyMode === 'Full'
                ? contentInfo.BookPoint
                : contentInfo.BookPoint * 0.5
            setStudyInfo({
              ...studyInfo,
              RgPoint: studyInfo.RgPoint + rgPoint,
            })
          }
          if (onCompleteMyMovie) {
            onCompleteMyMovie({
              captionTimeline,
              cueResults,
            })
            return
          }
          changeMainView('main')
          resetContentInfo()
        }

        await saveContent(
          detailContentInfo.StudyId,
          detailContentInfo.StudentHistoryId,
          detailContentInfo.StudyMode,
          answers,
          onCompleteSave,
        )
      } else {
        changeMainView('main')
        resetContentInfo()
      }
    } finally {
      changeIsLoading(false)
    }
  }, [
    changeMainView,
    contentInfo.BookPoint,
    contentInfo.LevelName,
    cueResults,
    captionTimeline,
    detailContentInfo.GetableRgPoint,
    detailContentInfo.LevelRoundId,
    detailContentInfo.Record,
    detailContentInfo.StudentHistoryId,
    detailContentInfo.StudyId,
    detailContentInfo.StudyMode,
    outputFile,
    onCompleteMyMovie,
    recordResultForModal,
    resetContentInfo,
    setStudyInfo,
    studyInfo,
  ])

  const handleConfirmScorePopup = useCallback(async () => {
    if (!canFinalizeMovie || encodeState.status === 'downloading') return

    if (!outputFile) {
      setEncodeState({
        status: 'downloading',
        progress: 0,
        message: 'Preparing video...',
      })
      try {
        const segments: MergeCueSegment[] = captionTimeline.map((cue) => ({
          cue,
          audioBlob: cueResults[cue.start]?.audioBlob ?? null,
        }))
        const result = await mergeMyMovieAndDownload({
          videoSrc: detailContentInfo.VideoPath,
          segments,
          triggerDownload: false,
          onProgress: (progress, message) => {
            setEncodeState({
              status: 'downloading',
              progress,
              message,
            })
          },
        })
        setOutputFile((prev) => {
          if (prev.startsWith('blob:')) URL.revokeObjectURL(prev)
          return result.url
        })
        setEncodeState({ status: 'idle' })
      } catch (error) {
        console.error('Failed to encode my movie:', error)
        setEncodeState({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to create My Movie. Please try again.',
        })
      }
      return
    }

    await uploadAndSaveResult()
  }, [
    canFinalizeMovie,
    captionTimeline,
    cueResults,
    detailContentInfo.VideoPath,
    encodeState.status,
    outputFile,
    uploadAndSaveResult,
  ])

  const changeIsLoading = (loading: boolean) => {
    setIsLoading(loading)
  }

  if (captionTimeline.length === 0) {
    return <Loading />
  }

  return (
    <>
      <StyledDubbingRoot>
        <StyledVideoShell>
          <video
            ref={videoRef}
            src={detailContentInfo.VideoPath}
            playsInline
            crossOrigin='anonymous'
            muted={false}
            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
          />
        </StyledVideoShell>

        <DubbingCaptionLayout
          caption={caption}
          characterImage={characterImage}
          onReplayCue={handleReplayCue}
          onStartRecording={handleStartRecordingWithCountdown}
          onPlayRecording={() => playRecording()}
          onNext={handleNextCue}
          onFinishDubbing={onClickSave}
          isNextDisabled={isNextCueDisabled || !canGoNext}
          isMicDisabled={
            !isPaused ||
            readyGoState !== 'idle' ||
            encodeState.status === 'downloading'
          }
          isRecording={isRecording}
          isCompleted={hasRecorded && !isRecording}
          isLastCue={isLastCue}
          showPlayRecording={hasRecorded && Boolean(recordedAudioUrl)}
          showNext={canGoNext && (!isNextCueDisabled || isLastCue)}
          matchedWordIndexes={matchedWordIndexes}
        />
      </StyledDubbingRoot>

      {showModalTotalScore && (
        <PopupLayout
          hideButtons
          confirm={false}
          contents={
            <TotalScore
              captionTimeline={captionTimeline}
              cueResults={cueResults}
              encodeState={encodeState}
              onRetry={() => {
                if (encodeState.status === 'downloading') return
                if (outputFile) {
                  setShowModalTotalScore(false)
                  changeMainView('main')
                  resetContentInfo()
                  return
                }
                setShowModalTotalScore(false)
              }}
              onConfirm={handleConfirmScorePopup}
              retryText={outputFile ? 'Back to List' : 'Retry'}
              confirmText={outputFile ? 'Watch My Movie' : 'Confirm'}
            />
          }
        />
      )}

      {isLoading && <Loading />}

      {showMicUnavailable && (
        <PopupLayout
          contents='Microphone is not available. Please check your device settings.'
          confirm={false}
          confirmText='Confirm'
          onConfirm={() => setShowMicUnavailable(false)}
          onClose={() => setShowMicUnavailable(false)}
        />
      )}

      {readyGoState !== 'idle' && (
        <StyledReadyGoOverlay>
          <span key={readyGoState} className={`ready-go-text ${readyGoState}`}>
            {readyGoState === 'ready' ? 'Ready' : 'Go!'}
          </span>
        </StyledReadyGoOverlay>
      )}
    </>
  )
}

const StyledReadyGoOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  z-index: 10;
  pointer-events: auto;

  .ready-go-text {
    color: #fff;
    font-size: 9em;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-shadow: 0 6px 30px rgba(0, 0, 0, 0.5);
    animation: ready-go-pop 1s ease-out forwards;
  }

  .ready-go-text.ready {
    color: #ffd54a;
  }

  .ready-go-text.go {
    color: #fff;
  }

  @keyframes ready-go-pop {
    0% {
      transform: scale(0.6);
      opacity: 0;
    }
    25% {
      transform: scale(1.1);
      opacity: 1;
    }
    60% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(1.05);
      opacity: 0.9;
    }
  }
`

const StyledDubbingRoot = styled.div`
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;

  img {
    -webkit-user-drag: none;
    user-select: none;
  }
`

const StyledVideoShell = styled.div`
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;

  video {
    width: 100%;
    max-width: 1280px;
    height: 100%;
    max-height: 720px;
    object-fit: contain;
  }
`

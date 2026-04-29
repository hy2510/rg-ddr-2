import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'

import { type CaptionCue } from '@components/dubbing/caption/captionTimeline'

// 정규화 후 동일하거나(거의 일치) 한 글자 정도의 작은 차이만 허용한다.
// 음성 인식 결과가 큐 단어를 실제로 "인식" 한 경우에만 하이라이트되도록
const MATCH_THRESHOLD = 0.25

// 예외 단어 목록.
// 여기에 등록된 단어는 사용자가 "어떤 소리든" 내면 정답으로 처리한다.
// (예: 감탄사처럼 음성 인식기가 철자를 맞추기 어려운 경우)
// 추가 시 정규화된 형태(소문자 알파벳/숫자만)로 등록한다.
const EXCEPTION_WORDS: ReadonlySet<string> = new Set<string>([
  'leoni',
  'oho',
  'woohoo',
  'ahhh',
])

function isExceptionCueWord(word: string): boolean {
  return EXCEPTION_WORDS.has(normalizeWord(word))
}

type UseCueRecordingParams = {
  videoRef: RefObject<HTMLVideoElement | null>
  activeCue: CaptionCue | null
  enabled?: boolean
  // 녹음이 끝났을 때(= 큐 종료로 pause 되어 markRecorded 가 일어난 시점) 호출된다.
  // matched/total 은 splitCueWords 기준 단어 수.
  // matchedIndexes 는 caption 단어 배열에서 인식에 성공한 단어들의 index 목록.
  onRecordingComplete?: (result: {
    cue: CaptionCue
    matched: number
    total: number
    matchedIndexes: number[]
  }) => void
  // MediaRecorder 의 onstop 에서 audio blob 이 확정되었을 때 호출된다.
  // (녹음 완료 직후 audioBlob 이 필요한 경우 — 예: 나중에 영상 병합 다운로드에
  // 사용하려면 상위 컴포넌트에서 blob 을 보관해야 한다.)
  onRecordedAudioAvailable?: (result: {
    cue: CaptionCue
    audioBlob: Blob
  }) => void
}

type UseCueRecordingResult = {
  isRecording: boolean
  hasRecorded: boolean
  isPlayingRecording: boolean
  matchedWordIndexes: Set<number>
  recordedAudioUrl: string | null
  startRecording: (cueOverride?: CaptionCue) => void
  playRecording: (cueOverride?: CaptionCue) => void
}

// Web Speech API는 표준 타입에 포함되어 있지 않아 최소 타입만 선언한다.
type SpeechRecognitionResultLike = {
  0: { transcript: string }
  isFinal: boolean
}
type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>
}
type SpeechRecognitionInstance = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type SpeechRecognitionClass = new () => SpeechRecognitionInstance

function getSpeechRecognitionClass(): SpeechRecognitionClass | null {
  if (typeof window === 'undefined') {
    return null
  }
  const w = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionClass
    webkitSpeechRecognition?: SpeechRecognitionClass
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp: number[] = new Array(n + 1)
  for (let j = 0; j <= n; j += 1) dp[j] = j
  for (let i = 1; i <= m; i += 1) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j += 1) {
      const temp = dp[j]
      dp[j] =
        a[i - 1] === b[j - 1] ? prev : Math.min(prev, dp[j - 1], dp[j]) + 1
      prev = temp
    }
  }
  return dp[n]
}

function normalizeWord(word: string): string {
  // 영문/숫자만 남겨 비교 (apostrophe, 구두점 등은 제거).
  // 예: "you're" → "youre", "name?" → "name"
  return word.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function similarity(a: string, b: string): number {
  const aa = normalizeWord(a)
  const bb = normalizeWord(b)
  if (!aa && !bb) return 1
  if (!aa || !bb) return 0
  if (aa === bb) return 1
  const maxLen = Math.max(aa.length, bb.length)
  return 1 - levenshtein(aa, bb) / maxLen
}

export function splitCueWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean)
}

// 스포큰 토큰 배열과 큐 단어 배열을 매칭해 매칭된 큐 단어 인덱스 집합을 돌려준다.
// 같은 스포큰 토큰이 여러 큐 단어에 재사용되지 않도록 greedy 로 소비한다.
// EXCEPTION_WORDS 에 등록된 큐 단어는 어떤 소리라도 인식되면 정답으로 처리하며,
// 실제 일치 매칭에 영향을 주지 않도록 스포큰 토큰을 소비하지 않는다.
function matchWords(cueWords: string[], spokenWords: string[]): Set<number> {
  const matched = new Set<number>()
  const usedSpoken = new Set<number>()
  const hasAnySpoken = spokenWords.length > 0
  for (let i = 0; i < cueWords.length; i += 1) {
    if (isExceptionCueWord(cueWords[i])) {
      if (hasAnySpoken) {
        matched.add(i)
      }
      continue
    }
    for (let j = 0; j < spokenWords.length; j += 1) {
      if (usedSpoken.has(j)) continue
      if (similarity(spokenWords[j], cueWords[i]) >= MATCH_THRESHOLD) {
        matched.add(i)
        usedSpoken.add(j)
        break
      }
    }
  }
  return matched
}

function collectSpokenWords(event: SpeechRecognitionEventLike): string[] {
  const out: string[] = []
  const { results } = event
  for (let i = 0; i < results.length; i += 1) {
    const transcript = results[i][0]?.transcript ?? ''
    out.push(...splitCueWords(transcript))
  }
  return out
}

export function useCueRecording({
  videoRef,
  activeCue,
  enabled = true,
  onRecordingComplete,
  onRecordedAudioAvailable,
}: UseCueRecordingParams): UseCueRecordingResult {
  const [isRecording, setIsRecording] = useState(false)
  const [hasRecorded, setHasRecorded] = useState(false)
  const [isPlayingRecording, setIsPlayingRecording] = useState(false)
  const [matchedWordIndexes, setMatchedWordIndexes] = useState<Set<number>>(
    () => new Set(),
  )
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const pauseListenerRef = useRef<(() => void) | null>(null)
  const activeCueRef = useRef<CaptionCue | null>(activeCue)
  const matchedWordIndexesRef = useRef<Set<number>>(matchedWordIndexes)
  const onRecordingCompleteRef = useRef(onRecordingComplete)
  const onRecordedAudioAvailableRef = useRef(onRecordedAudioAvailable)

  // 최신 값 동기화 (녹음 종료 시점의 콜백 호출에서 stale 값 참조 방지)
  useEffect(() => {
    matchedWordIndexesRef.current = matchedWordIndexes
    onRecordingCompleteRef.current = onRecordingComplete
    onRecordedAudioAvailableRef.current = onRecordedAudioAvailable
  })

  // 오디오 캡처 관련 refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingSessionIdRef = useRef<number>(0)

  // 녹음 재생 관련 refs
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null)
  const playbackPauseListenerRef = useRef<(() => void) | null>(null)

  // 초기화 판단에 사용하는 마지막 활성 큐 키 (큐 경계에서 잠시 null 이 되는
  // 경우에도 상태가 지워지지 않도록 null 은 무시하고 실제 다른 큐로 바뀔 때만
  // 초기화한다.)
  const lastActiveCueKeyRef = useRef<string | null>(null)

  useEffect(() => {
    activeCueRef.current = activeCue
  }, [activeCue])

  // 실제로 다른 큐로 전환된 경우에만 매칭 상태·녹음 완료·녹음 오디오를 초기화.
  useEffect(() => {
    if (!activeCue) return
    const key = `${activeCue.start}-${activeCue.end}`
    if (lastActiveCueKeyRef.current === key) return
    lastActiveCueKeyRef.current = key

    setMatchedWordIndexes(new Set())
    setHasRecorded(false)
    setRecordedAudioUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev)
      }
      return null
    })
  }, [activeCue])

  const stopRecording = useCallback(
    (options: { markRecorded?: boolean } = {}) => {
      const recognition = recognitionRef.current
      if (recognition) {
        try {
          recognition.stop()
        } catch {
          // noop
        }
        recognitionRef.current = null
      }

      // MediaRecorder 중단 (onstop 에서 Blob → URL 생성)
      const recorder = mediaRecorderRef.current
      if (recorder) {
        if (recorder.state !== 'inactive') {
          try {
            recorder.stop()
          } catch {
            // noop
          }
        } else {
          // 이미 inactive 인데 stream 만 남아 있는 경우 정리
          const stream = mediaStreamRef.current
          if (stream) {
            stream.getTracks().forEach((track) => track.stop())
            mediaStreamRef.current = null
          }
        }
        mediaRecorderRef.current = null
      } else {
        // recorder 가 아직 준비되지 않았지만 stream 은 열려 있을 수 있어 즉시 정리
        const stream = mediaStreamRef.current
        if (stream) {
          stream.getTracks().forEach((track) => track.stop())
          mediaStreamRef.current = null
        }
        audioChunksRef.current = []
      }

      const video = videoRef.current
      if (video) {
        if (pauseListenerRef.current) {
          video.removeEventListener('pause', pauseListenerRef.current)
          pauseListenerRef.current = null
        }
        video.muted = false
      }
      setIsRecording(false)
      if (options.markRecorded) {
        setHasRecorded(true)
        const cue = activeCueRef.current
        const callback = onRecordingCompleteRef.current
        if (cue && callback) {
          const total = splitCueWords(cue.text).length
          const matchedIndexes = Array.from(matchedWordIndexesRef.current).sort(
            (a, b) => a - b,
          )
          const matched = matchedIndexes.length
          callback({ cue, matched, total, matchedIndexes })
        }
      }
    },
    [videoRef],
  )

  const stopPlayback = useCallback(() => {
    const audio = playbackAudioRef.current
    if (audio) {
      try {
        audio.pause()
      } catch {
        // noop
      }
      audio.src = ''
      playbackAudioRef.current = null
    }
    const video = videoRef.current
    if (video) {
      if (playbackPauseListenerRef.current) {
        video.removeEventListener('pause', playbackPauseListenerRef.current)
        playbackPauseListenerRef.current = null
      }
      video.muted = false
    }
    setIsPlayingRecording(false)
  }, [videoRef])

  const playRecording = useCallback(
    (cueOverride?: CaptionCue) => {
      if (!enabled) return
      const cue = cueOverride ?? activeCueRef.current
      const video = videoRef.current
      const audioUrl = recordedAudioUrl
      if (!cue || !video || !audioUrl) return

      // 이미 재생 중이면 정지로 토글
      if (playbackAudioRef.current) {
        stopPlayback()
        video.pause()
        return
      }

      // 녹음 진행 중이면 먼저 녹음 중단
      if (recognitionRef.current || mediaRecorderRef.current) {
        stopRecording()
      }

      video.muted = true
      video.currentTime = cue.start
      video.play().catch((error: unknown) => {
        console.error('Cue replay (playback) failed:', error)
      })

      const audio = new Audio(audioUrl)
      audio.addEventListener('ended', () => {
        // 영상은 cue 끝까지 계속 재생될 수 있어 오디오만 정리
        if (playbackAudioRef.current === audio) {
          playbackAudioRef.current = null
        }
      })
      audio.play().catch((error: unknown) => {
        console.error('Recorded audio play failed:', error)
      })
      playbackAudioRef.current = audio

      // 큐 끝에서 영상이 pause 되면 재생 상태를 종료한다.
      const handlePause = () => {
        stopPlayback()
      }
      video.addEventListener('pause', handlePause)
      playbackPauseListenerRef.current = handlePause

      setIsPlayingRecording(true)
    },
    [enabled, recordedAudioUrl, stopPlayback, stopRecording, videoRef],
  )

  const startRecording = useCallback(
    (cueOverride?: CaptionCue) => {
      if (!enabled) return
      const cue = cueOverride ?? activeCueRef.current
      const video = videoRef.current
      if (!cue || !video) return

      // 녹음 재생 중이면 먼저 정리
      if (playbackAudioRef.current) {
        stopPlayback()
      }

      // 명시적으로 다음 큐가 주어졌으면 기존 녹음을 강제로 정리하고 바로 이어서 시작.
      // 명시된 큐가 없을 때(마이크 버튼 재클릭) 는 토글 동작으로 중단만 한다.
      if (recognitionRef.current) {
        if (cueOverride) {
          stopRecording()
        } else {
          stopRecording()
          return
        }
      }

      // 이전에 녹음된 오디오가 있으면 새 녹음 시작 전에 revoke
      setRecordedAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })

      // 매칭 상태 및 녹음 완료 플래그 리셋
      setMatchedWordIndexes(new Set())
      setHasRecorded(false)

      // 큐 종료 시점에 일시정지되면 녹음을 정리하고 완료 표시한다.
      const handlePause = () => {
        stopRecording({ markRecorded: true })
      }
      video.addEventListener('pause', handlePause)
      pauseListenerRef.current = handlePause

      // 오디오 캡처 세션 시작 (SpeechRecognition 과 병행)
      recordingSessionIdRef.current += 1
      const sessionId = recordingSessionIdRef.current
      audioChunksRef.current = []

      const SpeechRecognitionClassRef = getSpeechRecognitionClass()

      const startSpeechRecognition = () => {
        if (!SpeechRecognitionClassRef) {
          console.warn(
            'SpeechRecognition is not supported in this browser. Cue will replay muted without recording.',
          )
          setIsRecording(true)
          return true
        }

        const recognition = new SpeechRecognitionClassRef()
        recognition.lang = 'en-US'
        recognition.interimResults = true
        recognition.continuous = true

        const cueWords = splitCueWords(cue.text)

        recognition.onresult = (event) => {
          const spokenWords = collectSpokenWords(event)
          const nextMatched = matchWords(cueWords, spokenWords)
          setMatchedWordIndexes((prev) => {
            if (prev.size === nextMatched.size) {
              let same = true
              for (const idx of nextMatched) {
                if (!prev.has(idx)) {
                  same = false
                  break
                }
              }
              if (same) return prev
            }
            return nextMatched
          })
        }

        recognition.onerror = (event) => {
          // "no-speech" 는 정상적으로 발생할 수 있어 warn 으로만 남긴다.
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            console.error('SpeechRecognition error:', event.error)
          }
        }

        recognition.onend = () => {
          // 비디오가 아직 재생 중이면 자동 종료된 경우가 있어 그대로 두되,
          // 참조만 정리한다. 실제 종료는 pause 이벤트로 한다.
          if (recognitionRef.current === recognition) {
            recognitionRef.current = null
          }
        }

        try {
          recognition.start()
          recognitionRef.current = recognition
          setIsRecording(true)
          return true
        } catch (error) {
          console.error('Failed to start SpeechRecognition:', error)
          stopRecording()
          return false
        }
      }

      const startVideoPlayback = () => {
        if (recordingSessionIdRef.current !== sessionId) return
        if (!startSpeechRecognition()) return

        // MediaRecorder 와 음성 인식이 준비된 뒤 큐 처음부터 재생한다.
        video.muted = true
        video.currentTime = cue.start
        video.play().catch((error: unknown) => {
          console.error('Cue replay failed:', error)
        })
      }

      if (
        typeof navigator !== 'undefined' &&
        navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== 'undefined'
      ) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            // 요청 이후 세션이 교체되었으면 stream 정리 후 종료
            if (recordingSessionIdRef.current !== sessionId) {
              stream.getTracks().forEach((track) => track.stop())
              return
            }
            mediaStreamRef.current = stream
            const recorder = new MediaRecorder(stream)
            recorder.ondataavailable = (event) => {
              if (event.data && event.data.size > 0) {
                audioChunksRef.current.push(event.data)
              }
            }
            recorder.onstop = () => {
              const chunks = audioChunksRef.current
              audioChunksRef.current = []
              stream.getTracks().forEach((track) => track.stop())
              if (mediaStreamRef.current === stream) {
                mediaStreamRef.current = null
              }
              if (chunks.length === 0) return
              const blob = new Blob(chunks, {
                type: recorder.mimeType || 'audio/webm',
              })
              if (blob.size === 0) return
              const url = URL.createObjectURL(blob)
              setRecordedAudioUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return url
              })
              // audio blob 이 확정된 시점에 외부로 notify (다운로드용 보관 등)
              const cueAtStop = activeCueRef.current
              if (cueAtStop && onRecordedAudioAvailableRef.current) {
                onRecordedAudioAvailableRef.current({
                  cue: cueAtStop,
                  audioBlob: blob,
                })
              }
            }
            mediaRecorderRef.current = recorder
            try {
              recorder.start()
              startVideoPlayback()
            } catch (error) {
              console.error('Failed to start MediaRecorder:', error)
              stream.getTracks().forEach((track) => track.stop())
              if (mediaStreamRef.current === stream) {
                mediaStreamRef.current = null
              }
              stopRecording()
            }
          })
          .catch((err: unknown) => {
            console.warn('Microphone access failed:', err)
            stopRecording()
          })
        return
      }

      startVideoPlayback()
    },
    [enabled, stopPlayback, stopRecording, videoRef],
  )

  // 언마운트 시 정리
  useEffect(() => {
    const videoElement = videoRef.current
    return () => {
      recordingSessionIdRef.current += 1
      const recognition = recognitionRef.current
      if (recognition) {
        try {
          recognition.abort()
        } catch {
          // noop
        }
        recognitionRef.current = null
      }
      const recorder = mediaRecorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        try {
          recorder.stop()
        } catch {
          // noop
        }
      }
      mediaRecorderRef.current = null
      const stream = mediaStreamRef.current
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }
      const audio = playbackAudioRef.current
      if (audio) {
        try {
          audio.pause()
        } catch {
          // noop
        }
        audio.src = ''
        playbackAudioRef.current = null
      }
      if (videoElement) {
        if (pauseListenerRef.current) {
          videoElement.removeEventListener('pause', pauseListenerRef.current)
          pauseListenerRef.current = null
        }
        if (playbackPauseListenerRef.current) {
          videoElement.removeEventListener(
            'pause',
            playbackPauseListenerRef.current,
          )
          playbackPauseListenerRef.current = null
        }
        videoElement.muted = false
      }
    }
  }, [videoRef])

  // 녹음 오디오 URL 은 컴포넌트 언마운트 시 revoke
  useEffect(() => {
    return () => {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl)
      }
    }
  }, [recordedAudioUrl])

  // 비활성화되면 진행 중인 녹음/재생을 정리
  useEffect(() => {
    if (!enabled) {
      if (recognitionRef.current || mediaRecorderRef.current) {
        stopRecording()
      }
      if (playbackAudioRef.current) {
        stopPlayback()
      }
    }
  }, [enabled, stopPlayback, stopRecording])

  return {
    isRecording,
    hasRecorded,
    isPlayingRecording,
    matchedWordIndexes,
    recordedAudioUrl,
    startRecording,
    playRecording,
  }
}

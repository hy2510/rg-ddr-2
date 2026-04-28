import type { CaptionCue } from '@components/dubbing/caption/captionTimeline'

export type MergeCueSegment = {
  cue: CaptionCue
  // 없으면 해당 큐 구간은 원본 오디오가 그대로 유지된다.
  audioBlob?: Blob | null
}

export type MergeMyMovieOptions = {
  videoSrc: string
  // 전체 영상을 한 번 재생하면서, 이 세그먼트들의 [cue.start, cue.end] 구간에서만
  // 원본 오디오를 ducking 하고 녹음된 오디오로 덮어씌운다.
  segments: MergeCueSegment[]
  fps?: number
  fileName?: string
  // true 이면 완료 시 자동으로 파일 다운로드 트리거 (기본 true).
  triggerDownload?: boolean
  // 진행률(0~1)이 갱신될 때마다 호출. message 는 단계 설명.
  onProgress?: (progress: number, message?: string) => void
}

export type MergeMyMovieResult = {
  blob: Blob
  // createObjectURL 결과. 호출자가 더 이상 필요 없을 때 URL.revokeObjectURL 로 해제해야 한다.
  url: string
  mimeType: string
}

export function isMergeMyMovieSupported(): boolean {
  if (typeof window === 'undefined') return false
  if (typeof MediaRecorder === 'undefined') return false
  const AudioCtxCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!AudioCtxCtor) return false
  const canvas = document.createElement('canvas')
  if (typeof canvas.captureStream !== 'function') return false
  return true
}

function pickMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ]
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

function waitForEvent(
  target: HTMLElement,
  event: string,
  timeoutMs?: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const handler = () => {
      target.removeEventListener(event, handler)
      if (timerId != null) window.clearTimeout(timerId)
      resolve()
    }
    let timerId: number | null = null
    if (timeoutMs && timeoutMs > 0) {
      timerId = window.setTimeout(() => {
        target.removeEventListener(event, handler)
        reject(new Error(`${event} timeout`))
      }, timeoutMs)
    }
    target.addEventListener(event, handler)
  })
}

// 원본 영상을 전체 길이로 한 번 재생하면서, 지정된 큐 구간에서는
// 원본 오디오를 ducking(게인 0) 하고 녹음된 오디오로 대체한 합성 영상을 만들어
// 단일 WebM 파일로 다운로드한다.
export async function mergeMyMovieAndDownload(
  options: MergeMyMovieOptions,
): Promise<MergeMyMovieResult> {
  const {
    videoSrc,
    segments,
    fps = 30,
    fileName = 'my-movie.webm',
    triggerDownload = true,
    onProgress,
  } = options

  if (!isMergeMyMovieSupported()) {
    throw new Error('현재 브라우저에서 지원하지 않는 기능입니다.')
  }

  const report = (p: number, msg?: string) => {
    try {
      onProgress?.(Math.max(0, Math.min(1, p)), msg)
    } catch {
      // noop
    }
  }

  report(0, '영상 준비 중')

  // 1. <video> 엘리먼트 준비 (원본 오디오 포함해서 로드)
  const video = document.createElement('video')
  video.src = videoSrc
  video.crossOrigin = 'anonymous'
  video.playsInline = true
  video.preload = 'auto'
  // MediaElementAudioSourceNode 로 라우팅하면 기본 오디오 출력은 자동으로
  // 끊어지므로 muted 는 설정하지 않는다.

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('error', onError)
    }
    const onLoaded = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('영상을 불러오지 못했습니다.'))
    }
    video.addEventListener('loadedmetadata', onLoaded)
    video.addEventListener('error', onError)
  })

  const width = video.videoWidth || 1280
  const height = video.videoHeight || 720
  const totalDuration = Number.isFinite(video.duration) ? video.duration : 0
  if (totalDuration <= 0) {
    throw new Error('영상 길이를 확인할 수 없습니다.')
  }

  // 2. 캔버스 준비 + video 스트림
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('캔버스 컨텍스트를 생성할 수 없습니다.')
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)

  const videoStream = canvas.captureStream(fps)

  // 3. 오디오 그래프 구성
  const AudioCtxCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  const audioCtx = new AudioCtxCtor()
  if (audioCtx.state === 'suspended') {
    try {
      await audioCtx.resume()
    } catch {
      // noop
    }
  }
  const destination = audioCtx.createMediaStreamDestination()
  const videoSource = audioCtx.createMediaElementSource(video)
  const videoGain = audioCtx.createGain()
  videoSource.connect(videoGain)
  videoGain.connect(destination)
  videoGain.gain.value = 1

  // 큐별 녹음 오디오 디코딩 (재생 전에 모두 준비)
  const validSegments = segments.filter((s) => s.cue.end > s.cue.start)
  const decoded: Array<{
    cue: CaptionCue
    buffer: AudioBuffer | null
  }> = []
  for (let i = 0; i < validSegments.length; i += 1) {
    const seg = validSegments[i]
    let buffer: AudioBuffer | null = null
    if (seg.audioBlob && seg.audioBlob.size > 0) {
      try {
        const arrayBuffer = await seg.audioBlob.arrayBuffer()
        buffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0))
      } catch (err) {
        console.warn('오디오 디코딩 실패 (cue=', seg.cue.start, '):', err)
      }
    }
    decoded.push({ cue: seg.cue, buffer })
    report(0.05 + ((i + 1) / validSegments.length) * 0.1, '녹음 파일 준비 중')
  }

  const combinedStream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...destination.stream.getAudioTracks(),
  ])

  // 4. MediaRecorder 준비
  const mimeType = pickMimeType()
  const recorder = new MediaRecorder(
    combinedStream,
    mimeType ? { mimeType } : undefined,
  )
  const chunks: Blob[] = []
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) chunks.push(event.data)
  }
  const recorderDone = new Promise<void>((resolve, reject) => {
    recorder.onstop = () => resolve()
    recorder.onerror = (e) => reject(new Error(`녹화 중 오류: ${String(e)}`))
  })

  // 5. 캔버스 drawing loop
  let rafId = 0
  let rafActive = true
  const draw = () => {
    if (!rafActive) return
    try {
      ctx.drawImage(video, 0, 0, width, height)
    } catch {
      // 첫 프레임 전엔 그릴 수 없을 수 있음
    }
    rafId = requestAnimationFrame(draw)
  }

  // 진행률 업데이트용 인터벌
  let progressInterval: number | null = null

  try {
    // 6. 재생 + 녹화 시작
    video.currentTime = 0
    // 일부 브라우저에서 seek 후 바로 play 호출 전 seeked 를 기다려야
    // 첫 프레임이 실제로 로드된다.
    await waitForEvent(video, 'seeked', 3000).catch(() => {})

    recorder.start()
    rafId = requestAnimationFrame(draw)

    const playStartAudioTime = audioCtx.currentTime
    await video.play()

    // 7. 큐 구간 스케줄링 (audio context 기반)
    const activeSources: AudioBufferSourceNode[] = []
    for (const d of decoded) {
      const startCtx = playStartAudioTime + d.cue.start
      const endCtx = playStartAudioTime + d.cue.end

      // 원본 비디오 오디오 ducking
      videoGain.gain.setValueAtTime(0, Math.max(startCtx, audioCtx.currentTime))
      videoGain.gain.setValueAtTime(1, Math.max(endCtx, audioCtx.currentTime))

      if (d.buffer) {
        const src = audioCtx.createBufferSource()
        src.buffer = d.buffer
        src.connect(destination)
        try {
          src.start(Math.max(startCtx, audioCtx.currentTime))
          // 녹음이 cue 구간보다 길면 끝에서 자른다.
          src.stop(Math.max(endCtx, audioCtx.currentTime))
        } catch (err) {
          console.warn('audio source 재생 실패:', err)
        }
        activeSources.push(src)
      }
    }

    // 진행률 주기적으로 업데이트
    progressInterval = window.setInterval(() => {
      if (totalDuration > 0) {
        const ratio = Math.min(1, video.currentTime / totalDuration)
        // 디코드 단계 이후부터는 0.15 → 0.95 구간으로 매핑
        report(0.15 + ratio * 0.8, '합성 중')
      }
    }, 200)

    // 8. 영상이 끝날 때까지 대기
    await waitForEvent(video, 'ended')

    // 9. 녹화 종료
    rafActive = false
    cancelAnimationFrame(rafId)
    if (progressInterval != null) {
      window.clearInterval(progressInterval)
      progressInterval = null
    }
    activeSources.forEach((s) => {
      try {
        s.disconnect()
      } catch {
        // noop
      }
    })

    report(0.96, '파일 생성 중')

    if (recorder.state !== 'inactive') recorder.stop()
    await recorderDone

    try {
      await audioCtx.close()
    } catch {
      // noop
    }

    const finalType = recorder.mimeType || mimeType || 'video/webm'
    const finalBlob = new Blob(chunks, { type: finalType })
    const url = URL.createObjectURL(finalBlob)

    if (triggerDownload) {
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      // URL 은 재생 용도로도 쓰이므로 caller 가 관리한다 (여기서 revoke 하지 않음).
    }

    report(1, '완료')
    return { blob: finalBlob, url, mimeType: finalType }
  } finally {
    rafActive = false
    cancelAnimationFrame(rafId)
    if (progressInterval != null) {
      window.clearInterval(progressInterval)
    }
    try {
      if (recorder.state !== 'inactive') recorder.stop()
    } catch {
      // noop
    }
    try {
      video.pause()
    } catch {
      // noop
    }
    video.removeAttribute('src')
    try {
      video.load()
    } catch {
      // noop
    }
    if (audioCtx.state !== 'closed') {
      try {
        await audioCtx.close()
      } catch {
        // noop
      }
    }
  }
}

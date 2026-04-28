import {
  type Ref,
  type RefObject,
  useCallback,
  useEffect,
  useState,
} from 'react'

import styled from 'styled-components'

import {
  glossyVideoCenterIconStyles,
  VideoPlayIcon,
} from '@components/common/Icons'
import { PauseBarsIcon } from '@components/common/MyMoviePlayerIcons'

type MyMoviePlayerProps = {
  src: string
  videoRef: RefObject<HTMLVideoElement | null>
}

function formatClock(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const s = Math.floor(sec % 60)
  const m = Math.floor(sec / 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function MyMoviePlayer({ src, videoRef }: MyMoviePlayerProps) {
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [paused, setPaused] = useState(true)
  const [ended, setEnded] = useState(false)

  const syncFromVideo = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    setCurrentTime(v.currentTime)
    setDuration(Number.isFinite(v.duration) ? v.duration : 0)
    setPaused(v.paused)
    setEnded(v.ended)
  }, [videoRef])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    const onTime = () => {
      setCurrentTime(v.currentTime)
      setEnded(v.ended)
    }
    const onPlay = () => {
      setPaused(false)
      setEnded(false)
    }
    const onPause = () => setPaused(true)
    const onEnded = () => {
      setEnded(true)
      setPaused(true)
    }
    const onMeta = () => {
      setDuration(Number.isFinite(v.duration) ? v.duration : 0)
    }

    v.addEventListener('timeupdate', onTime)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('ended', onEnded)
    v.addEventListener('loadedmetadata', onMeta)

    syncFromVideo()

    return () => {
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('ended', onEnded)
      v.removeEventListener('loadedmetadata', onMeta)
    }
  }, [src, videoRef, syncFromVideo])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    void v.play().catch(() => {})
  }, [src, videoRef])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.ended) {
      v.currentTime = 0
      setEnded(false)
    }
    if (v.paused) {
      void v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [videoRef])

  const onSeek = useCallback(
    (t: number) => {
      const v = videoRef.current
      if (!v || !Number.isFinite(t)) return
      v.currentTime = Math.min(Math.max(0, t), v.duration || Infinity)
      setCurrentTime(v.currentTime)
    },
    [videoRef],
  )

  const showCenterPlay = paused

  return (
    <Shell className='my-movie-player-root'>
      <video
        ref={videoRef as Ref<HTMLVideoElement>}
        src={src}
        playsInline
        preload='metadata'
        onClick={(e) => {
          e.stopPropagation()
          togglePlay()
        }}
      />
      {showCenterPlay && (
        <CenterPlay
          type='button'
          aria-label={ended ? '처음부터 재생' : '재생'}
          onClick={(e) => {
            e.stopPropagation()
            togglePlay()
          }}
        >
          <VideoPlayIcon size={96} />
        </CenterPlay>
      )}
      <Controls
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <IconButton
          type='button'
          aria-label={paused ? '재생' : '일시정지'}
          onClick={togglePlay}
        >
          {paused ? <VideoPlayIcon size={28} /> : <PauseBarsIcon size={28} />}
        </IconButton>
        <Seek
          type='range'
          aria-label='재생 위치'
          min={0}
          max={duration > 0 ? duration : 0}
          step={0.05}
          value={Math.min(currentTime, duration || 0)}
          disabled={!duration}
          onChange={(e) => onSeek(Number(e.target.value))}
        />
        <TimeText aria-hidden>
          {formatClock(currentTime)} / {formatClock(duration)}
        </TimeText>
      </Controls>
    </Shell>
  )
}

const Shell = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: #000;

  video {
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
    cursor: pointer;
  }
`

const CenterPlay = styled.button`
  ${glossyVideoCenterIconStyles}
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  padding: 0;
  margin: 0;
  border: none;
  cursor: pointer;
  box-sizing: border-box;
  transition:
    filter 0.15s ease,
    transform 0.15s ease;

  &:hover {
    filter: brightness(1.12);
  }

  &:active {
    filter: brightness(0.92);
    transform: translate(-50%, -50%) scale(0.98);
  }
`

const Controls = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 4;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  padding: 40px 30px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(0, 0, 0, 0.55) 40%,
    rgba(0, 0, 0, 0.82) 100%
  );
`

const IconButton = styled.button`
  cursor: pointer;
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border: none;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.12);
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.22);
  }
`

const TimeText = styled.span`
  flex-shrink: 0;
  min-width: 60px;
  font-size: 0.95rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.92);
`

const seekTrack = `
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
  outline: none;
  cursor: pointer;
`

const seekThumb = `
  -webkit-appearance: none;
  appearance: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #35a900;
  box-shadow: 0 0 0 2px #ffffff;
  cursor: pointer;
`

const Seek = styled.input`
  flex: 1 1 160px;
  min-width: 80px;
  ${seekTrack}

  &::-webkit-slider-thumb {
    ${seekThumb}
  }
  &::-moz-range-thumb {
    ${seekThumb}
  }
  &::-moz-range-track {
    height: 6px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.25);
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

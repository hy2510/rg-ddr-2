import type { Ref, RefObject } from 'react'
import styled, { keyframes } from 'styled-components'

import {
  NextDubbingButton,
  VideoPauseButton,
  VideoRestartButton,
} from '@components/common/Buttons'
import type { CaptionCue } from '@components/dubbing/caption/captionTimeline'

type VideoLayoutProps = {
  videoRef: RefObject<HTMLVideoElement | null>
  src: string
  onClickRestart?: () => void
  onClickNext?: () => void
  isPaused?: boolean
  isVideoEnded?: boolean
  isLoading?: boolean
  activeCue?: CaptionCue | null
}

export function WatchVideoLayout({
  videoRef,
  src,
  onClickRestart,
  onClickNext,
  isPaused = false,
  isVideoEnded = false,
  isLoading = false,
  // activeCue = null,
}: VideoLayoutProps) {
  return (
    <StyledWatchVideo
      onClick={isVideoEnded ? undefined : onClickRestart}
      $isVideoEnded={isVideoEnded}
    >
      <StyledVideo
        ref={videoRef as Ref<HTMLVideoElement>}
        src={src}
        playsInline
        crossOrigin='anonymous'
        muted={false}
      />
      {isLoading && !isVideoEnded && (
        <StyledLoadingOverlay aria-live='polite'>
          <div className='loading-spinner' aria-hidden='true' />
          <div className='loading-text'>Loading...</div>
        </StyledLoadingOverlay>
      )}
      {isVideoEnded ? (
        <div className='next-container'>
          <VideoRestartButton aria-hidden='true' onClick={onClickRestart} />
          <NextDubbingButton aria-hidden='true' onClick={onClickNext} />
        </div>
      ) : (
        !isLoading &&
        isPaused && (
          <VideoPauseButton aria-hidden='true' onClick={onClickRestart} />
        )
      )}
      {/* <CueWaveform src={src} cue={activeCue} /> */}
    </StyledWatchVideo>
  )
}

const StyledWatchVideo = styled.div<{ $isVideoEnded: boolean }>`
  position: relative;
  width: 1280px;
  height: 720px;
  margin: auto;
  cursor: ${({ $isVideoEnded }) => ($isVideoEnded ? 'default' : 'pointer')};

  .next-container {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 50px;
    -webkit-backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
    transition: all 0.3s ease;
  }
`

const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
`

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`

const StyledLoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.4);
  pointer-events: none;

  .loading-spinner {
    width: 56px;
    height: 56px;
    border: 5px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: ${spin} 0.9s linear infinite;
  }

  .loading-text {
    font-size: 1.5em;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
`

type DubbingVideoLayoutProps = {
  videoRef: RefObject<HTMLVideoElement | null>
  src: string
  // activeCue?: CaptionCue | null;
}
export function DubbingVideoLayout({
  videoRef,
  src,
  // activeCue = null,
}: DubbingVideoLayoutProps) {
  return (
    <StyledDubbingVideo>
      <StyledVideo
        ref={videoRef as Ref<HTMLVideoElement>}
        src={src}
        playsInline
        crossOrigin='anonymous'
        muted={false}
      />
      {/* <CueWaveform src={src} cue={activeCue} /> */}
    </StyledDubbingVideo>
  )
}

const StyledDubbingVideo = styled.div`
  position: relative;
  width: 1280px;
  height: 720px;
  margin: auto;
`

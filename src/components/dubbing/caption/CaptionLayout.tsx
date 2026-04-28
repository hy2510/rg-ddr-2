import styled, { css, keyframes } from 'styled-components'

import { SquareButton } from '@components/common/Buttons'
import type { CaptionCharacterImage } from '@components/dubbing/caption/captionTimeline'
import { splitCueWords } from '@hooks/useCueRecording'
import {
  iconArrowLeft,
  iconArrowRight,
  iconMic,
  iconPlay,
} from '@utils/Assets'

/** 시청·더빙 공통: 캡션 바 위치·크기 (display 는 단계별로 다름) */
const captionBarShell = css`
  width: calc(100% - 86px);
  min-height: 120px;
  border-radius: 40px;
  padding: 0 30px;
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
  z-index: 1;
`

/** watch-video: 좌 화살표 | 인덱스 | 우 화살표 그리드 */
const watchCaptionBarGrid = css`
  background: rgba(0, 0, 0, 0.75);
  display: grid;
  grid-template-columns: 1fr 60px 60px 60px;
  align-items: center;

  .caption-index {
    color: #fff;
    font-size: 1.5em;
    font-weight: 600;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
`

const captionTextStyle = css`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;

  .caption-characters {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .caption-character {
    display: block;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
  }

  .caption-text {
    width: 100%;
    color: #fff;
    font-size: 2.5em;
    font-weight: 600;
    line-height: 1;
    text-align: left;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .caption-word {
    display: inline-block;
    position: relative;
    color: #fff;
    transition:
      color 60ms linear,
      text-shadow 60ms linear;
  }

  .caption-word.is-matched {
    color: #ffd54a;
  }
`

const CHARACTER_IMAGE_BASE_URL =
  'https://wcfresource.a1edu.com/newsystem/ddr/character'

type CaptionLayoutProps = {
  caption: string
  characterImage?: CaptionCharacterImage | null
  captionIndex?: number | null
  captionTotal?: number
  onSkipBack?: () => void
  onNext?: () => void
  isNextDisabled?: boolean
}

export function CaptionLayout({
  caption,
  characterImage,
  captionIndex = null,
  captionTotal = 0,
  onSkipBack,
  onNext,
  isNextDisabled = false,
}: CaptionLayoutProps) {
  const characterImageFiles = [
    characterImage?.image1,
    characterImage?.image2,
    characterImage?.image3,
    characterImage?.image4,
  ].filter((fileName): fileName is string => Boolean(fileName))

  return (
    <StyledCaption>
      <StyledCaptionText>
        {characterImageFiles.length > 0 && (
          <div className='caption-characters'>
            {characterImageFiles.map((fileName) => (
              <img
                key={fileName}
                className='caption-character'
                src={`${CHARACTER_IMAGE_BASE_URL}/${fileName}`}
                alt={fileName}
                width={60}
                height={60}
              />
            ))}
          </div>
        )}
        <div className='caption-text'>{caption}</div>
      </StyledCaptionText>
      <SquareButton
        icon={iconArrowLeft}
        bgColor='transparent'
        onClick={onSkipBack}
      />
      <div className='caption-index'>
        {captionIndex ?? '-'}/{captionTotal}
      </div>
      <SquareButton
        icon={iconArrowRight}
        bgColor='transparent'
        onClick={onNext}
        disabled={isNextDisabled}
      />
    </StyledCaption>
  )
}

const StyledCaption = styled.div`
  ${captionBarShell}
  ${watchCaptionBarGrid}
`

const StyledCaptionText = styled.div`
  ${captionTextStyle}

  .caption-text {
    color: #35a900;
  }
`

type DubbingCaptionLayoutProps = {
  caption: string
  characterImage?: CaptionCharacterImage | null
  onReplayCue?: () => void
  /** 이전 녹음 문장으로 이동 (더빙 스튜디오 좌측 화살표) */
  onPreviousSentence?: () => void
  isPreviousDisabled?: boolean
  onStartRecording?: () => void
  onPlayRecording?: () => void
  onNext?: () => void
  onFinishDubbing?: () => void
  isNextDisabled?: boolean
  isMicDisabled?: boolean
  isRecording?: boolean
  isCompleted?: boolean
  isLastCue?: boolean
  showPlayRecording?: boolean
  showNext?: boolean
  matchedWordIndexes?: Set<number>
}

export function DubbingCaptionLayout({
  caption,
  characterImage,
  onReplayCue,
  onPreviousSentence,
  isPreviousDisabled = false,
  onStartRecording,
  onPlayRecording,
  onNext,
  onFinishDubbing,
  isNextDisabled = false,
  isMicDisabled = false,
  isRecording = false,
  isCompleted = false,
  isLastCue = false,
  showPlayRecording = false,
  showNext = false,
  matchedWordIndexes,
}: DubbingCaptionLayoutProps) {
  const characterImageFiles = [
    characterImage?.image1,
    characterImage?.image2,
    characterImage?.image3,
    characterImage?.image4,
  ].filter((fileName): fileName is string => Boolean(fileName))

  const captionWords = splitCueWords(caption)

  // 완료 상태에서 매칭 비율이 50% 이하이면 실패 상태로 간주
  const matchedCount = matchedWordIndexes?.size ?? 0
  const matchRatio =
    captionWords.length > 0 ? matchedCount / captionWords.length : 0
  const isFailed =
    matchedWordIndexes != null &&
    isCompleted &&
    matchRatio <= 0.5

  return (
    <StyledDubbingCaption
      $isRecording={isRecording}
      $isCompleted={isCompleted}
      $isFailed={isFailed}
    >
      <StyledDubbingCaptionText onClick={onReplayCue}>
        {characterImageFiles.length > 0 && (
          <div className='caption-characters'>
            {characterImageFiles.map((fileName) => (
              <img
                key={fileName}
                className='caption-character'
                src={`${CHARACTER_IMAGE_BASE_URL}/${fileName}`}
                alt={fileName}
                width={60}
                height={60}
              />
            ))}
          </div>
        )}
        <div className='caption-text'>
          {captionWords.map((word, idx) => {
            const isMatched = matchedWordIndexes?.has(idx) ?? false
            return (
              <span
                key={`${word}-${idx}`}
                className={`caption-word${isMatched ? ' is-matched' : ''}`}
              >
                {word}
                {idx < captionWords.length - 1 ? ' ' : ''}
              </span>
            )
          })}
        </div>
      </StyledDubbingCaptionText>
      <div className='dubbing-caption-buttons'>
        {onPreviousSentence && (
          <SquareButton
            icon={iconArrowLeft}
            bgColor='transparent'
            onClick={onPreviousSentence}
            disabled={isPreviousDisabled}
          />
        )}
        <SquareButton
          icon={iconMic}
          bgColor='#EB2337'
          onClick={onStartRecording}
          disabled={isMicDisabled}
        />
        {showPlayRecording && (
          <SquareButton
            icon={iconPlay}
            bgColor='#3c4b62'
            onClick={onPlayRecording}
          />
        )}
        {showNext &&
          (isLastCue ? (
            <SquareButton
              icon={iconArrowRight}
              bgColor='#35A900'
              onClick={onFinishDubbing}
            />
          ) : (
            <SquareButton
              icon={iconArrowRight}
              bgColor='#3c4b62'
              onClick={onNext}
              disabled={isNextDisabled}
            />
          ))}
      </div>
    </StyledDubbingCaption>
  )
}

const recordingPulse = keyframes`
  0% {
    border-color: rgba(235, 35, 55, 0.9);
    box-shadow:
      0 0 0 0 rgba(235, 35, 55, 0.55),
      0 0 0 0 rgba(235, 35, 55, 0.35) inset;
  }
  50% {
    border-color: rgba(255, 90, 110, 1);
    box-shadow:
      0 0 18px 8px rgba(235, 35, 55, 0),
      0 0 12px 2px rgba(235, 35, 55, 0.25) inset;
  }
  100% {
    border-color: rgba(235, 35, 55, 0.9);
    box-shadow:
      0 0 0 0 rgba(235, 35, 55, 0),
      0 0 0 0 rgba(235, 35, 55, 0) inset;
  }
`

const recordingDotBlink = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.35;
    transform: scale(0.8);
  }
`

const StyledDubbingCaption = styled.div<{
  $isRecording?: boolean
  $isCompleted?: boolean
  $isFailed?: boolean
}>`
  ${captionBarShell}
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: nowrap;
  background: ${({ $isCompleted, $isFailed }) => {
    if ($isFailed) return '#FDEAECF2'
    if ($isCompleted) return '#CBFFB0F2'
    return 'rgba(0, 0, 0, 0.75)'
  }};
  transition:
    background-color 220ms ease-out,
    border-color 180ms ease-out;
  border: 3px solid
    ${({ $isRecording }) => ($isRecording ? '#EB2337' : 'transparent')};

  ${({ $isRecording }) =>
    $isRecording &&
    css`
      animation: ${recordingPulse} 1.4s ease-in-out infinite;
    `}

  &::before {
    content: '';
    position: absolute;
    top: 14px;
    left: 20px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ff3b3b;
    opacity: ${({ $isRecording }) => ($isRecording ? 1 : 0)};
    box-shadow: 0 0 10px rgba(255, 59, 59, 0.9);
    animation: ${({ $isRecording }) =>
      $isRecording
        ? css`
            ${recordingDotBlink} 1s ease-in-out infinite
          `
        : 'none'};
    pointer-events: none;
  }

  .dubbing-caption-buttons {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 20px;
  }

  /* 녹음 완료 상태에서는 매칭된 단어를 초록색으로, 기본 텍스트는 어둡게 */
  ${({ $isCompleted, $isFailed }) =>
    $isCompleted &&
    !$isFailed &&
    css`
      && .caption-word {
        color: #3c4b62;
        text-shadow: none;
      }
      && .caption-word.is-matched {
        color: #35a900;
      }
    `}

  /* 실패 상태 (매칭 비율 50% 이하): 미인식 단어는 빨강, 맞춘 단어는 초록 하이라이트 유지 */
  ${({ $isFailed }) =>
    $isFailed &&
    css`
      && .caption-word {
        color: #fe384c;
      }
      && .caption-word.is-matched {
        color: #35a900;
      }
    `}
`

const StyledDubbingCaptionText = styled.div`
  ${captionTextStyle}
  cursor: pointer;
  flex: 1 1 0;
  min-width: 0;
`

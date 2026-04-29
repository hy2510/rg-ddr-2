import styled, { css } from 'styled-components'

import {
  glossyVideoCenterIconStyles,
  VideoPlayIcon,
} from '@components/common/Icons'
import { iconArrowRight, iconFile, iconMic, iconRotate } from '@utils/Assets'

const videoCenterIconStyles = glossyVideoCenterIconStyles

const popupButtonStyles = css`
  cursor: pointer;
  min-width: 120px;
  height: 60px;
  padding: 0 20px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4em;
  font-weight: 600;
`

// 정사각형 버튼
type SquareButtonProps = {
  icon?: string
  onClick?: () => void
  bgColor?: string
  disabled?: boolean
}

export function SquareButton({
  icon,
  onClick,
  bgColor,
  disabled,
}: SquareButtonProps) {
  const handleClick = () => {
    if (disabled) {
      return
    }
    onClick?.()
  }
  return (
    <StyledSquareButton
      onClick={handleClick}
      $bgColor={bgColor ?? 'transparent'}
      $disabled={disabled}
    >
      <img src={icon} alt='icon' className='icon' />
    </StyledSquareButton>
  )
}

const StyledSquareButton = styled.div<{
  $bgColor: string
  $disabled?: boolean
}>`
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  width: 60px;
  height: 60px;
  background-color: ${({ $bgColor }) => $bgColor};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
  filter: ${({ $disabled }) => ($disabled ? 'grayscale(50%)' : 'none')};
  transition:
    opacity 180ms ease,
    filter 180ms ease;
  box-shadow: ${({ $bgColor, $disabled }) => {
    if (!$bgColor || $bgColor === 'transparent' || $disabled) {
      return 'none'
    }
    return `0 4px 0 color-mix(in srgb, ${$bgColor} 60%, #000)`
  }};

  &:active {
    transform: ${({ $disabled }) => ($disabled ? 'none' : 'translateY(4px)')};
    box-shadow: none;
  }

  .icon {
    display: block;
    width: 36px;
    height: 36px;
  }
`

// 직사각형 버튼
type RectangleButtonProps = {
  icon?: string
  onClick?: () => void
  bgColor?: string
  text?: string
  disabled?: boolean
  size?: 'free' | 'large'
}

export function RectangleButton({
  icon,
  onClick,
  bgColor,
  text,
  disabled,
  size = 'large',
}: RectangleButtonProps) {
  const handleClick = () => {
    if (disabled) return
    onClick?.()
  }
  return (
    <StyledRectangleButton
      onClick={handleClick}
      $bgColor={bgColor ?? '#2d2d2d'}
      $disabled={disabled}
      $size={size}
    >
      <div className='button-content'>
        {icon && <img src={icon} alt='icon' className='icon' />}
        {text && <span className='text'>{text}</span>}
      </div>
      <img src={iconArrowRight} alt='arrow right' width={32} height={32} />
    </StyledRectangleButton>
  )
}

const StyledRectangleButton = styled.div<{
  $bgColor: string
  $disabled?: boolean
  $size?: 'free' | 'large'
}>`
  width: ${({ $size }) => ($size === 'large' ? '380px' : 'auto')};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: ${({ $size }) =>
    $size === 'large' ? 'space-between' : 'center'};
  gap: 10px;
  padding: 20px 30px;
  border-radius: 25px;
  background-color: ${({ $bgColor }) => $bgColor ?? '#2d2d2d'};
  box-shadow: ${({ $bgColor }) => {
    const baseColor = $bgColor ?? '#2d2d2d'
    if (baseColor === 'transparent') {
      return 'none'
    }
    return `0 4px 0 color-mix(in srgb, ${baseColor} 60%, #000)`
  }};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  filter: ${({ $disabled }) => ($disabled ? 'grayscale(50%)' : 'none')};
  transform: translateY(0);

  &:active {
    transform: ${({ $disabled }) =>
      $disabled ? 'translateY(0)' : 'translateY(4px)'};
    box-shadow: ${({ $disabled }) => ($disabled ? undefined : 'none')};
  }

  .button-content {
    display: flex;
    align-items: center;
    gap: 20px;

    .icon {
      width: 2em;
      height: 2em;
    }

    .text {
      font-size: 2em;
      font-weight: 600;
    }
  }
`

// 영상 일시정지 시 중앙 오버레이(재생 아이콘 + 글로시 — My Movie 플레이어와 동일)
export function VideoPauseButton({ onClick }: { onClick?: () => void }) {
  return (
    <StyledVideoPauseButton onClick={onClick}>
      <VideoPlayIcon size={96} />
    </StyledVideoPauseButton>
  )
}

const StyledVideoPauseButton = styled.div`
  ${videoCenterIconStyles}
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
`

// 영상 다시시작 버튼
export function VideoRestartButton({ onClick }: { onClick?: () => void }) {
  return (
    <StyledVideoRestartButton onClick={onClick}>
      <img src={iconRotate} alt='' width={64} height={64} />
    </StyledVideoRestartButton>
  )
}

const StyledVideoRestartButton = styled.div`
  ${videoCenterIconStyles}
  background-color: #A2B1C4;
  cursor: pointer;
`

// Next 버튼 (더빙하러가기)
export function NextDubbingButton({ onClick }: { onClick?: () => void }) {
  return (
    <StyledNextDubbingButton onClick={onClick}>
      <img src={iconMic} alt='' width={64} height={64} />
    </StyledNextDubbingButton>
  )
}

const StyledNextDubbingButton = styled.div`
  ${videoCenterIconStyles}
  background-color: #EB2337;
  cursor: pointer;
`

// 팝업 버튼
export function PopupButton({
  onClick,
  text,
  buttonColor,
  disabled,
}: {
  onClick?: () => void
  text: string
  buttonColor: 'gray' | 'green'
  disabled?: boolean
}) {
  const handleClick = () => {
    if (disabled) return
    onClick?.()
  }
  return (
    <StyledPopupButton
      onClick={handleClick}
      $buttonColor={buttonColor}
      $disabled={disabled}
    >
      {text}
    </StyledPopupButton>
  )
}

const StyledPopupButton = styled.div<{
  $buttonColor: 'gray' | 'green'
  $disabled?: boolean
}>`
  ${popupButtonStyles}
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  background-color: ${({ $buttonColor }) =>
    $buttonColor === 'gray' ? '#e9edf3' : '#00cf00'};
  color: ${({ $buttonColor }) =>
    $buttonColor === 'gray' ? '#3c4b62' : '#fff'};
`

// 스코어 다시 보기 버튼
export function SeeScoreBoardButton({ onClick }: { onClick?: () => void }) {
  return (
    <StyledSeeScoreBoardButton onClick={onClick}>
      <img src={iconFile} alt='score board' width={32} height={32} />
    </StyledSeeScoreBoardButton>
  )
}

const StyledSeeScoreBoardButton = styled.div`
  cursor: pointer;
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background-color: rgba(0, 0, 0, 0.15);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);

  img {
    display: block;
    width: 36px;
    height: 36px;
  }
`

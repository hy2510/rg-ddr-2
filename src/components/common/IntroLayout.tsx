import styled, { keyframes } from 'styled-components'

import { RectangleButton } from '@components/common/Buttons'

type IntroLayoutProps = {
  thumbnailImage: string
  onClick: () => void
  buttonText?: string
  buttonIcon?: string
  buttonColor?: string
  buttonDisabled?: boolean
  secondaryButton?: {
    text: string
    onClick: () => void
    icon?: string
    bgColor?: string
    disabled?: boolean
  }
}

export function IntroLayout({
  thumbnailImage,
  onClick,
  buttonText,
  buttonIcon,
  buttonColor,
  buttonDisabled,
  secondaryButton,
}: IntroLayoutProps) {
  return (
    <StyledIntroLayout>
      <StyledIntroContent>
        <img src={thumbnailImage} alt='intro' className='intro-thumbnail' />
        <div className='intro-button-row'>
          <RectangleButton
            icon={buttonIcon}
            onClick={onClick}
            text={buttonText}
            bgColor={buttonColor}
            disabled={buttonDisabled}
          />
          {secondaryButton && (
            <RectangleButton
              icon={secondaryButton.icon}
              onClick={secondaryButton.onClick}
              text={secondaryButton.text}
              bgColor={secondaryButton.bgColor ?? '#35A900'}
              disabled={secondaryButton.disabled}
            />
          )}
        </div>
      </StyledIntroContent>
      <StyledIntroBg thumbnailImage={thumbnailImage} />
    </StyledIntroLayout>
  )
}

const floatThumbnail = keyframes`
  0% {
    transform: translateY(0) rotate(-0.4deg);
  }
  50% {
    transform: translateY(-14px) rotate(0.4deg);
  }
  100% {
    transform: translateY(0) rotate(-0.4deg);
  }
`

const StyledIntroLayout = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`

const StyledIntroContent = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  color: #fff;
  -webkit-backdrop-filter: blur(30px);
  backdrop-filter: blur(30px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  z-index: 2;

  .intro-thumbnail {
    display: block;
    width: 600px;
    height: auto;
    object-fit: cover;
    border: 4px solid #fff;
    border-radius: 30px;
    animation: ${floatThumbnail} 3.6s ease-in-out infinite;
    will-change: transform;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }

  .intro-button-row {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
  }
`

const StyledIntroBg = styled.div<{ thumbnailImage: string }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url(${({ thumbnailImage }) => thumbnailImage});
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 1;
`

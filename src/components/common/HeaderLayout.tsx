import { useState } from 'react'

import styled from 'styled-components'

import { SquareButton } from '@components/common/Buttons'
import PopupLayout from '@components/common/PopupLayout'
import iconDelete from '@src/assets/icons/dubbing/icon_delete.svg'

type HeaderProps = {
  studyTitle: string
  isWatchVideo?: boolean
  /** `dubbing-intro` — 녹음 시작 전 안내 화면 */
  isDubbingIntro?: boolean
  isOnAir?: boolean
  isMyMovie?: boolean
  /** X 클릭 시 부모의 다른 팝업(go-dubbing 등)을 먼저 닫을 때 */
  onDismissSiblingPopups?: () => void
  /** 학습 종료 확인에서 예 선택 시 */
  onConfirmExit: () => void
}

export function HeaderLayout({
  studyTitle,
  isWatchVideo,
  isDubbingIntro,
  isOnAir,
  isMyMovie,
  onDismissSiblingPopups,
  onConfirmExit,
}: HeaderProps) {
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)

  const handleCloseClick = () => {
    onDismissSiblingPopups?.()
    setExitConfirmOpen(true)
  }

  const handleDismissExit = () => setExitConfirmOpen(false)

  const handleConfirmExit = () => {
    setExitConfirmOpen(false)
    onConfirmExit()
  }

  return (
    <>
      <StyledHeader>
        <div className='title-container'>
          {isMyMovie && (
            <>
              <div className='title'>My Movie · {studyTitle}</div>
            </>
          )}
          {isOnAir && (
            <>
              <div className='on-air-icon' />
              <div className='title'>On Air · {studyTitle}</div>
            </>
          )}
          {isDubbingIntro && (
            <>
              <div className='title'>Dubbing · {studyTitle}</div>
            </>
          )}
          {isWatchVideo && (
            <>
              <div className='title'>Watch Video · {studyTitle}</div>
            </>
          )}
        </div>
        <SquareButton icon={iconDelete} onClick={handleCloseClick} />
      </StyledHeader>
      {exitConfirmOpen && (
        <PopupLayout
          contents='목록으로 돌아가시겠습니까?'
          confirm={true}
          okText='예'
          cancelText='아니오'
          onOk={handleConfirmExit}
          onCancel={handleDismissExit}
          onClose={handleDismissExit}
        />
      )}
    </>
  )
}

const StyledHeader = styled.div`
  width: calc(100% - 66px);
  height: 60px;
  display: grid;
  grid-template-columns: 1fr 60px;
  align-items: center;
  position: absolute;
  top: 33px;
  left: 33px;
  right: 33px;
  z-index: 999;

  .title-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;

    .on-air-icon {
      display: block;
      width: 10px;
      height: 10px;
      background-color: #fe384c;
      border-radius: 50%;
      animation: onAirBlink 3s ease-in-out infinite;
    }

    @keyframes onAirBlink {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.1;
      }
    }

    .title {
      width: 100%;
      font-size: 1.5em;
      font-weight: 600;
      color: #fff;
      text-align: left;
    }
  }
`

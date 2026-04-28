import { useRef, useState } from 'react'

import styled from 'styled-components'

import PopupLayout from '@components/common/PopupLayout'
import { useAppContext } from '@contexts/AppContext'
import { useSoundContext } from '@contexts/SoundContext'
import { IResultPostStudy } from '@interfaces/IDubbing'
import { postStudyInfo } from '@services/api'
import { iconCheckYellow, iconCloseRed } from '@utils/Assets'

type ModalSelectModeProps = {
  handleSelectMode: (res: IResultPostStudy) => void
  onClickClose?: () => void
}

/** Watch Video 이후 더빙 모드 선택 — `PopupLayout`과 동일한 흰 카드·버튼 스타일 */
export default function ModalSelectMode({
  handleSelectMode,
  onClickClose,
}: ModalSelectModeProps) {
  const isWorking = useRef(false)
  const { studyInfo, contentInfo } = useAppContext()
  const { audioList, playSound } = useSoundContext()
  const [pressedMode, setPressedMode] = useState<'Solo' | 'Full' | null>(null)

  const handleClose = () => {
    if (isWorking.current) return
    onClickClose?.()
    playSound(audioList.closeTapSound)
  }

  const onClickSelectMode = (mode: 'Solo' | 'Full') => {
    if (isWorking.current) return
    isWorking.current = true
    setPressedMode(mode)
    playSound(audioList.menuTapSound, 0.25, 0.8)

    window.setTimeout(() => {
      postStudyInfo(
        contentInfo.LevelRoundId,
        studyInfo.StudentHistory[studyInfo.StudentHistory.length - 1]
          .StudentHistoryId,
        mode,
      )
        .then((res) => {
          if (res) {
            handleSelectMode(res)
          }
        })
        .finally(() => {
          isWorking.current = false
          setPressedMode(null)
        })
    }, 1000)
  }

  const bookPoint = Number(contentInfo.BookPoint) || 0
  const rgPointSum = Number(contentInfo.RgPointSum) || 0
  const epsilon = 0.001
  const isSoloDone = Math.abs(rgPointSum - bookPoint * 0.5) < epsilon
  const isFullDone = Math.abs(rgPointSum - bookPoint) < epsilon
  const isAllDone = Math.abs(rgPointSum - bookPoint * 1.5) < epsilon
  const soloDone = isSoloDone || isAllDone
  const fullDone = isFullDone || isAllDone

  return (
    <PopupLayout
      confirm
      okText='풀 캐스트 모드'
      cancelText='솔로 모드'
      onOk={() => onClickSelectMode('Full')}
      onCancel={() => onClickSelectMode('Solo')}
      onClose={handleClose}
      contents={
        <StyledBody>
          <p className='title'>어떤 모드로 더빙할까요?</p>
          <ul className='hints'>
            <li className={soloDone ? 'done' : 'pending'}>
              {soloDone ? (
                <img src={iconCheckYellow} alt='' width={22} height={22} />
              ) : (
                <img src={iconCloseRed} alt='' width={22} height={22} />
              )}
              솔로
            </li>
            <li className={fullDone ? 'done' : 'pending'}>
              {fullDone ? (
                <img src={iconCheckYellow} alt='' width={22} height={22} />
              ) : (
                <img src={iconCloseRed} alt='' width={22} height={22} />
              )}
              풀 캐스트
            </li>
          </ul>
          {pressedMode != null && (
            <p className='pending' aria-live='polite'>
              {pressedMode === 'Solo' ? '솔로 모드' : '풀 캐스트 모드'} 적용 중…
            </p>
          )}
        </StyledBody>
      }
    />
  )
}

const StyledBody = styled.div`
  position: relative;
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 8px 12px 0;
  color: #3c4b62;

  .title {
    margin: 0;
    text-align: center;
    font-size: 1.35em;
    font-weight: 700;
    line-height: 1.35;
  }

  .hints {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: center;
    font-size: 0.95em;
    font-weight: 600;
    color: #5a6780;

    li {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    li.pending {
      opacity: 0.7;
    }

  }

  .pending {
    margin: 0;
    font-size: 0.95em;
    font-weight: 600;
    color: #1750da;
  }
`

import { useRef, useState } from 'react'

import styled from 'styled-components'

import PopupLayout from '@components/common/PopupLayout'
import { useAppContext } from '@contexts/AppContext'
import { useSoundContext } from '@contexts/SoundContext'
import { IResultPostStudy } from '@interfaces/IDubbing'
import { postStudyInfo } from '@services/api'
import { imgModeFull, imgModeSingle } from '@utils/Assets'

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

  const modeOptions = [
    {
      mode: 'Solo' as const,
      label: 'Single',
      icon: imgModeSingle,
      description: 'Record lines of\nthe main character!',
    },
    {
      mode: 'Full' as const,
      label: 'Full Cast',
      icon: imgModeFull,
      description: 'Record all lines\nby yourself!',
    },
  ]

  return (
    <PopupLayout
      contents='Choose Dubbing Mode'
      confirm={false}
      hideButtons
      onClose={handleClose}
    >
      <StyledSelectModeContainer>
        <div className='mode-list'>
          {modeOptions.map(({ mode, label, icon, description }) => (
            <button
              key={mode}
              type='button'
              className={`mode-card ${mode.toLowerCase()}`}
              disabled={pressedMode != null}
              onClick={() => onClickSelectMode(mode)}
            >
              <img src={icon} alt='' width={132} height={92} />
              <span>{label}</span>
              <small>{description}</small>
            </button>
          ))}
        </div>
      </StyledSelectModeContainer>
    </PopupLayout>
  )
}

const StyledSelectModeContainer = styled.div`
  width: 520px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  color: #344259;
  font-family: var(--sans);

  .mode-list {
    display: flex;
    justify-content: center;
    gap: 16px;
    width: 100%;
  }

  .mode-card {
    width: 224px;
    height: 224px;
    border: 0;
    border-radius: 36px;
    background: #ffd800;
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.2);
    cursor: pointer;
    color: #fff;
    font-family: var(--sans);
    font-weight: 800;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    position: relative;
    transform: translateY(0);

    &:active:not(:disabled) {
      transform: translateY(4px);
      box-shadow: none;
    }

    &:disabled {
      cursor: default;
      box-shadow: none;
      filter: grayscale(1);
      opacity: 0.75;
    }

    &.solo {
      background: #fe80ce;
      box-shadow: 0 4px 0 color-mix(in srgb, #fe80ce 60%, #000);
    }

    &.full {
      background: #ffd800;
      box-shadow: 0 4px 0 color-mix(in srgb, #ffd800 60%, #000);
    }

    &.solo:disabled,
    &.full:disabled {
      box-shadow: none;
    }

    img {
      width: 132px;
      height: 92px;
      object-fit: contain;
    }

    span {
      font-size: 3em;
      line-height: 1;
      text-shadow: 0 2px 0 rgba(0, 0, 0, 0.12);
    }

    small {
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.1;
      text-align: center;
      white-space: pre-line;
    }
  }
`

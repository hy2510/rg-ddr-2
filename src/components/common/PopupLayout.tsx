import type { ReactNode } from 'react'
import styled from 'styled-components'

import { PopupButton } from '@components/common/Buttons'

type PopupLayoutProps = {
  contents: ReactNode
  confirm: boolean
  /** true 이면 하단 기본 버튼 영역을 렌더하지 않음(contents 안에서 버튼 처리) */
  hideButtons?: boolean
  onClose?: () => void
  onConfirm?: () => void
  onOk?: () => void
  onCancel?: () => void
  okText?: string
  cancelText?: string
  confirmText?: string
}

export default function PopupLayout({
  contents,
  confirm,
  hideButtons = false,
  onConfirm,
  onOk,
  onCancel,
  onClose,
  okText = 'OK',
  cancelText = 'No',
  confirmText = 'Confirm',
}: PopupLayoutProps) {
  return (
    <StyledPopupLayout>
      <div className="popup-container">
        <div className="contents">{contents}</div>
        {!hideButtons && (
          <div className="buttons">
            {confirm ? (
              <>
                <PopupButton
                  onClick={onCancel}
                  text={cancelText}
                  buttonColor="gray"
                />
                <PopupButton onClick={onOk} text={okText} buttonColor="green" />
              </>
            ) : (
              <PopupButton
                onClick={onConfirm}
                text={confirmText}
                buttonColor="green"
              />
            )}
          </div>
        )}
      </div>
      <div className="back-space" onClick={onClose} />
    </StyledPopupLayout>
  )
}

const StyledPopupLayout = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;

  .popup-container {
    min-width: 500px;
    min-height: 400px;
    border-radius: 50px;
    padding: 30px;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 50px;
    position: relative;
    z-index: 1001;

    .contents {
      font-family: var(--sans);
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5em;
      font-weight: 600;
    }

    .buttons {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
    }
  }

  .back-space {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
  }
`

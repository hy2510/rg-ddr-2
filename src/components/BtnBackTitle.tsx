import styled from 'styled-components'

import { useAppContext } from '@contexts/AppContext'
import { RoundedFont } from '@stylesheets/GlobalStyle'
import { imgBtnArrowRight } from '@utils/Assets'

type BtnBackTitleProps = {
  title?: string
  onClick?: () => void
}

export default function BtnBackTitle({ title, onClick }: BtnBackTitleProps) {
  const { studyInfo } = useAppContext()

  return (
    <StyledBtnBackTitle onClick={onClick}>
      <RoundedFont />
      {title}
      {studyInfo.User === 'staff' && ' (T)'}
    </StyledBtnBackTitle>
  )
}

// ========== Styled Components ==========

const StyledBtnBackTitle = styled.div`
  cursor: pointer;
  color: #ffffff;
  font-family: 'Fredoka', sans-serif;
  font-size: 1.4em;
  font-weight: 700;
  width: fit-content;
  min-width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  padding-left: calc(34px + 10px);
  background-image: url(${'"' + imgBtnArrowRight + '"'});
  background-size: auto 100%;
  background-repeat: no-repeat;
  position: absolute;
  top: 40px;
  left: 40px;
  z-index: 3;
`

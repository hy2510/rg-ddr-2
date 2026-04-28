import styled from 'styled-components'

export const WrapperHome = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;

  &.screen-transition {
    background: linear-gradient(180deg, #27179e 0%, #255fec 58.65%);
  }
`

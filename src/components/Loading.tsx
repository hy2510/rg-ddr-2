import styled, { keyframes } from 'styled-components'

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`

export default function Loading() {
  return (
    <StyledLoading>
      <span className='spinner' aria-label='로딩 중' />
    </StyledLoading>
  )
}

const StyledLoading = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1001;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;

  .spinner {
    width: 56px;
    height: 56px;
    border: 4px solid rgba(255, 255, 255, 0.25);
    border-top-color: #fff;
    border-radius: 50%;
    animation: ${spin} 0.75s linear infinite;
  }
`

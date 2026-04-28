import styled from 'styled-components'

export const StyledTabBar = styled.div`
  display: flex;
  gap: 10px;
  position: fixed;
  top: 127px;
  padding: 0 10px;
  z-index: 2;

  .tab-menu-item {
    cursor: pointer;

    img {
      width: 160px;
      height: auto;
      -webkit-user-drag: none;
      user-select: none;
    }
  }
`

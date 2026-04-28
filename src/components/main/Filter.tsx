import styled from 'styled-components'

import { bgFilter } from '@utils/Assets'

export const StyledFilter = styled.div`
  position: fixed;
  top: 132px;
  left: 87%;
  display: inline-block;
  font-family: inherit;
  z-index: 2;
  width: 134px;
  height: 52px;
  background: url(${'"' + bgFilter + '"'}) no-repeat center center;
  background-size: 100% 100%;

  .bg-filter {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .filter-btn {
    background: transparent;
    color: #fff;
    font-weight: bold;
    font-size: 14px;
    text-align: center;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 100%;
    z-index: 2;
    border-radius: 14px;
    border: none;
  }

  .dropdown {
    position: absolute;
    top: 115%;
    left: -25px;
    background: #0d2a6b;
    border-radius: 15px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    min-width: 180px;
    padding: 8px 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .dropdown-item {
    color: #b6d0ff;
    margin: 0 8px;
    padding: 10px 20px;
    font-size: 17px;
    cursor: pointer;
    text-align: center;
    transition:
      background 0.2s,
      color 0.2s;
    border-radius: 8px;

    &:hover,
    &.active {
      background: #3a6be8;
      color: #fff;
    }
  }
`

import styled from 'styled-components'

export const StyledTags = styled.div`
  display: flex;
  gap: 5px;
  padding-left: 20px;
  margin-top: 10px;

  .tag-item {
    cursor: pointer;
    background-color: #618cf5;
    color: #3a71f5;
    border-radius: 999px;
    padding: 8px 16px;

    &.active {
      background-color: #ffffff;
      color: #3b75ff;
    }
  }
`

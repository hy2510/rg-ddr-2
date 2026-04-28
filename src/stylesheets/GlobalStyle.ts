import { createGlobalStyle } from 'styled-components'

/** 커스텀 TTF 에셋이 없을 때는 시스템 고딕 계열로 통일 */
const RoundedFont = createGlobalStyle`
  div {
    margin: 0;
    padding: 0;
    font-family:
      'Apple SD Gothic Neo',
      'Malgun Gothic',
      'Noto Sans KR',
      sans-serif;
  }
`

const TouchTransparent = createGlobalStyle`
  div {
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
  }
`

export { RoundedFont, TouchTransparent }

import { css } from 'styled-components'

import { glossyLine, iconPlay } from '@utils/Assets'

/** Watch / My Movie 등 영상 중앙 오버레이(일시정지 시 재생 유도) 공통 글로시 원 */
// Fast Refresh: 비컴포넌트 export — MyMoviePlayer styled 보간용
export const glossyVideoCenterIconStyles = css`
  width: 128px;
  height: 128px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url(${glossyLine});
  background-size: 12px;
  background-position: left 22px top 22px;
  background-repeat: no-repeat;
`

/** 더빙 캡션 등과 동일한 `play_icon.svg` — MyMoviePlayer·VideoPauseButton 공통 */
export function VideoPlayIcon({ size = 96 }: { size?: number }) {
  return (
    <img
      src={iconPlay}
      alt=''
      width={size}
      height={size}
      draggable={false}
      aria-hidden
      style={{ display: 'block' }}
    />
  )
}

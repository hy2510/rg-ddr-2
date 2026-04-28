import 'animate.css'

import styled from 'styled-components'

import BtnBackTitle from '@components/BtnBackTitle'
import { useSoundContext } from '@contexts/SoundContext'
import { RoundedFont } from '@stylesheets/GlobalStyle'
import {
  imgBtnMute,
  imgBtnNoMute,
  resContentsListHeaderLine,
  resSingDodoAni,
  resWatchDodoAni,
} from '@utils/Assets'

type FrameListHeaderProps = {
  theme?: 'content' | 'movie'
  title?: string
  onClickBack?: () => void
}

export default function FrameListHeader({
  theme,
  title,
  onClickBack,
}: FrameListHeaderProps) {
  const { isBgmMute, toggleBGM } = useSoundContext()

  return (
    <StyledListHeader>
      <RoundedFont />

      <div
        className={`btn-mute ${isBgmMute ? 'on' : ''}`}
        onClick={() => toggleBGM()}
      />

      <BtnBackTitle title={title} onClick={onClickBack} />

      <StyledDodoSing>
        {theme === 'content' ? (
          <object data={resSingDodoAni} type='image/svg+xml' width='100%' />
        ) : (
          <object data={resWatchDodoAni} type='image/svg+xml' width='100%' />
        )}
      </StyledDodoSing>
    </StyledListHeader>
  )
}

const StyledListHeader = styled.div`
  height: 190px;
  position: sticky;
  top: -1px;
  z-index: 1;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background-image: url(${resContentsListHeaderLine});
    background-position: center;
    background-size: contain;
    z-index: 2;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, #27179e 0%, #255fec 58.65%);
    z-index: 0;
  }

  .btn-mute {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 3;
    cursor: pointer;
    width: 55px;
    height: 55px;
    border-radius: 100px;
    border: 3px solid #96e3ed;
    background-color: #002281;
    background-position: center;
    background-size: 24px;
    background-repeat: no-repeat;
    background-image: url(${'"' + imgBtnMute + '"'});

    &.on {
      background-image: url(${'"' + imgBtnNoMute + '"'});
    }
  }
`

const StyledDodoSing = styled.div`
  position: absolute;
  right: 122px;
  bottom: -10px;
  width: 418.74px;
  height: 196.02px;
  background-size: 100%;
  background-repeat: no-repeat;
  z-index: 1;
`

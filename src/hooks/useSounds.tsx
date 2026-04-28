import { useEffect, useRef, useState } from 'react'

import { isIOS } from 'react-device-detect'
import styled from 'styled-components'

import sndBgm from '@assets/sounds/bg-cosmic-giggle-odyssey.mp3'
import sndClose from '@assets/sounds/btn-close.mp3'
import sndMenuTab from '@assets/sounds/btn-menu_tap.mp3'

interface SoundItem {
  ref: React.RefObject<HTMLAudioElement>
  src: string
  loop?: boolean
  preload?: 'auto' | 'metadata' | 'none'
}

export type AudioList = {
  bgMusic: React.RefObject<HTMLAudioElement>
  showUpSound: React.RefObject<HTMLAudioElement>
  launchSound: React.RefObject<HTMLAudioElement>
  hiThereVoice: React.RefObject<HTMLAudioElement>
  menuTapSound: React.RefObject<HTMLAudioElement>
  closeTapSound: React.RefObject<HTMLAudioElement>
  powerDownSound: React.RefObject<HTMLAudioElement>
}

/**
 * 실제 `src/assets/sounds`에 있는 파일만 등록합니다.
 * 목록에 없는 키는 ref만 유지되고 `<audio>`가 붙지 않으므로 `playSound`는 무시됩니다.
 */
export function useSounds() {
  const [isBgmMute, setIsBgmMute] = useState(false)
  const bgMusicRef = useRef<HTMLAudioElement>(null!)
  const showUpSoundRef = useRef<HTMLAudioElement>(null!)
  const launchSoundRef = useRef<HTMLAudioElement>(null!)
  const hiThereVoiceRef = useRef<HTMLAudioElement>(null!)
  const menuTapSoundRef = useRef<HTMLAudioElement>(null!)
  const closeTapSoundRef = useRef<HTMLAudioElement>(null!)
  const powerDownSoundRef = useRef<HTMLAudioElement>(null!)

  const sounds: Record<string, SoundItem> = {
    bgMusic: {
      ref: bgMusicRef,
      src: sndBgm,
      loop: true,
      preload: 'auto',
    },
    menuTapSound: {
      ref: menuTapSoundRef,
      src: sndMenuTab,
      preload: 'auto',
    },
    closeTapSound: {
      ref: closeTapSoundRef,
      src: sndClose,
      preload: 'auto',
    },
  }

  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const audioElements = Object.values(sounds)
      .map((sound) => sound.ref.current)
      .filter((el): el is HTMLAudioElement => el !== null)

    if (audioElements.length === 0) {
      setIsReady(true)
      return
    }

    let loadedCount = 0

    const handlePlayHandler = () => {
      loadedCount++

      if (loadedCount === audioElements.length) {
        setIsReady(true)
      }
    }

    audioElements.forEach((audio) => {
      if (isIOS) {
        audio.addEventListener('loadedmetadata', handlePlayHandler, {
          once: true,
        })
      } else {
        audio.addEventListener('canplaythrough', handlePlayHandler, {
          once: true,
        })
      }

      audio.load()
    })

    return () => {
      audioElements.forEach((audio) => {
        if (isIOS) {
          audio.removeEventListener('loadedmetadata', handlePlayHandler)
        } else {
          audio.removeEventListener('canplaythrough', handlePlayHandler)
        }
      })
    }
  }, [])

  const playSound = (
    ref: React.RefObject<HTMLAudioElement>,
    startTime = 0,
    volume = 1,
  ) => {
    const audio = ref.current

    if (audio) {
      audio.currentTime = startTime
      audio.volume = volume
      audio.play().catch(console.error)
    }
  }

  const pauseSound = (ref: React.RefObject<HTMLAudioElement>) => {
    const audio = ref.current

    if (audio) {
      audio.pause()
    }
  }

  const resumeSound = (ref: React.RefObject<HTMLAudioElement>) => {
    const audio = ref.current

    if (audio) {
      audio.play()
    }
  }

  const stopSound = (ref: React.RefObject<HTMLAudioElement>) => {
    const audio = ref.current

    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }

  const toggleBGM = () => {
    if (isBgmMute) {
      setIsBgmMute(false)
      resumeSound(audioList.bgMusic)
    } else {
      setIsBgmMute(true)
      pauseSound(audioList.bgMusic)
    }
    const audio = bgMusicRef.current

    if (audio) {
      audio.volume = audio.volume > 0 ? 0 : 0.3
    }
  }

  const renderAudioElements = (): JSX.Element[] => {
    return Object.entries(sounds).map(([key, { ref, src, loop, preload }]) => (
      <audio key={key} ref={ref} src={src} loop={loop} preload={preload} />
    ))
  }

  const renderLoadingScreen = () => (
    <StyledLoadingScreen>Loading Sounds...</StyledLoadingScreen>
  )

  const changeBGMMute = (state: boolean) => {
    setIsBgmMute(state)
  }

  const audioList: AudioList = {
    bgMusic: bgMusicRef,
    showUpSound: showUpSoundRef,
    launchSound: launchSoundRef,
    hiThereVoice: hiThereVoiceRef,
    menuTapSound: menuTapSoundRef,
    closeTapSound: closeTapSoundRef,
    powerDownSound: powerDownSoundRef,
  }

  return {
    isReady,
    isBgmMute,
    audioList,
    playSound,
    pauseSound,
    resumeSound,
    stopSound,
    toggleBGM,
    changeBGMMute,
    renderAudioElements,
    renderLoadingScreen,
  }
}

const StyledLoadingScreen = styled.div`
  width: 100vw;
  height: 100vh;
  background: black;
  color: white;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`

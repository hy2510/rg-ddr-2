import { useEffect, useState } from 'react'

import { useSoundContext } from '@contexts/SoundContext'
import DubbingContainer from '@pages/containers/DubbingContainer'
import MainContainer from '@pages/containers/MainContainer'

export type MainView = 'main' | 'dubbing'

export default function WrapperContainer() {
  const { playSound, audioList } = useSoundContext()

  const [mainView, setMainView] = useState<MainView>('main')

  // 뷰 변경 음원 재생
  const initialSound = () => {
    if (mainView === 'main') {
      playSound(audioList.bgMusic, 0, 0.3)
      playSound(audioList.showUpSound)
    }
  }

  // 최초 화면 진입 시
  useEffect(() => {
    initialSound()
  }, [])

  /**
   * 뷰 전환 핸들러
   */
  const changeMainView = (view: MainView) => setMainView(view)

  const renderView = () => {
    if (mainView === 'main') {
      return <MainContainer changeMainView={changeMainView} />
    }

    return <DubbingContainer changeMainView={changeMainView} />
  }

  return renderView()
}

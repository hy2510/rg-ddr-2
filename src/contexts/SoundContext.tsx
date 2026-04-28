import { createContext, ReactNode, useContext } from 'react'

import { useSounds } from '@hooks/useSounds'

export interface ISoundContext extends ReturnType<typeof useSounds> {}

const SoundContext = createContext<ISoundContext | null>(null)

type SoundProviderProps = {
  children: ReactNode
}

export function SoundProvider({ children }: SoundProviderProps) {
  const sound = useSounds()

  return (
    <SoundContext.Provider value={sound}>
      {children}
      {sound.renderAudioElements()}
    </SoundContext.Provider>
  )
}

export function useSoundContext(): ISoundContext {
  const context = useContext(SoundContext)

  if (!context) {
    throw new Error('useSoundContext must be used within a SoundProvider')
  }

  return context
}

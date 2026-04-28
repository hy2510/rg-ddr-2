import 'animate.css'

import React, { useLayoutEffect, useState } from 'react'

type FrameBodyProps = {
  children?: React.ReactNode
  bgImage?: string
  bgColor?: string
  viewStarfield?: boolean
  activeFadeIn?: boolean
}

/** 고정 설계 캔버스 — App 스케일·레이아웃과 동기화 */
export const DUBBING_ROOM_BASE_WIDTH = 1280
export const DUBBING_ROOM_BASE_HEIGHT = 720

function readViewportScale() {
  if (typeof window === 'undefined') return 1
  return Math.min(
    window.innerWidth / DUBBING_ROOM_BASE_WIDTH,
    window.innerHeight / DUBBING_ROOM_BASE_HEIGHT,
  )
}

export default function FrameBody({ children }: FrameBodyProps) {
  const [scale, setScale] = useState(readViewportScale)

  useLayoutEffect(() => {
    const onResize = () => setScale(readViewportScale())
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const scaledW = DUBBING_ROOM_BASE_WIDTH * scale
  const scaledH = DUBBING_ROOM_BASE_HEIGHT * scale

  return (
    <div
      style={{
        width: '100vw',
        height: '100svh',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#000',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: scaledW,
          height: scaledH,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: DUBBING_ROOM_BASE_WIDTH,
            height: DUBBING_ROOM_BASE_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

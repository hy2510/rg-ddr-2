import '@stylesheets/App.scss'

import React, { Suspense, useEffect, useState } from 'react'

import Loading from '@components/Loading'
import AppContextProvider from '@contexts/AppContext'
import { SoundProvider } from '@contexts/SoundContext'
import * as Assets from '@utils/Assets'

const WrapperContainer = React.lazy(
  () => import('@pages/containers/WrapperContainer'),
)

const AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'aac', 'm4a']
const VIDEO_EXTS = ['mp4', 'webm', 'mov']
const FONT_EXTS = ['woff', 'woff2', 'ttf', 'otf', 'eot']

const getExt = (url: string): string =>
  url.split('?')[0].split('.').pop()?.toLowerCase() ?? ''

/**
 * <link rel="preload"> 방식
 *
 * fetch()보다 한 단계 더 깊은 브라우저 preload 캐시에 올라감
 * - img 태그 src
 * - background-image: url()  ← styled-components
 * - SVG
 * 모든 사용 방식에서 캐시 공유되며 디코딩까지 완료된 상태로 유지
 */
const preloadViaLink = (
  url: string,
  as: 'image' | 'font' | 'audio',
): Promise<void> =>
  new Promise((resolve) => {
    // 이미 주입된 link가 있으면 스킵
    const existing = document.querySelector(
      `link[rel="preload"][href="${url}"]`,
    )
    if (existing) {
      resolve()
      return
    }

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = as
    link.href = url

    // 폰트는 crossOrigin 필수
    if (as === 'font') link.crossOrigin = 'anonymous'

    link.onload = () => resolve()
    link.onerror = () => {
      console.warn(`[Preload] link 실패: ${url}`)
      resolve()
    }

    document.head.appendChild(link)
  })

/**
 * 오디오는 Audio 객체로 버퍼링까지 처리
 * link rel="preload" as="audio"는 브라우저 지원이 불안정함
 */
const preloadAudio = (url: string): Promise<void> =>
  new Promise((resolve) => {
    const audio = new Audio()
    audio.preload = 'auto'
    audio.oncanplaythrough = () => resolve()
    audio.onerror = () => {
      console.warn(`[Preload] 오디오 로드 실패: ${url}`)
      resolve()
    }
    audio.src = url
  })

/**
 * 비디오는 metadata만 — 전체 로드는 너무 무거움
 */
const preloadVideo = (url: string): Promise<void> =>
  new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => resolve()
    video.onerror = () => {
      console.warn(`[Preload] 비디오 로드 실패: ${url}`)
      resolve()
    }
    video.src = url
  })

const preloadAllAssets = (): Promise<void> => {
  const urls = Object.values(Assets).filter(
    (v): v is string => typeof v === 'string',
  )

  const promises = urls.map((url) => {
    const ext = getExt(url)

    if (AUDIO_EXTS.includes(ext)) return preloadAudio(url)
    if (VIDEO_EXTS.includes(ext)) return preloadVideo(url)
    if (FONT_EXTS.includes(ext)) return preloadViaLink(url, 'font')

    // 이미지, SVG 모두 as="image"로 통일
    return preloadViaLink(url, 'image')
  })

  return Promise.all(promises).then(() => {})
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      preloadAllAssets(),
      import('@pages/containers/WrapperContainer'),
    ]).finally(() => {
      setIsLoading(false)
    })
  }, [])

  return (
    <AppContextProvider>
      <SoundProvider>
        <Suspense fallback={<Loading />}>
          {isLoading ? <Loading /> : <WrapperContainer />}
        </Suspense>
      </SoundProvider>
    </AppContextProvider>
  )
}

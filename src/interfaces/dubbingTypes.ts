/** 더빙룸 상단 플로우 단계 */
export type DubbingStep =
  | 'watch-video-intro'
  | 'watch-video'
  | 'dubbing-intro'
  | 'dubbing'
  | 'my-movie-intro'
  | 'my-movie'

/** 오버레이 팝업 식별자(null = 닫힘) */
export type DubbingPopupId =
  | 'go-dubbing'
  | 'my-movie-results'
  | 'mic-unavailable'

export type DubbingPopupState = DubbingPopupId | null

/** 큐(문장) 단위 녹음·채점 결과 */
export type CueResult = {
  matched: number
  total: number
  matchedIndexes?: number[]
  audioBlob?: Blob
}

/** My Movie 합성(MediaRecorder 등) 진행 상태 */
export type MyMovieEncodeState =
  | { status: 'idle' }
  | { status: 'downloading'; progress: number; message?: string }
  | { status: 'error'; message: string }

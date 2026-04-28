import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import axios from 'axios'
import styled from 'styled-components'

import { SeeScoreBoardButton } from '@components/common/Buttons'
import { HeaderLayout } from '@components/common/HeaderLayout'
import { IntroLayout } from '@components/common/IntroLayout'
import { MyMoviePlayer } from '@components/common/MyMoviePlayer'
import PopupLayout from '@components/common/PopupLayout'
import type { CaptionCue } from '@components/dubbing/caption/captionTimeline'
import { TotalScore } from '@components/dubbing/TotalScore'
import FrameBody from '@components/FrameBody'
import Loading from '@components/Loading'
import { MY_VIDEO_PATH } from '@constants/constants'
import { useAppContext } from '@contexts/AppContext'
import { useSoundContext } from '@contexts/SoundContext'
import type { CueResult, DubbingStep } from '@interfaces/dubbingTypes'
import type {
  IDetailContent,
  IMyMovieContent,
  IMyMovies,
  IReviewInfo,
} from '@interfaces/IDubbing'
import { IResultPostStudy } from '@interfaces/IDubbing'
import { MainView } from '@pages/containers/WrapperContainer'
import Dubbing from '@pages/Dubbing'
import WatchVideo from '@pages/WatchVideo'
import {
  getContent,
  getMyMovies,
  getReviewVideo,
  postLevelUpdate,
} from '@services/api'
import { iconIntroMyMovie, iconIntroPlay, iconIntroRecord } from '@utils/Assets'
import { getCookie } from '@utils/common'

export type SpeakMode = 'Solo' | 'Full'
export type StudyMode = 'All' | SpeakMode

type DubbingContainerProps = {
  changeMainView: (view: MainView) => void
}

type ArchiveStudyIds = {
  studyId: string
  studentHistoryId: string
}

function studyToArchiveIds(
  study:
    | IMyMovieContent['SoloStudy']
    | IMyMovieContent['FullStudy']
    | undefined,
): ArchiveStudyIds | null {
  if (!study?.StudyId?.trim() || !study?.StudentHistoryId?.trim()) return null
  return { studyId: study.StudyId, studentHistoryId: study.StudentHistoryId }
}

function toWordRatePercent(raw: unknown): number {
  const asNumber = Number(raw)
  if (!Number.isFinite(asNumber)) return 0
  return Math.max(0, Math.min(100, asNumber))
}

function buildScoreSnapshotFromContent(content: IDetailContent): {
  captionTimeline: CaptionCue[]
  cueResults: Record<number, CueResult>
} {
  const isSolo = content.StudyMode?.toLowerCase() === 'solo'
  const records = content.Record.filter((item) => (isSolo ? item.Lead : true))
  const fallbackRate = toWordRatePercent(content.ScoreOverall)

  const captionTimeline = records.map((item, idx) => ({
    start: idx,
    end: idx + 1,
    text: item.Sentence,
    studyType: item.Lead ? ('single' as const) : ('full' as const),
  }))

  const cueResults = captionTimeline.reduce<Record<number, CueResult>>(
    (acc, cue, idx) => {
      const words = cue.text.trim().split(/\s+/).filter(Boolean)
      const record = records[idx] as unknown as Record<string, unknown>
      const perSentenceRate = toWordRatePercent(
        record.ScoreOverall ??
          record.scoreOverall ??
          record.Score ??
          record.score,
      )
      const rate = perSentenceRate > 0 ? perSentenceRate : fallbackRate
      const matched = Math.round((words.length * rate) / 100)
      acc[cue.start] = {
        matched,
        total: words.length,
        matchedIndexes: Array.from({ length: matched }, (_, i) => i),
      }
      return acc
    },
    {},
  )

  return { captionTimeline, cueResults }
}

function createReviewInfo(params: {
  studyId: string
  studentHistoryId: string
  levelRoundId: string
  levelName: string
  studyMode: string
}): IReviewInfo {
  return {
    studyId: params.studyId,
    studentHistoryId: params.studentHistoryId,
    levelRoundId: params.levelRoundId,
    levelName: params.levelName,
    studyMode: params.studyMode,
    dubDate: '',
  }
}

export default function DubbingContainer({
  changeMainView,
}: DubbingContainerProps) {
  const {
    studyInfo,
    contentInfo,
    detailContentInfo,
    changeDetailContentInfo,
    setStudyInfo,
  } = useAppContext()
  const { isBgmMute, audioList, resumeSound } = useSoundContext()
  const [myMovieUrl, setMyMovieUrl] = useState('')
  const [isMyMovieLoading, setIsMyMovieLoading] = useState(false)
  const [showMyMovieScore, setShowMyMovieScore] = useState(false)
  const [myMovieScoreSnapshot, setMyMovieScoreSnapshot] = useState<{
    captionTimeline: CaptionCue[]
    cueResults: Record<number, CueResult>
  } | null>(null)
  const myMovieVideoRef = useRef<HTMLVideoElement | null>(null)

  const [step, setStep] = useState<DubbingStep>('watch-video-intro')
  const [isArchiveModeSelectionIntro, setIsArchiveModeSelectionIntro] =
    useState(false)
  const [introArchiveMyMovie, setIntroArchiveMyMovie] = useState<{
    solo: ArchiveStudyIds | null
    full: ArchiveStudyIds | null
  }>({ solo: null, full: null })

  const introThumbnail = useMemo(
    () => detailContentInfo?.StudyImagePath || contentInfo.StudyImagePath || '',
    [detailContentInfo?.StudyImagePath, contentInfo.StudyImagePath],
  )

  const loadMyMovieFromReviewInfo = useCallback(
    async (reviewInfo: IReviewInfo) => {
      const levelName = reviewInfo.levelName.includes('-')
        ? reviewInfo.levelName.split('-')[1]
        : reviewInfo.levelName

      const [archiveContent, reviewVideoUrl] = await Promise.all([
        getContent(
          reviewInfo.levelRoundId,
          reviewInfo.studyId,
          reviewInfo.studyMode,
        ),
        getReviewVideo(
          reviewInfo.studyId,
          reviewInfo.studentHistoryId,
          reviewInfo.levelRoundId,
          levelName,
          reviewInfo.studyMode,
        ),
      ])
      return { archiveContent, reviewVideoUrl }
    },
    [],
  )

  useEffect(() => {
    if (!contentInfo) return

    setIntroArchiveMyMovie({ solo: null, full: null })

    const levelRoundId = contentInfo.LevelRoundId
    const levelKey = contentInfo.LevelName.split('-')[1]

    const myMoviesPromise = getMyMovies(levelKey).then(
      (res) =>
        res?.Contents?.filter(
          (c) => c.TopicTitle === contentInfo.TopicTitle,
        )[0],
    )

    Promise.all([getContent(levelRoundId), myMoviesPromise])
      .then(([res, myMovies]) => {
        if (res) {
          changeDetailContentInfo(res)
          setIsArchiveModeSelectionIntro(false)
          setStep('watch-video-intro')
        } else {
          setIntroArchiveMyMovie({ solo: null, full: null })
        }

        setIntroArchiveMyMovie({
          solo: studyToArchiveIds(myMovies?.SoloStudy),
          full: studyToArchiveIds(myMovies?.FullStudy),
        })
      })
      .catch((error) => {
        console.error('Failed to load content:', error)
        setIntroArchiveMyMovie({ solo: null, full: null })
      })
  }, [contentInfo?.LevelRoundId, contentInfo.LevelName])

  const handleBackToMain = useCallback(() => {
    if (!isBgmMute) resumeSound(audioList.bgMusic)
    changeMainView('main')
  }, [isBgmMute, audioList.bgMusic, resumeSound, changeMainView])

  const handleSelectMode = (res: IResultPostStudy) => {
    const { StudyId, StudentHistoryId, StudyMode } = res

    postLevelUpdate(contentInfo.LevelName.split('-')[1])

    setStudyInfo({
      ...studyInfo,
      DubbingRoomLevel: contentInfo.LevelName.split('-')[1],
    })

    changeDetailContentInfo({
      ...detailContentInfo,
      StudyId,
      StudentHistoryId,
      StudyMode,
    })

    setIsArchiveModeSelectionIntro(false)
    setStep('dubbing-intro')
  }

  const handleOpenArchiveModePicker = useCallback(() => {
    if (!introArchiveMyMovie.solo && !introArchiveMyMovie.full) return
    setIsArchiveModeSelectionIntro(true)
    setStep('my-movie-intro')
  }, [introArchiveMyMovie.full, introArchiveMyMovie.solo])

  const handleGoToMyMovieFromWatchVideoIntro = useCallback(
    async (mode: SpeakMode) => {
      const solo = introArchiveMyMovie.solo
      const full = introArchiveMyMovie.full

      let studyId = ''
      let studentHistoryId = ''
      let studyMode: SpeakMode = 'Full'

      if (mode === 'Solo' && solo) {
        studyId = solo.studyId
        studentHistoryId = solo.studentHistoryId
        studyMode = 'Solo'
      } else if (mode === 'Full' && full) {
        studyId = full.studyId
        studentHistoryId = full.studentHistoryId
        studyMode = 'Full'
      } else {
        return
      }

      changeDetailContentInfo({
        StudyId: studyId,
        StudentHistoryId: studentHistoryId,
        StudyMode: studyMode,
      })

      const reviewInfo = createReviewInfo({
        studyId,
        studentHistoryId,
        levelRoundId: contentInfo.LevelRoundId,
        levelName: contentInfo.LevelName,
        studyMode,
      })

      setMyMovieScoreSnapshot(null)
      setShowMyMovieScore(false)
      setIsArchiveModeSelectionIntro(false)
      setIsMyMovieLoading(true)
      try {
        const { archiveContent, reviewVideoUrl } =
          await loadMyMovieFromReviewInfo(reviewInfo)
        if (archiveContent) {
          setMyMovieScoreSnapshot(buildScoreSnapshotFromContent(archiveContent))
        } else {
          setMyMovieScoreSnapshot(null)
        }
        setMyMovieUrl(reviewVideoUrl ?? '')
        setStep('my-movie')
      } catch (error) {
        console.error('Failed to load my movie video:', error)
        setMyMovieScoreSnapshot(null)
        setMyMovieUrl('')
        setStep('my-movie')
      } finally {
        setIsMyMovieLoading(false)
      }
    },
    [
      contentInfo.LevelRoundId,
      contentInfo.LevelName,
      introArchiveMyMovie,
      changeDetailContentInfo,
      loadMyMovieFromReviewInfo,
    ],
  )

  const handleCompleteMyMovie = useCallback(
    async (payload: {
      captionTimeline: CaptionCue[]
      cueResults: Record<number, CueResult>
    }) => {
      const reviewInfo = createReviewInfo({
        studyId: detailContentInfo.StudyId,
        studentHistoryId: detailContentInfo.StudentHistoryId,
        levelRoundId: detailContentInfo.LevelRoundId,
        levelName: contentInfo.LevelName,
        studyMode: detailContentInfo.StudyMode,
      })
      setMyMovieScoreSnapshot(payload)
      setIsMyMovieLoading(true)
      try {
        const { reviewVideoUrl } = await loadMyMovieFromReviewInfo(reviewInfo)
        setMyMovieUrl(reviewVideoUrl ?? '')
        setStep('my-movie')
      } catch (error) {
        console.error('Failed to load my movie video:', error)
        setMyMovieUrl('')
        setStep('my-movie')
      } finally {
        setIsMyMovieLoading(false)
      }
    },
    [
      contentInfo.LevelName,
      detailContentInfo.LevelRoundId,
      detailContentInfo.StudentHistoryId,
      detailContentInfo.StudyId,
      detailContentInfo.StudyMode,
      loadMyMovieFromReviewInfo,
    ],
  )

  const handleHeaderConfirmExit = useCallback(() => {
    handleBackToMain()
  }, [handleBackToMain])

  const studyTitle = useMemo(() => {
    const order = Number(contentInfo.LevelName.split('-')[2])
    const topic = contentInfo.TopicTitle
    const base = `${Number.isFinite(order) ? order : '?'}. ${topic}`
    return studyInfo.User === 'staff' ? `${base} (T)` : base
  }, [contentInfo.LevelName, contentInfo.TopicTitle, studyInfo.User])

  const canShowIntroArchiveMyMovie = Boolean(
    introArchiveMyMovie.solo || introArchiveMyMovie.full,
  )

  const renderStep = () => {
    switch (step) {
      case 'watch-video-intro':
        return (
          <IntroLayout
            thumbnailImage={introThumbnail}
            onClick={() => setStep('watch-video')}
            buttonText='Watch Video'
            buttonIcon={iconIntroPlay}
            buttonColor='#3c4b62'
            secondaryButton={
              canShowIntroArchiveMyMovie
                ? {
                    text: 'My Movie',
                    icon: iconIntroMyMovie,
                    bgColor: '#3c4b62',
                    onClick: handleOpenArchiveModePicker,
                  }
                : undefined
            }
          />
        )
      case 'watch-video':
        return <WatchVideo handleSelectMode={handleSelectMode} />
      case 'dubbing-intro':
        return (
          <IntroLayout
            thumbnailImage={introThumbnail}
            onClick={() => setStep('dubbing')}
            buttonText='Start Dubbing'
            buttonIcon={iconIntroRecord}
            buttonColor='#3c4b62'
          />
        )
      case 'dubbing':
        return (
          <Dubbing
            changeMainView={changeMainView}
            onCompleteMyMovie={handleCompleteMyMovie}
          />
        )
      case 'my-movie-intro':
        if (isArchiveModeSelectionIntro) {
          return (
            <IntroLayout
              thumbnailImage={introThumbnail}
              onClick={() => handleGoToMyMovieFromWatchVideoIntro('Solo')}
              buttonText='솔로'
              buttonIcon={iconIntroMyMovie}
              buttonColor='#f08cb4'
              buttonDisabled={!introArchiveMyMovie.solo}
              secondaryButton={{
                text: '풀 캐스트',
                icon: iconIntroMyMovie,
                bgColor: '#f4d44d',
                onClick: () => handleGoToMyMovieFromWatchVideoIntro('Full'),
                disabled: !introArchiveMyMovie.full,
              }}
            />
          )
        }
        return (
          <IntroLayout
            thumbnailImage={introThumbnail}
            onClick={() => setStep('my-movie')}
            buttonText='My Movie'
            buttonIcon={iconIntroMyMovie}
            buttonColor='#3c4b62'
          />
        )
      case 'my-movie':
        return (
          <StyledMyMovieVideo
            $visible={Boolean(myMovieUrl) && !isMyMovieLoading}
          >
            {myMovieScoreSnapshot && (
              <SeeScoreBoardButton onClick={() => setShowMyMovieScore(true)} />
            )}
            {isMyMovieLoading ? (
              <Loading />
            ) : myMovieUrl ? (
              <MyMoviePlayer src={myMovieUrl} videoRef={myMovieVideoRef} />
            ) : (
              <p className='placeholder'>My Movie 파일을 찾을 수 없어요.</p>
            )}
            {showMyMovieScore && myMovieScoreSnapshot && (
              <PopupLayout
                hideButtons
                confirm={false}
                contents={
                  <TotalScore
                    captionTimeline={myMovieScoreSnapshot.captionTimeline}
                    cueResults={myMovieScoreSnapshot.cueResults}
                    encodeState={{ status: 'idle' }}
                    onRetry={() => setShowMyMovieScore(false)}
                    onConfirm={() => setShowMyMovieScore(false)}
                    retryText='닫기'
                    confirmText='확인'
                  />
                }
                onClose={() => setShowMyMovieScore(false)}
              />
            )}
          </StyledMyMovieVideo>
        )
      default:
        return null
    }
  }

  return (
    <FrameBody bgColor='#3B75FF'>
      <StyledDubbingRoom>
        <HeaderLayout
          studyTitle={studyTitle}
          isWatchVideo={step === 'watch-video-intro' || step === 'watch-video'}
          isDubbingIntro={step === 'dubbing-intro'}
          isOnAir={step === 'dubbing'}
          isMyMovie={step === 'my-movie-intro' || step === 'my-movie'}
          onConfirmExit={handleHeaderConfirmExit}
        />
        {renderStep()}
      </StyledDubbingRoom>
    </FrameBody>
  )
}

const DUBBING_ROOM_BASE_WIDTH = 1280
const DUBBING_ROOM_BASE_HEIGHT = 720

const StyledDubbingRoom = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: ${DUBBING_ROOM_BASE_WIDTH}px;
  height: ${DUBBING_ROOM_BASE_HEIGHT}px;
  margin: auto;
  position: relative;
`

const StyledMyMovieVideo = styled.div<{ $visible: boolean }>`
  position: relative;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: hidden;
  z-index: 1;

  .my-movie-player-root {
    flex: 1 1 auto;
    align-self: stretch;
    width: 100%;
    min-height: 0;
  }

  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
    display: ${({ $visible }) => ($visible ? 'block' : 'none')};
  }

  .placeholder {
    color: #c9d1d9;
    font-size: 18px;
    padding: 0 24px;
    text-align: center;
  }
`

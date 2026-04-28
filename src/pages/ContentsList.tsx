import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import styled from 'styled-components'

import FrameListHeader from '@components/FrameListHeader'
import { StyledFilter } from '@components/main/Filter'
import { StyledListBoard } from '@components/main/ListBoard'
import { StyledTabBar } from '@components/main/TabBar'
import { useAppContext } from '@contexts/AppContext'
import { useSoundContext } from '@contexts/SoundContext'
import { IContent, IContentInfo, ILevelList } from '@interfaces/IDubbing'
import { MainView } from '@pages/containers/WrapperContainer'
import { getContentList, getTagsInfo } from '@services/api'
import {
  imgBtnTabLevelA,
  imgBtnTabLevelAOn,
  imgBtnTabLevelB,
  imgBtnTabLevelBOn,
  imgBtnTabLevelC,
  imgBtnTabLevelCOn,
  imgStarLevelKA,
  imgStarLevelKB,
  imgStarLevelKC,
  resEmptyMessage,
} from '@utils/Assets'

type DubContentsListProps = {
  changeMainView: (view: MainView, data?: IContent) => void
  onClickBack: () => void
}

const LEVEL_IMG_MAP = {
  KA: { on: imgBtnTabLevelAOn, off: imgBtnTabLevelA },
  KB: { on: imgBtnTabLevelBOn, off: imgBtnTabLevelB },
  KC: { on: imgBtnTabLevelCOn, off: imgBtnTabLevelC },
}

const FILTER_OPTIONS = [
  { label: 'All', value: 'All' },
  { label: 'Not Yet', value: 'Not Yet' },
  { label: 'Done', value: 'Done' },
]

export default function ContentsList({
  changeMainView,
  onClickBack,
}: DubContentsListProps) {
  const { studyInfo, setContentInfo } = useAppContext()
  const { isBgmMute, audioList, playSound, pauseSound } = useSoundContext()

  const filterRef = useRef<HTMLDivElement>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('All')

  const [currentLevelIndex, setCurrentLevelIndex] = useState(0)
  const [currentTagIndex, setCurrentTagIndex] = useState(0)
  const [levelList, setLevelList] = useState<ILevelList>()
  const [contentList, setContentList] = useState<IContentInfo>()

  useEffect(() => {
    getTagsInfo().then((res) => {
      setLevelList(res)

      let userSelectedLevelIndex = 0

      switch (studyInfo.DubbingRoomLevel) {
        case 'KA':
          userSelectedLevelIndex = 0
          break
        case 'KB':
          userSelectedLevelIndex = 1
          break
        case 'KC':
          userSelectedLevelIndex = 2
          break
        default:
          userSelectedLevelIndex = 0
          break
      }

      setCurrentLevelIndex(userSelectedLevelIndex)
    })
  }, [])

  useEffect(() => {
    if (!levelList) return

    const levelInfo = levelList.Levels[currentLevelIndex]
    if (!levelInfo) return

    const tag =
      currentTagIndex > 0 ? levelInfo.Tags[currentTagIndex] : undefined

    getContentList(levelInfo.Level, tag).then(setContentList)
  }, [levelList, currentLevelIndex, currentTagIndex])

  useEffect(() => {
    if (!isFilterOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isFilterOpen])

  /**
   * 버튼 클릭 - Level
   */
  const handleChangeLevel = useCallback(
    (index: number) => {
      if (index !== currentLevelIndex) {
        playSound(audioList.closeTapSound)
        setCurrentLevelIndex(index)
        setCurrentTagIndex(0)
      }
    },
    [currentLevelIndex, playSound, audioList.closeTapSound],
  )

  /**
   * 버튼 클릭 - Filter
   */
  const handleSelectFilter = (value: string) => {
    setSelectedFilter(value)
    setIsFilterOpen(false)
  }

  /**
   * 버튼 클릭 - Tag
   */
  const handleChangeTag = useCallback(
    (index: number) => {
      playSound(audioList.closeTapSound)
      setCurrentTagIndex(index)
    },
    [playSound, audioList.closeTapSound],
  )

  /**
   * 버튼 클릭 - Contents
   */
  const handleClickContent = useCallback(
    (content: IContent) => {
      if (!isBgmMute) pauseSound(audioList.bgMusic)
      playSound(audioList.menuTapSound, 0.25, 0.8)

      setContentInfo(content)
      changeMainView('dubbing')
    },
    [
      isBgmMute,
      audioList,
      pauseSound,
      playSound,
      changeMainView,
      setContentInfo,
    ],
  )

  const currentLevel = useMemo(
    () => levelList?.Levels[currentLevelIndex],
    [levelList, currentLevelIndex],
  )

  const tagList = currentLevel?.Tags ?? []

  const filteredContents = useMemo(() => {
    const contents = contentList?.Contents
    if (!contents) return []

    switch (selectedFilter) {
      case 'All':
        return contents
      case 'Not Yet':
        return contents.filter((c) => c.RgPointSum === 0)
      case 'Done':
        return contents.filter((c) => c.RgPointSum > 0)
      default:
        return []
    }
  }, [contentList, selectedFilter])

  return (
    <StyledDubContentsList>
      <FrameListHeader
        title="Dodo's Dubbing Room"
        theme='content'
        onClickBack={onClickBack}
      />

      {/* 레벨 셀렉터 */}
      <StyledTabBar>
        {levelList?.Levels.map((level, i) => {
          const isActive = i === currentLevelIndex
          const imgSrc = isActive
            ? LEVEL_IMG_MAP[level.Level].on
            : LEVEL_IMG_MAP[level.Level].off
          return (
            <div
              key={level.Level}
              className='tab-menu-item'
              onClick={() => handleChangeLevel(i)}
            >
              <img src={imgSrc} alt={level.Level} />
            </div>
          )
        })}
      </StyledTabBar>

      <StyledFilter ref={filterRef}>
        <button
          className='filter-btn'
          onClick={() => setIsFilterOpen((o) => !o)}
        >
          {selectedFilter === 'all' ? 'All' : selectedFilter}
          <span style={{ fontSize: 14 }}>{isFilterOpen ? '▲' : '▼'}</span>
        </button>
        {isFilterOpen && (
          <div className='dropdown'>
            {FILTER_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                className={
                  'dropdown-item' +
                  (selectedFilter === opt.value ? ' active' : '')
                }
                onClick={() => handleSelectFilter(opt.value)}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </StyledFilter>

      {/* 태그 필터 */}
      {/* <StyledTags>
        {tagList.map((tag, j) => (
          <div
            key={tag}
            className={`tag-item ${currentTagIndex === j ? 'active' : ''}`}
            onClick={() => handleChangeTag(j)}
          >
            {tag}
          </div>
        ))}
      </StyledTags> */}

      {filteredContents.length === 0 ? (
        <StyledEmptyMessage>
          <img src={resEmptyMessage} alt='no-content' />
        </StyledEmptyMessage>
      ) : (
        <StyledListBoard>
          {filteredContents.map((content) => {
            const levelSuffix = content.LevelName.split('-')[1] ?? ''
            const levelKey = levelSuffix.toLowerCase()

            return (
              <div
                key={content.LevelRoundId}
                className='thumbnail'
                onClick={() => handleClickContent(content)}
              >
                <div className='completed-mark-box'>
                  {content.RgPointSum === content.BookPoint * 1.5 && (
                    <>
                      <div className='single-mark'></div>
                      <div className='full-mark'></div>
                    </>
                  )}

                  {content.RgPointSum === content.BookPoint && (
                    <div className='full-mark'></div>
                  )}

                  {content.RgPointSum === content.BookPoint * 0.5 && (
                    <div className='single-mark'></div>
                  )}
                </div>

                <div className='wrapper-right'>
                  <div className='wrapper-star'>
                    {levelKey === 'ka' && (
                      <img src={imgStarLevelKA} alt='star' />
                    )}
                    {levelKey === 'kb' && (
                      <img src={imgStarLevelKB} alt='star' />
                    )}
                    {levelKey === 'kc' && (
                      <img src={imgStarLevelKC} alt='star' />
                    )}
                    <span>
                      {levelSuffix.slice(1, 2).toUpperCase()}·{content.Order}
                    </span>
                  </div>

                  {/* {content.GetableRgPoint > 0 && (
                    <div className="wrapper-coin">
                      {content.GetableRgPoint === content.BookPoint * 1.5
                        ? content.BookPoint
                        : content.GetableRgPoint}
                    </div>
                  )} */}
                </div>

                <img
                  src={content.StudyImagePath}
                  alt={content.TopicTitle}
                  crossOrigin='anonymous'
                />
              </div>
            )
          })}
        </StyledListBoard>
      )}
    </StyledDubContentsList>
  )
}

// ========== Styled Components ==========

const StyledDubContentsList = styled.div`
  background-color: #255fec;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  position: relative;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`

const StyledEmptyMessage = styled.div`
  display: flex;
  height: calc(100% - 190px);
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

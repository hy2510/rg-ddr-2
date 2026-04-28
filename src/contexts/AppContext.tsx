import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { IContent, IDetailContent } from '@interfaces/IDubbing'
import { IStudyInfo } from '@interfaces/IStudyInfo'
import { getDefaultInfo } from '@services/api'

type AppContextProviderProps = {
  children: React.ReactNode
}

type IUser = 'student' | 'staff'

type IStudyInfoWithUser = IStudyInfo & {
  User: IUser
}

type AppContextValue = {
  token: string
  studyInfo: IStudyInfoWithUser
  contentInfo: IContent
  detailContentInfo: IDetailContent
  setStudyInfo: (study: IStudyInfoWithUser) => void
  setContentInfo: (content: IContent) => void
  changeDetailContentInfo: (content: Partial<IDetailContent>) => void
  resetContentInfo: () => void
}

const defaultStudyInfo: IStudyInfoWithUser = {
  User: 'student',
  RgPoint: 0,
  CompleteCount: 0,
  TotalCount: 0,
  StudyableYn: false,
  StudentId: '',
  StudentHistory: [],
  DubbingRoomLevel: '',
}

const defaultContent: IContent = {
  Order: 0,
  BookPoint: 0,
  GetableRgPoint: 0,
  LevelName: '',
  LevelRoundId: '',
  RgPointCount: 0,
  RgPointSum: 0,
  StudyImagePath: '',
  TopicTitle: '',
}

const defaultDetailContent: IDetailContent = {
  LevelRoundId: '',
  StudyId: '',
  StudentHistoryId: '',
  StudentId: '',
  ClassId: '',
  Title: '',
  StudyImagePath: '',
  BookCode: '',
  RgPoint: 0,
  GetableRgPoint: 0,
  PassCount: 0,
  ActiveStudyMode: '',
  StudyMode: '',
  StudyStatus: '',
  VideoPath: '',
  Record: [],
  ScoreOverall: 0,
  Score1: 0,
  Score2: 0,
  Score3: 0,
  Score4: 0,
  Score5: 0,
}

export const AppContext = createContext<AppContextValue>({
  token: '',
  studyInfo: defaultStudyInfo,
  contentInfo: defaultContent,
  detailContentInfo: defaultDetailContent,
  setStudyInfo: (study: IStudyInfoWithUser) => {},
  setContentInfo: (content: IContent) => {},
  changeDetailContentInfo: (content: Partial<IDetailContent>) => {},
  resetContentInfo: () => {},
})

export default function AppContextProvider({
  children,
}: AppContextProviderProps) {
  const [studyInfo, setStudyInfo] =
    useState<IStudyInfoWithUser>(defaultStudyInfo)
  const [contentInfo, setContentInfo] = useState<IContent>(defaultContent)
  const [detailContentInfo, setDetailContentInfo] =
    useState<IDetailContent>(defaultDetailContent)

  const token: string = (window as any)?.REF?.Token ?? ''

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const REF = (window as any).REF
        const info = await getDefaultInfo()

        if (info) {
          if (REF) {
            setStudyInfo({ ...info, User: REF.User as IUser })
          } else {
            setStudyInfo({ ...info, User: 'student' })
          }
        }
      } catch (error) {
        console.error('Failed to fetch study info:', error)
      }
    }

    fetchInfo()
  }, [])

  useEffect(() => {}, [detailContentInfo])

  const changeDetailContentInfo = (content: Partial<IDetailContent>) => {
    setDetailContentInfo((prev) => ({
      ...prev,
      ...content,
    }))
  }

  const resetContentInfo = () => {
    setContentInfo(defaultContent)
    setDetailContentInfo(defaultDetailContent)
  }

  const contextValue = useMemo<AppContextValue>(
    () => ({
      token,
      studyInfo,
      contentInfo,
      detailContentInfo,
      setStudyInfo,
      setContentInfo,
      changeDetailContentInfo,
      resetContentInfo,
    }),
    [token, studyInfo, contentInfo, detailContentInfo],
  )

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error('useAppContext must be used within a SoundProvider')
  }

  return context
}

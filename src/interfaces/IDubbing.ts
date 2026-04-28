// 학습 모드
type Mode = 'solo' | 'full'

// 레벨 및  태그
interface ILevel {
  Level: 'KA' | 'KB' | 'KC'
  Tags: string[]
}

type IStudyStatus = '' | 'Not Started' | 'Not Yet' | 'Completed'

interface ILevelList {
  Levels: ILevel[]
}

// 컨텐츠
interface IContent {
  Order: number
  LevelRoundId: string
  LevelName: string
  TopicTitle: string
  StudyImagePath: string
  RgPointCount: number
  RgPointSum: number
  BookPoint: number
  GetableRgPoint: number
}

interface IPagenation {
  Page: number
  TotalPages: number
  RecordPerPage: number
  TotalRecords: number
}

interface IContentInfo {
  Contents: IContent[]
  Pagination: IPagenation
}

interface IRecord {
  QuizNo: number
  Actor: string
  Lead: boolean
  Sentence: string
  StartTime: string
  EndTime: string
  SoundPath: string
  skip?: boolean
}

interface IDetailContent {
  LevelRoundId: string
  StudyId: string
  StudentHistoryId: string
  StudentId: string
  ClassId: string
  Title: string
  StudyImagePath: string
  BookCode: string
  RgPoint: number
  GetableRgPoint: number
  PassCount: number
  ActiveStudyMode: string
  StudyMode: string
  StudyStatus: IStudyStatus
  VideoPath: string
  Record: IRecord[]
  ScoreOverall: number
  Score1: number
  Score2: number
  Score3: number
  Score4: number
  Score5: number
}

interface IResultPostStudy {
  StudyId: string
  StudentHistoryId: string
  StudyMode: string
}

interface IStudy {
  StudyId: string
  StudentHistoryId: string
  BookPoint: number
  EndDate: string
}

interface IMyMovieContent {
  Order: number
  LevelRoundId: string
  LevelName: string
  TopicTitle: string
  StudyImagePath: string
  SoloStudy: IStudy
  FullStudy: IStudy
}

interface IMyMovies {
  Contents: IMyMovieContent[]
  Pagination: IPagenation
}

interface IUploadUrl {
  Url: string
}

interface IAnswer {
  quizNo: string
  scoreOverall: number
  score1: number
  score2: number
  score3: number
  score4: number
  score5: number
  raw: string
}

interface IContentSaveResult {
  result: string
  resultMessage: string
}

interface IReviewInfo {
  studyId: string
  studentHistoryId: string
  levelRoundId: string
  levelName: string
  studyMode: string
  dubDate: string
}

export type {
  IAnswer,
  IContent,
  IContentInfo,
  IContentSaveResult,
  IDetailContent,
  ILevel,
  ILevelList,
  IMyMovieContent,
  IMyMovies,
  IRecord,
  IResultPostStudy,
  IReviewInfo,
  IUploadUrl,
  Mode,
}

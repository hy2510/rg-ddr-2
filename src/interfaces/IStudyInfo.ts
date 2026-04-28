// 과거 기록...?

interface StudentHistory {
  ClassId: string
  ClassName: string
  StudentHistoryId: string
}

// 첫 진입시 정보
interface IStudyInfo {
  RgPoint: number
  CompleteCount: number
  TotalCount: number
  StudyableYn: boolean
  DubbingRoomLevel: string
  StudentId: string
  StudentHistory: StudentHistory[]
}

export type { IStudyInfo }

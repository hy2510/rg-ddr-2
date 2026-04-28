import axios from 'axios'

import {
  CONTENT_PATH,
  CONTENT_SAVE_PATH,
  INFO_PATH,
  LEVEL_UPDATE_PATH,
  MY_VIDEO_PATH,
  MY_VIDEO_PLAY_PATH,
  MY_VIDEO_UPLOAD_PATH,
  SEARCH_PATH,
  TAGS_PATH,
} from '@constants/constants'
import {
  IAnswer,
  IContentInfo,
  IContentSaveResult,
  IDetailContent,
  ILevelList,
  IMyMovies,
  IResultPostStudy,
  IUploadUrl,
} from '@interfaces/IDubbing'
import { IStudyInfo } from '@interfaces/IStudyInfo'
import { getCookie } from '@utils/common'

/**
 * 조회 - 기본 정보
 */
const getDefaultInfo = async () => {
  try {
    const res = await axios.get<IStudyInfo>(`/${INFO_PATH}`, {
      headers: {
        Authorization: getCookie('d-token'),
      },
    })

    return res.data
  } catch (e) {
    console.log(e)
  }
}

/**
 * 조회 - 태그
 */
const getTagsInfo = async () => {
  try {
    const res = await axios.get<ILevelList>(`/${TAGS_PATH}`, {
      headers: {
        Authorization: getCookie('d-token'),
      },
    })

    return res.data
  } catch (e) {
    console.log(e)
  }
}

/**
 * 조회 - 컨텐츠 목록
 * @param level
 * @param tag?
 * @param page?
 */
const getContentList = async (level: string, tag?: string, page?: number) => {
  try {
    const res = await axios.get<IContentInfo>(`/${SEARCH_PATH}`, {
      headers: {
        Authorization: getCookie('d-token'),
      },
      params: {
        level,
        tag,
        page,
      },
    })

    return res.data
  } catch (e) {
    console.log(e)
  }
}

/**
 * 조회 - 컨텐츠
 * @param levelRoundId
 * @param studyId?
 * @param studyMode?
 */
const getContent = async (
  levelRoundId: string,
  studyId?: string,
  studyMode?: string,
) => {
  const params: {
    levelRoundId: string
    studyId?: string
    studyMode?: string
  } = {
    levelRoundId: levelRoundId,
  }

  if (studyId) {
    params.studyId = studyId
  }

  if (studyMode) {
    params.studyMode = studyMode
  }

  try {
    const res = await axios.get<IDetailContent>(`/${CONTENT_PATH}`, {
      headers: {
        Authorization: getCookie('d-token'),
      },
      params: params,
    })

    return res.data
  } catch (e) {
    console.log(e)
  }
}

/**
 * 등록 - 학습
 * @param levelRoundId
 * @param studentHistoryId
 * @param studyMode
 */
const postStudyInfo = async (
  levelRoundId: string,
  studentHistoryId: string,
  studyMode: string,
) => {
  try {
    const res = await axios.post<IResultPostStudy>(
      `/${CONTENT_PATH}`,
      {
        levelRoundId: `${levelRoundId}`,
        studentHistoryId: `${studentHistoryId}`,
        studyMode: `${studyMode}`,
      },
      {
        headers: {
          Authorization: getCookie('d-token'),
        },
      },
    )
    return res.data
  } catch (e) {
    console.log(e)
  }
}

/**
 * 조회 - 업로드 URL
 * @param studyId
 * @param studentHistoryId
 * @param levelRoundId
 * @param levelName
 * @param studyMode
 * @returns
 */
const getUploadUrl = async (
  studyId: string,
  studentHistoryId: string,
  levelRoundId: string,
  levelName: string,
  studyMode: string,
) => {
  let url = ''

  try {
    const res = await axios.get<IUploadUrl>(`/${MY_VIDEO_UPLOAD_PATH}`, {
      headers: {
        Authorization: getCookie('d-token'),
      },
      params: {
        studyId,
        studentHistoryId,
        levelRoundId,
        levelName,
        studyMode,
      },
    })

    url = res.data.Url

    if (!url) {
      throw new Error('Upload URL not found')
    }
  } catch (e) {
    console.log(e)
  }

  return url
}

/**
 * 영상 업로드
 * @param video
 * @param uploadUrl
 * @returns
 */
const uploadVideo = async (video: string, uploadUrl: string) => {
  try {
    const file = await blobUrlToFile(video)

    const formData = new FormData()
    formData.append('file', file)

    const res = await axios.post(uploadUrl, formData)

    return res.data
  } catch (e: any) {
    // AxiosError 객체라면 아래 정보들 확인 가능
    console.error('[UPLOAD ERROR]')
    console.error('Message:', e.message)
    console.error('Request:', e.request)
    console.error('Response:', e.response)
    console.error('Config:', e.config)
    throw e
  }
}

/**
 * blobUrl을 file로 변환하는 함수
 * @param blobUrl
 * @returns
 */
const blobUrlToFile = async (blobUrl: string) => {
  const response = await fetch(blobUrl)
  const blob = await response.blob()
  const file = new File([blob], 'video.mp4', { type: 'video/mp4' })
  return file
}

const saveContent = async (
  studyId: string,
  studentHistoryId: string,
  studyMode: string,
  answers: IAnswer[],
  onComplete: () => void,
) => {
  try {
    const res = await axios.post<IContentSaveResult>(
      `/${CONTENT_SAVE_PATH}`,
      {
        studyId: studyId,
        studentHistoryId: studentHistoryId,
        studyMode: studyMode,
        answers: answers,
      },
      {
        headers: {
          Authorization: getCookie('d-token'),
        },
      },
    )

    if (res.data.result !== '0') {
      throw new Error(res.data.result, { cause: res.data.resultMessage })
    } else {
      onComplete()
    }
  } catch (e) {
    console.log(e)
  }
}

/**
 * 조회 - My Movies
 * @returns
 */
const getMyMovies = async (
  level?: string,
  tag?: string,
  mode?: string,
  page?: number,
) => {
  try {
    const res = await axios.get<IMyMovies>(`/${MY_VIDEO_PATH}`, {
      headers: {
        Authorization: getCookie('d-token'),
      },
      params: {
        level,
        tag,
        mode,
        page,
      },
    })

    return res.data
  } catch (e) {
    console.log(e)
  }
}

/**
 * 조회 - 리뷰 영상
 * @param studyId
 * @param studentHistoryId
 * @param levelRoundId
 * @param levelName
 * @param studyMode
 */
const getReviewVideo = async (
  studyId: string,
  studentHistoryId: string,
  levelRoundId: string,
  levelName: string,
  studyMode: string,
) => {
  try {
    const res = await axios.get<IUploadUrl>(`/${MY_VIDEO_PLAY_PATH}`, {
      headers: {
        Authorization: getCookie('d-token'),
        'Content-Type': 'application/json',
      },
      params: {
        studyId,
        studentHistoryId,
        levelRoundId,
        levelName,
        studyMode,
      },
    })

    return res.data.Url
  } catch (e) {
    console.log(e)
  }
}

/**
 * DodoDubbingRoomLevel 업데이트
 * @param levelName
 */
const postLevelUpdate = async (levelName: string) => {
  try {
    const res = await axios.post(
      `/${LEVEL_UPDATE_PATH}`,
      {
        levelName,
      },
      {
        headers: {
          Authorization: getCookie('d-token'),
        },
      },
    )
  } catch (e) {
    console.log(e)
  }
}

export {
  getContent,
  getContentList,
  getDefaultInfo,
  getMyMovies,
  getReviewVideo,
  getTagsInfo,
  getUploadUrl,
  postLevelUpdate,
  postStudyInfo,
  saveContent,
  uploadVideo,
}

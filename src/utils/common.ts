import Cookies from 'js-cookie'

import { IAnswer } from '@interfaces/IDubbing'
import { RecordResultProps } from '@pages/Dubbing'

/**
 * 문자열을 시간으로 컨버팅
 * @param timeStr
 * @returns
 */
const convertTimeToSec = (timeStr: string) => {
  const [min, sec] = timeStr.split(':')

  return parseFloat(min) * 60 + parseFloat(sec)
}

/**
 * 시간을 문자열로 포맷
 * @param seconds
 * @returns
 */
const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return [
    hours.toString().padStart(2, '0'),
    mins.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':')
}

/**
 * 쿠키에 저장되어있는 값을 가져오는 함수
 * @param name 쿠키 key값
 * @returns 쿠키 key에 따른 value값
 */
const getCookie = (name: string) => {
  return Cookies.get(name)
}

type ScoreData = {
  scoreOverall: number
  score1: number
  score2: number
  score3: number
  score4: number
  score5: number
}

/**
 * 점수 데이터 생성
 * @param recordResult
 * @returns
 */
const makeScoreData = (recordResult: RecordResultProps) => {
  return {
    scoreOverall: Math.floor(recordResult.recordResult.total_score),
    score1: Math.floor(
      recordResult.recordResult.score.accent *
        recordResult.recordResult.score_weight.accent *
        (100 / recordResult.recordResult.score_weight.accent),
    ),
    score2: Math.floor(
      recordResult.recordResult.score.accuracy *
        recordResult.recordResult.score_weight.accuracy *
        (100 / recordResult.recordResult.score_weight.accuracy),
    ),
    score3: Math.floor(
      recordResult.recordResult.score.intonation *
        recordResult.recordResult.score_weight.intonation *
        (100 / recordResult.recordResult.score_weight.intonation),
    ),
    score4: Math.floor(
      recordResult.recordResult.score.pause *
        recordResult.recordResult.score_weight.pause *
        (100 / recordResult.recordResult.score_weight.pause),
    ),
    score5: Math.floor(
      recordResult.recordResult.score.speed *
        recordResult.recordResult.score_weight.speed *
        (100 / recordResult.recordResult.score_weight.speed),
    ),
  }
}

/**
 * 답안 데이터 생성
 * @param quizNo
 * @param scoreData
 * @param raw
 * @returns
 */
const makeAnswer = (
  quizNo: string,
  scoreData: ScoreData,
  raw: string,
): IAnswer => {
  return {
    quizNo: quizNo,
    scoreOverall: scoreData.scoreOverall,
    score1: scoreData.score1,
    score2: scoreData.score2,
    score3: scoreData.score3,
    score4: scoreData.score4,
    score5: scoreData.score5,
    raw: raw,
  }
}

export type AverageScore = {
  scoreOverall: number
  score1: number
  score2: number
  score3: number
  score4: number
  score5: number
}

/**
 * 평균 점수 계산
 * @param answers
 * @returns
 */
const makeAverageScore = (answers: IAnswer[]): AverageScore => {
  return {
    scoreOverall:
      answers.reduce((acc, cur) => acc + cur.scoreOverall, 0) / answers.length,
    score1: answers.reduce((acc, cur) => acc + cur.score1, 0) / answers.length,
    score2: answers.reduce((acc, cur) => acc + cur.score2, 0) / answers.length,
    score3: answers.reduce((acc, cur) => acc + cur.score3, 0) / answers.length,
    score4: answers.reduce((acc, cur) => acc + cur.score4, 0) / answers.length,
    score5: answers.reduce((acc, cur) => acc + cur.score5, 0) / answers.length,
  }
}

export {
  convertTimeToSec,
  formatTime,
  getCookie,
  makeAnswer,
  makeAverageScore,
  makeScoreData,
}

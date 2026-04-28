type SpeakPageProps = {
  ChallengeNumber: number
  BookId: string
  Page: number
  QuizNo: number
  Css: string
  Contents: string
  FontColor: string
  ImagePath: string
  Sequence: number
  SoundPath: string
  DataPath: string
  MarginTop: number
  MarginLeft: number
  Sentence: string
}

interface ISpeakRecord {
  Page: number
  Sequence: number
  QuizNo: number
  Sentence: string
  ScoreOverall: number
  ScoreWord: number
  ScorePronunciation: number
  ScoreProsody: number
  ScoreIntonation: number
  ScoreTiming: number
  ScoreLoudness: number
}

interface ISpeakUserAnswer {
  studyId: string
  studentHistoryId: string
  challengeNumber: number
  page: number
  sequence: number
  quizNo: number
  sentence: string
  scoreOverall: number
  wordsJson: string
  isLastQuiz: boolean
}

interface ISpeakSaveResult {
  result: number
  resultMessage: string
}

interface IRecordResultData {
  speech_detected: boolean
  best_answer: string
  phoneme_result: {
    sentence_score: number
    words: {
      phonemes: {
        phoneme: string
        score: number
      }[]

      word: string
    }[]
  }
  score_weight: {
    accuracy: number
    intonation: number
    accent: number
    pause: number
    speed: number
  }
  score: {
    accuracy: number
    intonation: number
    accent: number
    pause: number
    speed: number
  }
  weighted_score: {
    accuracy: number
    intonation: number
    accent: number
    pause: number
    speed: number
  }
  total_score: number
}

interface IPhonemeResult {
  average_phoneme_score: number
  speech_detected: boolean
  words: {
    phonemes: {
      phoneme: string
      score: number
    }[]

    word: string
  }[]
}

interface IResultPhoneme {
  alphabet: string
  index_start: number
  index_end: number
  phonemes: string[]
  score: number
}

type PageState = '' | 'play' | 'left' | 'right'
type PageSequenceProps = {
  playPage: number
  sequnce: number
}

// 오디오 상태
type PlayState = '' | 'play' | 'play-sentence' | 'play-user-sound'
type RecordState = '' | 'recording'

export type {
  IPhonemeResult,
  IRecordResultData,
  ISpeakRecord,
  ISpeakSaveResult,
  ISpeakUserAnswer,
  PageSequenceProps,
  PageState,
  PlayState,
  RecordState,
  SpeakPageProps,
}

export type CaptionWordCue = {
  start: number
  end: number
  text: string
}

export type CaptionCharacterImage = {
  image1: string
  image2: string
  image3: string
  image4: string
}

export type CaptionCue = {
  start: number
  end: number
  text: string
  words?: CaptionWordCue[]
  characterImage?: CaptionCharacterImage
  studyType: 'single' | 'full'
}

export function findCaptionCueByTime(
  timeline: CaptionCue[],
  currentTime: number,
): CaptionCue | undefined {
  return timeline.find(
    (cue) => currentTime >= cue.start && currentTime < cue.end,
  )
}

export function getCaptionByTime(
  timeline: CaptionCue[],
  currentTime: number,
  fallbackText: string,
): string {
  const matchedCue = findCaptionCueByTime(timeline, currentTime)

  return matchedCue?.text ?? fallbackText
}

function findActiveCueIndex(
  timeline: CaptionCue[],
  currentTime: number,
): number {
  let activeIndex = -1
  for (let i = 0; i < timeline.length; i += 1) {
    if (timeline[i].start <= currentTime) {
      activeIndex = i
    } else {
      break
    }
  }
  return activeIndex
}

export function findPreviousCueStart(
  timeline: CaptionCue[],
  currentTime: number,
): number | null {
  const activeIndex = findActiveCueIndex(timeline, currentTime)
  if (activeIndex <= 0) {
    return null
  }
  return timeline[activeIndex - 1].start
}

export function findCurrentCueStart(
  timeline: CaptionCue[],
  currentTime: number,
): number | null {
  const activeIndex = findActiveCueIndex(timeline, currentTime)
  if (activeIndex < 0) {
    return null
  }
  return timeline[activeIndex].start
}

export function findNextCueStart(
  timeline: CaptionCue[],
  currentTime: number,
): number | null {
  const nextCue = timeline.find((cue) => cue.start > currentTime)
  return nextCue ? nextCue.start : null
}

export function getWordIndexByTime(
  cue: CaptionCue,
  currentTime: number,
): number {
  if (!cue.words || cue.words.length === 0) {
    return -1
  }

  const wordIndex = cue.words.findIndex(
    (word) => currentTime >= word.start && currentTime < word.end,
  )

  if (wordIndex >= 0) {
    return wordIndex
  }

  if (currentTime >= cue.words[cue.words.length - 1].end) {
    return cue.words.length - 1
  }

  return -1
}

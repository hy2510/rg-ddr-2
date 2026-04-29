import styled from 'styled-components'

import { PopupButton } from '@components/common/Buttons'
import type { CaptionCue } from '@components/dubbing/caption/captionTimeline'
import { splitCueWords } from '@hooks/useCueRecording'
import type { CueResult, MyMovieEncodeState } from '@interfaces/dubbingTypes'

type TotalScoreProps = {
  captionTimeline: CaptionCue[]
  cueResults: Record<number, CueResult>
  encodeState: MyMovieEncodeState
  onRetry: () => void
  onConfirm: () => void | Promise<void>
  confirmText?: string
  retryText?: string
}

/** My Movie 점수 목록 + 합성 진행 표시 + 다시하기/확인 (팝업 contents 용) */
export function TotalScore({
  captionTimeline,
  cueResults,
  encodeState,
  onRetry,
  onConfirm,
  confirmText = 'Confirm',
  retryText = 'Retry',
}: TotalScoreProps) {
  const totals = captionTimeline.reduce(
    (acc, cue) => {
      const total = splitCueWords(cue.text).length
      const matched = cueResults[cue.start]?.matched ?? 0
      acc.total += total
      acc.matched += matched
      return acc
    },
    { matched: 0, total: 0 },
  )

  const totalRate =
    totals.total > 0 ? Math.round((totals.matched / totals.total) * 100) : 0

  const isBusy = encodeState.status === 'downloading'

  return (
    <StyledTotalScore>
      <h2 className='header-title'>Score</h2>
      <ul className='result-list'>
        {captionTimeline.map((cue, idx) => {
          const words = splitCueWords(cue.text)
          const total = words.length
          const result = cueResults[cue.start]
          const matched = result?.matched ?? 0
          const matchedSet = new Set(result?.matchedIndexes ?? [])
          const rate = total > 0 ? Math.round((matched / total) * 100) : 0
          return (
            <li key={cue.start} className='result-item'>
              <span className='result-index'>{idx + 1}.</span>
              <span className='result-text'>
                {words.map((word, wIdx) => (
                  <span
                    key={`${cue.start}-${wIdx}`}
                    className={matchedSet.has(wIdx) ? 'word matched' : 'word'}
                  >
                    {word}
                    {wIdx < words.length - 1 ? ' ' : ''}
                  </span>
                ))}
              </span>
              <span
                className={`result-rate ${
                  rate >= 80 ? 'good' : rate >= 40 ? 'ok' : 'bad'
                }`}
              >
                {rate}%
              </span>
            </li>
          )
        })}
      </ul>
      <div className='total-score'>
        <span className='total-label'>Total</span>
        <span className='total-value'>{totalRate}%</span>
      </div>

      {encodeState.status === 'downloading' && (
        <span className='download-status'>
          {(encodeState.message ?? 'Preparing My Movie …') +
            ` ${Math.round(encodeState.progress * 100)}%`}
        </span>
      )}
      {encodeState.status === 'error' && (
        <span className='download-status error'>{encodeState.message}</span>
      )}

      <div className='action-row'>
        <PopupButton
          text={retryText}
          buttonColor='gray'
          disabled={isBusy}
          onClick={() => {
            if (isBusy) return
            onRetry()
          }}
        />
        <PopupButton
          text={confirmText}
          buttonColor='green'
          disabled={isBusy}
          onClick={() => {
            if (isBusy) return
            void onConfirm()
          }}
        />
      </div>
    </StyledTotalScore>
  )
}

const StyledTotalScore = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 24px;
  width: 640px;
  max-width: 80vw;
  padding: 8px 4px;

  .header-title {
    margin: 0;
    font-size: 2em;
    font-weight: 800;
    color: #1f2d17;
    text-align: center;
    letter-spacing: 0.02em;
  }

  .result-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 360px;
    overflow-y: auto;
  }

  .result-item {
    display: grid;
    grid-template-columns: 32px 1fr auto;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    background: #f3f6fb;
    border-radius: 14px;
    font-size: 1em;
    font-weight: 500;
    color: #2a3346;
  }

  .result-index {
    font-weight: 700;
    color: #6b7a90;
    text-align: right;
  }

  .result-text {
    text-align: left;
    white-space: normal;
    word-break: break-word;

    .word {
      display: inline;
    }

    .word.matched {
      color: #1f5d00;
      background: #cbffb0;
      padding: 2px 6px;
      margin: 0 1px;
      border-radius: 6px;
      font-weight: 700;
    }
  }

  .result-rate {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    padding: 4px 10px;
    border-radius: 999px;
    background: #e0e6ef;
    color: #3c4b62;
    white-space: nowrap;
  }
  .result-rate.good {
    background: #cbffb0;
    color: #1f5d00;
  }
  .result-rate.ok {
    background: #fff1b8;
    color: #7a5a00;
  }
  .result-rate.bad {
    background: #fdeaec;
    color: #b4202e;
  }

  .total-score {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-top: 2px dashed #d6dde8;
    border-radius: 0;
    font-size: 1.2em;
  }

  .total-label {
    font-weight: 700;
    color: #2a3346;
  }

  .total-value {
    font-weight: 600;
    color: #3c4b62;
    font-variant-numeric: tabular-nums;

    strong {
      color: #35a900;
      font-weight: 800;
      margin-left: 4px;
    }
  }

  .download-status {
    font-size: 0.9em;
    color: #5a6780;
  }
  .download-status.error {
    color: #b4202e;
    font-weight: 600;
  }

  .action-row {
    /* PopupLayout .contents(1.5em) 상속을 끊음 — PopupButton 의 1.4em 이 루트 기준과 같게 */
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
    padding-top: 8px;
  }
`

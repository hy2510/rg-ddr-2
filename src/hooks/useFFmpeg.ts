import { useCallback, useRef, useState } from 'react'

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

import { IRecord } from '@interfaces/IDubbing'
import { convertTimeToSec, formatTime } from '@utils/common'

const BASE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm'

export default function useFFmpeg() {
  const [outputFile, setOutputFile] = useState('')

  const ffmpegRef = useRef(new FFmpeg())
  const ffmpeg = ffmpegRef.current

  /**
   * ffmpeg 로드
   */
  const loadFFmpeg = async () => {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(
        `${BASE_URL}/ffmpeg-core.wasm`,
        'application/wasm',
      ),
    })
  }

  /**
   * 유저 동영상 만들기
   * @param videoPath
   * @param recFiles
   * @param records
   */
  const trans = async (
    videoPath: string,
    recFiles: {
      file: File
      sentenceIndex: number
    }[],
    records: IRecord[],
  ) => {
    try {
      await loadFFmpeg()

      if (ffmpeg.loaded) {
        // ffmpeg.on('log', (e) => {
        //   console.log(e)
        // })

        const mergeStrArr: string[] = []

        // 파일 로드
        await ffmpeg.writeFile('video.mp4', await fetchFile(videoPath))

        for (let i = 0; i < recFiles.length; i++) {
          await fileToMp3(recFiles[i].file, `userAudio${i + 1}.mp3`)
        }

        // 동영상에서 오디오 분리
        await splitAudio()

        let lastEnd = '00:00'
        let partIdx = 0

        for (let i = 0; i < records.length; i++) {
          if (records[i].skip) continue

          await sliceAudio(
            lastEnd,
            records[i].StartTime,
            `part${partIdx + 1}.mp3`,
          )

          mergeStrArr.push(`part${partIdx + 1}.mp3`)
          mergeStrArr.push(`userAudio${partIdx + 1}.mp3`)

          lastEnd = records[i].EndTime
          partIdx++
        }

        await sliceAudioUntilEnd(lastEnd)
        mergeStrArr.push('last.mp3')

        // 음원 합치기
        await mergeAudio([...mergeStrArr])

        // 비디오와 오디오 합치기
        await makeVideo('user.mp4')

        // 완성된 파일 읽어오기
        const data = await ffmpeg.readFile('user.mp4')
        // @ts-ignore
        const blob = new Blob([data.buffer], { type: 'video/mp4' })
        const url = URL.createObjectURL(blob)

        setOutputFile(url)

        await ffmpeg.deleteFile('video.mp4')
        await ffmpeg.deleteFile('merged.mp3')
        await ffmpeg.deleteFile('audio.mp3')
        await ffmpeg.deleteFile('user.mp4')
        await ffmpeg.deleteFile('last.mp3')

        for (let i = 0; i < partIdx; i++) {
          await ffmpeg.deleteFile(`part${i + 1}.mp3`)
        }

        for (let i = 0; i < recFiles.length; i++) {
          await ffmpeg.deleteFile(`userAudio${i + 1}.mp3`)
        }
      }
    } catch (e) {
      console.log(e)
    } finally {
      ffmpeg.terminate()
    }
  }

  /**
   * 비디오와 음원 분리(mp3)
   */
  const splitAudio = async () => {
    await ffmpeg.exec([
      '-i',
      'video.mp4',
      '-q:a',
      '0',
      '-map',
      'a',
      'audio.mp3',
    ])
  }

  /**
   * 오디오 원하는 부분 자르는 함수
   * @param startTime
   * @param endTime
   * @param outputName
   */
  const sliceAudio = async (
    startTime: string,
    endTime: string,
    outputName: string,
  ) => {
    const duration = convertTimeToSec(endTime) - convertTimeToSec(startTime)

    await ffmpeg.exec([
      '-i',
      'audio.mp3',
      '-ss',
      startTime,
      '-t',
      formatTime(duration),
      outputName,
    ])
  }

  /**
   * 오디오를 특정 부분부터 마지막까지 자르는 함수
   * @param startTime
   */
  const sliceAudioUntilEnd = async (startTime: string) => {
    await ffmpeg.exec(['-i', 'audio.mp3', '-ss', startTime, 'last.mp3'])
  }

  /**
   * 오디오들을 합치는 함수
   * @param audioList
   */
  const mergeAudio = async (audioList: string[]) => {
    const audioStr = audioList.reduce((acc, cur) => acc + '|' + cur)

    await ffmpeg.exec(['-i', `concat:${audioStr}`, '-c', 'copy', 'merged.mp3'])
  }

  /**
   * 비디오와 오디오 결합해서 비디오 만드는 함수
   * @param fileName
   */
  const makeVideo = async (fileName: string) => {
    await ffmpeg.exec([
      '-i',
      'video.mp4',
      '-i',
      'merged.mp3',
      '-map',
      '0:v:0',
      '-map',
      '1:a:0',
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-movflags',
      'faststart',
      `${fileName}`,
    ])
  }

  /**
   * File 객체를 mp3로 변환하는 함수
   * @param file 변환할 File 객체
   * @param outputName 출력 mp3 파일 이름
   */
  const fileToMp3 = async (file: File, outputName: string): Promise<void> => {
    const inputName = `input_${Date.now()}${getExtension(file.name)}`

    // 1. ffmpeg에 원본 파일 write
    await ffmpeg.writeFile(inputName, await fetchFile(file))

    // 2. 변환 실행
    await ffmpeg.exec([
      '-i',
      inputName,
      '-ar',
      '44100',
      '-ac',
      '2',
      '-b:a',
      '128k',
      outputName,
    ])

    await ffmpeg.deleteFile(inputName)
  }

  /**
   * 확장자 얻기
   * @param filename
   * @returns
   */
  const getExtension = (filename: string): string => {
    const match = filename.match(/\.[0-9a-z]+$/i)
    return match ? match[0] : '.webm' // fallback 확장자
  }

  const clearOutputFile = useCallback(() => {
    setOutputFile((prev) => {
      if (prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev)
      }
      return ''
    })
  }, [])

  return { outputFile, trans, clearOutputFile }
}

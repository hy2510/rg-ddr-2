import styled from 'styled-components'

import { bgCoinEmpty, iconFullMode, iconSingleMode } from '@utils/Assets'

export const StyledListBoard = styled.div`
  display: grid;
  background-color: #255fec;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 15px 10px;
  position: relative;
  z-index: 0;

  .thumbnail {
    cursor: pointer;
    position: relative;

    &:active {
      transform: scale(0.98);
    }

    .completed-mark-box {
      position: absolute;
      display: flex;
      flex-direction: row;
      width: 100%;
      height: 100%;
      top: -10px;
      left: -5px;

      &::after {
        content: '';
        position: absolute;
        top: 10px;
        left: 5px;
        right: -5px;
        bottom: -10px;
        border-radius: 12px;
      }

      &.d-none {
        display: none;
      }

      &.review {
        &::after {
          background-color: transparent;
        }
      }

      .single-mark {
        width: 60px;
        height: 60px;
        background-image: url(${iconSingleMode});
        background-size: auto 100%;
        background-position: center;
        background-repeat: no-repeat;
        position: relative;
        z-index: 1;
      }

      .full-mark {
        width: 60px;
        height: 60px;
        background-image: url(${iconFullMode});
        background-size: auto 100%;
        background-position: center;
        background-repeat: no-repeat;
        position: relative;
        z-index: 1;
      }
    }

    .wrapper-right {
      position: absolute;
      top: -10px;
      right: -3px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;

      .wrapper-star {
        width: 70px;
        height: 70px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 1;
        gap: 2px;

        img {
          position: absolute;
          top: 0;
          left: 0;
          width: 70px;
          height: 70px;
          z-index: 1;
        }

        span {
          width: 100%;
          text-align: center;
          z-index: 2;
          font-size: 16px;
          color: white;
          line-height: 100%;
          font-family: 'Fredoka', sans-serif;
          font-weight: 600;
        }
      }

      .wrapper-coin {
        width: 50px;
        height: 50px;
        background-image: url(${bgCoinEmpty});
        background-size: auto 100%;
        background-position: center;
        background-repeat: no-repeat;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #cb862a;
        font-size: 14px;
      }
    }

    img {
      display: block;
      width: 100%;
      border-radius: 12px;
      -webkit-user-drag: none;
      user-select: none;
    }
  }
`

export const StyledListBoardReview = styled.div`
  display: grid;
  background-color: #255fec;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 15px 10px;
  position: relative;
  z-index: 0;

  .thumbnail {
    position: relative;

    .completed-mark-box {
      background-color: rgba(0, 0, 0, 0.5);
      border-radius: 0 0 12px 12px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      padding: 10px;
      box-sizing: border-box;

      &::after {
        content: '';
        position: absolute;
        border-radius: 12px 12px 0 0;
      }

      &.d-none {
        display: none;
      }

      &.review {
        &::after {
          background-color: transparent;
        }
      }

      .wrapper-mark {
        border-radius: 0 0 20px 20px;
        display: flex;
        gap: 10px;
        width: 100%;

        .single-mark,
        .full-mark {
          display: flex;
          padding: 10px;
          align-items: flex-start;

          gap: 8px;
          flex: 1 0 0;
          border-radius: 10px;
          cursor: pointer;

          img:first-child {
            height: 44px;
            width: 44px;
            flex-shrink: 0;
            object-fit: contain;
          }

          .text-wrapper {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-start;
            gap: 4px;
            flex: 1;
            min-width: 0;

            img {
              height: auto;
              max-height: 32px;
              width: auto;
              flex-shrink: 0;
              object-fit: contain;
            }
          }

          div.wrapper-text {
            font-size: 14px;
            font-weight: 400;
            letter-spacing: -0.64px;
            border-radius: 10px;
            white-space: nowrap;
            text-align: left;
          }

          div.text-single {
            color: #bf2183;
          }

          div.text-full {
            color: #867601;
          }

          &:active {
            transform: scale(0.98);
          }
        }

        .single-mark {
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #fe80ce;
        }

        .full-mark {
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #ffdf00;
        }
      }

      .order-number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        color: #fff;
        font-size: 16px;
        font-weight: 600;

        &.KA {
          background-color: #e9398f;
        }

        &.KB {
          background-color: #e8864c;
        }

        &.KC {
          background-color: #9e44df;
        }
      }
    }

    .wrapper-star {
      position: absolute;
      top: -10px;
      right: -3px;
      width: 70px;
      height: 70px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1;
      gap: 2px;

      img {
        position: absolute;
        top: 0;
        left: 0;
        width: 70px;
        height: 67px;
        z-index: 1;
      }

      span {
        width: 100%;
        text-align: center;
        z-index: 2;
        font-size: 16px;
        font-weight: 600;
        color: white;
        line-height: 100%;
      }
    }

    img {
      display: block;
      width: 100%;
      border-radius: 12px 12px 0 0;
      -webkit-user-drag: none;
      user-select: none;
    }
  }
`

/**
 * MindTrap - Timer Engine
 * 각 라운드의 타이머를 관리합니다.
 */

import { TIMER_STATES, GAME_CONFIG } from '../utils/constants.js';

/**
 * TimerEngine 클래스
 * 각 라운드에 대한 타이머를 관리하고,
 * 시간 초과 시 콜백을 실행합니다.
 */
export class TimerEngine {
  constructor() {
    /** @type {string} 타이머 상태 */
    this.state = TIMER_STATES.IDLE;

    /** @type {number} 남은 시간 (ms) */
    this.remainingTime = 0;

    /** @type {number} 라운드 시작 시간 */
    this.startTime = 0;

    /** @type {number|null} 타이머 interval ID */
    this.timerInterval = null;

    /** @type {Function|null} 시간 초과 콜백 */
    this.onTimeExpired = null;

    /** @type {Function|null} 타이머 업데이트 콜백 */
    this.onTick = null;
  }

  /**
   * 타이머 이벤트 리스너 등록
   * @param {Function} onTick - 매 틱마다 호출될 함수 (remainingTime 전달)
   * @param {Function} onTimeExpired - 시간 초과 시 호출될 함수
   */
  addListeners(onTick, onTimeExpired) {
    this.onTick = onTick;
    this.onTimeExpired = onTimeExpired;
  }

  /**
   * 타이머 시작
   * @param {number|null} [duration] - 타이머 지속 시간 (ms), null 시 시간 제한 없음
   */
  start(duration = GAME_CONFIG.ROUND_TIME_LIMIT) {
    // 기존 타이머 정리
    this.stop();

    this.state = TIMER_STATES.RUNNING;
    this.duration = duration;
    this.remainingTime = duration;
    this.startTime = Date.now();

    // 시간 제한이 없는 경우 (반응 시간 측정만 수행, 만료 없음)
    if (duration === null || duration === Infinity) {
      this.timerInterval = setInterval(() => {
        if (this.state !== TIMER_STATES.RUNNING) return;
        // 만료 처리 없이 경과 시간만 측정
        if (this.onTick) {
          this.onTick(null); // null 전달 = 시간 제한 없음
        }
      }, 50);
      return;
    }

    this.timerInterval = setInterval(() => {
      if (this.state !== TIMER_STATES.RUNNING) return;

      this.remainingTime = duration - (Date.now() - this.startTime);

      if (this.remainingTime <= 0) {
        this.expire();
        return;
      }

      if (this.onTick) {
        this.onTick(this.remainingTime);
      }
    }, 50); // 50ms 간격으로 업데이트
  }

  /**
   * 타이머 중지 (일시정지)
   */
  pause() {
    if (this.state === TIMER_STATES.RUNNING) {
      this.state = TIMER_STATES.PAUSED;
      this.remainingTime = GAME_CONFIG.ROUND_TIME_LIMIT - (Date.now() - this.startTime);
      this._clearInterval();
    }
  }

  /**
   * 일시정지된 타이머 재개
   */
  resume() {
    if (this.state === TIMER_STATES.PAUSED) {
      this.state = TIMER_STATES.RUNNING;
      const duration = this.duration ?? GAME_CONFIG.ROUND_TIME_LIMIT;

      // 시간 제한 없는 모드
      if (duration === null || duration === Infinity) {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
          if (this.state !== TIMER_STATES.RUNNING) return;
          if (this.onTick) {
            this.onTick(null);
          }
        }, 50);
        return;
      }

      this.startTime = Date.now() - (duration - this.remainingTime);

      this.timerInterval = setInterval(() => {
        if (this.state !== TIMER_STATES.RUNNING) return;

        this.remainingTime = duration - (Date.now() - this.startTime);

        if (this.remainingTime <= 0) {
          this.expire();
          return;
        }

        if (this.onTick) {
          this.onTick(this.remainingTime);
        }
      }, 50);
    }
  }

  /**
   * 타이머 정지 및 리셋
   */
  stop() {
    this._clearInterval();
    this.state = TIMER_STATES.IDLE;
    this.remainingTime = 0;
    this.startTime = 0;
  }

  /**
   * 타이머 만료 처리
   */
  expire() {
    this._clearInterval();
    this.state = TIMER_STATES.EXPIRED;
    this.remainingTime = 0;

    if (this.onTimeExpired) {
      this.onTimeExpired();
    }
  }

  /**
   * 경과 시간 반환
   * @returns {number} 경과된 시간 (ms)
   */
  getElapsedTime() {
    if (this.state === TIMER_STATES.RUNNING) {
      return Date.now() - this.startTime;
    }
    if (this.state === TIMER_STATES.PAUSED) {
      const duration = this.duration ?? GAME_CONFIG.ROUND_TIME_LIMIT;
      if (duration === null || duration === Infinity) {
        return Date.now() - this.startTime;
      }
      return duration - this.remainingTime;
    }
    if (this.state === TIMER_STATES.EXPIRED) {
      return this.duration ?? GAME_CONFIG.ROUND_TIME_LIMIT;
    }
    return 0;
  }

  /**
   * 반응 시간 반환 (현재까지)
   * @returns {number} 반응 시간 (ms)
   */
  getReactionTime() {
    return this.getElapsedTime();
  }

  /**
   * interval 정리
   * @private
   */
  _clearInterval() {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * 현재 타이머 상태의 프로그레스 비율 반환
   * @returns {number} 0~1 사이의 진행도
   */
  getProgress() {
    if (this.state === TIMER_STATES.IDLE) return 0;
    if (this.state === TIMER_STATES.EXPIRED) return 1;
    const duration = this.duration ?? GAME_CONFIG.ROUND_TIME_LIMIT;
    if (duration === null || duration === Infinity) return 0;
    return 1 - this.remainingTime / duration;
  }

  /**
   * 리소스 해제
   */
  destroy() {
    this.stop();
    this.onTick = null;
    this.onTimeExpired = null;
  }
}
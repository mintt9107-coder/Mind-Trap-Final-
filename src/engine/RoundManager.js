/**
 * MindTrap - Round Manager
 * 현재 게임의 라운드 상태를 관리합니다.
 */

import { GAME_CONFIG } from '../utils/constants.js';

/**
 * RoundManager 클래스
 * 라운드 진행 상태, 현재 라운드 정보, 라운드 결과 등을 관리합니다.
 */
export class RoundManager {
  constructor() {
    /** @type {number} 총 라운드 수 */
    this.totalRounds = GAME_CONFIG.TOTAL_ROUNDS;

    /** @type {number} 현재 라운드 번호 (1부터 시작) */
    this.currentRound = 0;

    /** @type {Array} 생성된 질문 세트 */
    this.questions = [];

    /** @type {Array} 라운드별 기록 데이터 */
    this.roundHistory = [];

    /** @type {boolean} 게임 진행 중 여부 */
    this.isGameInProgress = false;
  }

  /**
   * 라운드 매니저 초기화
   * @param {Array} questionSet - 생성된 질문 세트
   */
  initialize(questionSet) {
    this.questions = questionSet;
    this.currentRound = 0;
    this.roundHistory = [];
    this.isGameInProgress = true;
  }

  /**
   * 현재 라운드 정보 반환
   * @returns {{id: number, question: Object, roundNumber: number, totalRounds: number}|null}
   */
  getCurrentRound() {
    if (this.currentRound <= 0 || this.currentRound > this.totalRounds) {
      return null;
    }

    const question = this.questions[this.currentRound - 1];
    return {
      id: question.id,
      question,
      roundNumber: this.currentRound,
      totalRounds: this.totalRounds,
    };
  }

  /**
   * 다음 라운드로 진행
   * @returns {boolean} 다음 라운드가 있는지 여부
   */
  advanceToNextRound() {
    if (!this.isGameInProgress) return false;
    if (this.currentRound >= this.totalRounds) return false;

    this.currentRound++;
    return true;
  }

  /**
   * 라운드 결과 기록
   * @param {Object} roundData - 라운드 결과 데이터
   * @param {number} roundData.round - 라운드 번호
   * @param {Object} roundData.question - 질문 객체
   * @param {string} roundData.choice - 선택한 답변
   * @param {number} roundData.reactionTime - 반응 시간 (ms)
   * @param {boolean} roundData.changedChoice - 선택 변경 여부
   * @param {boolean} roundData.timeOut - 시간 초과 여부
   * @param {number} roundData.timestamp - 타임스탬프
   */
  recordRoundResult(roundData) {
    this.roundHistory.push({
      ...roundData,
      recordedAt: Date.now(),
    });
  }

  /**
   * 라운드 시작
   * @returns {Object|null} 시작하는 라운드의 정보
   */
  startRound() {
    if (!this.isGameInProgress) return null;
    if (this.currentRound >= this.totalRounds) return null;

    this.currentRound++;
    return this.getCurrentRound();
  }

  /**
   * 라운드 종료
   * @returns {boolean} 성공 여부
   */
  endRound() {
    return this.currentRound <= this.totalRounds;
  }

  /**
   * 게임 종료 여부 확인
   * @returns {boolean} 모든 라운드 완료 여부
   */
  isGameComplete() {
    return this.currentRound >= this.totalRounds;
  }

  /**
   * 게임 종료 처리
   */
  finishGame() {
    this.isGameInProgress = false;
  }

  /**
   * 현재까지의 기록 반환
   * @returns {Array} 라운드 히스토리
   */
  getHistory() {
    return [...this.roundHistory];
  }

  /**
   * 특정 라운드의 결과 반환
   * @param {number} roundNumber - 라운드 번호
   * @returns {Object|null} 해당 라운드의 결과
   */
  getRoundResult(roundNumber) {
    return (
      this.roundHistory.find((r) => r.round === roundNumber) || null
    );
  }

  /**
   * 게임 초기 상태로 리셋
   */
  reset() {
    this.currentRound = 0;
    this.questions = [];
    this.roundHistory = [];
    this.isGameInProgress = false;
  }

  /**
   * 진행률 반환 (0~1)
   * @returns {number} 게임 진행률
   */
  getProgress() {
    return this.currentRound / this.totalRounds;
  }

  /**
   * 남은 라운드 수 반환
   * @returns {number} 남은 라운드
   */
  getRemainingRounds() {
    return this.totalRounds - this.currentRound;
  }

  /**
   * 통계 데이터 생성 (MVP용 간단 통계)
   * @returns {Object} 요약 통계
   */
  getStats() {
    const totalRounds = this.roundHistory.length;
    const totalTimeOuts = this.roundHistory.filter((r) => r.timeOut).length;
    const clickedRounds = this.roundHistory.filter((r) => !r.timeOut && r.reactionTime > 0);
    const avgReactionTime =
      clickedRounds.length > 0
        ? clickedRounds.reduce((sum, r) => sum + r.reactionTime, 0) /
          clickedRounds.length
        : 0;

    const choiceCounts = {};
    this.roundHistory.forEach((r) => {
      const choiceKey = r.choice;
      choiceCounts[choiceKey] = (choiceCounts[choiceKey] || 0) + 1;
    });

    return {
      totalRounds,
      totalTimeOuts,
      avgReactionTime: Math.round(avgReactionTime),
      choiceDistribution: choiceCounts,
    };
  }
}

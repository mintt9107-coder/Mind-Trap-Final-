/**
 * MindTrap - Game Service
 * 게임 데이터 관리를 담당합니다.
 * MVP에서는 메모리에 저장하며, 추후 Firebase 연동 준비를 위한 인터페이스를 제공합니다.
 */

import { createTimestamp } from '../utils/helpers.js';

/**
 * GameService 클래스
 * 게임 세션 데이터를 관리하고 저장/로드를 담당합니다.
 */
export class GameService {
  constructor() {
    /** @type {Object|null} 현재 게임 세션 데이터 */
    this.currentSession = null;

    /** @type {Array} 저장된 게임 기록들 */
    this.gameHistory = [];
  }

  /**
   * 새 게임 세션 생성
   * @param {Array} questions - 질문 세트
   * @returns {Object} 생성된 세션
   */
  createSession(questions) {
    this.currentSession = {
      id: this._generateSessionId(),
      startedAt: createTimestamp(),
      endedAt: null,
      questions,
      rounds: [],
      stats: {
        totalTimeOuts: 0,
        totalReactionTime: 0,
        choicePatterns: {},
      },
      status: 'active',
    };

    return this.currentSession;
  }

  /**
   * 현재 세션에 라운드 결과 추가
   * @param {Object} roundData - 라운드 결과 데이터
   */
  recordRound(roundData) {
    if (!this.currentSession) {
      console.warn('No active session found');
      return;
    }

    const roundRecord = {
      round: roundData.round,
      question: roundData.question,
      choice: roundData.choice,
      reactionTime: roundData.reactionTime,
      changedChoice: roundData.changedChoice || false,
      timeOut: roundData.timeOut || false,
      timestamp: roundData.timestamp || createTimestamp(),
    };

    this.currentSession.rounds.push(roundRecord);

    // 통계 업데이트
    this.currentSession.stats.totalReactionTime += roundRecord.reactionTime;
    if (roundRecord.timeOut) {
      this.currentSession.stats.totalTimeOuts++;
    }

    const choiceKey = roundRecord.choice;
    this.currentSession.stats.choicePatterns[choiceKey] =
      (this.currentSession.stats.choicePatterns[choiceKey] || 0) + 1;
  }

  /**
   * 게임 세션 종료
   */
  endSession() {
    if (!this.currentSession) {
      console.warn('No active session to end');
      return;
    }

    this.currentSession.endedAt = createTimestamp();
    this.currentSession.status = 'completed';

    // 세션을 히스토리에 추가
    this.gameHistory.push(this.currentSession);

    // 현재 세션 참조 해제
    const completedSession = this.currentSession;
    this.currentSession = null;

    return completedSession;
  }

  /**
   * 현재 세션의 게임 데이터 반환
   * @returns {Object|null} 현재 게임 데이터
   */
  getGameData() {
    if (!this.currentSession) {
      return null;
    }

    const rounds = this.currentSession.rounds.length;
    const clickedRounds = this.currentSession.rounds.filter((r) => !r.timeOut && r.reactionTime > 0);
    const avgReactionTime =
      clickedRounds.length > 0
        ? clickedRounds.reduce((sum, r) => sum + r.reactionTime, 0) / clickedRounds.length
        : 0;

    return {
      sessionId: this.currentSession.id,
      currentRound: rounds,
      totalRounds: this.currentSession.questions.length,
      rounds: this.currentSession.rounds,
      stats: {
        ...this.currentSession.stats,
        avgReactionTime: Math.round(avgReactionTime),
      },
      status: this.currentSession.status,
    };
  }

  /**
   * 완료된 세션의 결과 요약 반환
   * @param {Object} session - 완료된 세션
   * @returns {Object} 결과 요약
   */
  getResultSummary(session) {
    const rounds = session.rounds;
    const totalRounds = rounds.length;
    const timeOutRounds = rounds.filter((r) => r.timeOut).length;
    const clickedRounds = rounds.filter((r) => !r.timeOut && r.reactionTime > 0);
    const avgReactionTime =
      clickedRounds.length > 0
        ? clickedRounds.reduce((sum, r) => sum + r.reactionTime, 0) / clickedRounds.length
        : 0;

    return {
      totalRounds,
      timeOutRounds,
      avgReactionTime: Math.round(avgReactionTime),
      duration: session.endedAt - session.startedAt,
      choicePatterns: session.stats.choicePatterns,
    };
  }

  /**
   * 저장된 게임 기록들 반환
   * @returns {Array} 게임 히스토리
   */
  getHistory() {
    return [...this.gameHistory];
  }

  /**
   * 특정 세션 조회
   * @param {string} sessionId - 세션 ID
   * @returns {Object|null} 해당 세션
   */
  getSession(sessionId) {
    const currentSession = this.gameHistory.find(
      (s) => s.id === sessionId || this.currentSession?.id === sessionId
    );
    if (currentSession) return currentSession;

    return (
      this.gameHistory.find((s) => s.id === sessionId) || null
    );
  }

  /**
   * 모든 저장된 데이터 삭제
   */
  clearAllData() {
    this.gameHistory = [];
    this.currentSession = null;
  }

  /**
   * 고유한 세션 ID 생성
   * @returns {string} 세션 ID
   * @private
   */
  _generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `session_${timestamp}_${random}`;
  }
}

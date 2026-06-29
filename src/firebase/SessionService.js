/**
 * MindTrap - Session Service
 * 게임 세션 관리를 담당합니다.
 * 각 게임마다 새로운 Session을 생성하고 저장합니다.
 */

import { FirestoreService } from './FirestoreService.js';
import { AuthenticationService } from './AuthenticationService.js';

/**
 * SessionService 클래스
 * 게임 세션의 생성, 저장, 조회를 관리합니다.
 */
export class SessionService {
  constructor() {
    /** @type {FirestoreService} Firestore 서비스 */
    this.firestoreService = new FirestoreService();

    /** @type {AuthenticationService} 인증 서비스 */
    this.authService = new AuthenticationService();

    /** @type {Object|null} 현재 세션 */
    this.currentSession = null;

    /** @type {boolean} 초기화 완료 여부 */
    this.isInitialized = false;
  }

  /**
   * 세션 서비스 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    await this.firestoreService.initialize();
    await this.authService.initialize();

    this.isInitialized = true;
    return true;
  }

  /**
   * 새 세션 생성
   * @returns {Promise<Object>} 생성된 세션
   */
  async createSession() {
    const uid = this.authService.getCurrentUID();
    if (!uid) {
      console.error('사용자가 로그인되어 있지 않습니다.');
      return null;
    }

    const sessionId = this._generateSessionId();
    const now = Date.now();

    this.currentSession = {
      sessionId,
      uid,
      createdAt: now,
      startedAt: now,
      endedAt: null,
      duration: 0,
      playerModelSnapshot: null,
      gameResult: null,
      aiPredictionAccuracy: 0,
      learningProgress: 0,
      summary: null,
      status: 'active',
    };

    return this.currentSession;
  }

  /**
   * 세션 ID 생성
   * @returns {string} 세션 ID
   * @private
   */
  _generateSessionId() {
    return 'session_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 세션 업데이트
   * @param {Object} updates - 업데이트할 데이터
   * @returns {Promise<boolean>} 성공 여부
   */
  async updateSession(updates) {
    if (!this.currentSession) {
      console.warn('활성 세션이 없습니다.');
      return false;
    }

    this.currentSession = {
      ...this.currentSession,
      ...updates,
    };

    return true;
  }

  /**
   * 세션 완료 처리
   * @param {Object} gameData - 게임 데이터
   * @returns {Promise<Object>} 저장된 세션
   */
  async completeSession(gameData) {
    if (!this.currentSession) {
      console.warn('활성 세션이 없습니다.');
      return null;
    }

    const now = Date.now();

    // 세션 데이터 완성
    this.currentSession.endedAt = now;
    this.currentSession.duration = now - this.currentSession.startedAt;
    this.currentSession.playerModelSnapshot = gameData.playerModelSnapshot;
    this.currentSession.gameResult = gameData.gameResult;
    this.currentSession.aiPredictionAccuracy = gameData.aiPredictionAccuracy;
    this.currentSession.learningProgress = gameData.learningProgress;
    this.currentSession.summary = gameData.summary;
    this.currentSession.status = 'completed';

    // Firestore에 저장
    const saved = await this._saveSession(this.currentSession);

    if (saved) {
      const savedSession = { ...this.currentSession };
      this.currentSession = null;
      return savedSession;
    }

    return null;
  }

  /**
   * 세션 저장
   * @param {Object} session - 저장할 세션
   * @returns {Promise<boolean>} 성공 여부
   * @private
   */
  async _saveSession(session) {
    const uid = session.uid;
    const sessionId = session.sessionId;

    const path = `users/${uid}/sessions`;
    const success = await this.firestoreService.setDocument(path, sessionId, session);

    if (!success) {
      console.error('세션 저장 실패, 로컬에 임시 저장');
      this._saveToLocal(session);
    }

    return success;
  }

  /**
   * 로컬에 임시 저장
   * @param {Object} session - 저장할 세션
   * @private
   */
  _saveToLocal(session) {
    const pendingKey = 'mindtrap_pending_sessions';
    const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
    pending.push(session);
    localStorage.setItem(pendingKey, JSON.stringify(pending));
  }

  /**
   * 현재 세션 반환
   * @returns {Object|null} 현재 세션
   */
  getCurrentSession() {
    return this.currentSession;
  }

  /**
   * 사용자의 모든 세션 조회
   * @returns {Promise<Array>} 세션 배열
   */
  async getUserSessions() {
    const uid = this.authService.getCurrentUID();
    if (!uid) {
      return [];
    }

    const path = `users/${uid}/sessions`;
    const sessions = await this.firestoreService.getCollection(path);

    // 최신순 정렬
    return sessions.sort((a, b) => (b.data?.createdAt || 0) - (a.data?.createdAt || 0));
  }

  /**
   * 최근 세션 조회
   * @param {number} limit - 가져올 세션 수
   * @returns {Promise<Array>} 세션 배열
   */
  async getRecentSessions(limit = 5) {
    const sessions = await this.getUserSessions();
    return sessions.slice(0, limit);
  }

  /**
   * 특정 세션 조회
   * @param {string} sessionId - 세션 ID
   * @returns {Promise<Object|null>} 세션 데이터
   */
  async getSession(sessionId) {
    const uid = this.authService.getCurrentUID();
    if (!uid) {
      return null;
    }

    const path = `users/${uid}/sessions`;
    const result = await this.firestoreService.getDocument(path, sessionId);

    return result.exists ? result.data : null;
  }

  /**
   * 세션 통계 계산
   * @returns {Promise<Object>} 통계 데이터
   */
  async getSessionStatistics() {
    const sessions = await this.getUserSessions();

    if (sessions.length === 0) {
      return {
        totalGames: 0,
        totalPlayTime: 0,
        avgPredictionAccuracy: 0,
        avgLearningProgress: 0,
      };
    }

    const completedSessions = sessions.filter((s) => s.data?.status === 'completed');

    let totalPlayTime = 0;
    let totalPredictionAccuracy = 0;
    let totalLearningProgress = 0;

    completedSessions.forEach((session) => {
      totalPlayTime += session.data.duration || 0;
      totalPredictionAccuracy += session.data.aiPredictionAccuracy || 0;
      totalLearningProgress += session.data.learningProgress || 0;
    });

    const count = completedSessions.length;

    return {
      totalGames: count,
      totalPlayTime,
      avgPlayTime: count > 0 ? totalPlayTime / count : 0,
      avgPredictionAccuracy: count > 0 ? totalPredictionAccuracy / count : 0,
      avgLearningProgress: count > 0 ? totalLearningProgress / count : 0,
    };
  }

  /**
   * 세션 서비스 상태 반환
   * @returns {Object} 상태 정보
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasActiveSession: this.currentSession !== null,
      currentSessionId: this.currentSession?.sessionId || null,
    };
  }
}
/**
 * MindTrap - Firebase Manager
 * 모든 Firebase 서비스를 통합 관리합니다.
 */

import { FirebaseService } from './FirebaseService.js';
import { AuthenticationService } from './AuthenticationService.js';
import { FirestoreService } from './FirestoreService.js';
import { SessionService } from './SessionService.js';
import { MemoryEngine } from './MemoryEngine.js';
import { ReportService } from './ReportService.js';
import { SyncManager } from './SyncManager.js';

/**
 * FirebaseManager 클래스
 * 모든 Firebase 서비스의 단일 진입점입니다.
 */
export class FirebaseManager {
  constructor() {
    /** @type {FirebaseService} Firebase 초기화 서비스 */
    this.firebase = new FirebaseService();

    /** @type {AuthenticationService} 인증 서비스 */
    this.auth = new AuthenticationService();

    /** @type {FirestoreService} Firestore 서비스 */
    this.firestore = new FirestoreService();

    /** @type {SessionService} 세션 서비스 */
    this.session = new SessionService();

    /** @type {MemoryEngine} 메모리 엔진 */
    this.memory = new MemoryEngine();

    /** @type {ReportService} 리포트 서비스 */
    this.report = new ReportService();

    /** @type {SyncManager} 동기화 매니저 */
    this.sync = new SyncManager();

    /** @type {boolean} 초기화 완료 여부 */
    this.isInitialized = false;
  }

  /**
   * Firebase Manager 초기화
   * 모든 서비스를 순차적으로 초기화합니다.
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    console.log('FirebaseManager: 초기화 시작...');

    try {
      // 1. Firebase 앱 초기화
      await this.firebase.initialize();

      // 2. 인증 서비스 초기화
      await this.auth.initialize();

      // 3. 익명 로그인
      const loginResult = await this.auth.signInAnonymously();
      if (loginResult.success) {
        console.log('FirebaseManager: 로그인 성공, UID:', this.auth.getCurrentUID());
      } else {
        console.warn('FirebaseManager: 로그인 실패, 로컬 모드로 진행');
      }

      // 4. Firestore 초기화
      await this.firestore.initialize();

      // 5. 세션 서비스 초기화
      await this.session.initialize();

      // 6. 메모리 엔진 초기화
      await this.memory.initialize();

      // 7. 리포트 서비스 초기화
      await this.report.initialize();

      // 8. 동기화 매니저 초기화
      await this.sync.initialize();

      this.isInitialized = true;
      console.log('FirebaseManager: 초기화 완료');
      return true;
    } catch (error) {
      console.error('FirebaseManager: 초기화 실패', error);
      return false;
    }
  }

  /**
   * 게임 시작 시 호출
   * 새 세션을 생성합니다.
   * @returns {Promise<Object>} 생성된 세션
   */
  async startGame() {
    return this.session.createSession();
  }

  /**
   * 게임 종료 시 호출
   * 세션 완료, PlayerModel 저장, Memory 업데이트, Report 생성을 수행합니다.
   * @param {Object} gameData - 게임 데이터
   * @returns {Promise<Object>} 완료 결과
   */
  async endGame(gameData) {
    const results = {
      session: null,
      memory: null,
      report: null,
      sync: null,
    };

    try {
      // 1. 세션 저장
      results.session = await this.session.completeSession({
        playerModelSnapshot: gameData.playerModelSnapshot,
        gameResult: gameData.gameResult,
        aiPredictionAccuracy: gameData.aiPredictionAccuracy,
        learningProgress: gameData.learningProgress,
        summary: gameData.summary,
      });

      // 2. Memory 업데이트
      results.memory = await this.memory.updateMemories(gameData.playerModelSnapshot);

      // 3. AI Analysis Report 생성 및 저장
      results.report = await this.report.generateReport(
        gameData.playerModelSnapshot,
        gameData.patterns || [],
        gameData.learningSummary || {}
      );

      // 4. 동기화 트리거
      results.sync = await this.sync.forceSync();

      console.log('FirebaseManager: 게임 종료 처리 완료');
    } catch (error) {
      console.error('FirebaseManager: 게임 종료 처리 중 오류', error);
    }

    return results;
  }

  /**
   * AI의 기억 조회
   * @returns {Array} 메모리 배열
   */
  getAIMemories() {
    return this.memory.getMemories();
  }

  /**
   * 메모리 리셋
   * AI의 모든 기억을 삭제합니다.
   * @returns {Promise<boolean>} 성공 여부
   */
  async resetMemory() {
    return this.memory.resetMemories();
  }

  /**
   * 사용자 세션 조회
   * @returns {Promise<Array>} 세션 배열
   */
  async getUserSessions() {
    return this.session.getUserSessions();
  }

  /**
   * 사용자 리포트 조회
   * @returns {Promise<Array>} 리포트 배열
   */
  async getUserReports() {
    return this.report.getUserReports();
  }

  /**
   * 리포트 비교
   * @returns {Promise<Object>} 비교 결과
   */
  async compareReports() {
    return this.report.compareReports();
  }

  /**
   * 수동 동기화
   * @returns {Promise<Object>} 동기화 결과
   */
  async syncNow() {
    return this.sync.forceSync();
  }

  /**
   * Firebase Manager 상태 반환
   * @returns {Object} 상태 정보
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      firebase: this.firebase.getStatus(),
      auth: this.auth.getStatus(),
      firestore: this.firestore.getStatus(),
      session: this.session.getStatus(),
      memory: this.memory.getStatus(),
      report: this.report.getStatus(),
      sync: this.sync.getStatus(),
    };
  }

  /**
   * 정리
   */
  destroy() {
    this.sync.destroy();
  }
}
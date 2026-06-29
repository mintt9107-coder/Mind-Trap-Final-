/**
 * MindTrap - Sync Manager
 * 로컬에 임시 저장된 데이터를 Firebase와 동기화합니다.
 * 네트워크 상태에 따라 자동으로 동기화를 수행합니다.
 */

import { FirestoreService } from './FirestoreService.js';
import { AuthenticationService } from './AuthenticationService.js';

/**
 * SyncManager 클래스
 * 오프라인 데이터와 Firebase 간의 동기화를 관리합니다.
 */
export class SyncManager {
  constructor() {
    /** @type {FirestoreService} Firestore 서비스 */
    this.firestoreService = new FirestoreService();

    /** @type {AuthenticationService} 인증 서비스 */
    this.authService = new AuthenticationService();

    /** @type {boolean} 초기화 완료 여부 */
    this.isInitialized = false;

    /** @type {boolean} 동기화 진행 중 여부 */
    this.isSyncing = false;

    /** @type {number} 동기화 간격 (ms) */
    this.syncInterval = 30000; // 30초

    /** @type {number|null} 동기화 타이머 ID */
    this.syncTimerId = null;

    /** @type {boolean} 온라인 상태 */
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Sync Manager 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    await this.firestoreService.initialize();
    await this.authService.initialize();

    // 온라인/오프라인 이벤트 리스너 등록
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this._handleOnline());
      window.addEventListener('offline', () => this._handleOffline());
    }

    // 주기적 동기화 시작
    this._startPeriodicSync();

    // 초기 동기화 수행
    await this.sync();

    this.isInitialized = true;
    return true;
  }

  /**
   * 온라인 상태 처리
   * @private
   */
  _handleOnline() {
    console.log('SyncManager: 온라인 상태 감지');
    this.isOnline = true;
    this.sync();
  }

  /**
   * 오프라인 상태 처리
   * @private
   */
  _handleOffline() {
    console.log('SyncManager: 오프라인 상태 감지');
    this.isOnline = false;
  }

  /**
   * 주기적 동기화 시작
   * @private
   */
  _startPeriodicSync() {
    if (this.syncTimerId) {
      clearInterval(this.syncTimerId);
    }

    this.syncTimerId = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.sync();
      }
    }, this.syncInterval);
  }

  /**
   * 주기적 동기화 중지
   */
  stopPeriodicSync() {
    if (this.syncTimerId) {
      clearInterval(this.syncTimerId);
      this.syncTimerId = null;
    }
  }

  /**
   * 전체 데이터 동기화
   * @returns {Promise<Object>} 동기화 결과
   */
  async sync() {
    if (!this.isOnline) {
      return { success: false, reason: 'offline' };
    }

    if (this.isSyncing) {
      return { success: false, reason: 'already_syncing' };
    }

    this.isSyncing = true;
    const result = {
      sessions: 0,
      reports: 0,
      errors: [],
    };

    try {
      // 대기 중인 세션 동기화
      result.sessions = await this._syncPendingSessions();

      // 대기 중인 리포트 동기화
      result.reports = await this._syncPendingReports();

      console.log(`SyncManager: 동기화 완료 (세션: ${result.sessions}, 리포트: ${result.reports})`);
    } catch (error) {
      console.error('SyncManager: 동기화 중 오류', error);
      result.errors.push(error.message);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * 대기 중인 세션 동기화
   * @returns {Promise<number>} 동기화된 세션 수
   * @private
   */
  async _syncPendingSessions() {
    const pendingKey = 'mindtrap_pending_sessions';
    const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');

    if (pending.length === 0) {
      return 0;
    }

    const uid = this.authService.getCurrentUID();
    if (!uid) {
      return 0;
    }

    let synced = 0;
    const remaining = [];

    for (const session of pending) {
      try {
        const path = `users/${uid}/sessions`;
        const success = await this.firestoreService.setDocument(
          path,
          session.sessionId,
          session
        );

        if (success) {
          synced++;
        } else {
          remaining.push(session);
        }
      } catch (error) {
        console.error('세션 동기화 실패:', error);
        remaining.push(session);
      }
    }

    // 남은 데이터 저장
    localStorage.setItem(pendingKey, JSON.stringify(remaining));

    return synced;
  }

  /**
   * 대기 중인 리포트 동기화
   * @returns {Promise<number>} 동기화된 리포트 수
   * @private
   */
  async _syncPendingReports() {
    const pendingKey = 'mindtrap_pending_reports';
    const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');

    if (pending.length === 0) {
      return 0;
    }

    const uid = this.authService.getCurrentUID();
    if (!uid) {
      return 0;
    }

    let synced = 0;
    const remaining = [];

    for (const report of pending) {
      try {
        const path = `users/${uid}/reports`;
        const success = await this.firestoreService.setDocument(
          path,
          report.reportId,
          report
        );

        if (success) {
          synced++;
        } else {
          remaining.push(report);
        }
      } catch (error) {
        console.error('리포트 동기화 실패:', error);
        remaining.push(report);
      }
    }

    // 남은 데이터 저장
    localStorage.setItem(pendingKey, JSON.stringify(remaining));

    return synced;
  }

  /**
   * 대기 중인 데이터 확인
   * @returns {Object} 대기 중인 데이터 수
   */
  getPendingCount() {
    const pendingSessions = JSON.parse(
      localStorage.getItem('mindtrap_pending_sessions') || '[]'
    );
    const pendingReports = JSON.parse(
      localStorage.getItem('mindtrap_pending_reports') || '[]'
    );

    return {
      sessions: pendingSessions.length,
      reports: pendingReports.length,
      total: pendingSessions.length + pendingReports.length,
    };
  }

  /**
   * 수동 동기화 트리거
   * @returns {Promise<Object>} 동기화 결과
   */
  async forceSync() {
    return this.sync();
  }

  /**
   * Sync Manager 상태 반환
   * @returns {Object} 상태 정보
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pending: this.getPendingCount(),
      syncInterval: this.syncInterval,
    };
  }

  /**
   * 정리
   */
  destroy() {
    this.stopPeriodicSync();

    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this._handleOnline);
      window.removeEventListener('offline', this._handleOffline);
    }
  }
}
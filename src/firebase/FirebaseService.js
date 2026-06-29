import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

/**
 * MindTrap - Firebase Service
 * Firebase 초기화 및 관리를 담당합니다.
 * 환경 변수에서 설정을 로드합니다.
 */

/**
 * FirebaseService 클래스
 * Firebase 앱 초기화 및 서비스 인스턴스 관리를 수행합니다.
 */
export class FirebaseService {
  constructor() {
    /** @type {Object|null} Firebase 앱 인스턴스 */
    this.app = null;

    /** @type {Object|null} Firestore 인스턴스 */
    this.firestore = null;

    /** @type {Object|null} Auth 인스턴스 */
    this.auth = null;

    /** @type {Object|null} Analytics 인스턴스 */
    this.analytics = null;

    /** @type {boolean} 초기화 완료 여부 */
    this.isInitialized = false;

    /** @type {Object} Firebase 설정 */
    this.config = this._loadConfig();
  }

  /**
   * Firebase 설정 로드
   * 환경 변수 또는 전역 설정에서 로드합니다.
   * @returns {Object} Firebase 설정
   * @private
   */
  _loadConfig() {
    // 전역 설정에서 Firebase 설정 확인
    if (typeof window !== 'undefined' && window.MINDTRAP_CONFIG) {
      return window.MINDTRAP_CONFIG.firebase || null;
    }

    // 기본 설정 (개발용)
    return {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
    };
  }

  /**
   * Firebase 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    if (!this.config || !this.config.apiKey) {
      console.warn('Firebase 설정이 없습니다. 로컬 모드로 동작합니다.');
      return false;
    }

    try {
      // Firebase 앱 초기화
      this.app = initializeApp(this.config);
      this.firestore = getFirestore(this.app);
      this.auth = getAuth(this.app);

      // Analytics는 선택적
      try {
        if (await isSupported()) {
          this.analytics = getAnalytics(this.app);
        }
      } catch (e) {
        console.warn('Analytics 초기화 실패:', e.message);
      }

      this.isInitialized = true;
      console.log('Firebase 초기화 완료');
      return true;
    } catch (error) {
      console.error('Firebase 초기화 실패:', error);
      return false;
    }
  }

  /**
   * Firestore 인스턴스 반환
   * @returns {Object|null} Firestore 인스턴스
   */
  getFirestore() {
    return this.firestore;
  }

  /**
   * Auth 인스턴스 반환
   * @returns {Object|null} Auth 인스턴스
   */
  getAuth() {
    return this.auth;
  }

  /**
   * Analytics 인스턴스 반환
   * @returns {Object|null} Analytics 인스턴스
   */
  getAnalytics() {
    return this.analytics;
  }

  /**
   * Firebase 설정 업데이트
   * @param {Object} config - 새 Firebase 설정
   */
  updateConfig(config) {
    this.config = config;
    this.isInitialized = false;
  }

  /**
   * 초기화 상태 반환
   * @returns {boolean} 초기화 완료 여부
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Firebase 상태 반환
   * @returns {Object} 상태 정보
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasConfig: !!this.config?.apiKey,
      hasFirestore: !!this.firestore,
      hasAuth: !!this.auth,
      hasAnalytics: !!this.analytics,
    };
  }
}

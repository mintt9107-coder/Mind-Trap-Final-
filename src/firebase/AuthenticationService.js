/**
 * MindTrap - Authentication Service
 * Firebase Authentication을 관리합니다.
 * Interface 기반으로 설계되어 다양한 로그인 방식을 지원합니다.
 */

import { FirebaseService } from './FirebaseService.js';
import {
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signInAnonymously as firebaseSignInAnonymously,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';

/**
 * @interface AuthProvider
 * 로그인 프로바이더 인터페이스
 */

/**
 * AuthenticationService 클래스
 * Firebase Authentication을 통한 사용자 인증을 관리합니다.
 */
export class AuthenticationService {
  constructor() {
    /** @type {FirebaseService} Firebase 서비스 */
    this.firebaseService = new FirebaseService();

    /** @type {Object|null} 현재 사용자 */
    this.currentUser = null;

    /** @type {boolean} 초기화 완료 여부 */
    this.isInitialized = false;

    /** @type {Array<Function>} 인증 상태 변경 리스너 */
    this.authStateListeners = [];

    /** @type {Object} 로컬 모드 사용자 (Firebase 없을 때) */
    this.localUser = null;
  }

  /**
   * 인증 서비스 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    // Firebase 초기화
    const firebaseReady = await this.firebaseService.initialize();

    if (firebaseReady) {
      const auth = this.firebaseService.getAuth();
      
      onAuthStateChanged(auth, (user) => {
        this.currentUser = user;
        this._notifyAuthStateChange(user);
      });

      this.isInitialized = true;
      return true;
    } else {
      // Firebase 없으면 로컬 모드
      console.warn('Authentication: 로컬 모드로 동작합니다.');
      this._initializeLocalMode();
      return true;
    }
  }

  /**
   * 로컬 모드 초기화
   * Firebase가 없을 때 로컬 사용자를 생성합니다.
   * @private
   */
  _initializeLocalMode() {
    const storedUid = localStorage.getItem('mindtrap_local_uid');
    
    if (storedUid) {
      this.localUser = {
        uid: storedUid,
        isAnonymous: true,
        isLocal: true,
      };
    } else {
      // 새 UID 생성
      const newUid = this._generateUID();
      this.localUser = {
        uid: newUid,
        isAnonymous: true,
        isLocal: true,
      };
      localStorage.setItem('mindtrap_local_uid', newUid);
    }

    this.currentUser = this.localUser;
    this.isInitialized = true;
    this._notifyAuthStateChange(this.localUser);
  }

  /**
   * UID 생성
   * @returns {string} 생성된 UID
   * @private
   */
  _generateUID() {
    return 'local_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Anonymous 로그인
   * @returns {Promise<Object>} 로그인 결과
   */
  async signInAnonymously() {
    if (!this.firebaseService.isReady()) {
      // 로컬 모드
      return {
        success: true,
        user: this.localUser,
        isLocal: true,
      };
    }

    try {
      const auth = this.firebaseService.getAuth();
      
      const result = await firebaseSignInAnonymously(auth);
      
      return {
        success: true,
        user: result.user,
        isLocal: false,
      };
    } catch (error) {
      console.error('Anonymous 로그인 실패:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Google 로그인
   * @returns {Promise<Object>} 로그인 결과
   */
  async signInWithGoogle() {
    if (!this.firebaseService.isReady()) {
      return {
        success: false,
        error: 'Firebase가 초기화되지 않았습니다.',
      };
    }

    try {
      const auth = this.firebaseService.getAuth();
      const provider = new GoogleAuthProvider();
      
      const result = await signInWithPopup(auth, provider);
      
      return {
        success: true,
        user: result.user,
        isLocal: false,
      };
    } catch (error) {
      console.error('Google 로그인 실패:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Apple 로그인
   * @returns {Promise<Object>} 로그인 결과
   */
  async signInWithApple() {
    if (!this.firebaseService.isReady()) {
      return {
        success: false,
        error: 'Firebase가 초기화되지 않았습니다.',
      };
    }

    try {
      const auth = this.firebaseService.getAuth();
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      
      const result = await signInWithPopup(auth, provider);
      
      return {
        success: true,
        user: result.user,
        isLocal: false,
      };
    } catch (error) {
      console.error('Apple 로그인 실패:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 로그아웃
   * @returns {Promise<Object>} 로그아웃 결과
   */
  async signOut() {
    if (!this.firebaseService.isReady()) {
      // 로컬 모드는 로그아웃 불가 (계정 유지)
      return {
        success: true,
        message: '로컬 모드에서는 로그아웃이 지원되지 않습니다.',
      };
    }

    try {
      const auth = this.firebaseService.getAuth();
      
      await firebaseSignOut(auth);
      this.currentUser = null;
      
      return {
        success: true,
      };
    } catch (error) {
      console.error('로그아웃 실패:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 현재 사용자 UID 반환
   * @returns {string|null} 현재 사용자 UID
   */
  getCurrentUID() {
    return this.currentUser?.uid || null;
  }

  /**
   * 현재 사용자 정보 반환
   * @returns {Object|null} 현재 사용자 정보
   */
  getCurrentUser() {
    if (!this.currentUser) return null;

    return {
      uid: this.currentUser.uid,
      isAnonymous: this.currentUser.isAnonymous ?? true,
      isLocal: this.currentUser.isLocal ?? false,
      email: this.currentUser.email || null,
      displayName: this.currentUser.displayName || null,
    };
  }

  /**
   * 로그인 상태 확인
   * @returns {boolean} 로그인되어 있는지
   */
  isLoggedIn() {
    return this.currentUser !== null;
  }

  /**
   * 인증 상태 변경 리스너 등록
   * @param {Function} callback - 인증 상태 변경 시 호출될 콜백
   * @returns {Function} 리스너 제거 함수
   */
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);

    // 현재 상태 즉시 알림
    if (this.currentUser) {
      callback(this.currentUser);
    }

    // 제거 함수 반환
    return () => {
      this.authStateListeners = this.authStateListeners.filter(
        (listener) => listener !== callback
      );
    };
  }

  /**
   * 인증 상태 변경 알림
   * @param {Object} user - 사용자 객체
   * @private
   */
  _notifyAuthStateChange(user) {
    this.authStateListeners.forEach((callback) => {
      try {
        callback(user);
      } catch (error) {
        console.error('Auth state listener error:', error);
      }
    });
  }

  /**
   * 로컬 계정 삭제
   * @returns {Object} 삭제 결과
   */
  deleteLocalAccount() {
    if (this.localUser) {
      localStorage.removeItem('mindtrap_local_uid');
      this.localUser = null;
      this.currentUser = null;
      
      // 새 로컬 사용자 생성
      this._initializeLocalMode();
      
      return { success: true };
    }
    
    return { success: false, error: '로컬 사용자가 없습니다.' };
  }

  /**
   * 인증 서비스 상태 반환
   * @returns {Object} 상태 정보
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isLoggedIn: this.isLoggedIn(),
      isLocalMode: !this.firebaseService.isReady(),
      currentUID: this.getCurrentUID(),
      firebaseStatus: this.firebaseService.getStatus(),
    };
  }
}

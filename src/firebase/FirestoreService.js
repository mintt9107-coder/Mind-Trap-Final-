/**
 * MindTrap - Firestore Service
 * Firestore 데이터베이스 작업을 관리합니다.
 */

import { FirebaseService } from './FirebaseService.js';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot as subscribeToSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

/**
 * FirestoreService 클래스
 * Firestore CRUD 작업을 수행합니다.
 */
export class FirestoreService {
  constructor() {
    /** @type {FirebaseService} Firebase 서비스 */
    this.firebaseService = new FirebaseService();

    /** @type {boolean} 초기화 완료 여부 */
    this.isInitialized = false;

    /** @type {boolean} 로컬 모드 여부 */
    this.isLocalMode = false;

    /** @type {Map} 로컬 데이터 저장소 */
    this.localData = new Map();
  }

  /**
   * Firestore 서비스 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    const firebaseReady = await this.firebaseService.initialize();

    if (!firebaseReady) {
      console.warn('Firestore: 로컬 모드로 동작합니다.');
      this.isLocalMode = true;
      this._loadLocalData();
    }

    this.isInitialized = true;
    return true;
  }

  /**
   * 로컬 데이터 로드
   * @private
   */
  _loadLocalData() {
    const stored = localStorage.getItem('mindtrap_firestore');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.localData = new Map(Object.entries(data));
      } catch (error) {
        console.error('로컬 데이터 로드 실패:', error);
        this.localData = new Map();
      }
    }
  }

  /**
   * 로컬 데이터 저장
   * @private
   */
  _saveLocalData() {
    const data = Object.fromEntries(this.localData);
    localStorage.setItem('mindtrap_firestore', JSON.stringify(data));
  }

  /**
   * 컬렉션 참조 생성
   * @param {string} collectionPath - 컬렉션 경로
   * @returns {Object} 컬렉션 참조
   */
  async collection(collectionPath) {
    if (this.isLocalMode) {
      return {
        path: collectionPath,
        doc: (docId) => this._createLocalDocRef(collectionPath, docId),
        add: async (data) => this._localAdd(collectionPath, data),
      };
    }

    const db = this.firebaseService.getFirestore();
    return collection(db, collectionPath);
  }

  /**
   * 로컬 도큐먼트 참조 생성
   * @param {string} collectionPath - 컬렉션 경로
   * @param {string} docId - 도큐먼트 ID
   * @returns {Object} 도큐먼트 참조
   * @private
   */
  _createLocalDocRef(collectionPath, docId) {
    return {
      path: `${collectionPath}/${docId}`,
      id: docId,
      get: async () => this._localGet(collectionPath, docId),
      set: async (data) => this._localSet(collectionPath, docId, data),
      update: async (data) => this._localUpdate(collectionPath, docId, data),
      delete: async () => this._localDelete(collectionPath, docId),
    };
  }

  /**
   * 도큐먼트 참조 생성
   * @param {string} collectionPath - 컬렉션 경로
   * @param {string} docId - 도큐먼트 ID
   * @returns {Object} 도큐먼트 참조
   */
  async doc(collectionPath, docId) {
    if (this.isLocalMode) {
      return this._createLocalDocRef(collectionPath, docId);
    }

    const db = this.firebaseService.getFirestore();
    return doc(db, collectionPath, docId);
  }

  /**
   * 도큐먼트 데이터 가져오기
   * @param {string} collectionPath - 컬렉션 경로
   * @param {string} docId - 도큐먼트 ID
   * @returns {Promise<Object>} 도큐먼트 데이터
   */
  async getDocument(collectionPath, docId) {
    if (this.isLocalMode) {
      return this._localGet(collectionPath, docId);
    }

    const db = this.firebaseService.getFirestore();
    const docRef = doc(db, collectionPath, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        data: docSnap.data(),
        exists: true,
      };
    }

    return {
      id: docId,
      data: null,
      exists: false,
    };
  }

  /**
   * 도큐먼트 데이터 설정
   * @param {string} collectionPath - 컬렉션 경로
   * @param {string} docId - 도큐먼트 ID
   * @param {Object} data - 저장할 데이터
   * @returns {Promise<boolean>} 성공 여부
   */
  async setDocument(collectionPath, docId, data) {
    if (this.isLocalMode) {
      return this._localSet(collectionPath, docId, data);
    }

    try {
      const db = this.firebaseService.getFirestore();
      const docRef = doc(db, collectionPath, docId);
      await setDoc(docRef, data);
      return true;
    } catch (error) {
      console.error('도큐먼트 설정 실패:', error);
      return false;
    }
  }

  /**
   * 도큐먼트 데이터 업데이트
   * @param {string} collectionPath - 컬렉션 경로
   * @param {string} docId - 도큐먼트 ID
   * @param {Object} data - 업데이트할 데이터
   * @returns {Promise<boolean>} 성공 여부
   */
  async updateDocument(collectionPath, docId, data) {
    if (this.isLocalMode) {
      return this._localUpdate(collectionPath, docId, data);
    }

    try {
      const db = this.firebaseService.getFirestore();
      const docRef = doc(db, collectionPath, docId);
      await updateDoc(docRef, data);
      return true;
    } catch (error) {
      console.error('도큐먼트 업데이트 실패:', error);
      return false;
    }
  }

  /**
   * 도큐먼트 삭제
   * @param {string} collectionPath - 컬렉션 경로
   * @param {string} docId - 도큐먼트 ID
   * @returns {Promise<boolean>} 성공 여부
   */
  async deleteDocument(collectionPath, docId) {
    if (this.isLocalMode) {
      return this._localDelete(collectionPath, docId);
    }

    try {
      const db = this.firebaseService.getFirestore();
      const docRef = doc(db, collectionPath, docId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('도큐먼트 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 컬렉션의 모든 도큐먼트 가져오기
   * @param {string} collectionPath - 컬렉션 경로
   * @returns {Promise<Array>} 도큐먼트 배열
   */
  async getCollection(collectionPath) {
    if (this.isLocalMode) {
      return this._localGetCollection(collectionPath);
    }

    try {
      const db = this.firebaseService.getFirestore();
      const colRef = collection(db, collectionPath);
      const querySnapshot = await getDocs(colRef);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }));
    } catch (error) {
      console.error('컬렉션 가져오기 실패:', error);
      return [];
    }
  }

  /**
   * 실시간 리스너 등록
   * @param {string} collectionPath - 컬렉션 경로
   * @param {string} docId - 도큐먼트 ID
   * @param {Function} callback - 데이터 변경 시 호출될 콜백
   * @returns {Function} 리스너 제거 함수
   */
  async onSnapshot(collectionPath, docId, callback) {
    if (this.isLocalMode) {
      // 로컬 모드에서는 실시간 업데이트 미지원
      const data = await this._localGet(collectionPath, docId);
      callback(data);
      return () => {};
    }

    const db = this.firebaseService.getFirestore();
    const docRef = doc(db, collectionPath, docId);

    return subscribeToSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({
          id: docSnap.id,
          data: docSnap.data(),
          exists: true,
        });
      } else {
        callback({
          id: docId,
          data: null,
          exists: false,
        });
      }
    });
  }

  /**
   * 배치 작업 생성
   * @returns {Object} 배치 객체
   */
  async batch() {
    if (this.isLocalMode) {
      return this._createLocalBatch();
    }

    const db = this.firebaseService.getFirestore();
    return writeBatch(db);
  }

  // ========== 로컬 모드 메서드 ==========

  /**
   * 로컬 추가
   * @private
   */
  async _localAdd(collectionPath, data) {
    const docId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    const key = `${collectionPath}/${docId}`;
    this.localData.set(key, { id: docId, ...data });
    this._saveLocalData();
    return { id: docId };
  }

  /**
   * 로컬 가져오기
   * @private
   */
  async _localGet(collectionPath, docId) {
    const key = `${collectionPath}/${docId}`;
    const data = this.localData.get(key);
    if (data) {
      return { id: docId, data, exists: true };
    }
    return { id: docId, data: null, exists: false };
  }

  /**
   * 로컬 설정
   * @private
   */
  async _localSet(collectionPath, docId, data) {
    const key = `${collectionPath}/${docId}`;
    this.localData.set(key, { id: docId, ...data });
    this._saveLocalData();
    return true;
  }

  /**
   * 로컬 업데이트
   * @private
   */
  async _localUpdate(collectionPath, docId, data) {
    const key = `${collectionPath}/${docId}`;
    const existing = this.localData.get(key) || {};
    this.localData.set(key, { ...existing, ...data });
    this._saveLocalData();
    return true;
  }

  /**
   * 로컬 삭제
   * @private
   */
  async _localDelete(collectionPath, docId) {
    const key = `${collectionPath}/${docId}`;
    this.localData.delete(key);
    this._saveLocalData();
    return true;
  }

  /**
   * 로컬 컬렉션 가져오기
   * @private
   */
  async _localGetCollection(collectionPath) {
    const results = [];
    for (const [key, value] of this.localData.entries()) {
      if (key.startsWith(collectionPath + '/')) {
        results.push({ id: value.id, data: value });
      }
    }
    return results;
  }

  /**
   * 로컬 배치 생성
   * @private
   */
  _createLocalBatch() {
    const operations = [];
    return {
      set: (ref, data) => operations.push({ type: 'set', ref, data }),
      update: (ref, data) => operations.push({ type: 'update', ref, data }),
      delete: (ref) => operations.push({ type: 'delete', ref }),
      commit: async () => {
        for (const op of operations) {
          if (op.type === 'set') {
            await this._localSet(op.ref.path.split('/')[0], op.ref.id, op.data);
          } else if (op.type === 'update') {
            await this._localUpdate(op.ref.path.split('/')[0], op.ref.id, op.data);
          } else if (op.type === 'delete') {
            await this._localDelete(op.ref.path.split('/')[0], op.ref.id);
          }
        }
        return true;
      },
    };
  }

  /**
   * Firestore 서비스 상태 반환
   * @returns {Object} 상태 정보
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isLocalMode: this.isLocalMode,
      localDataSize: this.localData.size,
    };
  }
}

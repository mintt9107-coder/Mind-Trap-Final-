/**
 * MindTrap - Memory Engine
 * AI의 기억을 관리합니다.
 * PlayerModel을 사람이 읽을 수 있는 기억으로 변환하고 저장합니다.
 * Memory는 덮어쓰지 않고, 변화를 감지하여 업데이트합니다.
 */

import { FirestoreService } from './FirestoreService.js';
import { AuthenticationService } from './AuthenticationService.js';

/**
 * MemoryEngine 클래스
 * AI의 기억을 생성, 저장, 업데이트합니다.
 */
export class MemoryEngine {
  constructor() {
    /** @type {FirestoreService} Firestore 서비스 */
    this.firestoreService = new FirestoreService();

    /** @type {AuthenticationService} 인증 서비스 */
    this.authService = new AuthenticationService();

    /** @type {Array} 현재 메모리 */
    this.memories = [];

    /** @type {Object|null} 이전 PlayerModel */
    this.previousPlayerModel = null;

    /** @type {boolean} 초기화 완료 여부 */
    this.isInitialized = false;
  }

  /**
   * Memory Engine 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    await this.firestoreService.initialize();
    await this.authService.initialize();

    // 기존 메모리 로드
    await this._loadMemories();

    this.isInitialized = true;
    return true;
  }

  /**
   * 기존 메모리 로드
   * @private
   */
  async _loadMemories() {
    const uid = this.authService.getCurrentUID();
    if (!uid) {
      this.memories = [];
      return;
    }

    const path = `users/${uid}/memory`;
    const result = await this.firestoreService.getDocument(path, 'memories');

    if (result.exists && result.data?.memories) {
      this.memories = result.data.memories;
      this.previousPlayerModel = result.data.previousPlayerModel || null;
    } else {
      this.memories = [];
      this.previousPlayerModel = null;
    }
  }

  /**
   * PlayerModel을 기반으로 메모리 업데이트
   * @param {Object} playerModel - PlayerModel 스냅샷
   * @returns {Promise<Array>} 업데이트된 메모리
   */
  async updateMemories(playerModel) {
    const uid = this.authService.getCurrentUID();
    if (!uid) {
      console.warn('MemoryEngine: 사용자가 로그인되어 있지 않습니다.');
      return this.memories;
    }

    const attributes = playerModel.attributes || playerModel;
    const newMemories = [];

    // 위험 성향 분석
    if (attributes.risk > 65) {
      newMemories.push({
        id: 'risk_preference',
        text: '위험보다 안전을 선호하는 경향이 있습니다.',
        category: 'personality',
        updatedAt: Date.now(),
      });
    } else if (attributes.risk < 35) {
      newMemories.push({
        id: 'risk_seeking',
        text: '위험을 감수하는 성향이 있습니다.',
        category: 'personality',
        updatedAt: Date.now(),
      });
    }

    // 반복 패턴 분석
    if (attributes.repeat > 60) {
      newMemories.push({
        id: 'repeat_pattern',
        text: '압박을 받으면 익숙한 선택을 반복합니다.',
        category: 'pattern',
        updatedAt: Date.now(),
      });
    }

    // AI 신뢰도 분석
    if (attributes.trustAI < 40) {
      newMemories.push({
        id: 'low_trust',
        text: 'AI의 예측을 쉽게 믿지 않습니다.',
        category: 'trust',
        updatedAt: Date.now(),
      });
    } else if (attributes.trustAI > 70) {
      newMemories.push({
        id: 'high_trust',
        text: 'AI의 분석을 신뢰하는 편입니다.',
        category: 'trust',
        updatedAt: Date.now(),
      });
    }

    // 인내심 분석
    if (attributes.patience > 65) {
      newMemories.push({
        id: 'patient',
        text: '결정을 내리기 전에 충분히 고민합니다.',
        category: 'personality',
        updatedAt: Date.now(),
      });
    } else if (attributes.patience < 35) {
      newMemories.push({
        id: 'impatient',
        text: '빠르게 결정하는 편입니다.',
        category: 'personality',
        updatedAt: Date.now(),
      });
    }

    // 일관성 분석
    if (attributes.consistency > 70) {
      newMemories.push({
        id: 'consistent',
        text: '일관된 선택 패턴을 보입니다.',
        category: 'pattern',
        updatedAt: Date.now(),
      });
    } else if (attributes.consistency < 30) {
      newMemories.push({
        id: 'unpredictable',
        text: '마지막 순간에 패턴을 바꾸는 습관이 있습니다.',
        category: 'pattern',
        updatedAt: Date.now(),
      });
    }

    // 반응 속도 분석
    if (attributes.reaction > 70) {
      newMemories.push({
        id: 'fast_reaction',
        text: '최근에는 반응 속도가 빨라졌습니다.',
        category: 'behavior',
        updatedAt: Date.now(),
      });
    }

    // 망설임 분석
    if (attributes.hesitation > 60) {
      newMemories.push({
        id: 'hesitant',
        text: '결정을 망설이는 경향이 있습니다.',
        category: 'behavior',
        updatedAt: Date.now(),
      });
    }

    // 이전 메모리와 비교하여 변경된 것만 업데이트
    const updatedMemories = this._mergeMemories(newMemories);

    // Firestore에 저장
    await this._saveMemories(updatedMemories, attributes);

    // 이전 PlayerModel 업데이트
    this.previousPlayerModel = { ...attributes };

    return updatedMemories;
  }

  /**
   * 메모리 병합
   * 새로운 메모리와 기존 메모리를 비교하여 업데이트
   * @param {Array} newMemories - 새로운 메모리
   * @returns {Array} 병합된 메모리
   * @private
   */
  _mergeMemories(newMemories) {
    const merged = [...this.memories];

    newMemories.forEach((newMemory) => {
      const existingIndex = merged.findIndex((m) => m.id === newMemory.id);

      if (existingIndex >= 0) {
        // 기존 메모리 업데이트 (변화가 있는 경우)
        if (merged[existingIndex].text !== newMemory.text) {
          merged[existingIndex] = {
            ...newMemory,
            previousText: merged[existingIndex].text,
          };
        }
      } else {
        // 새 메모리 추가
        merged.push(newMemory);
      }
    });

    return merged;
  }

  /**
   * 메모리 저장
   * @param {Array} memories - 저장할 메모리
   * @param {Object} playerModel - 현재 PlayerModel
   * @returns {Promise<boolean>} 성공 여부
   * @private
   */
  async _saveMemories(memories, playerModel) {
    const uid = this.authService.getCurrentUID();
    if (!uid) {
      return false;
    }

    const path = `users/${uid}/memory`;
    const data = {
      memories,
      previousPlayerModel: playerModel,
      updatedAt: Date.now(),
    };

    const success = await this.firestoreService.setDocument(path, 'memories', data);

    if (success) {
      this.memories = memories;
    } else {
      console.error('메모리 저장 실패');
    }

    return success;
  }

  /**
   * 현재 메모리 반환
   * @returns {Array} 메모리 배열
   */
  getMemories() {
    return [...this.memories];
  }

  /**
   * 메모리 텍스트 배열 반환 (UI용)
   * @returns {Array<string>} 메모리 텍스트 배열
   */
  getMemoryTexts() {
    return this.memories.map((m) => m.text);
  }

  /**
   * 카테고리별 메모리 반환
   * @param {string} category - 카테고리 (personality, pattern, trust, behavior)
   * @returns {Array} 해당 카테고리의 메모리
   */
  getMemoriesByCategory(category) {
    return this.memories.filter((m) => m.category === category);
  }

  /**
   * 메모리 초기화 (Memory Reset)
   * @returns {Promise<boolean>} 성공 여부
   */
  async resetMemories() {
    const uid = this.authService.getCurrentUID();
    if (!uid) {
      return false;
    }

    // 메모리 삭제
    const path = `users/${uid}/memory`;
    await this.firestoreService.deleteDocument(path, 'memories');

    // PlayerModel 삭제
    const pmPath = `users/${uid}/playerModel`;
    await this.firestoreService.deleteDocument(pmPath, 'current');

    // Reports 삭제
    const reportsPath = `users/${uid}/reports`;
    const reports = await this.firestoreService.getCollection(reportsPath);
    for (const report of reports) {
      await this.firestoreService.deleteDocument(reportsPath, report.id);
    }

    // Sessions 삭제
    const sessionsPath = `users/${uid}/sessions`;
    const sessions = await this.firestoreService.getCollection(sessionsPath);
    for (const session of sessions) {
      await this.firestoreService.deleteDocument(sessionsPath, session.id);
    }

    // Statistics 삭제
    const statsPath = `users/${uid}/statistics`;
    await this.firestoreService.deleteDocument(statsPath, 'summary');

    // 로컬 상태 초기화
    this.memories = [];
    this.previousPlayerModel = null;

    return true;
  }

  /**
   * Memory Engine 상태 반환
   * @returns {Object} 상태 정보
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      memoryCount: this.memories.length,
      hasPreviousModel: this.previousPlayerModel !== null,
      categories: this._getCategoryCounts(),
    };
  }

  /**
   * 카테고리별 메모리 개수
   * @returns {Object} 카테고리별 개수
   * @private
   */
  _getCategoryCounts() {
    const counts = {
      personality: 0,
      pattern: 0,
      trust: 0,
      behavior: 0,
    };

    this.memories.forEach((m) => {
      if (counts[m.category] !== undefined) {
        counts[m.category]++;
      }
    });

    return counts;
  }
}
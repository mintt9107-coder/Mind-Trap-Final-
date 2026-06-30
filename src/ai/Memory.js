/**
 * MindTrap - Memory
 * 과거 게임 데이터를 저장하고 관리합니다.
 * Gemini는 Memory를 참고하여 과거와 현재를 비교 분석합니다.
 */

import { getFromStorage, saveToStorage } from '../utils/helpers.js';

/**
 * Memory 클래스
 * 플레이어의 과거 게임 기록을 저장합니다.
 */
export class Memory {
  constructor() {
    /** @type {string} 스토리지 키 */
    this.storageKey = 'mindtrap_memory';

    /** @type {string} 이름별 메모리 목록 키 */
    this.profilesIndexKey = 'mindtrap_memory_profiles';

    /** @type {string} 유저 이름 스토리지 키 */
    this.userNameKey = 'mindtrap_user_name';

    /** @type {string} 이름별 저장 횟수 스토리지 키 */
    this.nameStatsKey = 'mindtrap_name_stats';

    /** @type {Object|null} 메모리 데이터 */
    this.data = null;

    /** @type {string|null} 유저 이름 */
    this.userName = null;

    // 저장된 유저 이름을 먼저 불러온 뒤, 이름별 메모리를 로드합니다.
    this._loadUserName();
    this._load();
  }

  /**
   * 스토리지 키에 안전하게 사용할 이름 생성
   * @param {string|null} name - 유저 이름
   * @returns {string}
   * @private
   */
  _normalizeUserName(name) {
    const normalized = (name || '').trim().toLowerCase();
    return normalized || 'anonymous';
  }

  /**
   * 현재 이름에 해당하는 메모리 스토리지 키
   * @param {string|null} name - 유저 이름
   * @returns {string}
   * @private
   */
  _getStorageKeyForName(name = this.userName) {
    return `${this.storageKey}:${this._normalizeUserName(name)}`;
  }

  /**
   * 이름별 메모리 목록에 현재 이름 추가
   * @param {string|null} name - 유저 이름
   * @private
   */
  _rememberProfileName(name) {
    try {
      const key = this._normalizeUserName(name);
      const profiles = JSON.parse(localStorage.getItem(this.profilesIndexKey) || '[]');
      if (!profiles.includes(key)) {
        profiles.push(key);
        localStorage.setItem(this.profilesIndexKey, JSON.stringify(profiles));
      }
    } catch (e) {
      console.error('Failed to update memory profile index:', e);
    }
  }

  _loadNameStats() {
    try {
      return JSON.parse(localStorage.getItem(this.nameStatsKey) || '{}');
    } catch (e) {
      return {};
    }
  }

  _saveNameStats(stats) {
    try {
      localStorage.setItem(this.nameStatsKey, JSON.stringify(stats));
    } catch (e) {
      console.error('Failed to save name stats:', e);
    }
  }

  _recordNameSave(name) {
    const cleanName = name ? name.trim().replace(/님$/, '').trim() : '';
    if (!cleanName) return null;

    const key = this._normalizeUserName(cleanName);
    const stats = this._loadNameStats();
    const current = stats[key] || {
      displayName: cleanName,
      saveCount: 0,
      firstSavedAt: Date.now(),
      lastSavedAt: Date.now(),
    };

    current.displayName = cleanName;
    current.saveCount = (current.saveCount || 0) + 1;
    current.lastSavedAt = Date.now();
    stats[key] = current;
    this._saveNameStats(stats);
    return current;
  }

  getNameStats(name = this.userName) {
    const cleanName = name ? name.trim().replace(/님$/, '').trim() : '';
    if (!cleanName) return null;

    const stats = this._loadNameStats();
    return stats[this._normalizeUserName(cleanName)] || null;
  }

  /**
   * 유저 이름 로드
   * @private
   */
  _loadUserName() {
    try {
      this.userName = localStorage.getItem(this.userNameKey) || null;
    } catch (e) {
      this.userName = null;
    }
  }

  /**
   * 유저 이름 저장
   * @param {string} name - 유저 이름
   */
  setUserName(name, options = {}) {
    const cleanName = name ? name.trim().replace(/님$/, '').trim() : '';
    this.userName = cleanName || null;
    try {
      if (this.userName) {
        localStorage.setItem(this.userNameKey, this.userName);
        this._rememberProfileName(this.userName);
        if (options.countSave) {
          this._recordNameSave(this.userName);
        }
      } else {
        localStorage.removeItem(this.userNameKey);
      }
      this._load();
    } catch (e) {
      console.error('Failed to save user name:', e);
    }
  }

  /**
   * 유저 이름 반환
   * @returns {string|null}
   */
  getUserName() {
    return this.userName;
  }

  /**
   * 모든 기억 삭제 (유저 이름 포함)
   */
  clearAll() {
    this.clearEveryProfile();
    this.setUserName(null);
  }

  /**
   * 메모리 로드
   * @private
   */
  _load() {
    this.data = getFromStorage(this._getStorageKeyForName());
  }

  /**
   * 메모리 저장
   * @private
   */
  _save() {
    if (this.data) {
      this._rememberProfileName(this.userName);
      saveToStorage(this._getStorageKeyForName(), this.data);
    }
  }

  /**
   * 게임 완료 시 메모리 저장
   * @param {Object} gameData - 게임 데이터
   * @param {Object} gameData.playerModel - 플레이어 모델 스냅샷
   * @param {Array} gameData.patterns - 발견된 패턴
   * @param {string} gameData.playerType - 플레이어 타입
   * @param {number} gameData.predictionAccuracy - 예측 정확도
   */
  saveGameMemory(gameData) {
    const { playerModel, patterns, playerType, predictionAccuracy } = gameData;

    const memoryEntry = {
      timestamp: Date.now(),
      playerType,
      predictionAccuracy,
      attributes: { ...playerModel.attributes },
      patterns: patterns.map((p) => p.type),
      learningProgress: playerModel.learningProgress,
    };

    // 이전 메모리가 있으면 업데이트, 없으면 새로 생성
    if (!this.data) {
      this.data = {
        games: [],
        firstPlayed: Date.now(),
        lastPlayed: Date.now(),
        totalGames: 0,
      };
    }

    this.data.games.push(memoryEntry);
    this.data.totalGames++;
    this.data.lastPlayed = Date.now();

    // 최근 10게임만 유지
    if (this.data.games.length > 10) {
      this.data.games = this.data.games.slice(-10);
    }

    this._save();
  }

  /**
   * 마지막 게임 메모리 반환
   * @returns {Object|null} 마지막 게임 메모리
   */
  getLastGame() {
    if (!this.data || this.data.games.length === 0) {
      return null;
    }
    return this.data.games[this.data.games.length - 1];
  }

  /**
   * 모든 게임 메모리 반환
   * @returns {Array} 게임 메모리 배열
   */
  getAllGames() {
    if (!this.data) return [];
    return [...this.data.games];
  }

  /**
   * 메모리가 있는지 확인
   * @returns {boolean} 메모리 존재 여부
   */
  hasMemory() {
    return this.data !== null && this.data.games.length > 0;
  }

  /**
   * 첫 방문 여부
   * @returns {boolean} 첫 방문이면 true
   */
  isFirstVisit() {
    return !this.hasMemory();
  }

  /**
   * 총 게임 수 반환
   * @returns {number} 총 게임 수
   */
  getTotalGames() {
    return this.data ? this.data.totalGames : 0;
  }

  /**
   * 메모리 요약 반환 (Gemini에게 전달용)
   * @returns {Object} 메모리 요약
   */
  getMemorySummary() {
    if (!this.hasMemory()) {
      const nameStats = this.getNameStats();
      return {
        hasMemory: false,
        nameSaveCount: nameStats?.saveCount || 0,
        message: '처음 뵙겠습니다.',
      };
    }

    const lastGame = this.getLastGame();
    const totalGames = this.getTotalGames();
    const nameStats = this.getNameStats();

    return {
      hasMemory: true,
      totalGames,
      nameSaveCount: nameStats?.saveCount || 0,
      lastGame: {
        playerType: lastGame.playerType,
        predictionAccuracy: lastGame.predictionAccuracy,
        attributes: lastGame.attributes,
        patterns: lastGame.patterns,
        timestamp: lastGame.timestamp,
      },
      message: this._getGreetingMessage(totalGames),
    };
  }

  /**
   * 방문 횟수에 따른 인사 메시지
   * @param {number} totalGames - 총 게임 수
   * @returns {string} 인사 메시지
   * @private
   */
  _getGreetingMessage(totalGames) {
    if (totalGames === 1) {
      return '다시 오셨군요.';
    }
    if (totalGames < 5) {
      return '또 오셨군요. 지난번보다 달라졌을지도 모르겠습니다.';
    }
    return '반갑습니다. 당신의 데이터를 가지고 있습니다.';
  }

  /**
   * 현재 게임과 과거 게임 비교 데이터
   * @param {Object} currentPlayerModel - 현재 플레이어 모델
   * @returns {Object} 비교 데이터
   */
  getComparisonData(currentPlayerModel) {
    if (!this.hasMemory()) {
      return null;
    }

    const lastGame = this.getLastGame();
    const currentAttrs = currentPlayerModel.attributes;
    const lastAttrs = lastGame.attributes;

    const comparison = {
      lastGame: {
        playerType: lastGame.playerType,
        risk: lastAttrs.risk,
        patience: lastAttrs.patience,
        consistency: lastAttrs.consistency,
        hesitation: lastAttrs.hesitation,
        trustAI: lastAttrs.trustAI,
      },
      currentGame: {
        risk: currentAttrs.risk,
        patience: currentAttrs.patience,
        consistency: currentAttrs.consistency,
        hesitation: currentAttrs.hesitation,
        trustAI: currentAttrs.trustAI,
      },
      changes: {
        risk: currentAttrs.risk - lastAttrs.risk,
        patience: currentAttrs.patience - lastAttrs.patience,
        consistency: currentAttrs.consistency - lastAttrs.consistency,
        hesitation: currentAttrs.hesitation - lastAttrs.hesitation,
        trustAI: currentAttrs.trustAI - lastAttrs.trustAI,
      },
    };

    return comparison;
  }

  /**
   * 메모리 초기화
   */
  clear() {
    this.data = null;
    localStorage.removeItem(this._getStorageKeyForName());
  }

  /**
   * 모든 이름의 메모리 초기화
   */
  clearEveryProfile() {
    try {
      const profiles = JSON.parse(localStorage.getItem(this.profilesIndexKey) || '[]');
      profiles.forEach((profileKey) => {
        localStorage.removeItem(`${this.storageKey}:${profileKey}`);
      });
      localStorage.removeItem(this.profilesIndexKey);
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.nameStatsKey);
    } catch (e) {
      console.error('Failed to clear all memory profiles:', e);
    }
    this.data = null;
  }
}

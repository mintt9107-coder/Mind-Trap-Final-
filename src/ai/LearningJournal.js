/**
 * MindTrap - Learning Journal
 * AI의 학습 과정을 내부적으로 기록합니다.
 * 이 Journal은 유저에게 보여주지 않으며,
 * Memory와 Replay 생성 시 참조 데이터로 사용됩니다.
 */

/**
 * LearningJournal 클래스
 * AI의 학습 여정을 타임라인 기반으로 기록합니다.
 */
export class LearningJournal {
  constructor() {
    /** @type {Array} 학습 기록 타임라인 */
    this.entries = [];

    /** @type {Object} 발견된 패턴들 */
    this.discoveredPatterns = {};

    /** @type {string} 현재 학습 단계 */
    this.currentStage = 'initial';

    /** @type {Array} 단계별 전환 기록 */
    this.stageTransitions = [];
  }

  /**
   * 학습 라운드 기록 추가
   * @param {Object} data - 학습 데이터
   * @param {number} data.round - 라운드 번호
   * @param {Object} data.features - 추출된 특징
   * @param {Array} data.appliedRules - 적용된 규칙들
   * @param {Object} data.playerSnapshot - 플레이어 모델 스냅샷
   */
  addEntry(data) {
    const { round, features, appliedRules, playerSnapshot } = data;

    // playerSnapshot이 누락된 경우 안전하게 처리
    const safeSnapshot = playerSnapshot || {};
    const safeAttributes = safeSnapshot.attributes || {};
    const safeFeatures = features || {};
    const safeRules = Array.isArray(appliedRules) ? appliedRules : [];

    const entry = {
      round,
      timestamp: Date.now(),
      features: this._extractKeyFeatures(safeFeatures),
      appliedRules: safeRules.map((r) => r.ruleId),
      playerType: this._determinePlayerType(safeAttributes),
      patterns: this._detectPatterns(safeFeatures, safeSnapshot),
      confidence: safeSnapshot.confidence ?? 0,
      learningProgress: safeSnapshot.learningProgress ?? 0,
      note: this._generateNote(round, safeFeatures, safeRules),
    };

    this.entries.push(entry);

    // 단계 전환 감지
    this._checkStageTransition(entry);
  }

  /**
   * 주요 특징만 추출
   * @param {Object} features - 전체 특징
   * @returns {Object} 주요 특징
   * @private
   */
  _extractKeyFeatures(features) {
    return {
      choice: features.choice,
      riskChoice: features.riskChoice,
      speedCategory: features.speedCategory,
      hesitationTime: features.hesitationTime,
      repeatChoice: features.repeatChoice,
    };
  }

  /**
   * 플레이어 타입 결정
   * @param {Object} attributes - 플레이어 특성
   * @returns {string} 플레이어 타입
   * @private
   */
  _determinePlayerType(attributes) {
    const { risk, patience, consistency, hesitation } = attributes;

    if (risk > 70 && consistency < 40) return 'unpredictable';
    if (risk > 70 && hesitation < 30) return 'aggressive';
    if (patience > 70 && risk < 40) return 'cautious';
    if (consistency > 70) return 'predictable';
    if (hesitation > 60) return 'hesitant';

    return 'balanced';
  }

  /**
   * 패턴 감지
   * @param {Object} features - 현재 특징
   * @param {Object} snapshot - 플레이어 스냅샷
   * @returns {Array} 감지된 패턴 ID들
   * @private
   */
  _detectPatterns(features, snapshot) {
    const patterns = [];

    // 위험 패턴
    if (features.riskChoice >= 70) {
      patterns.push('risk_taking');
      this.discoveredPatterns['risk_taking'] = 
        (this.discoveredPatterns['risk_taking'] || 0) + 1;
    }

    // 반복 패턴
    if (features.repeatChoice === 100) {
      patterns.push('repetition');
      this.discoveredPatterns['repetition'] =
        (this.discoveredPatterns['repetition'] || 0) + 1;
    }

    // 빠른 반응 패턴
    if (features.speedCategory === 'fast') {
      patterns.push('fast_reaction');
      this.discoveredPatterns['fast_reaction'] =
        (this.discoveredPatterns['fast_reaction'] || 0) + 1;
    }

    // 느린 반응 패턴
    if (features.speedCategory === 'slow') {
      patterns.push('slow_deliberation');
      this.discoveredPatterns['slow_deliberation'] =
        (this.discoveredPatterns['slow_deliberation'] || 0) + 1;
    }

    // 시간 초과 패턴
    if (features.timeOut) {
      patterns.push('timeout_hesitation');
      this.discoveredPatterns['timeout_hesitation'] =
        (this.discoveredPatterns['timeout_hesitation'] || 0) + 1;
    }

    return patterns;
  }

  /**
   * 학습 노트 생성
   * @param {number} round - 라운드 번호
   * @param {Object} features - 특징
   * @param {Array} appliedRules - 적용된 규칙
   * @returns {string} 학습 노트
   * @private
   */
  _generateNote(round, features, appliedRules) {
    if (round <= 3) {
      return '초기 관찰 단계 - 데이터 수집 중';
    }

    if (appliedRules.length === 0) {
      return 'No Pattern - 특이사항 없음';
    }

    const ruleDescriptions = appliedRules.map((r) => r.description).join(', ');
    return `Pattern Found: ${ruleDescriptions}`;
  }

  /**
   * 학습 단계 전환 감지
   * @param {Object} entry - 새 엔트리
   * @private
   */
  _checkStageTransition(entry) {
    const progress = entry.learningProgress;
    let newStage = 'initial';

    if (progress >= 0.8) {
      newStage = 'completed';
    } else if (progress >= 0.5) {
      if (Object.keys(this.discoveredPatterns).length >= 2) {
        newStage = 'pattern_recognized';
      } else {
        newStage = 'analyzing';
      }
    } else if (progress >= 0.2) {
      newStage = 'learning';
    }

    if (newStage !== this.currentStage) {
      this.stageTransitions.push({
        from: this.currentStage,
        to: newStage,
        round: entry.round,
        timestamp: Date.now(),
      });
      this.currentStage = newStage;
    }
  }

  /**
   * 전체 저널 조회
   * @returns {Array} 모든 엔트리
   */
  getAllEntries() {
    return [...this.entries];
  }

  /**
   * 특정 라운드의 엔트리 조회
   * @param {number} round - 라운드 번호
   * @returns {Object|null} 해당 엔트리
   */
  getEntryByRound(round) {
    return this.entries.find((e) => e.round === round) || null;
  }

  /**
   * 패턴 빈도 조회
   * @returns {Object} 패턴별 발견 횟수
   */
  getPatternFrequency() {
    return { ...this.discoveredPatterns };
  }

  /**
   * 가장 많이 발견된 패턴 반환
   * @returns {Object|null} 최다 패턴
   */
  getDominantPattern() {
    const patterns = Object.entries(this.discoveredPatterns);
    if (patterns.length === 0) return null;

    const sorted = patterns.sort((a, b) => b[1] - a[1]);
    return { pattern: sorted[0][0], count: sorted[0][1] };
  }

  /**
   * 단계 전환 기록 조회
   * @returns {Array} 단계 전환 기록
   */
  getStageTransitions() {
    return [...this.stageTransitions];
  }

  /**
   * 현재 학습 단계 반환
   * @returns {string} 현재 단계
   */
  getCurrentStage() {
    return this.currentStage;
  }

  /**
   * 학습 요약 생성
   * @returns {Object} 학습 요약
   */
  getSummary() {
    return {
      totalEntries: this.entries.length,
      currentStage: this.currentStage,
      discoveredPatterns: { ...this.discoveredPatterns },
      dominantPattern: this.getDominantPattern(),
      stageTransitions: [...this.stageTransitions],
      playerTypeEvolution: this.entries.map((e) => ({
        round: e.round,
        type: e.playerType,
      })),
    };
  }

  /**
   * 저널 초기화
   */
  reset() {
    this.entries = [];
    this.discoveredPatterns = {};
    this.currentStage = 'initial';
    this.stageTransitions = [];
  }
}
/**
 * MindTrap - Rule Engine
 * Rule Table 기반으로 플레이어 특성을 계산합니다.
 * if문을 남발하지 않고, 모든 규칙을 테이블로 관리합니다.
 */

/**
 * RuleEngine 클래스
 * Feature 기반 Rule Table로 플레이어 모델을 업데이트합니다.
 */
export class RuleEngine {
  constructor() {
    /**
     * Rule Table 정의
     * 각 규칙은 조건과 적용할 특성 변경을 정의합니다.
     */
    this.rules = this._initializeRules();
  }

  /**
   * 규칙 테이블 초기화
   * @returns {Array} 규칙 배열
   * @private
   */
  _initializeRules() {
    return [
      // 반응 속도 규칙
      {
        id: 'reaction_fast',
        condition: (f) => f.reactionTime < 1500 && !f.timeOut,
        effects: { reaction: +3, impulsive: +2, hesitation: -2 },
        description: '빠른 반응 - импуль적 성향',
      },
      {
        id: 'reaction_slow',
        condition: (f) => f.reactionTime > 4000 && !f.timeOut,
        effects: { hesitation: +3, patience: +2, reaction: -2 },
        description: '느린 반응 - 신중한 성향',
      },
      {
        id: 'timeout',
        condition: (f) => f.timeOut,
        effects: { hesitation: +5, patience: -3, trustAI: +2 },
        description: '시간 초과 - 큰 망설임',
      },

      // 위험 선택 규칙
      {
        id: 'risk_high',
        condition: (f) => f.riskChoice >= 70,
        effects: { risk: +5, adaptation: +2 },
        description: '위험 감수 선택',
      },
      {
        id: 'risk_low',
        condition: (f) => f.riskChoice <= 30,
        effects: { risk: -5, patience: +2, consistency: +2 },
        description: '안전 선택',
      },

      // 반복 패턴 규칙
      {
        id: 'repeat_choice',
        condition: (f) => f.repeatChoice === 100,
        effects: { repeat: +4, consistency: +3 },
        description: '동일 선택 반복',
      },
      {
        id: 'changed_choice',
        condition: (f) => f.changedChoice === 1,
        effects: { adaptation: +3, repeat: -2, hesitation: +2 },
        description: '선택 변경 - 적응력',
      },

      // 속도 패턴 규칙
      {
        id: 'speed_fast_impulsive',
        condition: (f) => f.speedCategory === 'fast' && f.riskChoice >= 60,
        effects: { impulsive: +3, risk: +2 },
        description: '빠르고 위험한 선택',
      },
      {
        id: 'speed_slow_deliberate',
        condition: (f) => f.speedCategory === 'slow' && f.hesitationTime > 60,
        effects: { patience: +3, hesitation: +2 },
        description: '느리고 신중한 선택',
      },

      // 일관성 규칙
      {
        id: 'high_consistency',
        condition: (f) => f.consistencyScore > 60,
        effects: { consistency: +3, repeat: +2 },
        description: '높은 일관성',
      },
      {
        id: 'low_consistency',
        condition: (f) => f.consistencyScore < 30,
        effects: { consistency: -3, adaptation: +2 },
        description: '낮은 일관성 - 예측 불가',
      },

      // 인내심 규칙
      {
        id: 'high_patience',
        condition: (f) => f.patienceScore > 70 && !f.timeOut,
        effects: { patience: +3, trustAI: +1 },
        description: '높은 인내심',
      },

      // AI 신뢰 규칙 (placeholder - AI 제시 여부에 따라)
      {
        id: 'ignored_ai',
        condition: (f) => f.ignoredAI === true,
        effects: { trustAI: -5, risk: +2 },
        description: 'AI 제안 무시',
      },
      {
        id: 'accepted_ai',
        condition: (f) => f.acceptedAI === true,
        effects: { trustAI: +5 },
        description: 'AI 제안 수락',
      },
    ];
  }

  /**
   * 특징에 맞는 모든 규칙 평가 및 적용
   * @param {Object} features - 추출된 특징
   * @param {Object} playerModel - PlayerModel 인스턴스
   * @returns {Array} 적용된 규칙 목록
   */
  applyRules(features, playerModel) {
    const appliedRules = [];

    this.rules.forEach((rule) => {
      if (rule.condition(features)) {
        playerModel.updateAttributes(rule.effects);
        appliedRules.push({
          ruleId: rule.id,
          description: rule.description,
          effects: rule.effects,
        });
      }
    });

    return appliedRules;
  }

  /**
   * 단일 규칙 테스트
   * @param {string} ruleId - 규칙 ID
   * @param {Object} features - 테스트할 특징
   * @returns {boolean} 규칙 조건 만족 여부
   */
  testRule(ruleId, features) {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (!rule) {
      console.warn(`Rule not found: ${ruleId}`);
      return false;
    }
    return rule.condition(features);
  }

  /**
   * 모든 규칙 정보 반환
   * @returns {Array} 규칙 정의 배열
   */
  getAllRules() {
    return this.rules.map((rule) => ({
      id: rule.id,
      description: rule.description,
      effects: rule.effects,
    }));
  }

  /**
   * 동적 규칙 추가
   * @param {Object} rule - 규칙 정의
   * @param {string} rule.id - 규칙 ID
   * @param {Function} rule.condition - 조건 함수
   * @param {Object} rule.effects - 적용할 효과
   * @param {string} rule.description - 설명
   */
  addRule(rule) {
    if (!rule.id || !rule.condition || !rule.effects) {
      console.error('Invalid rule format');
      return;
    }
    this.rules.push(rule);
  }

  /**
   * 특정 규칙 제거
   * @param {string} ruleId - 제거할 규칙 ID
   */
  removeRule(ruleId) {
    this.rules = this.rules.filter((r) => r.id !== ruleId);
  }
}
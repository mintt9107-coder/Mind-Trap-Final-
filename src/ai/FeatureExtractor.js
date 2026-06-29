/**
 * MindTrap - Feature Extractor
 * 게임 데이터에서 행동 특징(Feature)를 추출합니다.
 * 모든 계산은 여기서 이루어지며, Gemini는 이 값을 수정하지 않습니다.
 */

import { GAME_CONFIG, QUESTION_TYPES } from '../utils/constants.js';

/**
 * FeatureExtractor 클래스
 * 매 라운드마다 플레이어의 행동 특징을 추출합니다.
 */
export class FeatureExtractor {
  constructor() {
    /** @type {Array} 이전 라운드의 선택 기록 */
    this.previousChoices = [];

    /** @type {Array} 이전 반응 시간 기록 */
    this.previousReactionTimes = [];
  }

  /**
   * 단일 라운드에서 특징 추출
   * @param {Object} roundData - 라운드 데이터
   * @param {number} roundData.round - 라운드 번호
   * @param {Object} roundData.question - 질문 객체
   * @param {string} roundData.choice - 선택한 답변
   * @param {number} roundData.reactionTime - 반응 시간 (ms)
   * @param {boolean} roundData.changedChoice - 선택 변경 여부
   * @param {boolean} roundData.timeOut - 시간 초과 여부
   * @returns {Object} 추출된 특징들
   */
  extractFeatures(roundData) {
    const {
      round,
      question,
      choice,
      reactionTime,
      changedChoice,
      timeOut,
    } = roundData;

    const features = {
      round,
      timestamp: Date.now(),

      // 기본 행동 특징
      reactionTime,
      choice,
      changedChoice: changedChoice ? 1 : 0,
      timeOut: timeOut ? 1 : 0,

      // 파생 특징들
      hesitationTime: this._calculateHesitationTime(reactionTime, timeOut),
      riskChoice: this._evaluateRiskChoice(question, choice),
      repeatChoice: this._evaluateRepeatChoice(choice),
      speedCategory: this._categorizeSpeed(reactionTime, timeOut),

      // 문맥 기반 특징
      consistencyScore: this._calculateConsistency(choice),
      adaptationScore: this._calculateAdaptation(choice, question.type),
      patienceScore: timeOut ? 0 : this._calculatePatience(reactionTime),

      // 메타 특징
      questionType: question.type,
      choiceValue: this._getChoiceValue(question, choice),
    };

    // 기록 저장
    this.previousChoices.push(choice);
    this.previousReactionTimes.push(reactionTime);

    // 최근 5개만 유지
    if (this.previousChoices.length > 5) {
      this.previousChoices.shift();
      this.previousReactionTimes.shift();
    }

    return features;
  }

  /**
   * 망설임 시간 계산
   * @param {number} reactionTime - 반응 시간
   * @param {boolean} timeOut - 시간 초과 여부
   * @returns {number} 망설임 점수 (0-100)
   * @private
   */
  _calculateHesitationTime(reactionTime, timeOut) {
    if (timeOut) return 100;
    
    const normalized = Math.min(100, (reactionTime / GAME_CONFIG.ROUND_TIME_LIMIT) * 100);
    return Math.round(normalized);
  }

  /**
   * 위험 선택 평가
   * @param {Object} question - 질문 객체
   * @param {string} choice - 선택
   * @returns {number} 위험 수준 (0-100)
   * @private
   */
  _evaluateRiskChoice(question, choice) {
    const { type } = question;
    const isPrimary = choice === 'primary';

    // 타입별 위험 평가
    const riskMap = {
      [QUESTION_TYPES.RISK]: isPrimary ? 80 : 20,
      [QUESTION_TYPES.COMBAT]: isPrimary ? 70 : 30,
      [QUESTION_TYPES.REWARD]: isPrimary ? 90 : 10,
      [QUESTION_TYPES.TIME]: isPrimary ? 40 : 60,
      [QUESTION_TYPES.EMOTION]: isPrimary ? 60 : 40,
      [QUESTION_TYPES.SPEED]: isPrimary ? 70 : 30,
      [QUESTION_TYPES.DIRECTION]: 50, // 중립
    };

    return riskMap[type] ?? 50;
  }

  /**
   * 반복 선택 평가
   * @param {string} choice - 현재 선택
   * @returns {number} 반복 정도 (0-100)
   * @private
   */
  _evaluateRepeatChoice(choice) {
    if (this.previousChoices.length === 0) return 0;

    const lastChoice = this.previousChoices[this.previousChoices.length - 1];
    return lastChoice === choice ? 100 : 0;
  }

  /**
   * 속도 카테고리 분류
   * @param {number} reactionTime - 반응 시간
   * @param {boolean} timeOut - 시간 초과
   * @returns {string} 'fast' | 'normal' | 'slow' | 'timeout'
   * @private
   */
  _categorizeSpeed(reactionTime, timeOut) {
    if (timeOut) return 'timeout';
    if (reactionTime < 1500) return 'fast';
    if (reactionTime < 3000) return 'normal';
    return 'slow';
  }

  /**
   * 일관성 점수 계산
   * @param {string} currentChoice - 현재 선택
   * @returns {number} 일관성 (0-100)
   * @private
   */
  _calculateConsistency(currentChoice) {
    if (this.previousChoices.length < 2) return 50;

    const sameCount = this.previousChoices.filter(
      (c) => c === currentChoice
    ).length;
    const ratio = sameCount / this.previousChoices.length;

    return Math.round(ratio * 100);
  }

  /**
   * 적응력 점수 계산
   * @param {string} choice - 현재 선택
   * @param {string} questionType - 질문 타입
   * @returns {number} 적응력 (0-100)
   * @private
   */
  _calculateAdaptation(choice, questionType) {
    // 간단히 직전 선택과 다른지 확인
    if (this.previousChoices.length === 0) return 50;

    const lastChoice = this.previousChoices[this.previousChoices.length - 1];
    return choice !== lastChoice ? 70 : 30;
  }

  /**
   * 인내심 점수 계산
   * @param {number} reactionTime - 반응 시간
   * @returns {number} 인내심 (0-100)
   * @private
   */
  _calculatePatience(reactionTime) {
    // 반응 시간이 빠를수록 인내심 낮음
    const patience = Math.max(0, reactionTime / 50);
    return Math.min(100, Math.round(patience));
  }

  /**
   * 선택 값 반환 (primary/secondary를 의미있는 값으로)
   * @param {Object} question - 질문 객체
   * @param {string} choice - 선택
   * @returns {string} 선택의 실제 텍스트
   * @private
   */
  _getChoiceValue(question, choice) {
    return question.choices[choice] || choice;
  }

  /**
   * 여러 라운드 특징 추출
   * @param {Array} roundDataList - 라운드 데이터 배열
   * @returns {Array} 추출된 특징 배열
   */
  extractMultipleFeatures(roundDataList) {
    return roundDataList.map((data) => this.extractFeatures(data));
  }

  /**
   * 특징 요약 통계 생성
   * @param {Array} features - 특징 배열
   * @returns {Object} 요약 통계
   */
  generateFeatureSummary(features) {
    if (features.length === 0) {
      return {
        totalRounds: 0,
        avgReactionTime: 0,
        avgHesitation: 0,
        avgRisk: 0,
        repeatCount: 0,
        timeoutCount: 0,
        speedDistribution: { fast: 0, normal: 0, slow: 0, timeout: 0 },
        choiceDistribution: {},
      };
    }

    const summary = {
      totalRounds: features.length,
      avgReactionTime: 0,
      avgHesitation: 0,
      avgRisk: 0,
      repeatCount: 0,
      timeoutCount: 0,
      speedDistribution: { fast: 0, normal: 0, slow: 0, timeout: 0 },
      choiceDistribution: {},
    };

    const clickedFeatures = features.filter((f) => !f.timeOut && f.reactionTime > 0);

    features.forEach((f) => {
      summary.avgHesitation += f.hesitationTime;
      summary.avgRisk += f.riskChoice;
      summary.repeatCount += f.repeatChoice === 100 ? 1 : 0;
      summary.timeoutCount += f.timeOut;
      summary.speedDistribution[f.speedCategory]++;
      summary.choiceDistribution[f.choice] =
        (summary.choiceDistribution[f.choice] || 0) + 1;
    });

    summary.avgReactionTime = clickedFeatures.length > 0
      ? clickedFeatures.reduce((sum, f) => sum + f.reactionTime, 0) / clickedFeatures.length
      : 0;
    summary.avgHesitation /= features.length;
    summary.avgRisk /= features.length;

    return summary;
  }

  /**
   * extractor 초기화
   */
  reset() {
    this.previousChoices = [];
    this.previousReactionTimes = [];
  }
}

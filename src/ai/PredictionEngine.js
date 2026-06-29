/**
 * MindTrap - Prediction Engine
 * PlayerModel을 기반으로 플레이어의 다음 선택을 예측합니다.
 * JavaScript가 예측을 수행하며, Gemini는 이 결과를 해석합니다.
 */

import { QUESTION_TYPES } from '../utils/constants.js';

/**
 * PredictionEngine 클래스
 * 플레이어 모델을 기반으로 선택을 예측합니다.
 */
export class PredictionEngine {
  constructor() {
    /** @type {Array} 예측 히스토리 */
    this.predictionHistory = [];

    /** @type {number} 기본 예측 신뢰도 */
    this.baseConfidence = 0.3;
  }

  /**
   * 다음 선택 예측
   * @param {Object} playerModel - PlayerModel 스냅샷
   * @param {Object} currentQuestion - 현재 질문
   * @returns {Object} 예측 결과
   */
  predict(playerModel, currentQuestion) {
    const { attributes, recentChoices, choiceFrequency } = playerModel;
    const { type, choices } = currentQuestion;

    // 기본 예측 분석
    const analysis = this._analyzePredictionFactors(attributes, recentChoices, choiceFrequency, type);

    // 최종 예측 결정
    const prediction = this._makePrediction(analysis, attributes, type);

    // 신뢰도 계산
    const confidence = this._calculateConfidence(analysis, playerModel);

    // 이유 생성
    const reason = this._generateReason(analysis, attributes, type);

    const result = {
      prediction,
      probability: analysis.probability,
      confidence,
      reason,
      analysis,
      timestamp: Date.now(),
    };

    this.predictionHistory.push(result);
    return result;
  }

  /**
   * 예측 요인 분석
   * @param {Object} attributes - 플레이어 특성
   * @param {Array} recentChoices - 최근 선택들
   * @param {Object} choiceFrequency - 선택 빈도
   * @param {string} questionType - 질문 타입
   * @returns {Object} 분석 결과
   * @private
   */
  _analyzePredictionFactors(attributes, recentChoices, choiceFrequency, questionType) {
    const analysis = {
      riskFactor: 0,
      repeatFactor: 0,
      consistencyFactor: 0,
      hesitationFactor: 0,
      probability: 0.5,
      primaryLean: 0,
    };

    // 위험 성향 분석
    analysis.riskFactor = (attributes.risk - 50) / 50; // -1 to 1

    // 반복 패턴 분석
    if (recentChoices.length > 0) {
      const lastChoice = recentChoices[recentChoices.length - 1].choice;
      analysis.repeatFactor = lastChoice === 'primary' ? 0.3 : -0.3;
    }

    // 일관성 분석
    analysis.consistencyFactor = (attributes.consistency - 50) / 100; // -0.5 to 0.5

    // 망설임 분석
    analysis.hesitationFactor = attributes.hesitation / 100; // 0 to 1

    // 선택 빈도 기반 기울기
    const primaryCount = choiceFrequency['primary'] || 0;
    const secondaryCount = choiceFrequency['secondary'] || 0;
    const total = primaryCount + secondaryCount;
    if (total > 0) {
      analysis.primaryLean = (primaryCount - secondaryCount) / total;
    }

    // 종합 확률 계산
    analysis.probability = this._calculateProbability(analysis, questionType);

    return analysis;
  }

  /**
   * 확률 계산
   * @param {Object} analysis - 분석 결과
   * @param {string} questionType - 질문 타입
   * @returns {number} primary를 선택할 확률 (0-1)
   * @private
   */
  _calculateProbability(analysis, questionType) {
    let probability = 0.5;

    // 위험 성향 반영
    if (analysis.riskFactor > 0.3) {
      // 위험 선호 - 질문 타입에 따라 다름
      const riskMap = {
        [QUESTION_TYPES.RISK]: 0.2,
        [QUESTION_TYPES.COMBAT]: 0.15,
        [QUESTION_TYPES.REWARD]: 0.25,
      };
      probability += riskMap[questionType] || 0;
    } else if (analysis.riskFactor < -0.3) {
      const safeMap = {
        [QUESTION_TYPES.RISK]: -0.2,
        [QUESTION_TYPES.REWARD]: -0.25,
      };
      probability += safeMap[questionType] || 0;
    }

    // 반복 패턴 반영
    probability += analysis.repeatFactor * 0.2;

    // 일관성 반영
    probability += analysis.consistencyFactor * 0.15;

    // 선택 빈도 반영
    probability += analysis.primaryLean * 0.3;

    // 범위 제한
    return Math.max(0.1, Math.min(0.9, probability));
  }

  /**
   * 최종 예측 결정
   * @param {Object} analysis - 분석 결과
   * @param {Object} attributes - 플레이어 특성
   * @param {string} questionType - 질문 타입
   * @returns {string} 예측된 선택 ('primary' 또는 'secondary')
   * @private
   */
  _makePrediction(analysis, attributes, questionType) {
    return analysis.probability > 0.5 ? 'primary' : 'secondary';
  }

  /**
   * 신뢰도 계산
   * @param {Object} analysis - 분석 결과
   * @param {Object} playerModel - 플레이어 모델
   * @returns {string} 신뢰도 레벨 ('low' | 'medium' | 'high')
   * @private
   */
  _calculateConfidence(analysis, playerModel) {
    const { learningProgress, analyzedRounds } = playerModel;

    // 학습 진행률과 데이터 양에 기반한 신뢰도
    let confidenceScore = this.baseConfidence;

    // 라운드 수에 따른 증가
    confidenceScore += Math.min(0.3, analyzedRounds * 0.02);

    // 학습 진행률에 따른 증가
    confidenceScore += learningProgress * 0.3;

    // 일관성이 높으면 신뢰도 증가
    if (playerModel.attributes.consistency > 60) {
      confidenceScore += 0.1;
    }

    // 반복 패턴이 명확하면 신뢰도 증가
    if (analysis.repeatFactor !== 0) {
      confidenceScore += 0.05;
    }

    // 신뢰도 레벨 결정
    if (confidenceScore < 0.4) return 'low';
    if (confidenceScore < 0.7) return 'medium';
    return 'high';
  }

  /**
   * 예측 이유 생성
   * @param {Object} analysis - 분석 결과
   * @param {Object} attributes - 플레이어 특성
   * @param {string} questionType - 질문 타입
   * @returns {string} 예측 이유
   * @private
   */
  _generateReason(analysis, attributes, questionType) {
    const reasons = [];

    // 위험 성향 기반 이유
    if (attributes.risk > 65) {
      reasons.push('위험을 선호하는 성향');
    } else if (attributes.risk < 35) {
      reasons.push('안전을 추구하는 성향');
    }

    // 반복 기반 이유
    if (Math.abs(analysis.repeatFactor) > 0.2) {
      reasons.push('이전 선택 패턴');
    }

    // 일관성 기반 이유
    if (attributes.consistency > 65) {
      reasons.push('일관된 선택 경향');
    } else if (attributes.consistency < 35) {
      reasons.push('변덕스러운 선택 패턴');
    }

    // 선택 빈도 기반 이유
    if (Math.abs(analysis.primaryLean) > 0.3) {
      reasons.push('선호하는 선택지');
    }

    if (reasons.length === 0) {
      reasons.push('초기 분석 단계');
    }

    return reasons.join(', ');
  }

  /**
   * 예측 결과 반환 (Gemini에게 전달할 형태)
   * @returns {Object} Gemini에게 전달할 예측 데이터
   */
  getPredictionForGemini() {
    if (this.predictionHistory.length === 0) {
      return null;
    }
    return this.predictionHistory[this.predictionHistory.length - 1];
  }

  /**
   * 예측 정확도 계산
   * @param {Array} actualChoices - 실제 선택들
   * @returns {number} 정확도 (0-1)
   */
  calculateAccuracy(actualChoices) {
    if (actualChoices.length === 0) return 0;

    let correct = 0;
    const historyLength = Math.min(actualChoices.length, this.predictionHistory.length);
    const startIdx = this.predictionHistory.length - historyLength;

    for (let i = 0; i < historyLength; i++) {
      const prediction = this.predictionHistory[startIdx + i];
      const actual = actualChoices[i];
      if (prediction.prediction === actual) {
        correct++;
      }
    }

    return correct / historyLength;
  }

  /**
   * 예측 히스토리 초기화
   */
  reset() {
    this.predictionHistory = [];
  }
}
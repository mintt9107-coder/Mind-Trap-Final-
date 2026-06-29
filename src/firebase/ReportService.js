/**
 * MindTrap - Report Service
 * AI Analysis Report 생성 및 관리를 담당합니다.
 */

import { FirestoreService } from './FirestoreService.js';
import { AuthenticationService } from './AuthenticationService.js';
import { AIService } from '../ai/AIService.js';
import { PromptBuilder } from '../ai/PromptBuilder.js';

/**
 * ReportService 클래스
 * AI Analysis Report를 생성하고 저장합니다.
 */
export class ReportService {
  constructor() {
    /** @type {FirestoreService} Firestore 서비스 */
    this.firestoreService = new FirestoreService();

    /** @type {AuthenticationService} 인증 서비스 */
    this.authService = new AuthenticationService();

    /** @type {AIService} AI 서비스 */
    this.aiService = new AIService();

    /** @type {PromptBuilder} 프롬프트 빌더 */
    this.promptBuilder = new PromptBuilder();

    /** @type {boolean} 초기화 완료 여부 */
    this.isInitialized = false;
  }

  /**
   * Report 서비스 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    await this.firestoreService.initialize();
    await this.authService.initialize();

    this.isInitialized = true;
    return true;
  }

  /**
   * AI Analysis Report 생성
   * @param {Object} playerModel - PlayerModel 스냅샷
   * @param {Array} patterns - 발견된 패턴
   * @param {Object} learningSummary - 학습 요약
   * @returns {Promise<Object>} 생성된 리포트
   */
  async generateReport(playerModel, patterns, learningSummary) {
    const uid = this.authService.getCurrentUID();
    if (!uid) {
      console.error('ReportService: 사용자가 로그인되어 있지 않습니다.');
      return null;
    }

    // Gemini에게 분석 요청
    const reportContent = await this._generateAIReport(playerModel, patterns, learningSummary);

    // 리포트 객체 생성
    const report = {
      reportId: this._generateReportId(),
      uid,
      createdAt: Date.now(),
      playerModel: {
        risk: playerModel.attributes?.risk || 0,
        repeat: playerModel.attributes?.repeat || 0,
        adaptation: playerModel.attributes?.adaptation || 0,
        hesitation: playerModel.attributes?.hesitation || 0,
        reaction: playerModel.attributes?.reaction || 0,
        trustAI: playerModel.attributes?.trustAI || 0,
        predictionAccuracy: playerModel.predictionAccuracy || 0,
        learningProgress: playerModel.learningProgress || 0,
        confidence: playerModel.confidence || 0,
      },
      patterns: patterns.map(p => ({
        type: p.type,
        strength: p.strength,
        description: p.description,
      })),
      content: reportContent,
      summary: this._extractSummary(reportContent),
    };

    // Firestore에 저장
    await this._saveReport(report);

    return report;
  }

  /**
   * Gemini를 통한 AI 리포트 생성
   * @param {Object} playerModel - PlayerModel 스냅샷
   * @param {Array} patterns - 발견된 패턴
   * @param {Object} learningSummary - 학습 요약
   * @returns {Promise<string>} 생성된 리포트 내용
   * @private
   */
  async _generateAIReport(playerModel, patterns, learningSummary) {
    const messages = this.promptBuilder.buildAnalysisReportPrompt({
      playerModel,
      patterns,
      learningSummary,
    });

    const response = await this.aiService.chatCompletion({
      messages,
      maxTokens: 800,
      temperature: 0.5,
    });

    return response.content.trim();
  }

  /**
   * 리포트에서 요약 추출
   * @param {string} content - 리포트 내용
   * @returns {Object} 요약 데이터
   * @private
   */
  _extractSummary(content) {
    const lines = content.split('\n').filter(line => line.trim());
    
    return {
      predictionAccuracy: this._extractMetric(content, '예측 성공률'),
      riskPreference: this._extractMetric(content, '위험 성향'),
      patternRepeat: this._extractMetric(content, '패턴 반복성'),
      choiceChangeTiming: this._extractMetric(content, '선택 변화 시점'),
      psychologicalResistance: this._extractMetric(content, '심리전 대응 능력'),
      firstLearningMoment: this._extractMetric(content, 'First Learning Moment'),
      bestDeceptionMoment: this._extractMetric(content, 'Best Deception Moment'),
      todaySummary: this._extractSection(content, 'Today\'s Summary'),
      nextChallenge: this._extractSection(content, 'Next Challenge'),
    };
  }

  /**
   * 리포트에서 특정 메트릭 추출
   * @param {string} content - 리포트 내용
   * @param {string} metricName - 메트릭 이름
   * @returns {string} 추출된 값
   * @private
   */
  _extractMetric(content, metricName) {
    const regex = new RegExp(`${metricName}[:\\s]+([^\\n]+)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  /**
   * 리포트에서 특정 섹션 추출
   * @param {string} content - 리포트 내용
   * @param {string} sectionName - 섹션 이름
   * @returns {string} 추출된 섹션
   * @private
   */
  _extractSection(content, sectionName) {
    const regex = new RegExp(`${sectionName}[:\\s]+([\\s\\S]+?)(?=\\n\\n|\\n[A-Z]|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  /**
   * 리포트 ID 생성
   * @returns {string} 리포트 ID
   * @private
   */
  _generateReportId() {
    return 'report_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 리포트 저장
   * @param {Object} report - 저장할 리포트
   * @returns {Promise<boolean>} 성공 여부
   * @private
   */
  async _saveReport(report) {
    const uid = report.uid;
    const reportId = report.reportId;

    const path = `users/${uid}/reports`;
    const success = await this.firestoreService.setDocument(path, reportId, report);

    if (!success) {
      console.error('리포트 저장 실패, 로컬에 임시 저장');
      this._saveToLocal(report);
    }

    return success;
  }

  /**
   * 로컬에 임시 저장
   * @param {Object} report - 저장할 리포트
   * @private
   */
  _saveToLocal(report) {
    const pendingKey = 'mindtrap_pending_reports';
    const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
    pending.push(report);
    localStorage.setItem(pendingKey, JSON.stringify(pending));
  }

  /**
   * 사용자의 모든 리포트 조회
   * @returns {Promise<Array>} 리포트 배열
   */
  async getUserReports() {
    const uid = this.authService.getCurrentUID();
    if (!uid) {
      return [];
    }

    const path = `users/${uid}/reports`;
    const reports = await this.firestoreService.getCollection(path);

    // 최신순 정렬
    return reports.sort((a, b) => (b.data?.createdAt || 0) - (a.data?.createdAt || 0));
  }

  /**
   * 최근 리포트 조회
   * @param {number} limit - 가져올 리포트 수
   * @returns {Promise<Array>} 리포트 배열
   */
  async getRecentReports(limit = 5) {
    const reports = await this.getUserReports();
    return reports.slice(0, limit);
  }

  /**
   * 특정 리포트 조회
   * @param {string} reportId - 리포트 ID
   * @returns {Promise<Object|null>} 리포트 데이터
   */
  async getReport(reportId) {
    const uid = this.authService.getCurrentUID();
    if (!uid) {
      return null;
    }

    const path = `users/${uid}/reports`;
    const result = await this.firestoreService.getDocument(path, reportId);

    return result.exists ? result.data : null;
  }

  /**
   * 리포트 비교 (최근 리포트와 이전 리포트)
   * @returns {Promise<Object>} 비교 결과
   */
  async compareReports() {
    const reports = await this.getRecentReports(2);

    if (reports.length < 2) {
      return {
        hasComparison: false,
        message: '비교할 이전 리포트가 없습니다.',
      };
    }

    const current = reports[0].data;
    const previous = reports[1].data;

    const comparison = {
      hasComparison: true,
      current: {
        createdAt: current.createdAt,
        risk: current.playerModel.risk,
        predictionAccuracy: current.playerModel.predictionAccuracy,
        learningProgress: current.playerModel.learningProgress,
      },
      previous: {
        createdAt: previous.createdAt,
        risk: previous.playerModel.risk,
        predictionAccuracy: previous.playerModel.predictionAccuracy,
        learningProgress: previous.playerModel.learningProgress,
      },
      changes: {
        risk: current.playerModel.risk - previous.playerModel.risk,
        predictionAccuracy: current.playerModel.predictionAccuracy - previous.playerModel.predictionAccuracy,
        learningProgress: current.playerModel.learningProgress - previous.playerModel.learningProgress,
      },
      summary: this._generateComparisonSummary(current, previous),
    };

    return comparison;
  }

  /**
   * 비교 요약 생성
   * @param {Object} current - 현재 리포트
   * @param {Object} previous - 이전 리포트
   * @returns {string} 비교 요약
   * @private
   */
  _generateComparisonSummary(current, previous) {
    const changes = [];

    const riskDiff = current.playerModel.risk - previous.playerModel.risk;
    if (Math.abs(riskDiff) > 5) {
      changes.push(`위험 선택이 ${Math.abs(riskDiff)}% ${riskDiff > 0 ? '증가' : '감소'}했습니다.`);
    }

    const accuracyDiff = current.playerModel.predictionAccuracy - previous.playerModel.predictionAccuracy;
    if (Math.abs(accuracyDiff) > 0.05) {
      changes.push(`예측 정확도가 ${Math.abs(Math.round(accuracyDiff * 100))}% ${accuracyDiff > 0 ? '향상' : '하락'}했습니다.`);
    }

    if (changes.length === 0) {
      return '이전 게임과 비슷한 패턴을 보입니다.';
    }

    return changes.join(' ');
  }

  /**
   * Report 서비스 상태 반환
   * @returns {Object} 상태 정보
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
    };
  }
}
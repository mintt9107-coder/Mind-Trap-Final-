/**
 * MindTrap - AI Engine
 * 모든 AI 컴포넌트를 통합하는 메인 엔진입니다.
 * GameEngine과 독립적으로 동작하며, 학습과 예측을 수행합니다.
 */

import { LearningEngine } from './LearningEngine.js';
import { PredictionEngine } from './PredictionEngine.js';
import { LearningJournal } from './LearningJournal.js';
import { AIService } from './AIService.js';
import { PromptBuilder } from './PromptBuilder.js';
import { AIPersonality } from './AIPersonality.js';
import { Memory } from './Memory.js';
import { BehaviorAnalyzer } from './BehaviorAnalyzer.js';
import { GAME_CONFIG } from '../utils/constants.js';

/**
 * AIEngine 클래스
 * 전체 AI 시스템을 통합 관리합니다.
 */
export class AIEngine {
  constructor() {
    // 하위 엔진 초기화
    this.learningEngine = new LearningEngine();
    this.predictionEngine = new PredictionEngine();
    this.learningJournal = new LearningJournal();
    this.aiService = new AIService();
    this.promptBuilder = new PromptBuilder();
    this.personality = new AIPersonality();
    this.memory = new Memory();
    this.behaviorAnalyzer = new BehaviorAnalyzer();

    /** @type {boolean} AI 엔진 활성화 여부 */
    this.isActive = false;

    /** @type {Array} AI 대사 히스토리 */
    this.dialogueHistory = [];

    /** @type {string|null} 마지막 AI 대사 */
    this.lastDialogue = null;

    /** @type {Object|null} 마지막 예측 */
    this.lastPrediction = null;
  }

  /**
   * AI 엔진 초기화
   */
  initialize() {
    this.learningEngine.initialize();
    this.predictionEngine.reset();
    this.learningJournal.reset();
    this.dialogueHistory = [];
    this.lastDialogue = null;
    this.lastPrediction = null;
    this.isActive = true;
  }

  /**
   * 라운드 시작 시 호출
   * @param {Object} currentQuestion - 현재 질문
   * @param {Object} [options] - 옵션
   * @param {boolean} [options.generateDialogue=true] - 라운드 시작 대사 생성 여부
   * @returns {Promise<Object>} 예측 결과 및 AI 대사
   */
  async onRoundStart(currentQuestion, { generateDialogue = true } = {}) {
    if (!this.isActive) return null;

    const playerSnapshot = this.learningEngine.getPlayerSnapshot();
    const currentRound = this.learningEngine.playerModel.analyzedRounds + 1;
    const memorySummary = this.memory.getMemorySummary();

    // 예측 수행
    const prediction = this.predictionEngine.predict(
      playerSnapshot,
      currentQuestion
    );
    this.lastPrediction = prediction;

    const dialogue = generateDialogue
      ? await this._generateRoundDialogue({
          playerSnapshot,
          currentRound,
          currentQuestion,
          prediction,
          memorySummary,
        })
      : null;

    return {
      prediction,
      dialogue,
      playerSnapshot,
    };
  }

  /**
   * 라운드 종료 시 호출 (학습 수행)
   * @param {Object} roundData - 라운드 데이터
   * @returns {Object} 학습 결과
   */
  onRoundEnd(roundData) {
    if (!this.isActive) return null;

    // 학습 수행
    const learningResult = this.learningEngine.learnFromRound(roundData);

    // 저널에 기록 (playerModelSnapshot → playerSnapshot 매핑)
    if (learningResult) {
      this.learningJournal.addEntry({
        round: learningResult.round,
        features: learningResult.features,
        appliedRules: learningResult.appliedRules,
        playerSnapshot: learningResult.playerModelSnapshot,
      });
    }

    // 예측 정확도 업데이트
    const lastPrediction = this.predictionEngine.getPredictionForGemini();
    if (lastPrediction) {
      const wasCorrect = lastPrediction.prediction === roundData.choice;
      this.learningEngine.updateFromPrediction(wasCorrect);
    }

    return learningResult;
  }

  /**
   * 라운드 진행 대사 생성
   * @param {Object} params - 파라미터
   * @returns {Promise<string>} AI 대사
   * @private
   */
  async _generateRoundDialogue({ playerSnapshot, currentRound, currentQuestion, prediction, memorySummary }) {
    // 프롬프트 빌드
    const messages = this.promptBuilder.buildRoundProgressPrompt({
      playerModel: playerSnapshot,
      currentRound,
      currentQuestion,
      prediction,
      learningJournal: this.learningJournal,
      memorySummary,
    });

    // Gemini 호출
    const response = await this.aiService.chatCompletion({
      messages,
      maxTokens: 2000,
      temperature: 0.6,
    });

    // 후처리 (이모지 제거, 금지 표현 필터링)
    const dialogue = this.personality.postProcess(response.content.trim());
    
    this.lastDialogue = dialogue;
    this.dialogueHistory.push({
      round: currentRound,
      dialogue,
      type: 'round_progress',
      timestamp: Date.now(),
    });

    return dialogue;
  }

  /**
   * 게임 시작 대사 생성
   * @returns {Promise<string>} 게임 시작 대사
   */
  async generateGameStartDialogue() {
    const memorySummary = this.memory.getMemorySummary();

    const messages = this.promptBuilder.buildGameStartPrompt({
      memorySummary,
    });

    const response = await this.aiService.chatCompletion({
      messages,
      maxTokens: 2000,
      temperature: 0.5,
    });

    const dialogue = this.personality.postProcess(response.content.trim());
    
    this.dialogueHistory.push({
      round: 0,
      dialogue,
      type: 'game_start',
      timestamp: Date.now(),
    });

    return dialogue;
  }

  /**
   * 예측 결과 대사 생성
   * 유저의 선택 즉각 반영 - 고도의 심리전 대사 생성
   * @param {boolean} wasCorrect - 예측이 맞았는지
   * @param {Object} [roundData] - 라운드 데이터 (선택, 반응시간, 변경 여부)
   * @returns {Promise<string>} 예측 결과 대사
   */
  async generatePredictionResultDialogue(wasCorrect, roundData = null) {
    if (!this.lastPrediction) {
      // 예측이 없어도 유저의 선택에 대한 심리전 대사 생성
      if (roundData) {
        return this._generateChoiceReactionDialogue(roundData);
      }
      return '';
    }

    const messages = wasCorrect
      ? this.promptBuilder.buildPredictionSuccessPrompt({
          prediction: this.lastPrediction,
          actualChoice: roundData?.choice || this.lastPrediction.prediction,
          roundData,
        })
      : this.promptBuilder.buildPredictionFailurePrompt({
          prediction: this.lastPrediction,
          actualChoice: roundData?.choice || 'other',
          roundData,
        });

    const response = await this.aiService.chatCompletion({
      messages,
      maxTokens: 2000,
      temperature: 0.5,
    });

    const dialogue = this.personality.postProcess(response.content.trim());
    
    this.dialogueHistory.push({
      round: this.learningEngine.playerModel.analyzedRounds,
      dialogue,
      type: wasCorrect ? 'prediction_success' : 'prediction_failure',
      timestamp: Date.now(),
    });

    return dialogue;
  }

  /**
   * 유저 선택에 대한 심리전 반응 대사 생성 (예측 없는 초기 라운드용)
   * @param {Object} roundData - 라운드 데이터
   * @returns {Promise<string>} 심리전 대사
   * @private
   */
  async _generateChoiceReactionDialogue(roundData) {
    const playerSnapshot = this.learningEngine.getPlayerSnapshot();

    const messages = this.promptBuilder.buildChoiceReactionPrompt({
      playerModel: playerSnapshot,
      roundData,
    });

    const response = await this.aiService.chatCompletion({
      messages,
      maxTokens: 2000,
      temperature: 0.65,
    });

    const dialogue = this.personality.postProcess(response.content.trim());

    this.dialogueHistory.push({
      round: roundData.round,
      dialogue,
      type: 'choice_reaction',
      timestamp: Date.now(),
    });

    return dialogue;
  }

  /**
   * 최종 분석 리포트 생성
   * 실제 학습 데이터를 기반으로 그래프용 퍼센트가 포함된 구체적 리포트 생성
   * @returns {Promise<string>} 분석 리포트 (마크다운 형식, 퍼센트 포함)
   */
  async generateFinalReport() {
    if (!this.isActive) return null;

    const playerSnapshot = this.learningEngine.getPlayerSnapshot();
    const patterns = this.learningEngine.analyzePatterns();
    const learningSummary = this.learningEngine.getLearningSummary();
    const userName = this.memory.getUserName();

    // Gemini 호출 시도
    const messages = this.promptBuilder.buildAnalysisReportPrompt({
      playerModel: playerSnapshot,
      patterns,
      learningSummary,
      userName,
    });

    let report;
    const response = await this.aiService.chatCompletion({
      messages,
      maxTokens: 2000,
      temperature: 0.5,
    });
    report = this.personality.postProcess(response.content.trim());

    report = this._applyReportAddress(report, userName);

    // 메모리에 게임 저장
    this.memory.saveGameMemory({
      playerModel: playerSnapshot,
      patterns,
      playerType: playerSnapshot.playerType || this.learningEngine.playerModel.getPlayerType(),
      predictionAccuracy: playerSnapshot.predictionAccuracy,
    });

    return report;
  }

  /**
   * 실제 학습 데이터를 기반으로 구체적인 분석 리포트 생성
   * BehaviorAnalyzer를 활용하여 행동 데이터 기반의 심층 분석 제공
   * @param {Object} playerSnapshot - 플레이어 모델 스냅샷
   * @param {Array} patterns - 발견된 패턴
   * @param {Object} learningSummary - 학습 요약
   * @param {string} userName - 유저 이름
   * @returns {string} 마크다운 형식 분석 리포트
   * @private
   */
  _generateDataDrivenReport(playerSnapshot, patterns, learningSummary, userName) {
    // BehaviorAnalyzer를 통한 심층 행동 분석
    const analysis = this.behaviorAnalyzer.analyze(
      playerSnapshot,
      null,
      this.learningJournal
    );

    // 행동 분석 기반 상세 리포트 생성
    return this.behaviorAnalyzer.generateDetailedReport(
      analysis,
      playerSnapshot,
      patterns,
      learningSummary,
      userName
    );
  }

  /**
   * 결과 리포트의 호칭을 저장된 이름 기준으로 통일합니다.
   * @param {string} report - 분석 리포트
   * @param {string|null} userName - 저장된 유저 이름
   * @returns {string}
   * @private
   */
  _applyReportAddress(report, userName) {
    if (!report || typeof report !== 'string') return report;

    const cleanName = userName ? userName.trim() : '';
    if (!cleanName) {
      return report;
    }

    const name = `${cleanName}님`;
    return report
      .replace(/당신은/g, `${name}은`)
      .replace(/당신의/g, `${name}의`)
      .replace(/당신을/g, `${name}을`)
      .replace(/당신에게/g, `${name}에게`)
      .replace(/당신이/g, `${name}이`)
      .replace(/당신도/g, `${name}도`)
      .replace(/당신만/g, `${name}만`)
      .replace(/당신/g, name);
  }

  /**
   * Replay 생성
   * @returns {Promise<string>} Replay 텍스트
   */
  async generateReplay() {
    if (!this.isActive) return null;

    const journalEntries = this.learningJournal.getAllEntries();
    const playerSnapshot = this.learningEngine.getPlayerSnapshot();

    const messages = this.promptBuilder.buildReplayPrompt({
      journalEntries,
      playerModel: playerSnapshot,
    });

    const response = await this.aiService.chatCompletion({
      messages,
      maxTokens: 2000,
      temperature: 0.5,
    });

    return this.personality.postProcess(response.content.trim());
  }

  /**
   * Memory 대화 생성
   * @returns {Promise<string>} Memory 기반 대화
   */
  async generateMemoryDialogue() {
    const memorySummary = this.memory.getMemorySummary();
    const playerSnapshot = this.learningEngine.getPlayerSnapshot();
    const comparisonData = this.memory.getComparisonData(this.learningEngine.playerModel);

    const messages = this.promptBuilder.buildMemoryDialoguePrompt({
      memorySummary,
      comparisonData,
    });

    const response = await this.aiService.chatCompletion({
      messages,
      maxTokens: 2000,
      temperature: 0.5,
    });

    return this.personality.postProcess(response.content.trim());
  }

  /**
   * AI 상태에 따른 대사 가져오기
   * (Gemini 호출 없이 JavaScript로만 생성)
   * @returns {Object} AI 대사 정보
   */
  getAIStatement() {
    return this.learningEngine.getAIStatement();
  }

  /**
   * 학습 요약 반환
   * @returns {Object} 학습 요약
   */
  getLearningSummary() {
    return this.learningEngine.getLearningSummary();
  }

  /**
   * 발견된 패턴 반환
   * @returns {Array} 패턴 목록
   */
  getPatterns() {
    return this.learningEngine.analyzePatterns();
  }

  /**
   * 플레이어 타입 반환
   * @returns {string} 플레이어 타입
   */
  getPlayerType() {
    return this.learningEngine.playerModel.getPlayerType();
  }

  /**
   * API 키 설정
   * @param {string} apiKey - OpenRouter API 키
   */
  setApiKey(apiKey) {
    this.aiService.setApiKey(apiKey);
  }

  /**
   * OpenRouter 모델 ID 설정
   * @param {string} modelId - OpenRouter 모델 ID
   */
  setModelId(modelId) {
    this.aiService.setModelId(modelId);
  }

  /**
   * AI 엔진 상태 반환
   * @returns {Object} 상태 정보
   */
  getStatus() {
    return {
      isActive: this.isActive,
      aiService: this.aiService.getStatus(),
      learningProgress: this.learningEngine.playerModel.learningProgress,
      confidence: this.learningEngine.playerModel.confidence,
      analyzedRounds: this.learningEngine.playerModel.analyzedRounds,
      dialogueCount: this.dialogueHistory.length,
    };
  }

  /**
   * AI 엔진 리셋
   */
  reset() {
    this.learningEngine.reset();
    this.predictionEngine.reset();
    this.learningJournal.reset();
    this.aiService.reset();
    this.dialogueHistory = [];
    this.lastDialogue = null;
    this.lastPrediction = null;
    this.isActive = false;
  }

  /**
   * Memory 조회
   * @returns {Memory} 메모리 인스턴스
   */
  getMemory() {
    return this.memory;
  }

  /**
   * AI Personality 조회
   * @returns {AIPersonality} AI 성격 인스턴스
   */
  getPersonality() {
    return this.personality;
  }

  /**
   * 학습 저널 조회 (테스트용)
   * @returns {Object} 학습 저널
   */
  getLearningJournal() {
    return this.learningJournal;
  }

  /**
   * 예측 엔진 조회 (테스트용)
   * @returns {PredictionEngine} 예측 엔진
   */
  getPredictionEngine() {
    return this.predictionEngine;
  }

  /**
   * 행동 분석 기반 프로필 제목(한마디) 반환
   * @returns {string} 프로필 제목
   */
  getProfileTitle() {
    const playerSnapshot = this.learningEngine.getPlayerSnapshot();
    const analysis = this.behaviorAnalyzer.analyze(
      playerSnapshot,
      null,
      this.learningJournal
    );
    const userName = this.memory.getUserName();
    return this.behaviorAnalyzer.generateProfileTitle(analysis, playerSnapshot, userName);
  }

  /**
   * 행동 분석 기반 유저 프로필 반환 (저장/공유용)
   * @returns {Object} 유저 프로필 객체
   */
  getPlayerProfile() {
    const playerSnapshot = this.learningEngine.getPlayerSnapshot();
    const analysis = this.behaviorAnalyzer.analyze(
      playerSnapshot,
      null,
      this.learningJournal
    );
    const userName = this.memory.getUserName();
    return this.behaviorAnalyzer.generatePlayerProfile(analysis, playerSnapshot, userName);
  }
}

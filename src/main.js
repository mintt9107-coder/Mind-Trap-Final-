/**
 * MindTrap - Main Entry Point
 * 게임의 진입점이며 모든 화면과 엔진을 통합합니다.
 * GameEngine과 AIEngine을 이벤트 기반으로 연결합니다.
 */

import { GameEngine } from './engine/GameEngine.js';
import { AIEngine } from './ai/AIEngine.js';
import { SCREEN_STATES, GAME_EVENTS } from './utils/constants.js';
import { createSplashScreen } from './screens/SplashScreen.js';
import { createLandingScreen } from './screens/LandingScreen.js';
import { createTutorialScreen } from './screens/TutorialScreen.js';
import { createGameScreen } from './screens/GameScreen.js';
import { createResultScreen } from './screens/ResultScreen.js';

/**
 * MindTrap 애플리케이션 클래스
 */
export class MindTrap {
  constructor() {
    // 앱 컨테이너
    this.appContainer = document.getElementById('app');

    // 게임 엔진 초기화
    this.gameEngine = new GameEngine();

    // AI 엔진 초기화
    this.aiEngine = new AIEngine();

    // OpenRouter API 키 로드 (window.MINDTRAP_CONFIG 또는 환경 변수)
    this._loadAiApiKey();

    // 화면들 초기화
    this.screens = {};
    this.currentScreen = null;
    this.pendingAiDialogue = null;
    this.displayedDialogueRound = null;
    this.viewMode = this._loadViewMode();
    this._applyViewMode(this.viewMode);

    // 앱 초기화
    this._initialize();

    // AI 엔진을 게임 이벤트에 바인딩
    this._bindAiEngine();
  }

  /**
   * AI 엔진에 API 키 로드
   * @private
   */
  _loadAiApiKey() {
    let apiKey = null;

    // window 전역 설정에서 로드 (Next.js page.js에서 주입)
    if (typeof window !== 'undefined' && window.MINDTRAP_CONFIG) {
      apiKey = window.MINDTRAP_CONFIG.OPENROUTER_API_KEY ||
               window.MINDTRAP_CONFIG.openRouter?.apiKey || null;
    }

    // process.env에서 로드 (빌드 타임)
    if (!apiKey && typeof process !== 'undefined' && process.env) {
      apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || null;
    }

    if (apiKey) {
      this.aiEngine.setApiKey(apiKey);
      console.log('%c AI Engine: API Key configured ', 'background: #10b981; color: white; padding: 2px 6px; border-radius: 3px;');
    } else {
      console.warn('AI Engine: API Key not found - falling back to mock mode');
    }
  }

  /**
   * AI 엔진을 GameEngine 이벤트에 바인딩
   * 모든 질문 페이지에서 유저 선택에 따라 AI가 즉각적으로 심리전을 걸도록 연결
   * @private
   */
  _bindAiEngine() {
    // 게임 시작 시 AI 엔진 초기화
    this.gameEngine.addEventListener(GAME_EVENTS.GAME_START, () => {
      this.aiEngine.initialize();
      this.pendingAiDialogue = '첫 선택부터 조심하세요. 예측을 피하려는 순간, 오히려 심리는 더 선명해집니다.';
      this.displayedDialogueRound = null;
    });

    // 라운드 시작 시 AI 예측 갱신 + 저장된 심리전 대사 1회 표시
    this.gameEngine.addEventListener(GAME_EVENTS.ROUND_START, async (data) => {
      const currentQuestion = data.question;
      const round = data.round;
      this._showPendingAiDialogueForRound(round);

      try {
        await this.aiEngine.onRoundStart(currentQuestion, { generateDialogue: false });
      } catch (error) {
        console.error('AI round start error:', error);
      }
    });

    // 유저 선택 즉각 반영 - onRoundEnd로 학습 + 예측 결과 대사
    this.gameEngine.addEventListener(GAME_EVENTS.CHOICE_MADE, async (roundData) => {
      // AI 학습 수행 (플레이어 모델 업데이트)
      this.aiEngine.onRoundEnd(roundData);

      // 예측 결과 대사 생성 (맞았는지 틀렸는지) - roundData 전달
      try {
        const wasCorrect = this.aiEngine.lastPrediction
          ? this.aiEngine.lastPrediction.prediction === roundData.choice
          : false;
        const dialogue = await this.aiEngine.generatePredictionResultDialogue(wasCorrect, roundData);
        if (dialogue) {
          this.pendingAiDialogue = dialogue;
          const currentRound = this.gameEngine.roundManager.currentRound;
          if (currentRound === roundData.round + 1) {
            this._showPendingAiDialogueForRound(currentRound);
          } else if (currentRound > roundData.round + 1) {
            this.pendingAiDialogue = null;
          }
        }
      } catch (error) {
        console.error('AI choice dialogue error:', error);
      }
    });

    this.gameEngine.addEventListener(GAME_EVENTS.TIME_EXPIRED, async (roundData) => {
      this.aiEngine.onRoundEnd(roundData);
      try {
        const dialogue = await this.aiEngine.generatePredictionResultDialogue(false, roundData);
        if (dialogue) {
          this.pendingAiDialogue = dialogue;
          const currentRound = this.gameEngine.roundManager.currentRound;
          if (currentRound === roundData.round + 1) {
            this._showPendingAiDialogueForRound(currentRound);
          } else if (currentRound > roundData.round + 1) {
            this.pendingAiDialogue = null;
          }
        }
      } catch (error) {
        console.error('AI timeout dialogue error:', error);
      }
    });

    // 게임 종료 시 최종 분석 리포트 + 프로필 생성
    this.gameEngine.addEventListener(GAME_EVENTS.GAME_END, async (data) => {
      try {
        const report = await this.aiEngine.generateFinalReport();
        if (report) {
          this.screens.result.setAiReport(report);
        }

        // 행동 분석 기반 프로필 제목 + 유저 프로필 전달
        const profileTitle = this.aiEngine.getProfileTitle();
        const playerProfile = this.aiEngine.getPlayerProfile();
        if (profileTitle) {
          this.screens.result.setProfileTitle(profileTitle);
        }
        if (playerProfile) {
          this.screens.result.setPlayerProfile(playerProfile);
        }
      } catch (error) {
        console.error('AI final report error:', error);
      }
    });
  }

  /**
   * AI 대사를 GameScreen에 전달하여 표시
   * @param {string} dialogue - AI 대사
   * @param {boolean} [isFinal=false] - 최종 리포트 여부
   * @private
   */
  _showAiDialogue(dialogue, isFinal = false) {
    if (!dialogue) return;
    const gameScreen = this.screens.game;
    if (gameScreen && typeof gameScreen.showAiDialogue === 'function') {
      gameScreen.showAiDialogue(dialogue, isFinal);
    }
  }

  _showPendingAiDialogueForRound(round) {
    if (!this.pendingAiDialogue) return;
    if (this.displayedDialogueRound === round) {
      this.pendingAiDialogue = null;
      return;
    }
    this._showAiDialogue(this.pendingAiDialogue);
    this.pendingAiDialogue = null;
    this.displayedDialogueRound = round;
  }

  _loadViewMode() {
    if (typeof window === 'undefined') return 'desktop';
    const savedMode = window.localStorage.getItem('mindtrap_view_mode');
    if (savedMode === 'desktop' || savedMode === 'mobile') return savedMode;
    return window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop';
  }

  _applyViewMode(mode) {
    if (typeof document === 'undefined') return;
    document.body.classList.remove('mindtrap-mode-desktop', 'mindtrap-mode-mobile');
    document.body.classList.add(`mindtrap-mode-${mode}`);
    document.body.dataset.viewMode = mode;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('mindtrap_view_mode', mode);
    }
  }

  /**
   * 앱 초기화
   * @private
   */
  _initialize() {
    // 화면 생성
    this._createScreens();

    // 이벤트 리스너 설정
    this._setupEventListeners();

    // 스플래시 화면 표시
    this._showScreen(SCREEN_STATES.SPLASH);
    this.screens.splash.show();
  }

  /**
   * 모든 화면 생성
   * @private
   */
  _createScreens() {
    // 스플래시 화면
    this.screens.splash = createSplashScreen({
      onComplete: () => {
        this.screens.splash.hide();
        setTimeout(() => {
          this._showScreen(SCREEN_STATES.LANDING);
          this.screens.landing.show();
        }, 500);
      },
    });

    // 랜딩 화면
    this.screens.landing = createLandingScreen({
      onStartGame: () => {
        this._handleStartGame();
      },
      onShowTutorial: () => {
        this._showScreen(SCREEN_STATES.TUTORIAL);
        this.screens.tutorial.show();
      },
      initialUserName: this.aiEngine.getMemory().getUserName() || '',
      onSaveUserName: (name) => {
        this.aiEngine.getMemory().setUserName(name);
        return this.aiEngine.getMemory().getMemorySummary();
      },
      viewMode: this.viewMode,
      onChangeViewMode: (mode) => {
        this.viewMode = mode;
        this._applyViewMode(mode);
      },
      onResetMemory: () => {
        this.aiEngine.getMemory().clearAll();
        // 페이지 새로고침으로 랜딩 화면 갱신
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      },
      memorySummary: this.aiEngine.getMemory().getMemorySummary(),
    });

    // 튜토리얼 화면
    this.screens.tutorial = createTutorialScreen({
      onStartGame: () => {
        this._handleStartGame();
      },
      onBack: () => {
        this._showScreen(SCREEN_STATES.LANDING);
        this.screens.tutorial.hide();
        this.screens.landing.show();
      },
    });

    // 게임 화면
    this.screens.game = createGameScreen({
      gameEngine: this.gameEngine,
    });

    // 결과 화면
    this.screens.result = createResultScreen({
      gameEngine: this.gameEngine,
      onRestart: () => {
        this._handleRestart();
      },
      onBackToMenu: () => {
        this._handleBackToMenu();
      },
    });

    // DOM에 추가
    Object.values(this.screens).forEach((screen) => {
      this.appContainer.appendChild(screen.element);
    });
  }

  /**
   * 이벤트 리스너 설정
   * @private
   */
  _setupEventListeners() {
    // 화면 변경 이벤트
    this.gameEngine.addEventListener(SCREEN_STATES.SPLASH, () => {
      this._showScreen(SCREEN_STATES.SPLASH);
    });

    // 게임 종료 이벤트
    this.gameEngine.addEventListener('game:end', (data) => {
      setTimeout(() => {
        this._showScreen(SCREEN_STATES.RESULT);
        this.screens.result.show();
      }, 300);
    });
  }

  /**
   * 화면 전환
   * @param {string} screenName - 전환할 화면 이름
   * @private
   */
  _showScreen(screenName) {
    // 모든 화면 숨기기
    Object.keys(this.screens).forEach((key) => {
      this.screens[key].hide();
    });

    // 현재 화면 업데이트
    this.currentScreen = screenName;
  }

  /**
   * 게임 시작 처리
   * @private
   */
  _handleStartGame() {
    // 튜토리얼에서 시작하는 경우
    if (this.currentScreen === SCREEN_STATES.TUTORIAL) {
      this.screens.tutorial.hide();
    } else {
      this.screens.landing.hide();
    }

    // 게임 시작
    this._showScreen(SCREEN_STATES.GAME);
    this.screens.game.show();
    this.gameEngine.startGame();
  }

  /**
   * 게임 재시작 처리
   * @private
   */
  _handleRestart() {
    this.screens.result.hide();
    this.gameEngine.restartGame();

    // 랜딩 화면 표시
    setTimeout(() => {
      this._showScreen(SCREEN_STATES.LANDING);
      this.screens.landing.show();
    }, 100);
  }

  /**
   * 메뉴로 돌아가기 처리
   * @private
   */
  _handleBackToMenu() {
    this.screens.result.hide();
    this.gameEngine.backToMenu();

    // 랜딩 화면 표시
    setTimeout(() => {
      this._showScreen(SCREEN_STATES.LANDING);
      this.screens.landing.show();
    }, 100);
  }
}

export const initMindTrap = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  if (window.mindTrap) {
    return window.mindTrap;
  }

  const start = () => {
    window.mindTrap = new MindTrap();
    console.log('%c MindTrap Loaded ', 'background: #7c3aed; color: white; padding: 4px 8px; border-radius: 4px;');
    return window.mindTrap;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
    return null;
  }

  return start();
};

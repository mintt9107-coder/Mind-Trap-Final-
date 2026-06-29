/**
 * MindTrap - Game Constants
 * 모든 게임 설정값과 상수를 관리합니다.
 */

/** 게임 전체 설정 */
export const GAME_CONFIG = Object.freeze({
  TOTAL_ROUNDS: 20,
  ROUND_TIME_LIMIT: 10000, // 10초 (밀리초) - 시간적 압박
  SPLASH_DURATION: 4000, // 4초
  TUTORIAL_STORAGE_KEY: 'mindtrap_tutorial_completed',
  TWO_STAGE_CHANCE: 0.3, // 2단계 선택지가 등장할 확률 (30%)
});

/** 화면 전환 상태 */
export const SCREEN_STATES = Object.freeze({
  SPLASH: 'splash',
  LANDING: 'landing',
  TUTORIAL: 'tutorial',
  GAME: 'game',
  RESULT: 'result',
  MEMORY_BOOK: 'memory_book',
});

/** 질문 타입 정의 */
export const QUESTION_TYPES = Object.freeze({
  DIRECTION: 'direction',
  COMBAT: 'combat',
  RISK: 'risk',
  TIME: 'time',
  REWARD: 'reward',
  EMOTION: 'emotion',
  SPEED: 'speed',
  TEMPTATION: 'temptation', // 심리적 유혹 (4선택지)
});

/** 질문 타입별 선택지 */
export const QUESTION_CHOICES = Object.freeze({
  [QUESTION_TYPES.DIRECTION]: {
    left: '왼쪽',
    right: '오른쪽',
  },
  [QUESTION_TYPES.COMBAT]: {
    attack: '공격',
    defense: '방어',
  },
  [QUESTION_TYPES.RISK]: {
    risk: '위험 감수',
    safe: '안전 선택',
  },
  [QUESTION_TYPES.TIME]: {
    wait: '기다리기',
    click: '즉시 클릭',
  },
  [QUESTION_TYPES.REWARD]: {
    highReward: '높은 보상',
    lowReward: '낮은 보상',
  },
  [QUESTION_TYPES.EMOTION]: {
    trust: '신뢰',
    doubt: '의심',
  },
  [QUESTION_TYPES.SPEED]: {
    fast: '빠르게',
    slow: '천천히',
  },
  [QUESTION_TYPES.TEMPTATION]: {
    A: '가장 먼저 제시된 정보',
    B: '가장 많은 사람이 선택한 정보',
    C: '전문가처럼 보이는 사람이 말한 정보',
    D: '내 직감과 가장 잘 맞는 정보',
  },
});

/** 질문 프롬프트 템플릿 */
export const QUESTION_PROMPTS = Object.freeze({
  [QUESTION_TYPES.DIRECTION]: '당신은 어느 방향을 선택하시겠습니까?',
  [QUESTION_TYPES.COMBAT]: 'AI와의 대결에서 당신은 어떤 선택을 하시겠습니까?',
  [QUESTION_TYPES.RISK]: '당신은 위험을 감수하시겠습니까, 아니면 안전을 선택하시겠습니까?',
  [QUESTION_TYPES.TIME]: '당신은 끝까지 기다리시겠습니까, 아니면 즉시 행동하시겠습니까?',
  [QUESTION_TYPES.REWARD]: '당신은 높은 보상을 노리시겠습니까, 아니면 작지만 확실한 보상을 선택하시겠습니까?',
  [QUESTION_TYPES.EMOTION]: '당신은 AI를 신뢰하시겠습니까, 아니면 의심하시겠습니까?',
  [QUESTION_TYPES.SPEED]: '당신은 빠르게 결정하시겠습니까, 아니면 신중하게 천천히 하시겠습니까?',
  [QUESTION_TYPES.TEMPTATION]: '제한 시간 안에 결정을 내려야 합니다. 어떤 정보를 먼저 믿겠습니까?',
});

/** 타이머 상태 */
export const TIMER_STATES = Object.freeze({
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  EXPIRED: 'expired',
});

/** 게임 이벤트 타입 */
export const GAME_EVENTS = Object.freeze({
  ROUND_START: 'round:start',
  ROUND_END: 'round:end',
  CHOICE_MADE: 'choice:made',
  TIME_EXPIRED: 'time:expired',
  GAME_START: 'game:start',
  GAME_END: 'game:end',
  SCREEN_CHANGE: 'screen:change',
  TIMER_TICK: 'timer:tick',
  TWO_STAGE: 'two_stage', // 2단계 선택지 이벤트
});
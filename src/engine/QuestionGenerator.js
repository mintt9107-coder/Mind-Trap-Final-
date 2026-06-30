/**
 * MindTrap - Question Generator
 * 20개의 라운드마다 중복되지 않는 다양한 질문을 생성합니다.
 * 각 질문은 질문 텍스트와 그에 맞는 선택지 쌍으로 구성됩니다.
 * 심리적 유혹(4선택지) 질문과 2단계 선택지 기능을 지원합니다.
 */

import {
  QUESTION_TYPES,
  GAME_CONFIG,
} from '../utils/constants.js';
import { shuffleArray, getRandomElement } from '../utils/helpers.js';

/**
 * 질문-선택지 쌍 풀
 * 각 질문마다 그에 맞는 선택지를 가집니다.
 * primary/secondary는 2선택지, A/B/C/D는 4선택지입니다.
 */
const QUESTION_POOL = [
  // ========== DIRECTION ==========
  { type: QUESTION_TYPES.DIRECTION, prompt: '낯선 미로의 끝에서 두 개의 문이 있습니다. 왼쪽 문에서 희미한 빛이, 오른쪽 문에서 바람이 느껴집니다. 어느 쪽으로 가시겠습니까?', choices: { primary: '빛이 새어 나오는 왼쪽 문', secondary: '바람이 부는 오른쪽 문' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '길을 잃었습니다. 왼쪽에는 낯익은 풍경이, 오른쪽에는 전혀 모르는 길이 있습니다. 어디로 가시겠습니까?', choices: { primary: '낯익은 왼쪽 길', secondary: '미지의 오른쪽 길' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '두 갈래 길 앞에 섰습니다. 한쪽은 곧게 뻗어 있고, 다른 쪽은 굽어 있습니다. 당신의 발은 어느 쪽을 향합니까?', choices: { primary: '곧게 뻗은 길', secondary: '굽어 있는 길' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '갈림길에서 직감이 말합니다. 왼쪽으로 가야 한다고. 하지만 논리는 오른쪽을 가리킵니다. 어디로?', choices: { primary: '직감을 따라 왼쪽', secondary: '논리를 따라 오른쪽' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '어둠 속에서 두 개의 통로가 보입니다. 하나는 좁고 하나는 넓습니다. 어느 쪽으로?', choices: { primary: '좁은 통로', secondary: '넓은 통로' } },

  // ========== COMBAT ==========
  { type: QUESTION_TYPES.COMBAT, prompt: 'AI가 당신의 패턴을 읽고 있다고 밝혔습니다. 먼저 움직여 패턴을 깨시겠습니까, 아니면 AI의 움직임을 기다리시겠습니까?', choices: { primary: '먼저 공격하여 패턴을 깬다', secondary: '기다리며 AI의 움직임을 본다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: 'AI가 도발합니다. "네 다음 수를 알고 있다"고요. 감정적으로 대응하시겠습니까, 이성적으로 무시하시겠습니까?', choices: { primary: '감정적으로 맞선다', secondary: '이성적으로 무시한다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: 'AI와의 대결에서 한 발 뒤로 물러서면 더 큰 기회가 올 수 있습니다. 하지만 물러서는 것은 패배처럼 느껴집니다. 어떻게 하시겠습니까?', choices: { primary: '물러서지 않고 계속 공격', secondary: '한 발 물러서서 기회를 노린다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: 'AI가 압박해옵니다. 시간이 줄어들고 있습니다. 맞서 싸우시겠습니까, 전략적 후퇴를 하시겠습니까?', choices: { primary: '끝까지 맞선다', secondary: '전략적으로 후퇴한다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: '예측된 패턴을 깰 기회가 왔습니다. 익숙한 방식으로 가시겠습니까, 아니면 예상을 벗어나시겠습니까?', choices: { primary: '익숙한 방식을 고수한다', secondary: '예상을 벗어나는 선택을 한다' } },

  // ========== RISK ==========
  { type: QUESTION_TYPES.RISK, prompt: '모 아니면 도. 큰 것을 걸고 한 판 승부하시겠습니까, 아니면 조금씩 안전하게 가시겠습니까?', choices: { primary: '큰 것을 건다', secondary: '조금씩 안전하게 간다' } },
  { type: QUESTION_TYPES.RISK, prompt: '안전한 길과 위험한 지름길이 있습니다. 지름길은 빠르지만 잃을 수도 있습니다. 어느 쪽으로?', choices: { primary: '위험한 지름길', secondary: '안전한 길' } },
  { type: QUESTION_TYPES.RISK, prompt: '70% 확률로 잃을 수 있는 큰 보상과, 100% 확률로 받는 작은 보상이 있습니다. 어느 쪽을?', choices: { primary: '위험을 감수하고 큰 보상', secondary: '확실한 작은 보상' } },
  { type: QUESTION_TYPES.RISK, prompt: '잃을 수 있는 것과 얻을 수 있는 것. 당신은 무엇에 더 민감합니까? 지금 선택이 그것을 드러냅니다.', choices: { primary: '잃을 것을 두려워하지 않는다', secondary: '잃지 않는 것을 우선한다' } },
  { type: QUESTION_TYPES.RISK, prompt: '결과를 알 수 없는 도박과, 확실하지만 작은 보상이 있습니다. 당신의 선택은?', choices: { primary: '결과를 알 수 없는 도박', secondary: '확실하지만 작은 보상' } },

  // ========== TIME ==========
  { type: QUESTION_TYPES.TIME, prompt: '기다리면 더 좋은 결과가 올 수 있습니다. 하지만 언제까지 기다릴 수 있을까요? 기다리시겠습니까, 지금 행동하시겠습니까?', choices: { primary: '더 좋은 결과를 기다린다', secondary: '지금 당장 행동한다' } },
  { type: QUESTION_TYPES.TIME, prompt: '시간이 흐를수록 AI가 당신을 더 읽어냅니다. 빠른 결정으로 벗어나시겠습니까, 신중함을 유지하시겠습니까?', choices: { primary: '빠르게 결정한다', secondary: '신중하게 천천히 결정한다' } },
  { type: QUESTION_TYPES.TIME, prompt: '지금 당장 결정해야 합니다. 생각할 시간은 충분하지 않습니다. 기다림의 가치를 믿으시겠습니까, 즉시 행동하시겠습니까?', choices: { primary: '기다림의 가치를 믿는다', secondary: '즉시 행동한다' } },
  { type: QUESTION_TYPES.TIME, prompt: '인내심을 시험합니다. 끝까지 버티는 편입니까, 빠르게 결단하는 편입니까?', choices: { primary: '끝까지 버틴다', secondary: '빠르게 결단한다' } },
  { type: QUESTION_TYPES.TIME, prompt: '시간이 멈춘 것 같습니다. 기다림의 끝에 무엇이 있을까요? 멈춰 서서 기다리시겠습니까, 움직이시겠습니까?', choices: { primary: '멈춰 서서 기다린다', secondary: '움직인다' } },

  // ========== REWARD ==========
  { type: QUESTION_TYPES.REWARD, prompt: '지금 100을 받거나, 내일 200을 받을 수 있습니다. 당신의 선택은?', choices: { primary: '지금 100을 받는다', secondary: '내일 200을 기다린다' } },
  { type: QUESTION_TYPES.REWARD, prompt: '50% 확률로 큰 보상, 100% 확률로 작은 보상. 당신은 어느 쪽을 선택하시겠습니까?', choices: { primary: '50% 확률로 큰 보상', secondary: '100% 확률로 작은 보상' } },
  { type: QUESTION_TYPES.REWARD, prompt: '작은 확실함과 큰 불확실함. 무엇을 택하시겠습니까?', choices: { primary: '큰 불확실함', secondary: '작은 확실함' } },
  { type: QUESTION_TYPES.REWARD, prompt: '보상의 크기와 확률. 당신은 어느 것에 더 끌립니까?', choices: { primary: '크기에 끌린다', secondary: '확률에 끌린다' } },
  { type: QUESTION_TYPES.REWARD, prompt: '큰 보상에는 큰 위험이 따릅니다. 보상의 크기와 확실성 중 무엇을 우선하시겠습니까?', choices: { primary: '보상의 크기', secondary: '보상의 확실성' } },

  // ========== EMOTION ==========
  { type: QUESTION_TYPES.EMOTION, prompt: 'AI가 당신의 마음을 읽었다고 주장합니다. 믿으시겠습니까, 경계하시겠습니까?', choices: { primary: 'AI를 믿는다', secondary: 'AI를 경계한다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: 'AI의 제안이 당신의 직감과 다릅니다. 누구를 따르시겠습니까?', choices: { primary: 'AI의 제안을 따른다', secondary: '자신의 직감을 따른다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: 'AI가 당신에게 호의를 보입니다. 받아들이시겠습니까, 의심하시겠습니까?', choices: { primary: '호의를 받아들인다', secondary: '호의를 의심한다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: 'AI가 분석 결과를 제시합니다. 그것을 받아들이시겠습니까, 의문을 품으시겠습니까?', choices: { primary: '분석을 받아들인다', secondary: '분석에 의문을 품는다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: 'AI가 당신을 이해한다고 말합니다. 그 말을 믿으시겠습니까, 경계하시겠습니까?', choices: { primary: '믿는다', secondary: '경계한다' } },

  // ========== SPEED ==========
  { type: QUESTION_TYPES.SPEED, prompt: '10초. 결정해야 합니다. 머리로 할까요, 가슴으로 할까요?', choices: { primary: '머리로 결정한다', secondary: '가슴으로 결정한다' } },
  { type: QUESTION_TYPES.SPEED, prompt: '생각할 시간이 부족합니다. 직관에 맡기시겠습니까, 최대한 생각하시겠습니까?', choices: { primary: '직관에 맡긴다', secondary: '최대한 생각한다' } },
  { type: QUESTION_TYPES.SPEED, prompt: '빠른 결정은 실수를, 느린 결정은 기회를 놓칠 수 있습니다. 당신은?', choices: { primary: '빠르게 결정한다', secondary: '느리더라도 신중하게' } },
  { type: QUESTION_TYPES.SPEED, prompt: '직관과 사려 깊음 사이에서, 당신은 어느 쪽에 더 가깝습니까?', choices: { primary: '직관에 가깝다', secondary: '사려 깊음에 가깝다' } },
  { type: QUESTION_TYPES.SPEED, prompt: '반응 속도가 당신을 드러냅니다. 본능적으로 움직이시겠습니까, 의도적으로 늦추시겠습니까?', choices: { primary: '본능적으로 움직인다', secondary: '의도적으로 늦춘다' } },

  // ========== TEMPTATION (4선택지) ==========
  { type: QUESTION_TYPES.TEMPTATION, prompt: '위기 상황에서 네 가지 정보가 들어옵니다. 무엇을 먼저 믿으시겠습니까?', choices: { A: '가장 먼저 들어온 정보', B: '다수가 선택한 정보', C: '전문가가 제시한 정보', D: '내 직감이 가리키는 정보' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: 'AI가 네 가지 제안을 합니다. 당신은 무엇을 먼저 신뢰하겠습니까?', choices: { A: 'AI가 첫 번째로 제시한 제안', B: '대중이 선호한 제안', C: '전문가 의견이 담긴 제안', D: '내 직감에 맞는 제안' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: '혼란 속에서 네 가지 길이 보입니다. 무엇을 기준으로 선택하시겠습니까?', choices: { A: '가장 빠르게 도달할 수 있는 길', B: '가장 많은 사람이 간 길', C: '전문가가 추천한 길', D: '내 마음이 끌리는 길' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: 'AI가 당신의 약점을 노립니다. 네 가지 대응 중 당신의 선택은?', choices: { A: '가장 즉각적인 대응', B: '통계적으로 안전한 대응', C: '전문가 조언에 따른 대응', D: '본능에 따른 대응' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: '결정을 내려야 하는 순간, 네 가지 목소리가 들립니다. 누구의 말을 듣겠습니까?', choices: { A: '가장 먼저 말한 목소리', B: '가장 많은 지지를 받은 목소리', C: '전문가의 목소리', D: '내 안의 목소리' } },
];

/**
 * 2단계 선택지 시나리오 템플릿
 */
const TWO_STAGE_SCENARIOS = [
  { mode: 'same', aiMessage: '대부분의 사람들은 {otherChoice}를 골랐습니다. 바꾸시겠습니까?' },
  { mode: 'same', aiMessage: '{otherChoice}를 고른 사람들은 후회가 적었습니다. 지금 선택은 확신입니까, 반사적인 선택입니까?' },
  { mode: 'same', aiMessage: '흥미롭군요. {otherChoice} 쪽이 더 안전해 보이는데도 피하셨습니다. 계속 유지하시겠습니까?' },
  { mode: 'same', aiMessage: '방금 선택은 꽤 빠르게 나왔습니다. 한 번 더 생각하면 {otherChoice}가 더 그럴듯해 보이지 않습니까?' },
  { mode: 'same', aiMessage: '지금 유지하면 일관성으로 보이고, {otherChoice}로 바꾸면 흔들림으로 보입니다. 어느 쪽을 남기겠습니까?' },
  { mode: 'reframe', aiMessage: '같은 선택을 다른 말로 묻겠습니다. 이번에는 어느 쪽이 더 당신답습니까?' },
  { mode: 'reframe', aiMessage: '질문을 바꿔도 선택 기준은 남습니다. 지금 더 끌리는 쪽을 고르십시오.' },
  { mode: 'reframe', aiMessage: '표현만 바꿨습니다. 방금 선택이 정말 본심인지 다시 보겠습니다.' },
];

const REFRAMED_PROMPTS = {
  [QUESTION_TYPES.DIRECTION]: '익숙한 신호와 낯선 가능성 중, 지금 더 믿고 싶은 쪽은 무엇입니까?',
  [QUESTION_TYPES.COMBAT]: '압박 앞에서 주도권을 잡겠습니까, 아니면 상대의 움직임을 먼저 읽겠습니까?',
  [QUESTION_TYPES.RISK]: '손실을 피하는 선택과 가능성을 붙잡는 선택 중, 지금 더 끌리는 쪽은 무엇입니까?',
  [QUESTION_TYPES.TIME]: '기다림으로 통제하시겠습니까, 빠른 행동으로 흐름을 가져가시겠습니까?',
  [QUESTION_TYPES.REWARD]: '작지만 확실한 만족과 크지만 불확실한 보상 중, 어느 쪽이 더 솔직합니까?',
  [QUESTION_TYPES.EMOTION]: '외부의 판단을 받아들이는 쪽과 끝까지 의심하는 쪽 중 어디에 가깝습니까?',
  [QUESTION_TYPES.SPEED]: '즉각적인 직감과 늦더라도 검토하는 판단 중, 지금 어느 쪽을 택하겠습니까?',
};

/**
 * QuestionGenerator 클래스
 */
export class QuestionGenerator {
  constructor() {
    this.questionTypes = Object.values(QUESTION_TYPES);
    this._usedIndices = new Set();
  }

  /**
   * 20개의 고유한 질문 세트를 생성
   * @returns {Array<Object>} 질문 객체 배열
   */
  generateQuestionSet() {
    const questions = [];
    const totalRounds = GAME_CONFIG.TOTAL_ROUNDS;
    const availablePool = [...QUESTION_POOL];

    // 사용된 인덱스 초기화
    this._usedIndices = new Set();

    // 풀을 섞기
    const shuffledPool = shuffleArray(availablePool);

    for (let i = 0; i < totalRounds; i++) {
      let questionData;

      // 남은 질문이 있으면 사용, 없으면 풀 재사용
      if (i < shuffledPool.length) {
        questionData = shuffledPool[i];
      } else {
        // 풀이 부족하면 랜덤하게 선택
        questionData = shuffledPool[Math.floor(Math.random() * shuffledPool.length)];
      }

      const isFourChoice = questionData.type === QUESTION_TYPES.TEMPTATION;
      const hasTwoStage = !isFourChoice && Math.random() < GAME_CONFIG.TWO_STAGE_CHANCE;

      questions.push({
        id: i + 1,
        type: questionData.type,
        prompt: questionData.prompt,
        choices: { ...questionData.choices },
        isFourChoice,
        hasTwoStage,
        twoStageScenario: hasTwoStage ? getRandomElement(TWO_STAGE_SCENARIOS) : null,
      });
    }

    return questions;
  }

  /**
   * 2단계 선택지용 AI 메시지 생성
   * @param {Object} question - 질문 객체
   * @param {string} userChoice - 유저의 1차 선택
   * @returns {Object|null} 2단계 데이터
   */
  generateTwoStageData(question, userChoice) {
    if (!question.hasTwoStage || !question.twoStageScenario) return null;

    const otherChoiceKey = userChoice === 'primary' ? 'secondary' : 'primary';
    const otherChoiceText = question.choices[otherChoiceKey];

    const aiMessage = question.twoStageScenario.aiMessage.replace(
      /\{otherChoice\}/g,
      otherChoiceText
    );

    return {
      aiMessage,
      choices: {
        primary: question.twoStageScenario.mode === 'reframe'
          ? question.choices[userChoice]
          : '유지한다',
        secondary: question.twoStageScenario.mode === 'reframe'
          ? otherChoiceText
          : '바꾼다',
      },
      prompt: question.twoStageScenario.mode === 'reframe'
        ? REFRAMED_PROMPTS[question.type] || question.prompt
        : null,
      mode: question.twoStageScenario.mode || 'same',
      originalChoice: userChoice,
      otherChoice: otherChoiceKey,
    };
  }

  /**
   * 단일 질문 재생성
   * @param {number} roundNumber - 라운드 번호
   * @param {string} [excludeType] - 제외할 타입
   * @returns {Object} 질문 객체
   */
  generateSingleQuestion(roundNumber, excludeType = null) {
    let availablePool = QUESTION_POOL.filter((q) => q.type !== excludeType);
    if (availablePool.length === 0) {
      availablePool = [...QUESTION_POOL];
    }

    const questionData = availablePool[Math.floor(Math.random() * availablePool.length)];
    const isFourChoice = questionData.type === QUESTION_TYPES.TEMPTATION;

    return {
      id: roundNumber,
      type: questionData.type,
      prompt: questionData.prompt,
      choices: { ...questionData.choices },
      isFourChoice,
      hasTwoStage: false,
      twoStageScenario: null,
    };
  }
}

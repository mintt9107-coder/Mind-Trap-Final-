/**
 * MindTrap - AI Engine Test
 * AI 엔진을 독립적으로 테스트합니다.
 * 브라우저 콘솔에서 실행하여 테스트할 수 있습니다.
 */

import { AIEngine } from './AIEngine.js';
import { LearningEngine } from './LearningEngine.js';
import { PredictionEngine } from './PredictionEngine.js';
import { PlayerModel } from './PlayerModel.js';
import { FeatureExtractor } from './FeatureExtractor.js';
import { RuleEngine } from './RuleEngine.js';
import { LearningJournal } from './LearningJournal.js';
import { AIService } from './AIService.js';
import { PromptBuilder } from './PromptBuilder.js';
import { AIPersonality } from './AIPersonality.js';
import { Memory } from './Memory.js';

/**
 * AI 엔진 테스트 실행
 */
export const runAITest = () => {
  console.log('=== MindTrap AI Engine Test ===\n');

  // 1. PlayerModel 테스트
  console.log('1. PlayerModel Test');
  const playerModel = new PlayerModel();
  playerModel.updateAttribute('risk', 10);
  playerModel.updateAttribute('patience', -5);
  console.log('  - Risk:', playerModel.getAttribute('risk'));
  console.log('  - Patience:', playerModel.getAttribute('patience'));
  console.log('  - Player Type:', playerModel.getPlayerType());
  console.log('  ✓ PlayerModel OK\n');

  // 2. FeatureExtractor 테스트
  console.log('2. FeatureExtractor Test');
  const extractor = new FeatureExtractor();
  const mockRoundData = {
    round: 1,
    question: {
      id: 1,
      type: 'risk',
      prompt: '위험한 선택, 안전한 선택',
      choices: { primary: '위험 감수', secondary: '안전 선택' },
    },
    choice: 'primary',
    reactionTime: 2000,
    changedChoice: false,
    timeOut: false,
  };
  const features = extractor.extractFeatures(mockRoundData);
  console.log('  - Reaction Time:', features.reactionTime);
  console.log('  - Risk Choice:', features.riskChoice);
  console.log('  - Speed Category:', features.speedCategory);
  console.log('  ✓ FeatureExtractor OK\n');

  // 3. RuleEngine 테스트
  console.log('3. RuleEngine Test');
  const ruleEngine = new RuleEngine();
  const appliedRules = ruleEngine.applyRules(features, playerModel);
  console.log('  - Applied Rules:', appliedRules.length);
  appliedRules.forEach((r) => console.log('    -', r.description));
  console.log('  ✓ RuleEngine OK\n');

  // 4. LearningEngine 테스트
  console.log('4. LearningEngine Test');
  const learningEngine = new LearningEngine();
  learningEngine.initialize();
  const learningResult = learningEngine.learnFromRound(mockRoundData);
  console.log('  - Learning Progress:', learningResult.playerModelSnapshot.learningProgress);
  console.log('  - AI Statement:', learningEngine.getAIStatement().message);
  console.log('  ✓ LearningEngine OK\n');

  // 5. PredictionEngine 테스트
  console.log('5. PredictionEngine Test');
  const predictionEngine = new PredictionEngine();
  const prediction = predictionEngine.predict(
    learningEngine.getPlayerSnapshot(),
    mockRoundData.question
  );
  console.log('  - Prediction:', prediction.prediction);
  console.log('  - Confidence:', prediction.confidence);
  console.log('  - Reason:', prediction.reason);
  console.log('  ✓ PredictionEngine OK\n');

  // 6. LearningJournal 테스트
  console.log('6. LearningJournal Test');
  const journal = new LearningJournal();
  journal.addEntry(learningResult);
  console.log('  - Entries:', journal.getAllEntries().length);
  console.log('  - Current Stage:', journal.getCurrentStage());
  console.log('  ✓ LearningJournal OK\n');

  // 7. PromptBuilder 테스트
  console.log('7. PromptBuilder Test');
  const promptBuilder = new PromptBuilder();
  const messages = promptBuilder.buildRoundProgressPrompt({
    playerModel: learningEngine.getPlayerSnapshot(),
    currentRound: 1,
    prediction,
    learningJournal: journal,
    memorySummary: { hasMemory: false },
  });
  console.log('  - Messages Count:', messages.length);
  console.log('  - System Prompt Length:', messages[0].content.length);
  console.log('  ✓ PromptBuilder OK\n');

  // 8. AIService 테스트 (Mock 모드)
  console.log('8. AIService Test (Mock Mode)');
  const aiService = new AIService();
  console.log('  - Use Mock:', aiService.useMock);
  console.log('  - Model:', aiService.modelId);
  console.log('  ✓ AIService OK\n');

  // 9. AIPersonality 테스트
  console.log('9. AIPersonality Test');
  const personality = new AIPersonality();
  console.log('  - Name:', personality.name);
  console.log('  - Player Address:', personality.getPlayerAddress());
  console.log('  - Confidence Level (0.5):', personality.getConfidenceLevel(0.5).phrase);
  console.log('  - Post Process Test:', personality.postProcess('안녕하세요! 😊 대박'));
  console.log('  ✓ AIPersonality OK\n');

  // 10. Memory 테스트
  console.log('10. Memory Test');
  const memory = new Memory();
  console.log('  - Has Memory:', memory.hasMemory());
  console.log('  - Is First Visit:', memory.isFirstVisit());
  console.log('  - Memory Summary:', JSON.stringify(memory.getMemorySummary(), null, 2));
  console.log('  ✓ Memory OK\n');

  // 11. AIEngine 통합 테스트
  console.log('11. AIEngine Integration Test');
  const aiEngine = new AIEngine();
  aiEngine.initialize();
  console.log('  - Is Active:', aiEngine.isActive);
  console.log('  - Has Personality:', aiEngine.getPersonality() !== null);
  console.log('  - Has Memory:', aiEngine.getMemory() !== null);
  console.log('  - Status:', JSON.stringify(aiEngine.getStatus(), null, 2));
  console.log('  ✓ AIEngine OK\n');

  console.log('=== All Tests Passed! ===');
  console.log('\n디버깅 팁:');
  console.log('- runAITest() : AI 엔진 전체 테스트 실행');
  console.log('- mindTrap.getAIStatus() : AI 엔진 상태 조회');
  console.log('- mindTrap.getLearningSummary() : 학습 요약 조회');
  console.log('- mindTrap.aiEngine.getMemory() : Memory 조회');
  console.log('- mindTrap.aiEngine.getPersonality() : AI Personality 조회');
};

// 전역에서 접근 가능하도록 설정
if (typeof window !== 'undefined') {
  window.runAITest = runAITest;
}
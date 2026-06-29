/**
 * MindTrap - Memory Book Screen
 * AI가 현재 플레이어를 어떻게 기억하고 있는지 보여줍니다.
 */

import { createCard } from '../components/Card.js';
import { createButton } from '../components/Button.js';

/**
 * Memory Book Screen 생성
 * @param {Object} options - 옵션
 * @param {Function} options.onBack - 뒤로 가기 콜백
 * @param {Function} options.onReset - 메모리 리셋 콜백
 * @returns {Object} 화면 객체
 */
export const createMemoryBookScreen = ({ onBack, onReset }) => {
  const element = document.createElement('div');
  element.className = 'screen memory-book-screen';
  element.style.display = 'none';

  // 제목
  const title = document.createElement('h1');
  title.className = 'memory-book__title';
  title.textContent = 'AI의 기억';
  element.appendChild(title);

  // 부제목
  const subtitle = document.createElement('p');
  subtitle.className = 'memory-book__subtitle';
  subtitle.textContent = 'AI가 기억하는 당신';
  element.appendChild(subtitle);

  // 메모리 컨테이너
  const memoryContainer = document.createElement('div');
  memoryContainer.className = 'memory-book__container';
  element.appendChild(memoryContainer);

  // 메모리 리스트
  const memoryList = document.createElement('div');
  memoryList.className = 'memory-book__list';
  memoryContainer.appendChild(memoryList);

  // 빈 상태 메시지
  const emptyMessage = document.createElement('p');
  emptyMessage.className = 'memory-book__empty';
  emptyMessage.textContent = '아직 기억이 없습니다. 게임을 플레이하면 AI가 당신을 기억하기 시작합니다.';
  emptyMessage.style.display = 'none';
  memoryContainer.appendChild(emptyMessage);

  // 버튼 컨테이너
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'memory-book__buttons';
  element.appendChild(buttonContainer);

  // 뒤로 가기 버튼
  const backButton = createButton({
    text: '뒤로 가기',
    variant: 'secondary',
    size: 'medium',
    onClick: onBack,
  });
  buttonContainer.appendChild(backButton);

  // 메모리 리셋 버튼
  const resetButton = createButton({
    text: '기억 삭제',
    variant: 'ghost',
    size: 'medium',
    onClick: () => {
      if (confirm('정말 제 기억에서 사라지시겠습니까?\n\n당신을 잊으면 우리는 처음 만나는 사이가 됩니다.')) {
        onReset();
      }
    },
  });
  buttonContainer.appendChild(resetButton);

  /**
   * 메모리 표시
   * @param {Array} memories - 메모리 배열
   */
  const showMemories = (memories) => {
    memoryList.innerHTML = '';

    if (!memories || memories.length === 0) {
      emptyMessage.style.display = 'block';
      return;
    }

    emptyMessage.style.display = 'none';

    // 카테고리별 그룹화
    const categories = {
      personality: { title: '성향', memories: [] },
      pattern: { title: '패턴', memories: [] },
      trust: { title: '신뢰', memories: [] },
      behavior: { title: '행동', memories: [] },
    };

    memories.forEach((memory) => {
      const category = memory.category || 'personality';
      if (categories[category]) {
        categories[category].memories.push(memory);
      }
    });

    // 각 카테고리별 카드 생성
    Object.entries(categories).forEach(([key, category]) => {
      if (category.memories.length > 0) {
        const categoryCard = createCard({
          title: category.title,
          content: category.memories.map((m) => `• ${m.text}`).join('\n'),
          animation: 'fadeIn',
        });
        categoryCard.classList.add('memory-book__category-card');
        memoryList.appendChild(categoryCard);
      }
    });
  };

  /**
   * 화면 표시
   */
  const show = () => {
    element.style.display = 'flex';
  };

  /**
   * 화면 숨기기
   */
  const hide = () => {
    element.style.display = 'none';
  };

  return {
    element,
    show,
    hide,
    showMemories,
  };
};
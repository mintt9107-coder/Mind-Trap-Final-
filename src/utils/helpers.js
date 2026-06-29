/**
 * MindTrap - Helper Utilities
 * 재사용 가능한 유틸리티 함수들을 관리합니다.
 */

/**
 * milliseconds을 초 단위로 변환
 * @param {number} ms - 밀리초
 * @returns {number} 초
 */
export const msToSeconds = (ms) => ms / 1000;

/**
 * 배열을 셔플 (Fisher-Yates 알고리즘)
 * @param {Array} array - 셔플할 배열
 * @returns {Array} 새 배열
 */
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * 지정된 범위의 랜덤 정수 반환
 * @param {number} min - 최소값 (포함)
 * @param {number} max - 최대값 (포함)
 * @returns {number} 랜덤 정수
 */
export const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * 배열에서 랜덤 요소 선택
 * @param {Array} array - 선택할 배열
 * @returns {*} 랜덤 요소
 */
export const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Promise-based 대기 함수
 * @param {number} ms - 밀리초
 * @returns {Promise<void>}
 */
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 로컬 스토리지에서 값 가져오기
 * @param {string} key - 스토리지 키
 * @returns {*} 저장된 값 (없으면 null)
 */
export const getFromStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Failed to get item from storage with key: ${key}`, error);
    return null;
  }
};

/**
 * 로컬 스토리지에 값 저장하기
 * @param {string} key - 스토리지 키
 * @param {*} value - 저장할 값
 * @returns {boolean} 성공 여부
 */
export const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to save item to storage with key: ${key}`, error);
    return false;
  }
};

/**
 * 로컬 스토리지에서 값 삭제하기
 * @param {string} key - 스토리지 키
 * @returns {boolean} 성공 여부
 */
export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove item from storage with key: ${key}`, error);
    return false;
  }
};

/**
 * 타임스탬프 생성
 * @returns {number} 현재 타임스탬프
 */
export const createTimestamp = () => Date.now();

/**
 * 반응 시간 분석 (빠름/보통/느림)
 * @param {number} reactionTime - 반응 시간 (ms)
 * @returns {string} 분석 결과
 */
export const analyzeReactionTime = (reactionTime) => {
  if (reactionTime < 1500) return 'fast';
  if (reactionTime < 3000) return 'normal';
  return 'slow';
};

/**
 * DOM 요소 생성 헬퍼
 * @param {string} tag - HTML 태그
 * @param {Object} options - 옵션
 * @param {string} [options.className] - 클래스명
 * @param {string} [options.id] - ID
 * @param {string} [options.textContent] - 텍스트 내용
 * @param {Object} [options.dataset] - 데이터 속성
 * @param {HTMLElement[]} [options.children] - 자식 요소들
 * @returns {HTMLElement} 생성된 요소
 */
export const createElement = (tag, options = {}) => {
  const element = document.createElement(tag);
  
  if (options.className) element.className = options.className;
  if (options.id) element.id = options.id;
  if (options.textContent) element.textContent = options.textContent;
  if (options.innerHTML) element.innerHTML = options.innerHTML;
  
  if (options.dataset) {
    Object.entries(options.dataset).forEach(([key, value]) => {
      element.dataset[key] = value;
    });
  }
  
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  
  if (options.children) {
    options.children.forEach((child) => {
      if (child) element.appendChild(child);
    });
  }
  
  if (options.onClick) {
    element.addEventListener('click', options.onClick);
  }
  
  return element;
};

/**
 * DOM 요소에 애니메이션 클래스 적용 후 제거
 * @param {HTMLElement} element - 대상 요소
 * @param {string} animationClass - 애니메이션 클래스
 * @param {number} duration - 애니메이션 지속 시간 (ms)
 * @returns {Promise<void>}
 */
export const applyAnimation = async (element, animationClass, duration) => {
  element.classList.add(animationClass);
  await wait(duration);
  element.classList.remove(animationClass);
};

/**
 * 타자기 효과 (한 글자씩 출력)
 * @param {HTMLElement} element - 대상 요소
 * @param {string} text - 출력할 텍스트
 * @param {number} speed - 글자 출력 간격 (ms)
 * @returns {Promise<void>}
 */
export const typeWriter = async (element, text, speed = 50) => {
  element.textContent = '';
  for (let i = 0; i < text.length; i++) {
    element.textContent += text[i];
    await wait(speed);
  }
};
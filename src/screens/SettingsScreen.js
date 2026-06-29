/**
 * MindTrap - Settings Screen
 * 설정 화면
 */

import { createElement } from '../utils/helpers.js';
import { createButton } from '../components/Button.js';
import { createCard } from '../components/Card.js';

/**
 * SettingsScreen 생성
 * @param {Object} options - 설정 화면 옵션
 * @param {Function} options.onBack - 뒤로 가기 콜백
 * @param {Function} options.onMemoryReset - 메모리 리셋 콜백
 * @param {Function} options.onLogout - 로그아웃 콜백
 * @param {Object} options.currentSettings - 현재 설정값
 * @param {Function} options.onSettingsChange - 설정 변경 콜백
 * @returns {Object} 설정 화면 객체
 */
export const createSettingsScreen = ({
  onBack,
  onMemoryReset,
  onLogout,
  currentSettings = {},
  onSettingsChange,
}) => {
  const screen = createElement('div', {
    className: 'screen settings-screen',
    id: 'settings-screen',
  });

  // 헤더
  const header = createElement('div', {
    className: 'settings__header',
  });

  const backButton = createButton({
    text: '← 뒤로',
    variant: 'ghost',
    size: 'small',
    onClick: onBack,
  });

  const title = createElement('h1', {
    className: 'settings__title',
    textContent: '설정',
  });

  header.appendChild(backButton);
  header.appendChild(title);
  screen.appendChild(header);

  // 설정 컨테이너
  const container = createElement('div', {
    className: 'settings__container',
  });

  // ========== appearance 설정 ==========
  const appearanceCard = createCard({
    className: 'settings__card',
    glass: true,
    children: [
      createElement('h2', {
        className: 'settings__card-title',
        textContent: '화면',
      }),
    ],
  });

  // Dark Mode 토글
  const darkModeRow = createElement('div', {
    className: 'settings__row',
  });

  darkModeRow.appendChild(createElement('span', {
    className: 'settings__label',
    textContent: '다크 모드',
  }));

  const darkModeToggle = createElement('label', {
    className: 'settings__toggle',
  });

  const darkModeInput = createElement('input', {
    type: 'checkbox',
    checked: currentSettings.darkMode !== false,
  });

  darkModeInput.addEventListener('change', (e) => {
    onSettingsChange?.({ darkMode: e.target.checked });
  });

  const darkModeSlider = createElement('span', {
    className: 'settings__toggle-slider',
  });

  darkModeToggle.appendChild(darkModeInput);
  darkModeToggle.appendChild(darkModeSlider);
  darkModeRow.appendChild(darkModeToggle);
  appearanceCard.appendChild(darkModeRow);

  // Animation 토글
  const animationRow = createElement('div', {
    className: 'settings__row',
  });

  animationRow.appendChild(createElement('span', {
    className: 'settings__label',
    textContent: '애니메이션',
  }));

  const animationToggle = createElement('label', {
    className: 'settings__toggle',
  });

  const animationInput = createElement('input', {
    type: 'checkbox',
    checked: currentSettings.animation !== false,
  });

  animationInput.addEventListener('change', (e) => {
    onSettingsChange?.({ animation: e.target.checked });
  });

  const animationSlider = createElement('span', {
    className: 'settings__toggle-slider',
  });

  animationToggle.appendChild(animationInput);
  animationToggle.appendChild(animationSlider);
  animationRow.appendChild(animationToggle);
  appearanceCard.appendChild(animationRow);

  container.appendChild(appearanceCard);

  // ========== Sound 설정 ==========
  const soundCard = createCard({
    className: 'settings__card',
    glass: true,
    children: [
      createElement('h2', {
        className: 'settings__card-title',
        textContent: '사운드',
      }),
    ],
  });

  const soundRow = createElement('div', {
    className: 'settings__row',
  });

  soundRow.appendChild(createElement('span', {
    className: 'settings__label',
    textContent: '효과음',
  }));

  const soundToggle = createElement('label', {
    className: 'settings__toggle',
  });

  const soundInput = createElement('input', {
    type: 'checkbox',
    checked: currentSettings.sound !== false,
  });

  soundInput.addEventListener('change', (e) => {
    onSettingsChange?.({ sound: e.target.checked });
  });

  const soundSlider = createElement('span', {
    className: 'settings__toggle-slider',
  });

  soundToggle.appendChild(soundInput);
  soundToggle.appendChild(soundSlider);
  soundRow.appendChild(soundToggle);
  soundCard.appendChild(soundRow);

  container.appendChild(soundCard);

  // ========== Data 설정 ==========
  const dataCard = createCard({
    className: 'settings__card',
    glass: true,
    children: [
      createElement('h2', {
        className: 'settings__card-title',
        textContent: '데이터',
      }),
    ],
  });

  // Memory Reset 버튼
  const memoryResetRow = createElement('div', {
    className: 'settings__row',
  });

  memoryResetRow.appendChild(createElement('div', {
    className: 'settings__label-group',
    children: [
      createElement('span', {
        className: 'settings__label',
        textContent: 'AI 기억 삭제',
      }),
      createElement('span', {
        className: 'settings__description',
        textContent: 'AI가 가진 모든 기억을 삭제합니다',
      }),
    ],
  }));

  const memoryResetButton = createButton({
    text: '삭제',
    variant: 'danger',
    size: 'small',
    onClick: () => {
      if (confirm('정말 제 기억에서 사라지시겠습니까?\n\n당신을 잊으면 우리는 처음 만나는 사이가 됩니다.')) {
        onMemoryReset?.();
      }
    },
  });

  memoryResetRow.appendChild(memoryResetButton);
  dataCard.appendChild(memoryResetRow);

  // Logout 버튼
  const logoutRow = createElement('div', {
    className: 'settings__row',
  });

  logoutRow.appendChild(createElement('span', {
    className: 'settings__label',
    textContent: '로그아웃',
  }));

  const logoutButton = createButton({
    text: '로그아웃',
    variant: 'secondary',
    size: 'small',
    onClick: () => {
      if (confirm('로그아웃하시겠습니까?')) {
        onLogout?.();
      }
    },
  });

  logoutRow.appendChild(logoutButton);
  dataCard.appendChild(logoutRow);

  container.appendChild(dataCard);

  // ========== 정보 ==========
  const infoCard = createCard({
    className: 'settings__card',
    glass: true,
    children: [
      createElement('h2', {
        className: 'settings__card-title',
        textContent: '정보',
      }),
      createElement('div', {
        className: 'settings__info',
        children: [
          createElement('div', {
            className: 'settings__info-row',
            children: [
              createElement('span', { textContent: '버전' }),
              createElement('span', { textContent: 'v1.0.0' }),
            ],
          }),
          createElement('div', {
            className: 'settings__info-row',
            children: [
              createElement('span', { textContent: '개발자' }),
              createElement('span', { textContent: 'MindTrap Team' }),
            ],
          }),
          createElement('div', {
            className: 'settings__info-row',
            children: [
              createElement('span', { textContent: '연락처' }),
              createElement('span', { textContent: 'support@mindtrap.ai' }),
            ],
          }),
        ],
      }),
    ],
  });

  container.appendChild(infoCard);
  screen.appendChild(container);

  /**
   * 화면 표시
   */
  const show = () => {
    screen.classList.add('active', 'fade-in');
  };

  /**
   * 화면 숨기기
   */
  const hide = () => {
    screen.classList.remove('active');
    screen.classList.remove('fade-in');
  };

  return {
    element: screen,
    show,
    hide,
  };
};
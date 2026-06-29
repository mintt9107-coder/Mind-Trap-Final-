/**
 * MindTrap - Splash Screen
 * 게임 시작 시 표시되는 스플래시 화면입니다.
 */

import { createElement, wait, typeWriter } from '../utils/helpers.js';
import { GAME_CONFIG } from '../utils/constants.js';

/**
 * SplashScreen 생성
 * @param {Object} options - 스플래시 화면 옵션
 * @param {Function} options.onComplete - 스플래시 완료 후 호출될 콜백
 * @returns {Object} 스플래시 화면 객체 {element, show, hide}
 */
export const createSplashScreen = ({ onComplete }) => {
  const screen = createElement('div', {
    className: 'screen splash-screen',
    id: 'splash-screen',
  });

  // 로고 컨테이너
  const logoContainer = createElement('div', {
    className: 'splash__logo-container',
  });

  // 로고 텍스트
  const logo = createElement('h1', {
    className: 'splash__logo text-gradient',
    textContent: 'MindTrap',
  });

  // 서브 텍스트 (타이핑 효과)
  const subtitle = createElement('p', {
    className: 'splash__subtitle',
  });

  logoContainer.appendChild(logo);
  logoContainer.appendChild(subtitle);
  screen.appendChild(logoContainer);

  let isShowing = false;

  /**
   * 스플래시 화면 표시
   */
  const show = async () => {
    if (isShowing) return;
    isShowing = true;

    screen.classList.add('active', 'fade-in');

    // 로고 페이드인 대기
    await wait(800);

    // 타이핑 효과로 서브 텍스트 표시
    await typeWriter(subtitle, 'AI는 당신을 분석합니다.', 80);

    // 잠시 대기
    await wait(1500);

    // 완료 콜백 호출
    if (onComplete) {
      onComplete();
    }
  };

  /**
   * 스플래시 화면 숨기기
   */
  const hide = () => {
    isShowing = false;
    screen.classList.remove('active');
    screen.classList.add('fade-out');
    
    setTimeout(() => {
      screen.classList.remove('fade-out');
      subtitle.textContent = '';
    }, 500);
  };

  return { element: screen, show, hide };
};
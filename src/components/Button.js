/**
 * MindTrap - Button Component
 * 재사용 가능한 버튼 컴포넌트입니다.
 */

import { createElement } from '../utils/helpers.js';

/**
 * Button 컴포넌트 생성
 * @param {Object} options - 버튼 옵션
 * @param {string} options.text - 버튼 텍스트
 * @param {string} [options.variant='primary'] - 버튼 스타일 ('primary', 'secondary', 'ghost')
 * @param {string} [options.size='medium'] - 버튼 크기 ('small', 'medium', 'large')
 * @param {Function} [options.onClick] - 클릭 이벤트 핸들러
 * @param {boolean} [options.disabled=false] - 비활성화 여부
 * @param {string} [options.className] - 추가 CSS 클래스
 * @returns {HTMLElement} 버튼 요소
 */
export const createButton = ({
  text,
  variant = 'primary',
  size = 'medium',
  onClick,
  disabled = false,
  className = '',
}) => {
  const button = createElement('button', {
    className: `btn btn--${variant} btn--${size} ${className}`.trim(),
    textContent: text,
    onClick,
  });

  if (disabled) {
    button.disabled = true;
    button.classList.add('btn--disabled');
  }

  return button;
};

/**
 * primary 버튼을 생성하는 헬퍼
 * @param {Object} options - 버튼 옵션
 * @returns {HTMLElement}
 */
export const createPrimaryButton = (options) =>
  createButton({ ...options, variant: 'primary' });

/**
 * secondary 버튼을 생성하는 헬퍼
 * @param {Object} options - 버튼 옵션
 * @returns {HTMLElement}
 */
export const createSecondaryButton = (options) =>
  createButton({ ...options, variant: 'secondary' });

/**
 * ghost 버튼을 생성하는 헬퍼
 * @param {Object} options - 버튼 옵션
 * @returns {HTMLElement}
 */
export const createGhostButton = (options) =>
  createButton({ ...options, variant: 'ghost' });
/**
 * MindTrap - Card Component
 * 재사용 가능한 카드 컴포넌트입니다.
 */

import { createElement } from '../utils/helpers.js';

/**
 * Card 컴포넌트 생성
 * @param {Object} options - 카드 옵션
 * @param {string} [options.title] - 카드 제목
 * @param {string} [options.content] - 카드 내용
 * @param {HTMLElement[]} [options.children] - 자식 요소들
 * @param {string} [options.className] - 추가 CSS 클래스
 * @param {boolean} [options.glass=true] - 글래스모피즘 적용 여부
 * @param {string} [options.animation] - 애니메이션 효과 ('fadeIn', 'slideUp', 'scaleIn')
 * @returns {HTMLElement} 카드 요소
 */
export const createCard = ({
  title = '',
  content = '',
  children = [],
  className = '',
  glass = true,
  animation = null,
}) => {
  const cardClasses = ['card', className];
  if (glass) cardClasses.push('glass');
  if (animation) cardClasses.push(`card--${animation}`);

  const card = createElement('div', {
    className: cardClasses.join(' ').trim(),
  });

  if (title) {
    const titleEl = createElement('h3', {
      className: 'card__title',
      textContent: title,
    });
    card.appendChild(titleEl);
  }

  if (content) {
    const contentEl = createElement('p', {
      className: 'card__content',
      textContent: content,
    });
    card.appendChild(contentEl);
  }

  if (children && children.length > 0) {
    const childrenContainer = createElement('div', {
      className: 'card__children',
    });
    children.forEach((child) => {
      if (child) childrenContainer.appendChild(child);
    });
    card.appendChild(childrenContainer);
  }

  return card;
};

/**
 * 글래스 카드 생성 헬퍼
 * @param {Object} options - 카드 옵션
 * @returns {HTMLElement}
 */
export const createGlassCard = (options) =>
  createCard({ ...options, glass: true });
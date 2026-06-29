/**
 * MindTrap - ProgressBar Component
 * 재사용 가능한 프로그레스 바 컴포넌트입니다.
 */

import { createElement } from '../utils/helpers.js';

/**
 * ProgressBar 컴포넌트 생성
 * @param {Object} options - 프로그레스 바 옵션
 * @param {number} options.value - 현재 값 (0~1)
 * @param {number} [options.max=1] - 최대 값
 * @param {string} [options.variant='primary'] - 스타일 변형 ('primary', 'timer')
 * @param {string} [options.label] - 표시할 텍스트
 * @param {boolean} [options.showLabel=true] - 라벨 표시 여부
 * @returns {Object} 엘리먼트와 업데이트 메서드를 포함한 객체
 */
export const createProgressBar = ({
  value = 0,
  max = 1,
  variant = 'primary',
  label = '',
  showLabel = true,
}) => {
  const container = createElement('div', {
    className: `progress-bar progress-bar--${variant}`,
  });

  const fill = createElement('div', {
    className: 'progress-bar__fill',
  });

  container.appendChild(fill);

  let labelElement = null;
  if (showLabel && label) {
    labelElement = createElement('span', {
      className: 'progress-bar__label',
      textContent: label,
    });
    container.appendChild(labelElement);
  }

  /**
   * 진행률 업데이트
   * @param {number} newValue - 새 값 (0~max)
   * @param {string} [newLabel] - 새 라벨 텍스트
   */
  const update = (newValue, newLabel = null) => {
    const percentage = Math.min(Math.max(newValue / max, 0), 1);
    fill.style.width = `${percentage * 100}%`;

    if (newLabel !== null && labelElement) {
      labelElement.textContent = newLabel;
    }
  };

  // 초기값 설정
  update(value, label);

  return { element: container, update };
};

/**
 * 원형 프로그레스 바 컴포넌트
 * @param {Object} options - 옵션
 * @returns {Object} 엘리먼트와 업데이트 메서드를 포함한 객체
 */
export const createCircularProgressBar = ({
  value = 0,
  max = 1,
  variant = 'timer',
  size = 48,
}) => {
  const svgSize = size;
  const strokeWidth = 4;
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const container = createElement('div', {
    className: `circular-progress circular-progress--${variant}`,
    attributes: {
      style: `width: ${svgSize}px; height: ${svgSize}px;`,
    },
  });

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', svgSize);
  svg.setAttribute('height', svgSize);

  // 배경 원
  const bgCircle = document.createElementNS(svgNS, 'circle');
  bgCircle.setAttribute('cx', svgSize / 2);
  bgCircle.setAttribute('cy', svgSize / 2);
  bgCircle.setAttribute('r', radius);
  bgCircle.setAttribute('fill', 'none');
  bgCircle.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
  bgCircle.setAttribute('stroke-width', strokeWidth);

  // 프로그레스 원
  const progressCircle = document.createElementNS(svgNS, 'circle');
  progressCircle.setAttribute('cx', svgSize / 2);
  progressCircle.setAttribute('cy', svgSize / 2);
  progressCircle.setAttribute('r', radius);
  progressCircle.setAttribute('fill', 'none');
  progressCircle.setAttribute('stroke', 'currentColor');
  progressCircle.setAttribute('stroke-width', strokeWidth);
  progressCircle.setAttribute('stroke-linecap', 'round');
  progressCircle.setAttribute(
    'stroke-dasharray',
    `${circumference}`
  );
  progressCircle.setAttribute(
    'stroke-dashoffset',
    `${circumference}`
  );
  progressCircle.style.transform = 'rotate(-90deg)';
  progressCircle.style.transformOrigin = '50% 50%';
  progressCircle.style.transition = 'stroke-dashoffset 0.3s ease';

  svg.appendChild(bgCircle);
  svg.appendChild(progressCircle);
  container.appendChild(svg);

  const valueText = createElement('span', {
    className: 'circular-progress__value',
    textContent: '',
  });
  container.appendChild(valueText);

  /**
   * 진행률 업데이트
   * @param {number} newValue - 새 값 (0~max)
   */
  const update = (newValue) => {
    const percentage = Math.min(Math.max(newValue / max, 0), 1);
    const offset = circumference * (1 - percentage);
    progressCircle.setAttribute('stroke-dashoffset', offset);
    valueText.textContent = String(Math.max(0, Math.ceil(newValue / 1000)));
    container.setAttribute('aria-label', `남은 시간 ${valueText.textContent}초`);

    // 타이머 색상에 따른 클래스 변경
    container.classList.remove(
      'circular-progress--normal',
      'circular-progress--warning',
      'circular-progress--danger'
    );
    if (percentage < 0.3) {
      container.classList.add('circular-progress--danger');
    } else if (percentage < 0.6) {
      container.classList.add('circular-progress--warning');
    } else {
      container.classList.add('circular-progress--normal');
    }
  };

  // 초기값 설정
  update(value);

  return { element: container, update };
};

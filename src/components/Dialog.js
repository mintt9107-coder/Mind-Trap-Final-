/**
 * MindTrap - Dialog Component
 * 재사용 가능한 모달 다이얼로그 컴포넌트입니다.
 */

import { createElement } from '../utils/helpers.js';

/**
 * Dialog 컴포넌트 생성
 * @param {Object} options - 다이얼로그 옵션
 * @param {string} options.title - 다이얼로그 제목
 * @param {string} options.message - 다이얼로그 메시지
 * @param {Array} [options.buttons] - 버튼 배열 [{text, variant, onClick}]
 * @param {boolean} [options.closable=true] - 닫기 가능 여부
 * @param {Function} [options.onClose] - 닫기 콜백
 * @returns {Object} 다이얼로그 객체 {element, open, close}
 */
export const createDialog = ({
  title,
  message,
  buttons = [],
  closable = true,
  onClose,
}) => {
  // 오버레이
  const overlay = createElement('div', {
    className: 'dialog-overlay',
  });

  // 다이얼로그 컨테이너
  const dialog = createElement('div', {
    className: 'dialog glass',
  });

  // 제목
  const titleEl = createElement('h2', {
    className: 'dialog__title',
    textContent: title,
  });
  dialog.appendChild(titleEl);

  // 메시지
  const messageEl = createElement('p', {
    className: 'dialog__message',
    textContent: message,
  });
  dialog.appendChild(messageEl);

  // 버튼 컨테이너
  if (buttons.length > 0) {
    const buttonContainer = createElement('div', {
      className: 'dialog__buttons',
    });

    buttons.forEach(({ text, variant = 'primary', onClick }) => {
      const btn = createElement('button', {
        className: `btn btn--${variant}`,
        textContent: text,
        onClick: () => {
          if (onClick) onClick();
          close();
        },
      });
      buttonContainer.appendChild(btn);
    });

    dialog.appendChild(buttonContainer);
  }

  overlay.appendChild(dialog);

  // 오버레이 클릭으로 닫기
  if (closable) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        close();
      }
    });
  }

  /**
   * 다이얼로그 열기
   */
  const open = () => {
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      overlay.classList.add('dialog-overlay--visible');
      dialog.classList.add('dialog--visible');
    });
  };

  /**
   * 다이얼로그 닫기
   */
  const close = () => {
    overlay.classList.remove('dialog-overlay--visible');
    dialog.classList.remove('dialog--visible');
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      if (onClose) onClose();
    }, 300);
  };

  return { element: overlay, open, close };
};
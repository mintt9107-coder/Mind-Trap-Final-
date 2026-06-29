/**
 * MindTrap - Premium Screen
 * Premium 소개 화면
 */

import { createElement } from '../utils/helpers.js';
import { createButton } from '../components/Button.js';
import { createCard } from '../components/Card.js';

/**
 * PremiumScreen 생성
 * @param {Object} options - 옵션
 * @param {Function} options.onBack - 뒤로 가기 콜백
 * @returns {Object} Premium 화면 객체
 */
export const createPremiumScreen = ({ onBack }) => {
  const screen = createElement('div', {
    className: 'screen premium-screen',
    id: 'premium-screen',
  });

  // 헤더
  const header = createElement('div', {
    className: 'premium__header',
  });

  const backButton = createButton({
    text: '← 뒤로',
    variant: 'ghost',
    size: 'small',
    onClick: onBack,
  });

  header.appendChild(backButton);
  screen.appendChild(header);

  // 컨테이너
  const container = createElement('div', {
    className: 'premium__container',
  });

  // ========== Hero ==========
  const hero = createElement('div', {
    className: 'premium__hero',
  });

  const badge = createElement('div', {
    className: 'premium__badge',
    textContent: 'COMING SOON',
  });

  const title = createElement('h1', {
    className: 'premium__title text-gradient',
    textContent: 'MindTrap Premium',
  });

  const subtitle = createElement('p', {
    className: 'premium__subtitle',
    textContent: '더 깊은 AI 분석과 무제한 플레이를 경험하세요.',
  });

  hero.appendChild(badge);
  hero.appendChild(title);
  hero.appendChild(subtitle);
  container.appendChild(hero);

  // ========== Features ==========
  const featuresCard = createCard({
    className: 'premium__features-card',
    glass: true,
    children: [
      createElement('h2', {
        className: 'premium__features-title',
        textContent: 'Premium 기능',
      }),
    ],
  });

  const features = [
    {
      icon: '♾️',
      title: '무제한 플레이',
      description: '하루 몇 번이든 게임을 플레이할 수 있습니다.',
    },
    {
      icon: '📊',
      title: '심층 AI 리포트',
      description: '더 상세한 AI 분석 리포트를 제공합니다.',
    },
    {
      icon: '🧠',
      title: 'AI Personality 분석',
      description: '당신의 심층적인 AI 성격 분석을 받아보세요.',
    },
    {
      icon: '🚫',
      title: '광고 제거',
      description: '광고 없이 깔끔한 경험을 제공합니다.',
    },
    {
      icon: '🔮',
      title: '향후 업데이트',
      description: '새로운 기능이 추가될 때 가장 먼저 이용하세요.',
    },
  ];

  features.forEach((feature) => {
    const row = createElement('div', {
      className: 'premium__feature-row',
    });

    row.appendChild(createElement('span', {
      className: 'premium__feature-icon',
      textContent: feature.icon,
    }));

    const textGroup = createElement('div', {
      className: 'premium__feature-text',
    });

    textGroup.appendChild(createElement('h3', {
      textContent: feature.title,
    }));

    textGroup.appendChild(createElement('p', {
      textContent: feature.description,
    }));

    row.appendChild(textGroup);
    featuresCard.appendChild(row);
  });

  container.appendChild(featuresCard);

  // ========== Pricing ==========
  const pricingCard = createCard({
    className: 'premium__pricing-card',
    glass: true,
    children: [
      createElement('div', {
        className: 'premium__pricing',
        children: [
          createElement('div', {
            className: 'premium__price',
            children: [
              createElement('span', {
                className: 'premium__price-amount',
                textContent: '미정',
              }),
              createElement('span', {
                className: 'premium__price-period',
                textContent: ' / 월',
              }),
            ],
          }),
          createElement('p', {
            className: 'premium__pricing-note',
            textContent: '가격은 추후 공개될 예정입니다.',
          }),
        ],
      }),
    ],
  });

  container.appendChild(pricingCard);

  // ========== CTA ==========
  const ctaCard = createCard({
    className: 'premium__cta-card',
    glass: true,
    children: [
      createElement('p', {
        className: 'premium__cta-text',
        textContent: '현재 개발 중입니다. 곧 출시 예정입니다.',
      }),
      createElement('p', {
        className: 'premium__cta-subtext',
        textContent: '알림을 원하시면 이메일을 남겨주세요.',
      }),
      createElement('div', {
        className: 'premium__email-form',
        children: [
          createElement('input', {
            type: 'email',
            className: 'premium__email-input',
            placeholder: 'your@email.com',
          }),
          createButton({
            text: '알림 받기',
            variant: 'primary',
            size: 'medium',
            onClick: () => {
              alert('알림 신청이 완료되었습니다. 감사합니다!');
            },
          }),
        ],
      }),
    ],
  });

  container.appendChild(ctaCard);
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
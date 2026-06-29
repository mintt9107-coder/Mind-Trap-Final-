/**
 * MindTrap - Result Screen
 * 게임 결과 화면입니다. AI 분석 리포트를 그래프+퍼센트 형식으로 표시합니다.
 * 행동 분석 기반 프로필 제목(한마디)과 저장/공유 기능을 제공합니다.
 */

import { createElement, msToSeconds } from '../utils/helpers.js';
import { createButton } from '../components/Button.js';
import html2canvas from 'html2canvas';

/**
 * AI 리포트 마크다운을 파싱하여 항목별 데이터 추출
 * @param {string} report - 마크다운 형식 리포트
 * @returns {Object} 파싱된 리포트 데이터
 */
const parseAiReport = (report) => {
  if (!report || typeof report !== 'string') return null;

  const result = {
    predictionAccuracy: null,
    sections: [],
    feedback: '',
    learned: '',
    nextGame: '',
  };

  // "## AI Analysis Report" 헤더 제거
  const cleaned = report
    .replace(/^##\s*AI Analysis Report\s*/i, '')
    .replace(/\bprimary\b/g, '첫 번째 선택지')
    .replace(/\bsecondary\b/g, '두 번째 선택지')
    .replace(
      /\*\*===\s*한 줄 피드백\s*===\*\*\s*([\s\S]*?)\s*\*\*=+\*\*/g,
      '**한 줄 피드백**: $1'
    );

  // 항목별 파싱: **항목**: 내용 (여러 줄 내용 포함)
  const itemRegex = /\*\*([^*]+)\*\*\s*:\s*([\s\S]*?)(?=\n\s*\*\*[^*]+\*\*\s*:|$)/g;
  let match;
  while ((match = itemRegex.exec(cleaned)) !== null) {
    const key = match[1].trim();
    const value = match[2].trim();

    // 퍼센트 추출 시도
    const percentMatch = value.match(/(\d+(?:\.\d+)?)\s*%/);
    const percent = percentMatch ? parseFloat(percentMatch[1]) : null;

    result.sections.push({ key, value, percent });
  }

  // 한 줄 피드백, 학습 내용, 다음 게임 예고
  result.sections.forEach((s) => {
    if (s.key.includes('한 줄 피드백')) result.feedback = s.value;
    if (s.key.includes('학습')) result.learned = s.value;
    if (s.key.includes('다음 게임')) result.nextGame = s.value;
  });

  return result;
};

const appendJobRecommendations = (container, value) => {
  const list = createElement('div', {
    className: 'analysis-item__job-list',
  });
  const icons = ['🧭', '💡', '📊', '🎯', '✨'];
  const jobs = value
    .replace(/\s*(\d+\.)\s*/g, '\n$1 ')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  jobs.forEach((line, index) => {
    const row = createElement('p', {
      className: 'analysis-item__job',
    });
    const match = line.match(/^(\d+\.)\s*([^-]+?)\s*-\s*(.+)$/);
    if (!match) {
      row.textContent = line;
      list.appendChild(row);
      return;
    }

    row.appendChild(createElement('span', {
      className: 'analysis-item__job-icon',
      textContent: icons[index % icons.length],
    }));
    row.appendChild(document.createTextNode(` ${match[1]} `));
    row.appendChild(createElement('strong', {
      className: 'analysis-item__job-title',
      textContent: match[2].trim(),
    }));
    row.appendChild(document.createTextNode(` - ${match[3].trim()}`));
    list.appendChild(row);
  });

  container.appendChild(list);
};

const cleanAnalysisDetail = (text, percent) => {
  let detail = text || '';
  if (percent !== null) {
    const escapedPercent = String(percent).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    detail = detail.replace(new RegExp(`\\b${escapedPercent}(?:\\.0+)?\\s*%\\b`, 'g'), '');
  }
  return detail
    .replace(/\s+\./g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s*[.,]\s*/, '')
    .trim();
};

/**
 * 분석 항목을 그래프 바 + 퍼센트로 렌더링
 * @param {Object} section - { key, value, percent }
 * @returns {HTMLElement}
 */
const createAnalysisGraphItem = (section) => {
  const item = createElement('div', {
    className: 'analysis-item',
  });
  const shouldShowBar = section.percent !== null && !section.key.includes('오늘 새롭게 학습한 내용');

  // 라벨 행 (항목명 + 퍼센트)
  const labelRow = createElement('div', {
    className: 'analysis-item__label-row',
  });

  const label = createElement('span', {
    className: 'analysis-item__label',
    textContent: section.key,
  });

  labelRow.appendChild(label);

  item.appendChild(labelRow);

  // 그래프 바 (퍼센트가 있는 경우)
  if (shouldShowBar) {
    const barTrack = createElement('div', {
      className: 'analysis-item__bar-track',
    });
    const barFill = createElement('div', {
      className: 'analysis-item__bar-fill',
    });
    barFill.style.width = `${Math.min(100, Math.max(0, section.percent))}%`;

    // 퍼센트에 따른 색상 클래스
    if (section.percent > 50) {
      barFill.classList.add('analysis-item__bar-fill--high');
    } else if (section.percent > 30) {
      barFill.classList.add('analysis-item__bar-fill--medium');
    } else {
      barFill.classList.add('analysis-item__bar-fill--low');
    }

    barTrack.appendChild(barFill);
    item.appendChild(barTrack);
  }

  const desc = createElement('div', {
    className: 'analysis-item__desc',
  });

  const value = section.value.replace(/\s+/g, ' ').trim();
  if (section.key.includes('추천 직업')) {
    appendJobRecommendations(desc, section.value);
    item.appendChild(desc);
    return item;
  }

  const summaryMatch = value.match(/^(\d+(?:\.\d+)?%\s*-\s*[^.]+\.?)(?:\s*(.*))?$/);

  if (summaryMatch) {
    const summary = summaryMatch[1].endsWith('.') ? summaryMatch[1] : `${summaryMatch[1]}.`;
    const detail = cleanAnalysisDetail(summaryMatch[2] || '', section.percent);
    desc.appendChild(createElement('strong', {
      className: 'analysis-item__highlight',
      textContent: summary,
    }));
    if (detail) {
      desc.appendChild(createElement('span', {
        className: 'analysis-item__detail',
        textContent: detail,
      }));
    }
  } else {
    desc.textContent = cleanAnalysisDetail(value, section.percent);
  }

  item.appendChild(desc);

  return item;
};

/**
 * ResultScreen 생성
 * @param {Object} options - 결과 화면 옵션
 * @param {Object} options.gameEngine - 게임 엔진 인스턴스
 * @param {Function} options.onRestart - 재시작 콜백
 * @param {Function} options.onBackToMenu - 메뉴로 돌아가기 콜백
 * @returns {Object} 결과 화면 객체
 */
export const createResultScreen = ({ gameEngine, onRestart, onBackToMenu }) => {
  const screen = createElement('div', {
    className: 'screen result-screen',
    id: 'result-screen',
  });

  // 결과 컨테이너
  const resultContainer = createElement('div', {
    className: 'result__container',
  });

  // 제목
  const title = createElement('h1', {
    className: 'result__title text-gradient',
    textContent: '게임 완료',
  });

  // AI 한마디 프로필 제목 (행동 분석 기반)
  const profileTitle = createElement('h2', {
    className: 'result__profile-title',
    textContent: '분석 중...',
  });

  // 통계 메시지
  const resultMessage = createElement('p', {
    className: 'result__message',
    textContent: 'AI가 당신을 분석했습니다.',
  });

  // 통계 카드 섹션
  const statsSection = createElement('div', {
    className: 'result__stats',
  });

  // 통계 아이템 생성 헬퍼
  const createStatItem = (label, value) => {
    const item = createElement('div', {
      className: 'result__stat-item glass',
    });

    const statLabel = createElement('span', {
      className: 'result__stat-label',
      textContent: label,
    });

    const statValue = createElement('span', {
      className: 'result__stat-value',
      textContent: value,
    });

    item.appendChild(statLabel);
    item.appendChild(statValue);
    return {
      element: item,
      updateLabel: (newLabel) => (statLabel.textContent = newLabel),
      updateValue: (newValue) => (statValue.textContent = newValue),
    };
  };

  // 통계 아이템들
  const totalRoundsStat = createStatItem('총 라운드', '0');
  const timeoutsStat = createStatItem('시간 초과', '0');
  const avgReactionTimeStat = createStatItem('평균 반응시간', '0초');

  statsSection.appendChild(totalRoundsStat.element);
  statsSection.appendChild(timeoutsStat.element);
  statsSection.appendChild(avgReactionTimeStat.element);

  // AI 분석 리포트 섹션 (그래프 + 퍼센트)
  const analysisSection = createElement('div', {
    className: 'result__analysis',
  });

  const analysisTitle = createElement('h2', {
    className: 'result__analysis-title',
    textContent: '🤖 AI Analysis Report',
  });

  // 분석 그래프 컨테이너
  const analysisGraphContainer = createElement('div', {
    className: 'result__analysis-graphs',
  });

  // 로딩 텍스트
  const loadingText = createElement('p', {
    className: 'result__analysis-loading',
    textContent: 'AI가 분석 중입니다...',
  });
  analysisGraphContainer.appendChild(loadingText);

  analysisSection.appendChild(analysisTitle);
  analysisSection.appendChild(analysisGraphContainer);

  // 직업 추천 섹션
  const jobRecommendationSection = createElement('div', {
    className: 'result__job-recommendation glass',
  });
  jobRecommendationSection.style.display = 'none';

  const jobRecTitle = createElement('h2', {
    className: 'result__job-title',
    textContent: '💼🔎 추천 직업',
  });

  const jobRecContent = createElement('div', {
    className: 'result__job-content',
  });

  const jobIcon = createElement('span', {
    className: 'result__job-icon',
    textContent: '🔍',
  });

  const jobName = createElement('h3', {
    className: 'result__job-name',
    textContent: '분석 중...',
  });

  const jobDesc = createElement('p', {
    className: 'result__job-desc',
    textContent: '당신의 성향에 맞는 직업을 찾고 있습니다.',
  });

  jobRecContent.appendChild(jobIcon);
  jobRecContent.appendChild(jobName);
  jobRecContent.appendChild(jobDesc);
  jobRecommendationSection.appendChild(jobRecTitle);
  jobRecommendationSection.appendChild(jobRecContent);

  // AI 리포트 저장 변수
  let aiReport = null;

  // 유저 프로필 데이터
  let playerProfile = null;

  // 프로필 액션 버튼 (저장/공유)
  const profileActionSection = createElement('div', {
    className: 'result__profile-actions',
  });

  const saveProfileBtn = createButton({
    text: 'JPG 저장',
    variant: 'secondary',
    size: 'medium',
    onClick: () => _saveProfile(),
  });

  const shareProfileBtn = createButton({
    text: '공유하기',
    variant: 'secondary',
    size: 'medium',
    onClick: () => _shareProfile(),
  });

  profileActionSection.appendChild(saveProfileBtn);
  profileActionSection.appendChild(shareProfileBtn);

  // 버튼 섹션
  const buttonSection = createElement('div', {
    className: 'result__buttons',
  });

  const restartBtn = createButton({
    text: '다시 시작',
    variant: 'primary',
    size: 'large',
    onClick: onRestart,
  });

  const menuBtn = createButton({
    text: '메뉴로',
    variant: 'secondary',
    size: 'large',
    onClick: onBackToMenu,
  });

  buttonSection.appendChild(restartBtn);
  buttonSection.appendChild(menuBtn);

  resultContainer.appendChild(title);
  resultContainer.appendChild(profileTitle);
  resultContainer.appendChild(resultMessage);
  resultContainer.appendChild(statsSection);
  resultContainer.appendChild(analysisSection);
  resultContainer.appendChild(jobRecommendationSection);
  resultContainer.appendChild(profileActionSection);
  resultContainer.appendChild(buttonSection);
  screen.appendChild(resultContainer);

  /**
   * 분석 리포트를 그래프로 렌더링
   * @param {string} report - AI 분석 리포트 (마크다운)
   */
  const renderAiReport = (report) => {
    // 기존 내용 초기화
    analysisGraphContainer.innerHTML = '';

    if (!report) {
      analysisGraphContainer.appendChild(loadingText);
      return;
    }

    const parsed = parseAiReport(report);

    if (!parsed || parsed.sections.length === 0) {
      // 파싱 실패 시 원본 텍스트 표시
      const fallback = createElement('p', {
        className: 'result__analysis-fallback',
        textContent: report,
      });
      analysisGraphContainer.appendChild(fallback);
      return;
    }

    // 각 섹션을 그래프 아이템으로 렌더링
    parsed.sections
      .filter((section) => !['플레이어 타입', '선택 변화 시점', 'AI를 가장 많이 속인 순간'].includes(section.key))
      .forEach((section) => {
      analysisGraphContainer.appendChild(createAnalysisGraphItem(section));
      });
  };

  /**
   * 결과 데이터로 업데이트
   * @param {Object} resultData - 결과 데이터
   */
  const update = (resultData) => {
    if (!resultData) return;

    const { stats, totalRounds } = resultData;

    totalRoundsStat.updateValue(`${stats.totalRounds} / ${totalRounds}`);
    timeoutsStat.updateValue(`${stats.totalTimeOuts}`);
    avgReactionTimeStat.updateValue(`${msToSeconds(stats.avgReactionTime).toFixed(2)}초`);

    // AI 리포트가 있으면 표시
    if (aiReport) {
      renderAiReport(aiReport);
    }
  };

  /**
   * AI 리포트 설정
   * @param {string} report - AI 분석 리포트
   */
  const setAiReport = (report) => {
    aiReport = report;
    // 결과 화면이 이미 보이고 있으면 즉시 업데이트
    renderAiReport(report);
  };

  /**
   * 프로필 제목(한마디) 설정
   * @param {string} titleText - 프로필 제목
   */
  const setProfileTitle = (titleText) => {
    profileTitle.textContent = titleText;
  };

  /**
   * 유저 프로필 설정
   * @param {Object} profile - 유저 프로필 객체
   */
  const setPlayerProfile = (profile) => {
    playerProfile = profile;
    if (profile && profile.title) {
      setProfileTitle(profile.title);
    }
  };

  /**
   * 직업 추천 설정
   * @param {Object} job - 추천 직업 { title, description, icon }
   */
  const setJobRecommendation = (job) => {
    if (!job) return;
    jobRecommendationSection.style.display = '';
    jobIcon.textContent = job.icon || '🔍';
    jobName.textContent = job.title || '';
    jobDesc.textContent = job.description || '';
  };

  /**
   * 프로필을 로컬 스토리지에 저장
   * @private
   */
  const _saveProfile = async () => {
    try {
      const previousText = saveProfileBtn.textContent;
      saveProfileBtn.textContent = '저장 중...';
      saveProfileBtn.disabled = true;

      const canvas = await html2canvas(resultContainer, {
        backgroundColor: '#070711',
        scale: Math.min(2, window.devicePixelRatio || 1),
        useCORS: true,
      });
      const imageUrl = canvas.toDataURL('image/jpeg', 0.92);
      const link = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      link.href = imageUrl;
      link.download = `mindtrap-report-${date}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      saveProfileBtn.textContent = previousText;
      saveProfileBtn.disabled = false;
    } catch (e) {
      console.error('JPG save error:', e);
      saveProfileBtn.textContent = 'JPG 저장';
      saveProfileBtn.disabled = false;
      alert('JPG 저장에 실패했습니다.');
    }
  };

  /**
   * 프로필 공유 (클립보드 복사 + 공유 API)
   * @private
   */
  const _shareProfile = async () => {
    if (!playerProfile) {
      alert('아직 프로필이 생성되지 않았습니다.');
      return;
    }

    const shareText = _buildShareText();

    // Web Share API 시도 (모바일)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MindTrap - AI 행동 분석 프로필',
          text: shareText,
        });
        return;
      } catch (e) {
        // 공유 취소 또는 실패 시 클립보드 복사로 폴백
      }
    }

    // 클립보드 복사 (데스크톱)
    try {
      await navigator.clipboard.writeText(shareText);
      alert('프로필이 클립보드에 복사되었습니다.');
    } catch (e) {
      // 구형 브라우저 폴백
      const textarea = document.createElement('textarea');
      textarea.value = shareText;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        alert('프로필이 클립보드에 복사되었습니다.');
      } catch (err) {
        alert('복사에 실패했습니다. 직접 텍스트를 선택해서 복사하세요.');
      }
      document.body.removeChild(textarea);
    }
  };

  /**
   * 공유용 텍스트 생성
   * @returns {string} 공유 텍스트
   * @private
   */
  const _buildShareText = () => {
    if (!playerProfile) return '';

    const lines = [];
    lines.push('🧠 MindTrap - AI 행동 분석 프로필');
    lines.push('');
    lines.push(`"${playerProfile.title}"`);
    lines.push('');
    lines.push(`분석 대상: ${playerProfile.userName}`);
    lines.push(`플레이어 타입: ${playerProfile.playerType}`);
    lines.push(`AI 예측 성공률: ${playerProfile.predictionAccuracy}%`);
    lines.push('');

    if (playerProfile.traits && playerProfile.traits.length > 0) {
      lines.push('주요 특성:');
      playerProfile.traits.forEach((t) => lines.push(`  • ${t}`));
      lines.push('');
    }

    if (playerProfile.randomClickingDetected) {
      lines.push('⚠️ 패턴 숨기기 시도 감지됨');
      lines.push('');
    }

    const attrs = playerProfile.attributes;
    if (attrs) {
      lines.push('행동 지표:');
      lines.push(`  위험 성향: ${attrs.risk}%`);
      lines.push(`  일관성: ${attrs.consistency}%`);
      lines.push(`  망설임: ${attrs.hesitation}%`);
      lines.push(`  적응력: ${attrs.adaptation}%`);
      lines.push(`  AI 신뢰도: ${attrs.trustAI}%`);
    }

    lines.push('');
    lines.push('MindTrap에서 나를 분석해보세요.');

    return lines.join('\n');
  };

  /**
   * 화면 표시
   */
  const show = () => {
    // 결과 데이터 업데이트
    const resultData = gameEngine.getResultData();
    update(resultData);

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
    update,
    setAiReport,
    setProfileTitle,
    setPlayerProfile,
    setJobRecommendation,
  };
};

# MindTrap

> AI는 당신을 분석합니다. 그리고 기억합니다.

MindTrap은 AI가 플레이어의 행동 패턴을 학습하고 예측하는 심리 웹게임입니다. 20개의 라운드 동안 AI가 당신의 선택을 분석하고, 다음 게임을 더 정확하게 예측합니다.

## ✨ 주요 기능

- **AI 학습 엔진**: 20라운드 동안 플레이어의 선택 패턴, 반응 속도, 일관성을 분석
- **예측 엔진**: 학습된 데이터를 기반으로 다음 선택 예측
- **Firebase Memory**: 게임 데이터를 Firebase에 저장하여 AI가 기억
- **AI Analysis Report**: 게임 종료 후 상세 분석 리포트 제공
- **Memory Book**: AI가 기억하는 당신의 모습 확인
- **반응형 디자인**: Desktop, Tablet, Mobile 모두 지원

## 🎮 플레이 방법

1. **선택하세요**: 각 라운드에서 2개의 선택지 중 하나를 고릅니다
2. **AI가 예측합니다**: AI가 당신의 다음 선택을 예측하려고 합니다
3. **속이세요**: AI의 예측을 빗나가게 하여 승리하세요
4. **분석받으세요**: 게임 종료 후 AI가 당신을 분석한 리포트를 받습니다

## 🛠️ 기술 스택

### Frontend
- Next.js
- React
- CSS3 (Custom Properties, Glassmorphism)
- JavaScript (ES Modules)

### Backend / Services
- Firebase Authentication (Anonymous Login)
- Firestore (데이터 저장)
- OpenRouter API (Gemini)

### AI / ML
- PlayerModel (행동 특성 모델링)
- FeatureExtractor (행동 특징 추출)
- RuleEngine (규칙 기반 학습)
- LearningEngine (패턴 학습)
- PredictionEngine (선택 예측)
- MemoryEngine (기억 관리)

## 📁 프로젝트 구조

```
MindTrap/
├── app/                       # Next.js App Router
│   ├── layout.js              # 루트 레이아웃 및 글로벌 CSS
│   └── page.js                # MindTrap 클라이언트 부트스트랩
├── package.json               # Next.js 스크립트 및 의존성
├── next.config.mjs            # Next.js 설정
├── firebase/
│   └── firestore.rules        # Firestore 보안 규칙
└── src/
    ├── main.js                # 앱 진입점
    ├── ai/                    # AI 엔진 모듈
    │   ├── AIEngine.js        # AI 통합 엔진
    │   ├── AIPersonality.js   # AI 성격 정의
    │   ├── AIService.js       # OpenRouter API
    │   ├── FeatureExtractor.js # 특징 추출
    │   ├── LearningEngine.js  # 학습 엔진
    │   ├── LearningJournal.js # 학습 기록
    │   ├── Memory.js          # 로컬 메모리
    │   ├── PlayerModel.js     # 플레이어 모델
    │   ├── PredictionEngine.js # 예측 엔진
    │   ├── PromptBuilder.js   # 프롬프트 빌더
    │   └── RuleEngine.js      # 규칙 엔진
    ├── components/            # 재사용 가능한 UI 컴포넌트
    │   ├── Button.js
    │   ├── Card.js
    │   ├── Dialog.js
    │   ├── GameChoice.js
    │   └── ProgressBar.js
    ├── engine/                # 게임 엔진
    │   ├── GameEngine.js      # 게임 통합 엔진
    │   ├── QuestionGenerator.js # 질문 생성
    │   ├── RoundManager.js    # 라운드 관리
    │   └── TimerEngine.js     # 타이머 엔진
    ├── firebase/              # Firebase 서비스
    │   ├── AuthenticationService.js
    │   ├── FirebaseManager.js
    │   ├── FirebaseService.js
    │   ├── FirestoreService.js
    │   ├── MemoryEngine.js
    │   ├── ReportService.js
    │   ├── SessionService.js
    │   └── SyncManager.js
    ├── screens/               # 화면 모듈
    │   ├── AnalysisReportScreen.js
    │   ├── GameScreen.js
    │   ├── LandingScreen.js
    │   ├── MemoryBookScreen.js
    │   ├── PremiumScreen.js
    │   ├── ResultScreen.js
    │   ├── SettingsScreen.js
    │   ├── SplashScreen.js
    │   └── TutorialScreen.js
    ├── services/              # 서비스 계층
    │   └── GameService.js
    ├── styles/                # 스타일시트
    │   ├── components.css
    │   ├── global.css
    │   └── theme.css
    └── utils/                 # 유틸리티
        ├── constants.js
        └── helpers.js
```

## 🚀 실행 방법

### 개발 서버 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

### 프로덕션 빌드

```bash
npm run build
npm run start
```

### Firebase 설정

1. Firebase Console에서 프로젝트 생성
2. Authentication에서 Anonymous Login 활성화
3. Firestore Database 생성
4. `firestore.rules` 배포

```bash
firebase deploy --only firestore:rules
```

### OpenRouter 설정

1. [OpenRouter](https://openrouter.ai/)에서 API 키 발급
2. `.env.local`에 Firebase 공개 설정 추가

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## 🔒 환경 변수

민감한 정보는 절대 코드에 포함하지 않습니다.

```bash
NEXT_PUBLIC_OPENROUTER_API_KEY=
NEXT_PUBLIC_OPENROUTER_MODEL_ID=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

Next.js에서는 브라우저에서 필요한 공개 값만 `NEXT_PUBLIC_` 접두사로 노출합니다.

## 📱 화면 구성

| 화면 | 설명 |
|------|------|
| Splash | 로딩 애니메이션 |
| Landing | 메인 랜딩 페이지 |
| Tutorial | 게임 설명 |
| Game | 게임 플레이 |
| Result | 게임 결과 |
| Analysis Report | AI 분석 리포트 |
| Memory Book | AI의 기억 |
| Settings | 설정 |
| Premium | Premium 소개 |

## 🎨 디자인 시스템

### 색상
- Primary: `#000000` (Black)
- Secondary: `#0a0a0a` (Dark Gray)
- Accent: `#007AFF` (Blue) → `#AF52DE` (Purple) Gradient

### 타이포그래피
- Font: SF Pro Display, -apple-system, sans-serif
- Size: 12px ~ 64px

### 컴포넌트
- Glassmorphism Card
- Gradient Button
- Progress Bar
- Dialog

## 🔮 향후 개발 계획

- [ ] Premium 결제 연동
- [ ] Google/Apple 로그인
- [ ] Replay 기능
- [ ] 랭킹 시스템
- [ ] 소셜 공유
- [ ] 다국어 지원

## 📄 라이선스

© 2024 MindTrap. All rights reserved.

## 📞 연락처

- Email: support@mindtrap.ai
- Website: https://mindtrap.ai

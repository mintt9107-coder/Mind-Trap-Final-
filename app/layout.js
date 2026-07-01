import '../src/styles/global.css';
import '../src/styles/theme.css';
import '../src/styles/components.css';
import '../src/styles/landing.css';

export const metadata = {
  title: 'MindTrap',
  description: 'MindTrap - AI는 당신을 분석합니다. 그리고 기억합니다.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

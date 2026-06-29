/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js 15 개발자 도구(Segment Explorer) 버그 회피
  // "Could not find the module segment-explorer-node.js#SegmentViewNode" 오류 방지
  devIndicators: false,
  // webpack module resolution 안정성 향상
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.js', '.jsx'],
    };
    return config;
  },
};

export default nextConfig;

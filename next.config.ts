import type { NextConfig } from 'next';
const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  output: 'standalone',
  images: { loader: 'custom', loaderFile: './src/lib/image-loader.ts', deviceSizes: [480, 768, 1200, 1600], imageSizes: [96, 160, 256, 384], dangerouslyAllowSVG: false },
  async headers() {
    return [{ source: '/(.*)', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
    ] }];
  }
};
export default config;

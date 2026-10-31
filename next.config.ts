import type { NextConfig } from 'next';
const firebaseHosting = process.env.FIREBASE_HOSTING === 'true';
const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  output: firebaseHosting ? 'export' : 'standalone',
  trailingSlash: firebaseHosting,
  images: { loader: 'custom', loaderFile: './src/lib/image-loader.ts', deviceSizes: [480, 768, 1200, 1600], imageSizes: [96, 160, 256, 384], dangerouslyAllowSVG: false },
  ...(firebaseHosting ? {} : { async headers() {
    return [{ source: '/(.*)', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
    ] }];
  } })
};
export default config;

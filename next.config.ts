import type { NextConfig } from 'next';
import { transportHeaders } from './security/browser-policy.mjs';
const firebaseHosting = process.env.FIREBASE_HOSTING === 'true';
const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  output: firebaseHosting ? 'export' : 'standalone',
  trailingSlash: firebaseHosting,
  images: { loader: 'custom', loaderFile: './src/lib/image-loader.ts', deviceSizes: [480, 768, 1200, 1600], imageSizes: [96, 160, 256, 384], dangerouslyAllowSVG: false },
  ...(firebaseHosting ? {} : { async headers() {
    return [{ source: '/(.*)', headers: transportHeaders }];
  } })
};
export default config;

// Public policy shared by the Next proxy and the static-export header generator.
export const transportHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
];
export function contentSecurityPolicy({ nonce, hashes = [], development = false } = {}) {
  const scripts = ["'self'", ...hashes.map(hash => `'sha256-${hash}'`), ...(nonce ? [`'nonce-${nonce}'`] : []), ...(development ? ["'unsafe-eval'"] : []), 'https://www.googletagmanager.com'];
  return [
    "default-src 'none'", `script-src ${scripts.join(' ')}`, "script-src-attr 'none'",
    "style-src 'self'", "style-src-attr 'unsafe-inline'", "img-src 'self' data: https://www.google-analytics.com",
    "font-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'",
    "frame-src 'none'", "manifest-src 'self'", "worker-src 'self'", "media-src 'self'",
    `connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://www.google-analytics.com https://region1.google-analytics.com${development ? ' http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*' : ''}`,
    ...(development ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

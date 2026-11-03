import { NextRequest, NextResponse } from 'next/server';
import { contentSecurityPolicy, transportHeaders } from '../security/browser-policy.mjs';

export function proxy(request: NextRequest) {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = btoa(String.fromCharCode(...bytes));
  const policy = contentSecurityPolicy({ nonce, development: process.env.NODE_ENV === 'development' });
  const headers = new Headers(request.headers);
  // Overwrite caller-supplied nonce and CSP; neither is a trusted input.
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', policy);
  for (const { key, value } of transportHeaders) response.headers.set(key, value);
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|assets|imgs|favicon.ico).*)'] };

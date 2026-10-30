import { inquirySchema, validationErrors, type Inquiry, type InquiryResponse } from '@/lib/inquiry';
import { initiatives, tiers, type Initiative } from '@/lib/content';
import { isEventRegistrationOpen } from '@/lib/events';
import { log } from './logger';
export type StoredReceipt = { reference: string; receivedAt: string; payloadHash: string };
export interface InquiryStore {
  find(id: string): Promise<StoredReceipt | null>;
  consumeLimit(key: string, expiresAt: number, now: number): Promise<boolean>;
  save(inquiry: Inquiry, receipt: StoredReceipt): Promise<void>;
}
export class ServiceUnavailable extends Error {}
const MAX_BYTES = 12000;
const RATE_WINDOW = 10 * 60 * 1000;
async function hash(value: string) { const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)); return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join(''); }
export function createInquiryHandler(getStore: () => Promise<InquiryStore>, canonicalOrigin: string, events: readonly Initiative[] = initiatives) {
  return async function handle(request: Request): Promise<Response> {
    const requestId = crypto.randomUUID();
    const started = Date.now();
    function reply(body: InquiryResponse, status: number, extra: Record<string, string> = {}) {
      return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Request-Id': requestId, 'X-Content-Type-Options': 'nosniff', ...extra } });
    }
    const reject = (message: string, status: number, extra: Record<string, string> = {}) => reply({ ok: false, message, requestId }, status, extra);
    try {
      if (request.method !== 'POST') return reject('Use POST to submit an inquiry.', 405, { Allow: 'POST' });
      const origin = request.headers.get('origin');
      let allowedOrigin = !origin;
      if (origin) {
        try {
          const parsedOrigin = new URL(origin);
          // Adapters can normalize the internal URL. Host retains the public request host.
          const matchesHost = parsedOrigin.host === request.headers.get('host') && ['https:', 'http:'].includes(parsedOrigin.protocol);
          allowedOrigin = origin === canonicalOrigin || origin === new URL(request.url).origin || matchesHost;
        } catch { allowedOrigin = false; }
      }
      if (request.headers.get('sec-fetch-site') === 'cross-site' || !allowedOrigin) return reject('Please submit this form from the DUSACCOM website.', 403);
      if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return reject('Please send a JSON inquiry.', 415);
      const length = Number(request.headers.get('content-length'));
      if (Number.isFinite(length) && length > MAX_BYTES) return reject('Your inquiry is too long. Please shorten it.', 413);
      if (!request.body) return reject('Please complete the inquiry form.', 400);
      const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let total = 0;
      while (true) { const part = await reader.read(); if (part.done) break; total += part.value.byteLength; if (total > MAX_BYTES) { await reader.cancel(); return reject('Your inquiry is too long. Please shorten it.', 413); } chunks.push(part.value); }
      const bytes = new Uint8Array(total); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      let input: unknown;
      try { input = JSON.parse(new TextDecoder().decode(bytes)); } catch { return reject('We couldn’t read your inquiry. Please try again.', 400); }
      const parsed = inquirySchema.safeParse(input);
      if (!parsed.success) return reply({ ok: false, message: 'Please check the highlighted fields.', errors: validationErrors(parsed.error), requestId }, 422);
      const inquiry = parsed.data;
      const event = events.find(item => item.id === inquiry.interest);
      if ((inquiry.kind === 'membership' && !tiers.some(tier => tier.id === inquiry.interest)) || (['event', 'event-registration'].includes(inquiry.kind) && !event)) return reply({ ok: false, message: 'Please choose one of the available options.', errors: { interest: 'Please choose a listed option.' }, requestId }, 422);
      const store = await getStore();
      const payloadHash = await hash(JSON.stringify({ ...inquiry, submissionId: undefined }));
      const existing = await store.find(inquiry.submissionId);
      if (existing) {
        if (existing.payloadHash !== payloadHash) return reject('This inquiry has already been received with different details. Refresh the page to send a new inquiry.', 409);
        return reply({ ok: true, reference: existing.reference, receivedAt: existing.receivedAt }, 200);
      }
      if (inquiry.kind === 'event-registration' && (!event || !isEventRegistrationOpen(event))) return reply({ ok: false, message: 'Registration is not open for this event. Please check the event calendar.', errors: { interest: 'Please choose an upcoming event with open registration.' }, requestId }, 422);
      const now = Date.now(); const window = Math.floor(now / RATE_WINDOW);
      // Cloudflare overwrites CF-Connecting-IP. Other runtimes share a conservative fallback bucket.
      const network = request.headers.get('cf-connecting-ip') || 'unidentified-network';
      const key = await hash(`dusaccom:${network}:${window}`);
      if (!await store.consumeLimit(key, (window + 1) * RATE_WINDOW, now)) return reject('We’ve received several inquiries from your network. Please try again in ten minutes, or contact us directly.', 429, { 'Retry-After': '600' });
      const receipt = { reference: `DUS-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`, receivedAt: new Date(now).toISOString(), payloadHash };
      try { await store.save(inquiry, receipt); }
      catch (error) {
        // A concurrent retry can win the unique submission ID insertion.
        const winner = await store.find(inquiry.submissionId);
        if (winner?.payloadHash === payloadHash) return reply({ ok: true, reference: winner.reference, receivedAt: winner.receivedAt }, 200);
        throw error;
      }
      log('info', 'inquiry.received', { requestId, reference: receipt.reference, durationMs: Date.now() - started });
      return reply({ ok: true, reference: receipt.reference, receivedAt: receipt.receivedAt }, 201);
    } catch (error) {
      const unavailable = error instanceof ServiceUnavailable;
      log('error', 'inquiry.failed', { requestId, code: unavailable ? 'storage_unavailable' : 'unexpected', status: unavailable ? 503 : 500, durationMs: Date.now() - started });
      return reject(unavailable ? 'Online inquiries are temporarily unavailable. Please email dusaccom1@gmail.com or call 646-326-6052.' : 'We couldn’t confirm your inquiry. Please try again or contact us directly.', unavailable ? 503 : 500);
    }
  };
}

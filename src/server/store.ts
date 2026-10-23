import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { D1Database } from '@cloudflare/workers-types';
import type { Inquiry } from '@/lib/inquiry';
import { ServiceUnavailable, type InquiryStore, type StoredReceipt } from './inquiry-handler';
class D1InquiryStore implements InquiryStore {
  constructor(private db: D1Database) {}
  async find(id: string): Promise<StoredReceipt | null> { return this.db.prepare('SELECT reference, received_at AS receivedAt, payload_hash AS payloadHash FROM inquiries WHERE id = ?').bind(id).first<StoredReceipt>(); }
  async consumeLimit(key: string, expiresAt: number, now: number) {
    const results = await this.db.batch([
      this.db.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now),
      this.db.prepare('INSERT INTO rate_limits (key, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count').bind(key, expiresAt)
    ]);
    const counter = results[1].results[0] as { count?: number } | undefined;
    return typeof counter?.count === 'number' && counter.count <= 5;
  }
  async save(inquiry: Inquiry, receipt: StoredReceipt) {
    await this.db.prepare('INSERT INTO inquiries (id, reference, kind, name, email, company, interest, message, consent, payload_hash, received_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(inquiry.submissionId, receipt.reference, inquiry.kind, inquiry.name, inquiry.email, inquiry.company, inquiry.interest, inquiry.message, 1, receipt.payloadHash, receipt.receivedAt, 'new').run();
  }
}
export async function getInquiryStore(): Promise<InquiryStore> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const database = (env as unknown as { DB?: D1Database }).DB;
    if (!database) throw new ServiceUnavailable();
    return new D1InquiryStore(database);
  } catch { throw new ServiceUnavailable(); }
}

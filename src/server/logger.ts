type LogFields = { requestId?: string; code?: string; status?: number; durationMs?: number; reference?: string };
export function log(level: 'info' | 'warn' | 'error', event: string, fields: LogFields = {}) {
  // Never log request bodies, names, emails, raw IPs, credentials, or error stacks.
  console[level](JSON.stringify({ level, event, timestamp: new Date().toISOString(), ...fields }));
}

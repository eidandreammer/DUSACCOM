import { liveEvent } from '@/lib/live-events';
import { ServiceUnavailable } from './inquiry-handler';

// Public event lookup uses the same Security Rules as the public calendar.
// No service-account secret is required in the web host or browser.
export async function findFirebaseEvent(id: string) {
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!project || !/^live-[A-Za-z0-9]+$/.test(id)) return null;
  let response: Response;
  try {
    response = await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents/events/${encodeURIComponent(id)}`, {
      cache: 'no-store', signal: AbortSignal.timeout(8000),
    });
  } catch { throw new ServiceUnavailable(); }
  if (response.status === 404 || response.status === 403) return null;
  if (!response.ok) throw new ServiceUnavailable();
  const document = await response.json() as { fields?: Record<string, { stringValue?: string }> };
  const data = Object.fromEntries(Object.entries(document.fields || {}).map(([key, value]) => [key, value.stringValue]));
  return liveEvent(id, data);
}

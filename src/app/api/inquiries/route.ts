import { createInquiryHandler } from '@/server/inquiry-handler';
import { getInquiryStore } from '@/server/store';
import { findFirebaseEvent } from '@/server/firebase-events';
import { site } from '@/lib/site';
export const dynamic = 'force-dynamic';
export const POST = createInquiryHandler(getInquiryStore, new URL(site.url).origin, undefined, findFirebaseEvent);

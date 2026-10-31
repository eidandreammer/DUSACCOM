import { signInAnonymously } from 'firebase/auth';
import { doc, getDocFromServer, runTransaction, serverTimestamp, Timestamp, type Firestore } from 'firebase/firestore';
import { inquirySchema, validationErrors, type Inquiry, type InquiryResponse } from './inquiry';
import { getInquiryFirebase } from './firebase';

const WINDOW_MS = 10 * 60 * 1000;
class SubmissionError extends Error {}
let guestSignIn: Promise<unknown> | undefined;

export async function saveFirestoreInquiry(db: Firestore, ownerUid: string, input: Inquiry): Promise<InquiryResponse> {
  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Please check the highlighted fields.', errors: validationErrors(parsed.error) };
  const inquiry = parsed.data;
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(inquiry)));
  const payloadHash = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
  const reference = `DUS-${inquiry.submissionId.replaceAll('-', '').slice(0, 12).toUpperCase()}`;
  const receiptRef = doc(db, 'inquiries', inquiry.submissionId);
  const limitRef = doc(db, 'inquiryLimits', ownerUid);
  try {
    await runTransaction(db, async transaction => {
      const receipt = await transaction.get(receiptRef);
      if (receipt.exists()) {
        if (receipt.data().payloadHash !== payloadHash) throw new SubmissionError('This submission was already received with different details. Refresh the page to start a new inquiry.');
        return;
      }
      const limit = await transaction.get(limitRef);
      const previous = limit.data();
      const freshWindow = !previous || !(previous.windowStart instanceof Timestamp) || Date.now() >= previous.windowStart.toMillis() + WINDOW_MS;
      const count = freshWindow ? 1 : previous.count + 1;
      if (count > 5) throw new SubmissionError('You have sent several inquiries. Please try again in ten minutes, or contact the Chamber directly.');
      transaction.set(limitRef, {
        count, windowStart: freshWindow ? serverTimestamp() : previous!.windowStart,
        updatedAt: serverTimestamp(), lastSubmission: inquiry.submissionId,
      });
      transaction.set(receiptRef, { ...inquiry, ownerUid, reference, payloadHash, receivedAt: serverTimestamp(), status: 'new' });
    });
    // Require a confirmed server receipt. Offline writes never show success.
    const saved = (await getDocFromServer(receiptRef)).data();
    if (!saved || !(saved.receivedAt instanceof Timestamp) || saved.payloadHash !== payloadHash) throw new Error('Missing server receipt.');
    return { ok: true, reference: saved.reference, receivedAt: saved.receivedAt.toDate().toISOString() };
  } catch (error) {
    if (error instanceof SubmissionError) return { ok: false, message: error.message };
    throw error;
  }
}

export async function submitFirebaseInquiry(input: Inquiry): Promise<InquiryResponse> {
  const { auth, db } = getInquiryFirebase();
  await auth.authStateReady();
  if (!auth.currentUser) {
    guestSignIn ??= signInAnonymously(auth).finally(() => { guestSignIn = undefined; });
    await guestSignIn;
  }
  if (!auth.currentUser) throw new Error('Guest authentication unavailable.');
  return saveFirestoreInquiry(db, auth.currentUser.uid, input);
}

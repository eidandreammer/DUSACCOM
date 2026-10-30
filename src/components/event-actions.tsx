'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { getFirebase } from '@/lib/firebase';
import { accountCopy } from '@/lib/account-copy';
import { eventTitle } from '@/lib/events';
import type { Initiative } from '@/lib/content';
import { EventCreator } from './event-creator';
import styles from './event-calendar.module.css';

export function EventActions({ event, onEdit, onDeleted }: { event: Initiative; onEdit: () => void; onDeleted: () => void }) {
  const { user, isAdmin } = useAuth();
  const { lang } = useLanguage();
  const t = accountCopy[lang];
  const id = useId();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const deleteButton = useRef<HTMLButtonElement>(null);

  async function remove() {
    if (!user || !isAdmin || busy) return;
    setBusy(true); setError('');
    try {
      await deleteDoc(doc(getFirebase().db, 'events', event.id));
      onDeleted();
    } catch { setError(t.failed); }
    finally { setBusy(false); }
  }

  if (!user || !isAdmin) return null;
  return <div className={styles.adminActions}>
    <div className={styles.actionRow}>
      <button type="button" disabled={busy} onClick={onEdit}>{t.editEvent}</button>
      <button ref={deleteButton} type="button" disabled={busy} aria-expanded={confirming} aria-controls={`${id}-delete`} onClick={() => { setConfirming(true); setError(''); }}>{t.deleteEvent}</button>
    </div>
    {confirming && <div id={`${id}-delete`} className={styles.deleteConfirmation}>
      <p>{t.deleteQuestion} <strong>{eventTitle(event, lang)}</strong>? {t.deleteHint}</p>
      <div className={styles.actionRow}>
        <button type="button" className={styles.dangerButton} disabled={busy} onClick={remove}>{busy ? t.deleting : t.confirmDelete}</button>
        <button type="button" disabled={busy} onClick={() => { setConfirming(false); setError(''); deleteButton.current?.focus(); }}>{t.cancel}</button>
      </div>
      {error && <p className={styles.liveError} role="alert">{error}</p>}
    </div>}
  </div>;
}

export function EventEditor({ event, categories, onClose, onSaved }: {
  event: Initiative; categories: readonly string[]; onClose: () => void; onSaved: (startsAt: string, zone: string) => void;
}) {
  const { lang } = useLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return <dialog ref={dialog} className={styles.editorDialog} aria-label={accountCopy[lang].editEvent}
    onCancel={event => { event.preventDefault(); if (!dialog.current?.querySelector('fieldset')?.disabled) onClose(); }}>
    <EventCreator event={event} categories={categories} onCancel={onClose} onPublished={onSaved} />
  </dialog>;
}

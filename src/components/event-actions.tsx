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
  const confirmation = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = confirmation.current;
    if (!confirming || !element) return;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [confirming, isAdmin, user]);

  function cancel() {
    if (busy) return;
    setConfirming(false); setError('');
    requestAnimationFrame(() => deleteButton.current?.focus({ preventScroll: true }));
  }

  async function remove() {
    if (!user || !isAdmin || busy) return;
    setBusy(true); setError('');
    try {
      await deleteDoc(doc(getFirebase().db, 'events', event.id));
      setConfirming(false);
      onDeleted();
    } catch { setError(t.failed); }
    finally { setBusy(false); }
  }

  if (!user || !isAdmin) return null;
  return <div className={styles.adminActions}>
    <div className={styles.actionRow}>
      <button type="button" className={`${styles.editButton} hover-scale`} disabled={busy} onClick={onEdit}>{t.editEvent}</button>
      <button ref={deleteButton} type="button" className={`${styles.deleteButton} hover-scale`} disabled={busy} aria-haspopup="dialog" aria-expanded={confirming} aria-controls={`${id}-delete`} onClick={() => { setConfirming(true); setError(''); }}>{t.deleteEvent}</button>
    </div>
    {confirming && <dialog ref={confirmation} id={`${id}-delete`} className={styles.deleteDialog}
      aria-labelledby={`${id}-delete-title`} aria-describedby={`${id}-delete-hint`} aria-busy={busy}
      onCancel={event => { event.preventDefault(); cancel(); }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) cancel();
      }}>
      <h2 id={`${id}-delete-title`}>{t.deleteQuestion} <strong>{eventTitle(event, lang)}</strong>?</h2>
      <p id={`${id}-delete-hint`}>{t.deleteHint}</p>
      <div className={styles.actionRow}>
        <button type="button" className={`${styles.dangerButton} hover-scale`} disabled={busy} onClick={remove}>{busy ? t.deleting : t.confirmDelete}</button>
        <button type="button" className="hover-scale" autoFocus disabled={busy} onClick={cancel}>{t.cancel}</button>
      </div>
      {error && <p className={styles.liveError} role="alert">{error}</p>}
    </dialog>}
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

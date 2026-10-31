'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useLanguage } from '@/lib/language-context';
import { accountSettingsCopy } from '@/lib/account-settings-copy';
import styles from './account-settings.module.css';

export function ConfirmationDialog({ open, title, description, busy = false, onCancel, children }: {
  open: boolean; title: string; description: string; busy?: boolean; onCancel: () => void; children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { lang } = useLanguage();
  const id = useId();
  useEffect(() => {
    if (!open || !dialog.current) return;
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; previousFocus?.focus({ preventScroll: true }); };
  }, [open]);
  if (!open) return null;
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} aria-busy={busy}
    onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }}
    onClick={event => {
      if (busy || event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onCancel();
    }}>
    <h2 id={`${id}-title`}>{title}</h2>
    <p id={`${id}-description`}>{description}</p>
    {children}
    <button type="button" className={styles.cancel} autoFocus disabled={busy} onClick={onCancel}>{accountSettingsCopy[lang].cancel}</button>
  </dialog>;
}

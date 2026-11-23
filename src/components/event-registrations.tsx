'use client';
import { useEffect, useRef, useState } from 'react';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { getFirebase } from '@/lib/firebase';
import { useLanguage, LOCALE } from '@/lib/language-context';
import { accountCopy } from '@/lib/account-copy';
import { eventTitle } from '@/lib/events';
import type { Initiative } from '@/lib/content';
import styles from './event-calendar.module.css';

type Signup = { name: string; email: string; company: string; message: string; kind: string; reference: string; receivedAt: Date | null };

function csvCell(value: string) { return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value; }

// Admin-only attendee list for one event, with CSV export.
export function EventRegistrations({ event, onClose }: { event: Initiative; onClose: () => void }) {
  const { lang } = useLanguage();
  const t = accountCopy[lang];
  const dialog = useRef<HTMLDialogElement>(null);
  const [rows, setRows] = useState<Signup[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  useEffect(() => {
    let live = true;
    getDocs(query(collection(getFirebase().db, 'inquiries'), where('kind', 'in', ['event', 'event-registration']), where('interest', '==', event.id), limit(500)))
      .then(snapshot => {
        if (!live) return;
        setRows(snapshot.docs.map(item => {
          const data = item.data();
          return { name: String(data.name ?? ''), email: String(data.email ?? ''), company: String(data.company ?? ''), message: String(data.message ?? ''),
            kind: String(data.kind), reference: String(data.reference ?? ''), receivedAt: data.receivedAt?.toDate?.() ?? null };
        }).sort((a, b) => (a.receivedAt?.getTime() ?? 0) - (b.receivedAt?.getTime() ?? 0)));
      }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [event.id]);

  function download() {
    if (!rows) return;
    const header = [t.name, t.email, t.company, t.status, t.message, t.reference, t.received];
    const lines = rows.map(row => [row.name, row.email, row.company, row.kind === 'event-registration' ? t.registered : t.interested, row.message, row.reference, row.receivedAt?.toISOString() ?? ''].map(csvCell).join(','));
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.id}-registrations.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const registered = rows?.filter(row => row.kind === 'event-registration').length ?? 0;
  return <dialog ref={dialog} className={styles.editorDialog} aria-labelledby="registrations-title" onCancel={e => { e.preventDefault(); onClose(); }}>
    <div className={styles.registrationsPanel}>
      <h2 id="registrations-title">{t.registrationsTitle} <strong>{eventTitle(event, lang)}</strong></h2>
      {failed ? <p role="alert" className={styles.liveError}>{t.failed}</p> : rows === null ? <p role="status">{t.loadingList}</p> : rows.length === 0 ? <p role="status">{t.noRegistrations}</p> : <>
        <p role="status">{registered} {t.registered.toLowerCase()} · {rows.length - registered} {t.interested.toLowerCase()}</p>
        <div className={styles.registrationsTable}>
          <table>
            <thead><tr><th scope="col">{t.name}</th><th scope="col">{t.email}</th><th scope="col">{t.company}</th><th scope="col">{t.received}</th></tr></thead>
            <tbody>{rows.map(row => <tr key={row.reference}>
              <td>{row.name}{row.kind !== 'event-registration' && <small> · {t.interested}</small>}</td>
              <td><a href={`mailto:${row.email}`}>{row.email}</a></td><td>{row.company || '—'}</td>
              <td>{row.receivedAt ? new Intl.DateTimeFormat(LOCALE[lang], { dateStyle: 'medium', timeStyle: 'short' }).format(row.receivedAt) : '—'}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </>}
      <div className={styles.actionRow}>
        {rows && rows.length > 0 && <button type="button" className={`${styles.editButton} hover-scale`} onClick={download}>{t.downloadCsv}</button>}
        <button type="button" className="hover-scale" autoFocus onClick={onClose}>{t.close}</button>
      </div>
    </div>
  </dialog>;
}

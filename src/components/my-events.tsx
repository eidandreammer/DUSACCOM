'use client';
import { useEffect, useState } from 'react';
import { CalendarDays, MapPin } from 'lucide-react';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { useLanguage, LOCALE } from '@/lib/language-context';
import { getFirebase } from '@/lib/firebase';
import { accountCopy } from '@/lib/account-copy';
import { liveEvent } from '@/lib/live-events';
import { eventTitle } from '@/lib/events';
import type { Initiative } from '@/lib/content';
import styles from './account.module.css';

type Row = { reference: string; kind: string; receivedAt: number; eventId: string; event: Initiative | null };

// A signed-in member's event registrations, newest event first.
export function MyEvents() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const t = accountCopy[lang];
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!user || user.isAnonymous) return;
    let live = true;
    (async () => {
      const { db } = getFirebase();
      const snapshot = await getDocs(query(collection(db, 'inquiries'), where('ownerUid', '==', user.uid), limit(200)));
      const signups = snapshot.docs.map(item => item.data()).filter(data => data.kind === 'event-registration' || data.kind === 'event');
      const ids = [...new Set(signups.map(data => String(data.interest)))];
      const events = new Map(await Promise.all(ids.map(async eventId => {
        try { const found = await getDoc(doc(db, 'events', eventId)); return [eventId, found.exists() ? liveEvent(eventId, found.data()) : null] as const; }
        catch { return [eventId, null] as const; }
      })));
      const list = signups.map(data => ({ reference: String(data.reference), kind: String(data.kind), eventId: String(data.interest),
        receivedAt: data.receivedAt?.toMillis?.() ?? 0, event: events.get(String(data.interest)) ?? null }));
      list.sort((a, b) => (Date.parse(b.event?.schedule?.startsAt ?? '') || b.receivedAt) - (Date.parse(a.event?.schedule?.startsAt ?? '') || a.receivedAt));
      if (live) setRows(list);
    })().catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [user]);

  if (!user || user.isAnonymous) return null;
  const locale = LOCALE[lang];
  return <section className={`surface ${styles.panel}`} aria-labelledby="my-events-title">
    <h2 id="my-events-title">{t.myEvents}</h2>
    <p>{t.myEventsHint}</p>
    {failed ? <p role="alert" className={styles.error}>{t.failed}</p> : rows === null ? <p role="status">{t.loadingList}</p> : rows.length === 0 ? <>
      <p role="status">{t.myEventsEmpty}</p>
      <a className={styles.primary} href="/#events">{t.browseEvents}</a>
    </> : <ul className={styles.eventList}>
      {rows.map(row => {
        const start = row.event?.schedule ? new Date(row.event.schedule.startsAt) : null;
        const past = start ? start.getTime() < Date.now() : false;
        return <li key={row.reference} className={styles.eventItem}>
          <div>
            <strong>{row.event ? eventTitle(row.event, lang) : t.eventRemoved}</strong>
            {start && row.event?.schedule && <span className={styles.eventMeta}><CalendarDays size={14} aria-hidden="true" />
              {new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: row.event.schedule.timeZone, timeZoneName: 'short' }).format(start)}</span>}
            {row.event?.location && <span className={styles.eventMeta}><MapPin size={14} aria-hidden="true" />{row.event.location}</span>}
            <span className={styles.eventMeta}>{t.reference}: {row.reference}</span>
          </div>
          <span className={styles.badge}>{past ? t.pastEvent : row.kind === 'event-registration' ? t.registered : t.interested}</span>
        </li>;
      })}
    </ul>}
  </section>;
}

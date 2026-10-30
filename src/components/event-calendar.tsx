'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { firebaseConfigured, getFirebase } from '@/lib/firebase';
import { liveEvent } from '@/lib/live-events';
import { accountCopy } from '@/lib/account-copy';
import { useAuth } from '@/lib/auth-context';
import { EventCreator } from './event-creator';
import { EventActions, EventEditor } from './event-actions';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';
import { initiatives, type Initiative } from '@/lib/content';
import { dateKey, eventDateKey, eventDescription, eventTitle, isEventRegistrationOpen, monthDays, upcomingEvents } from '@/lib/events';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';
import { InquiryForm } from './inquiry-form';
import styles from './event-calendar.module.css';

type Month = { year: number; month: number };

export function EventCalendar({ events: initialEvents = initiatives }: { events?: readonly Initiative[] }) {
  const { lang } = useLanguage();
  const { user, isAdmin } = useAuth();
  const admin = Boolean(user && isAdmin);
  const [remoteEvents, setRemoteEvents] = useState<Initiative[]>([]);
  const [liveError, setLiveError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const events = useMemo(() => [...initialEvents, ...remoteEvents], [initialEvents, remoteEvents]);
  useEffect(() => {
    if (!firebaseConfigured) return;
    setLiveError(false);
    // Core operations are required for real-time snapshots (including Enterprise).
    return onSnapshot(query(collection(getFirebase().db, 'events'), where('status', '==', 'confirmed'), limit(500)), snapshot => {
      setRemoteEvents(snapshot.docs.flatMap(document => {
        const event = liveEvent(document.id, document.data());
        return event ? [event] : [];
      }));
      setLiveError(false);
    }, () => setLiveError(true));
  }, [attempt]);
  const copy = translations[lang].eventCalendar;
  const locale = lang === 'es' ? 'es-US' : 'en-US';
  const id = useId();
  const [month, setMonth] = useState<Month | null>(null);
  const [today, setToday] = useState('');
  const [now, setNow] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [editingEventId, setEditingEventId] = useState('');
  const [showPast, setShowPast] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const eventListHeading = useRef<HTMLHeadingElement>(null);
  const registration = useRef<HTMLDivElement>(null);
  const registrationTrigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    function updateClock() {
      const current = new Date();
      const key = dateKey(current, 'America/New_York');
      const [year, monthNumber] = key.split('-').map(Number);
      setToday(key);
      setNow(current.getTime());
      setMonth(previous => previous || { year, month: monthNumber - 1 });
    }
    updateClock();
    const timer = setInterval(updateClock, 60000);
    return () => clearInterval(timer);
  }, []);

  const resolvedLink = useRef(false);
  useEffect(() => {
    if (resolvedLink.current) return;
    const requested = new URLSearchParams(window.location.search).get('event');
    const event = events.find(item => item.id === requested);
    if (event) {
      resolvedLink.current = true;
      setSelectedEventId(event.id);
      const key = eventDateKey(event);
      if (key) {
        const [year, monthNumber] = key.split('-').map(Number);
        setMonth({ year, month: monthNumber - 1 });
        setSelectedDate(key);
      }
    }
  }, [events]);

  useEffect(() => {
    if (!selectedEventId) return;
    const frame = requestAnimationFrame(() => {
      registration.current?.focus({ preventScroll: true });
      registration.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedEventId]);

  const scheduled = events.filter(event => eventDateKey(event) !== null).sort((a, b) => Date.parse(a.schedule!.startsAt) - Date.parse(b.schedule!.startsAt));
  const upcoming = now > 0 ? upcomingEvents(events, now) : [];
  const monthKey = month ? `${month.year}-${String(month.month + 1).padStart(2, '0')}` : '';
  const includePast = admin && showPast;
  const listedEvents = includePast ? scheduled : upcoming;
  const visibleUpcoming = selectedDate ? listedEvents.filter(event => eventDateKey(event) === selectedDate) : listedEvents;
  const editingEvent = admin ? remoteEvents.find(event => event.id === editingEventId) : undefined;
  const selectedEvent = events.find(event => event.id === selectedEventId);
  const canRegister = selectedEvent && now > 0 ? isEventRegistrationOpen(selectedEvent, now) : false;
  const selectedIsPending = selectedEvent ? eventDateKey(selectedEvent) === null : false;
  const monthLabel = month ? new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(month.year, month.month, 1))) : copy.loading;

  function changeMonth(delta: number) {
    if (!month) return;
    const next = new Date(Date.UTC(month.year, month.month + delta, 1));
    setMonth({ year: next.getUTCFullYear(), month: next.getUTCMonth() });
    setSelectedDate(null);
  }

  function goToday() {
    if (!today) return;
    const [year, monthNumber] = today.split('-').map(Number);
    setMonth({ year, month: monthNumber - 1 });
    setSelectedDate(today);
  }

  function showPublishedMonth(startsAt: string, zone: string) {
    const key = dateKey(new Date(startsAt), zone);
    const [year, monthNumber] = key.split('-').map(Number);
    setMonth({ year, month: monthNumber - 1 }); setSelectedDate(null);
  }

  function renderEvent(event: Initiative) {
    const open = now > 0 && isEventRegistrationOpen(event, now);
    const dated = eventDateKey(event) !== null;
    const formatted = dated ? new Intl.DateTimeFormat(locale, {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: event.schedule!.timeZone,
    }).format(new Date(event.schedule!.startsAt)) : copy.tba;
    return (
      <article key={event.id} className={styles.eventCard}>
        <span className={styles.eventDate}><CalendarDays size={15} aria-hidden="true" />{dated ? <time dateTime={event.schedule!.startsAt}>{formatted}</time> : formatted}</span>
        <h3>{eventTitle(event, lang)}</h3>
        <p>{eventDescription(event, lang)}</p>
        <span className={styles.location}><MapPin size={14} aria-hidden="true" />{event.location || copy.locationTba}</span>
        {open || !dated ? (
          <button className={styles.eventButton} aria-expanded={selectedEventId === event.id} aria-controls={`${id}-registration`}
            onClick={click => { registrationTrigger.current = click.currentTarget; setSelectedEventId(event.id); }}>{open ? copy.register : copy.interest}</button>
        ) : <span className={styles.closed}>{copy.closed}</span>}
        {admin && remoteEvents.some(item => item.id === event.id) && <EventActions event={event}
          onEdit={() => { setAdminMessage(''); setEditingEventId(event.id); }}
          onDeleted={() => {
            if (selectedEventId === event.id) setSelectedEventId('');
            if (editingEventId === event.id) setEditingEventId('');
            setAdminMessage(accountCopy[lang].deleted);
            requestAnimationFrame(() => eventListHeading.current?.focus({ preventScroll: true }));
          }} />}
      </article>
    );
  }

  return (
    <section id="events" className={styles.section} aria-labelledby={`${id}-title`}>
      <div className={styles.container}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h2 id={`${id}-title`}>{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
        <div className={styles.layout}>
          <div className={styles.calendar} aria-label={copy.calendarLabel}>
            <div className={styles.monthBar}>
              <h3 aria-live="polite">{monthLabel}</h3>
              <div>
                <button disabled={!month} aria-label={copy.previousMonth} onClick={() => changeMonth(-1)}><ChevronLeft size={19} aria-hidden="true" /></button>
                <button disabled={!month} className={styles.todayButton} onClick={goToday}>{copy.today}</button>
                <button disabled={!month} aria-label={copy.nextMonth} onClick={() => changeMonth(1)}><ChevronRight size={19} aria-hidden="true" /></button>
              </div>
            </div>
            {month && <table className={styles.monthGrid}>
              <caption className="sr-only">{copy.calendarLabel}: {monthLabel}</caption>
              <thead><tr>{Array.from({ length: 7 }, (_, index) => {
                const date = new Date(Date.UTC(2024, 0, 7 + index));
                return <th key={index} scope="col"><abbr title={new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(date)}>{new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(date)}</abbr></th>;
              })}</tr></thead>
              <tbody>{Array.from({ length: monthDays(month.year, month.month).length / 7 }, (_, week) => (
                <tr key={week}>{monthDays(month.year, month.month).slice(week * 7, week * 7 + 7).map((day, index) => {
                  const key = `${monthKey}-${String(day).padStart(2, '0')}`;
                  const count = scheduled.filter(event => eventDateKey(event) === key).length;
                  const label = day ? new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(Date.UTC(month.year, month.month, day))) : '';
                  return <td key={index}>{day !== null && <button aria-label={`${label}${count ? `, ${count} ${count === 1 ? copy.eventSingular : copy.eventCount}` : ''}`}
                    aria-pressed={selectedDate === key} aria-current={key === today ? 'date' : undefined}
                    className={`${styles.day} ${count ? styles.hasEvents : ''}`} onClick={() => setSelectedDate(key)}>
                    <span>{day}</span>{count > 0 && <span className={styles.dot} aria-hidden="true" />}
                  </button>}</td>;
                })}</tr>
              ))}</tbody>
            </table>}
            <p className={styles.timeZone}>{copy.timeZone}</p>
          </div>
          <div className={styles.sidebar}>
            <EventCreator categories={events.map(event => event.category)} onPublished={(startsAt, zone) => { setAdminMessage(''); showPublishedMonth(startsAt, zone); }} />
          </div>
        </div>
        <div className={styles.upcoming}>
          <div className={styles.listHeading}>
            <h3 ref={eventListHeading} tabIndex={-1}>{includePast ? accountCopy[lang].allEvents : copy.upcoming}</h3>
            {admin && <label className={styles.historyToggle}><input type="checkbox" checked={showPast} onChange={event => { setShowPast(event.target.checked); setSelectedDate(null); }} />{accountCopy[lang].includePast}</label>}
          </div>
          {admin && adminMessage && <p role="status" className={styles.adminMessage}>{adminMessage}</p>}
          {liveError && <p className={styles.liveError} role="alert">{accountCopy[lang].liveError} <button onClick={() => setAttempt(value => value + 1)}>{accountCopy[lang].retry}</button></p>}
          {selectedDate && <div className={styles.listHeading}>
            <h4>{copy.selectedDay} {new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${selectedDate}T12:00:00Z`))}</h4>
            <button onClick={() => setSelectedDate(null)}>{includePast ? accountCopy[lang].showAll : copy.showUpcoming}</button>
          </div>}
          {now === 0 ? <p role="status">{copy.loading}</p> : visibleUpcoming.length ? <div className={styles.upcomingGrid}>{visibleUpcoming.map(renderEvent)}</div> : <p className={styles.empty} role="status">{copy.empty}</p>}
        </div>
        {editingEvent && <EventEditor key={editingEvent.id} event={editingEvent} categories={events.map(event => event.category)}
          onClose={() => setEditingEventId('')}
          onSaved={(startsAt, zone) => {
            setEditingEventId(''); setAdminMessage(accountCopy[lang].updated); showPublishedMonth(startsAt, zone);
          }} />}
        <div id={`${id}-registration`} hidden={!selectedEvent} className={styles.registration} ref={registration} tabIndex={-1}>
          {selectedEvent && <>
            <div className={styles.registrationIntro}>
              <div><h3>{copy.registrationTitle}</h3><p>{eventTitle(selectedEvent, lang)}</p></div>
              <button aria-label={copy.closeForm} onClick={() => { setSelectedEventId(''); registrationTrigger.current?.focus(); }}><X size={20} aria-hidden="true" /></button>
            </div>
            {canRegister || selectedIsPending ? <>
              {selectedIsPending && <p className={styles.interestNote}>{copy.interestNote}</p>}
              <InquiryForm kind={canRegister ? 'event-registration' : 'event'} initialInterest={selectedEvent.id} eventOptions={[selectedEvent]} />
            </> : <p className={styles.empty} role="status">{copy.closed}</p>}
          </>}
        </div>
      </div>
    </section>
  );
}

'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import { collection, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { firebaseConfigured, getFirebase } from '@/lib/firebase';
import { accountCopy } from '@/lib/account-copy';
import { eventTimeToInput, eventTimeToISO, liveEventSchema } from '@/lib/live-events';
import type { Initiative } from '@/lib/content';
import styles from './account.module.css';
import calendarStyles from './event-calendar.module.css';

export function EventCreator({ categories = [], event: existingEvent, onCancel, onPublished }: {
  categories?: readonly string[]; event?: Initiative; onCancel?: () => void; onPublished: (startsAt: string, zone: string) => void;
}) {
  const { user, isAdmin, loading } = useAuth();
  const { lang } = useLanguage();
  const t = accountCopy[lang];
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [published, setPublished] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [category, setCategory] = useState(existingEvent?.category || 'Networking');
  const [savedCategories, setSavedCategories] = useState<string[]>([]);
  const toggle = useRef<HTMLButtonElement>(null);
  const categoryOptions = [...new Set(['Networking', 'Workshop', 'Cross-border', ...(existingEvent ? [existingEvent.category] : []), ...categories, ...savedCategories])];
  const initialDate = existingEvent?.schedule ? eventTimeToInput(existingEvent.schedule.startsAt, existingEvent.schedule.timeZone) : '';

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !isAdmin || busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = (key: string) => String(data.get(key) || '').trim();
    // Keep seconds and the original offset occurrence when the time was not edited.
    const startsAt = existingEvent?.schedule && text('date') === initialDate && text('timeZone') === existingEvent.schedule.timeZone
      ? existingEvent.schedule.startsAt : eventTimeToISO(text('date'), text('timeZone'));
    setPublished(false); setError('');
    if (!startsAt || (!existingEvent && Date.parse(startsAt) <= Date.now())) { setError(existingEvent ? t.validDate : t.future); return; }
    const payload = liveEventSchema.safeParse({ title: text('title'), titleEs: text('titleEs'), description: text('description'), descriptionEs: text('descriptionEs'),
      location: text('location'), category: category === '' ? text('newCategory') : category, startsAt, timeZone: text('timeZone'), status: 'confirmed', registration: existingEvent ? text('registration') : 'open', createdBy: user.uid });
    if (!payload.success) { setError(t.failed); return; }
    setBusy(true);
    try {
      const { db } = getFirebase();
      if (existingEvent) {
        const { createdBy, ...updates } = payload.data;
        // Preserve the original creator and timestamp when another admin edits.
        await updateDoc(doc(db, 'events', existingEvent.id), updates);
      } else {
        const reference = doc(db, 'events', `live-${doc(collection(db, 'events')).id}`);
        await setDoc(reference, { ...payload.data, createdAt: serverTimestamp() });
      }
      setSavedCategories(previous => [...new Set([...previous, payload.data.category])]);
      form.reset(); setCategory('Networking'); setPublished(true); setExpanded(false);
      if (!existingEvent) requestAnimationFrame(() => toggle.current?.focus({ preventScroll: true }));
      onPublished(startsAt, payload.data.timeZone);
    } catch { setError(t.failed); }
    finally { setBusy(false); }
  }

  if (!firebaseConfigured || loading || !user || !isAdmin) return null;

  return <aside className={calendarStyles.creator} aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`}>{existingEvent ? t.editEvent : <button ref={toggle} type="button" className={calendarStyles.creatorToggle} aria-expanded={expanded} aria-controls={`${id}-form`} disabled={busy} onClick={() => setExpanded(value => !value)}>
      {t.addEvent}<ChevronDown size={20} aria-hidden="true" style={{ transform: expanded ? 'rotate(180deg)' : undefined }} />
    </button>}</h3>
    {published && <p role="status" className={styles.hint}>{t.published}</p>}
    <div id={`${id}-form`} hidden={!expanded}>
    <p className={calendarStyles.creatorHint}>{t.adminHint}</p>
    <form className={styles.form} onSubmit={publish}>
      <fieldset disabled={busy} className={calendarStyles.creatorFields}>
        <label htmlFor={`${id}-name`}>{t.eventTitle}<input id={`${id}-name`} name="title" required maxLength={160} defaultValue={existingEvent?.title} /></label>
        <label htmlFor={`${id}-description`}>{t.descriptionLabel}<textarea id={`${id}-description`} name="description" required maxLength={2000} defaultValue={existingEvent?.description} /></label>
        <label htmlFor={`${id}-category`}>{t.category}<select id={`${id}-category`} name="category" value={category} onChange={event => setCategory(event.target.value)}>
          {categoryOptions.map(option => <option key={option} value={option}>{option}</option>)}
          <option value="">{t.addCategory}</option>
        </select></label>
        {category === '' && <label htmlFor={`${id}-new-category`}>{t.newCategory}<input id={`${id}-new-category`} name="newCategory" required maxLength={60} pattern=".*\S.*" /></label>}
        <details>
          <summary>{lang === 'es' ? 'Opciones adicionales' : 'More options'}</summary>
          <label htmlFor={`${id}-title-es`}>{t.eventTitleEs}<input id={`${id}-title-es`} name="titleEs" maxLength={160} defaultValue={existingEvent?.titleEs} /></label>
          <label htmlFor={`${id}-description-es`}>{t.descriptionEs}<textarea id={`${id}-description-es`} name="descriptionEs" maxLength={2000} defaultValue={existingEvent?.descriptionEs} /></label>
        </details>
        <label htmlFor={`${id}-location`}>{t.location}<input id={`${id}-location`} name="location" required maxLength={240} defaultValue={existingEvent?.location} /></label>
        <label htmlFor={`${id}-date`}>{t.date}<input id={`${id}-date`} name="date" type="datetime-local" required defaultValue={initialDate} /></label>
        <label htmlFor={`${id}-zone`}>{t.zone}<select id={`${id}-zone`} name="timeZone" defaultValue={existingEvent?.schedule?.timeZone || 'America/New_York'}>
          {existingEvent?.schedule && !['America/New_York', 'America/Santo_Domingo', 'America/Chicago', 'America/Los_Angeles', 'UTC'].includes(existingEvent.schedule.timeZone) && <option value={existingEvent.schedule.timeZone}>{existingEvent.schedule.timeZone}</option>}
          <option value="America/New_York">New York</option><option value="America/Santo_Domingo">Santo Domingo</option><option value="America/Chicago">Chicago</option><option value="America/Los_Angeles">Los Angeles</option><option value="UTC">UTC</option>
        </select></label>

        {existingEvent && <label htmlFor={`${id}-registration`}>{t.registration}<select id={`${id}-registration`} name="registration" defaultValue={existingEvent.schedule?.registration || 'open'}>
          <option value="open">{t.registrationOpen}</option><option value="closed">{t.registrationClosed}</option>
        </select></label>}
        <button className={styles.primary} disabled={busy}>{busy ? (existingEvent ? t.saving : t.publishing) : existingEvent ? t.saveEvent : t.publish}</button>
        {onCancel && <button type="button" className={styles.secondary} disabled={busy} onClick={onCancel}>{t.cancel}</button>}
      </fieldset>
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </form>
    </div>
  </aside>;
}

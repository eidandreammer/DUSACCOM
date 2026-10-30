'use client';
import Link from 'next/link';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, LoaderCircle, Mail, ShieldCheck } from 'lucide-react';
import { inquirySchema, validationErrors, type FieldErrors, type InquiryKind, type InquiryResponse } from '@/lib/inquiry';
import { site } from '@/lib/site';
import { initiatives, type Initiative } from '@/lib/content';
import { eventTitle, isEventRegistrationOpen } from '@/lib/events';
import { track } from './privacy-controls';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';

type Values = {
  name: string;
  email: string;
  company: string;
  interest: string;
  message: string;
  consent: boolean;
  website: string;
};

export function InquiryForm({
  kind = 'contact',
  initialInterest = '',
  onInterestChange,
  eventOptions = initiatives,
}: {
  kind?: InquiryKind;
  initialInterest?: string;
  onInterestChange?: (interest: string) => void;
  eventOptions?: readonly Initiative[];
}) {
  const { lang } = useLanguage();
  const f = translations[lang].form;
  const isEvent = kind === 'event' || kind === 'event-registration';
  const isRegistration = kind === 'event-registration';
  const id = useId();
  const [values, setValues] = useState<Values>({
    name: '',
    email: '',
    company: '',
    interest: initialInterest,
    message: '',
    consent: false,
    website: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<InquiryResponse | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const submissionId = useRef<string>('');
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    submissionId.current = crypto.randomUUID();
  }, []);

  useEffect(() => {
    setValues(current => ({ ...current, interest: initialInterest }));
    setErrors(current => ({ ...current, interest: undefined }));
    setResult(null);
  }, [initialInterest, kind]);

  const options =
    kind === 'membership'
      ? translations[lang].membershipTiers.map((tier) => ({ value: tier.id, label: tier.name }))
      : isEvent
      ? eventOptions.filter(event => !isRegistration || isEventRegistrationOpen(event)).map((event) => ({ value: event.id, label: eventTitle(event, lang) }))
      : f.contactTopics.map((topic) => ({ value: topic, label: topic }));

  function check(next: Values): FieldErrors {
    const parsed = inquirySchema.safeParse({ ...next, kind, submissionId: submissionId.current });
    return parsed.success ? {} : validationErrors(parsed.error);
  }

  function update<K extends keyof Values>(name: K, value: Values[K]) {
    const next = { ...values, [name]: value };
    setValues(next);
    setResult(null);
    if (touched[name]) setErrors((current) => ({ ...current, [name]: check(next)[name] }));
  }

  function blur(name: keyof Values) {
    setTouched((current) => ({ ...current, [name]: true }));
    setErrors((current) => ({ ...current, [name]: check(values)[name] }));
  }

  const fieldProps = (name: keyof Values) => ({
    id: `${id}-${name}`,
    name,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `${id}-${name}-error` : undefined,
    onBlur: () => blur(name),
  });

  function ErrorMessage({ name }: { name: keyof Values }) {
    return errors[name] ? (
      <span id={`${id}-${name}-error`} className="mt-1.5 block text-xs font-normal leading-5 text-red-800">
        {errors[name]}
      </span>
    ) : null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!submissionId.current) submissionId.current = crypto.randomUUID();
    const invalid = check(values);
    setErrors(invalid);
    if (Object.keys(invalid).length) {
      setTouched({ name: true, email: true, interest: true, message: true, consent: true });
      const field = form.current?.elements.namedItem(Object.keys(invalid)[0]);
      if (field instanceof HTMLElement) field.focus();
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, kind, submissionId: submissionId.current }),
        signal: AbortSignal.timeout(15000),
      });
      const payload: unknown = await response.json();
      if (typeof payload !== 'object' || payload === null || !('ok' in payload)) throw new Error('Invalid response');
      const data = payload as InquiryResponse;
      if (response.ok && data.ok && typeof data.reference === 'string') {
        setResult(data);
        setValues({ name: '', email: '', company: '', interest: initialInterest, message: '', consent: false, website: '' });
        setTouched({});
        submissionId.current = crypto.randomUUID();
        track('inquiry_received', { kind });
      } else if (!data.ok) {
        setResult(data);
        if (data.errors) setErrors(data.errors);
      } else {
        throw new Error('Request failed');
      }
    } catch {
      setResult({
        ok: false,
        message: f.errorMessage,
      });
    } finally {
      setBusy(false);
      requestAnimationFrame(() => resultRef.current?.focus({ preventScroll: false }));
    }
  }

  const title =
    isRegistration ? f.titleEventRegistration : kind === 'membership'
      ? f.titleMembership
      : kind === 'event'
      ? f.titleEvent
      : f.titleContact;

  const desc =
    isRegistration ? f.descEventRegistration : kind === 'membership'
      ? f.descMembership
      : kind === 'event'
      ? f.descEvent
      : f.descContact;

  const submitBtnText =
    isRegistration ? f.submitEventRegistration : kind === 'membership'
      ? f.submitMembership
      : kind === 'event'
      ? f.submitEvent
      : f.submitContact;

  return (
    <form
      ref={form}
      method="post"
      action="/api/inquiries"
      onSubmit={submit}
      noValidate
      aria-busy={busy}
      className="rounded-[8px] border border-slate-200 bg-mist p-6 md:p-8"
    >
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 mb-7 text-sm leading-7 text-slate-600">{desc}</p>

      <fieldset disabled={busy} className="min-w-0 space-y-5">
        <legend className="sr-only">Details</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-xs font-semibold" htmlFor={`${id}-name`}>
            {f.fullName} <span className="text-crimson" aria-hidden="true">*</span>
            <input
              {...fieldProps('name')}
              value={values.name}
              onChange={(e) => update('name', e.target.value)}
              className="form-field"
              placeholder={f.fullNamePlaceholder}
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
            />
            <ErrorMessage name="name" />
          </label>
          <label className="text-xs font-semibold" htmlFor={`${id}-email`}>
            {f.emailAddress} <span className="text-crimson" aria-hidden="true">*</span>
            <input
              {...fieldProps('email')}
              type="email"
              value={values.email}
              onChange={(e) => update('email', e.target.value)}
              className="form-field"
              autoComplete="email"
              placeholder={f.emailPlaceholder}
              required
              maxLength={254}
            />
            <ErrorMessage name="email" />
          </label>
        </div>

        <label className="block text-xs font-semibold">
          {f.company}
          <input
            {...fieldProps('company')}
            value={values.company}
            onChange={(e) => update('company', e.target.value)}
            className="form-field"
            placeholder={f.companyPlaceholder}
            autoComplete="organization"
            maxLength={150}
          />
          <ErrorMessage name="company" />
        </label>

        <label className="block text-xs font-semibold">
          {kind === 'membership' ? f.pathwayLabel : isEvent ? f.eventLabel : f.helpLabel}{' '}
          <span className="text-crimson" aria-hidden="true">*</span>
          <select
            {...fieldProps('interest')}
            value={values.interest}
            onChange={(e) => {
              update('interest', e.target.value);
              onInterestChange?.(e.target.value);
              track('inquiry_interest_selected', {
                kind,
                option: options.findIndex((opt) => opt.value === e.target.value),
              });
            }}
            className="form-field"
            required
          >
            <option value="">{f.selectOption}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ErrorMessage name="interest" />
        </label>

        <label className="block text-xs font-semibold">
          {isRegistration ? f.optionalMessage : f.messageLabel} {!isRegistration && <span className="text-crimson" aria-hidden="true">*</span>}
          <textarea
            {...fieldProps('message')}
            value={values.message}
            onChange={(e) => update('message', e.target.value)}
            className="form-field min-h-32 resize-y"
            placeholder={f.messagePlaceholder}
            rows={4}
            required={!isRegistration}
            minLength={isRegistration ? undefined : 10}
            maxLength={3000}
          />
          <ErrorMessage name="message" />
        </label>

        <div className="absolute -left-[10000px]" aria-hidden="true">
          <label>
            Leave empty
            <input
              name="website"
              value={values.website}
              onChange={(e) => update('website', e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3 text-xs leading-6 text-slate-600">
            <input
              {...fieldProps('consent')}
              type="checkbox"
              checked={values.consent}
              onChange={(e) => update('consent', e.target.checked)}
              className="mt-1 size-4.5 shrink-0 accent-crimson rounded-[8px]"
              required
            />
            <span>
              {lang === 'en' ? (
                <>
                  I agree to the{' '}
                  <Link href="/privacy" target="_blank" rel="noopener" className="underline underline-offset-2">
                    {f.privacyLinkText}
                  </Link>{' '}
                  and consent to being contacted about my inquiry.
                </>
              ) : (
                <>
                  Acepto la{' '}
                  <Link href="/privacy" target="_blank" rel="noopener" className="underline underline-offset-2">
                    {f.privacyLinkText}
                  </Link>{' '}
                  y autorizo a ser contactado sobre mi consulta.
                </>
              )}
            </span>
          </label>
          <ErrorMessage name="consent" />
        </div>

        <button type="submit" className="button w-full justify-center" disabled={busy}>
          <span>{busy ? f.sending : submitBtnText}</span>
          {busy ? (
            <LoaderCircle size={19} className="animate-spin" aria-hidden="true" />
          ) : (
            <ArrowRight size={18} aria-hidden="true" />
          )}
        </button>
      </fieldset>

      <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs leading-5 text-slate-600">
        <ShieldCheck size={15} className="shrink-0" aria-hidden="true" />
        {f.noPaymentNote}
      </p>

      <div
        ref={resultRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={
          result
            ? `mt-6 rounded-[8px] border p-5 ${result.ok ? 'border-emerald-300 bg-emerald-50' : 'border-red-200 bg-red-50'}`
            : ''
        }
      >
        {result &&
          (result.ok ? (
            <>
              <CheckCircle2 size={24} className="mb-3 text-emerald-700" aria-hidden="true" />
              <h3 className="text-lg font-semibold">{isRegistration ? f.eventRegistrationSuccess : f.thankYou}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                {f.refText} <strong>{result.reference}</strong> {f.forFollowUp}
              </p>
            </>
          ) : (
            <>
              <h3 className="font-semibold">{f.errorTitle}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-700">{result.message}</p>
              <a className="text-link mt-2" href={`mailto:${site.email}`}>
                <Mail size={17} aria-hidden="true" />
                <span>{f.emailChamber}</span>
              </a>
              <p className="text-xs leading-6 text-slate-600">
                {f.callChamber}{' '}
                <a href={`tel:${site.phoneHref}`} className="underline">
                  {site.phone}
                </a>
                . {result.requestId && <>Ref: {result.requestId}</>}
              </p>
            </>
          ))}
      </div>
    </form>
  );
}

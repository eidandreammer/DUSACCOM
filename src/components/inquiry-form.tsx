'use client';
import Link from 'next/link';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, LoaderCircle, Mail, ShieldCheck } from 'lucide-react';
import { inquirySchema, validationErrors, type FieldErrors, type InquiryKind, type InquiryResponse } from '@/lib/inquiry';
import { site } from '@/lib/site';
import { tiers, initiatives } from '@/lib/content';
import { track } from './privacy-controls';
type Values = { name: string; email: string; company: string; interest: string; message: string; consent: boolean; website: string };
const contactTopics = ['General inquiry', 'Membership', 'Business development', 'Networking & connections', 'Trade & market access', 'Community & advocacy', 'Partnership opportunity'];
export function InquiryForm({ kind = 'contact', initialInterest = '' }: { kind?: InquiryKind; initialInterest?: string }) {
  const id = useId();
  const [values, setValues] = useState<Values>({ name: '', email: '', company: '', interest: initialInterest, message: '', consent: false, website: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<InquiryResponse | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const submissionId = useRef<string>('');
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { submissionId.current = crypto.randomUUID(); }, []);
  const options = kind === 'membership' ? tiers.map(tier => ({ value: tier.id, label: tier.name })) : kind === 'event' ? initiatives.map(event => ({ value: event.id, label: event.title })) : contactTopics.map(topic => ({ value: topic, label: topic }));
  function check(next: Values): FieldErrors {
    const parsed = inquirySchema.safeParse({ ...next, kind, submissionId: submissionId.current });
    return parsed.success ? {} : validationErrors(parsed.error);
  }
  function update<K extends keyof Values>(name: K, value: Values[K]) {
    const next = { ...values, [name]: value }; setValues(next); setResult(null);
    if (touched[name]) setErrors(current => ({ ...current, [name]: check(next)[name] }));
  }
  function blur(name: keyof Values) { setTouched(current => ({ ...current, [name]: true })); setErrors(current => ({ ...current, [name]: check(values)[name] })); }
  const fieldProps = (name: keyof Values) => ({ id: `${id}-${name}`, name, 'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `${id}-${name}-error` : undefined, onBlur: () => blur(name) });
  function ErrorMessage({ name }: { name: keyof Values }) { return errors[name] ? <span id={`${id}-${name}-error`} className="mt-1.5 block text-xs font-normal leading-5 text-red-800">{errors[name]}</span> : null; }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    if (!submissionId.current) submissionId.current = crypto.randomUUID();
    const invalid = check(values); setErrors(invalid);
    if (Object.keys(invalid).length) { setTouched({ name: true, email: true, interest: true, message: true, consent: true }); const field = form.current?.elements.namedItem(Object.keys(invalid)[0]); if (field instanceof HTMLElement) field.focus(); return; }
    setBusy(true); setResult(null);
    try {
      const response = await fetch('/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, kind, submissionId: submissionId.current }), signal: AbortSignal.timeout(15000) });
      const payload: unknown = await response.json();
      if (typeof payload !== 'object' || payload === null || !('ok' in payload)) throw new Error('Invalid response');
      const data = payload as InquiryResponse;
      if (response.ok && data.ok && typeof data.reference === 'string') {
        setResult(data); setValues({ name: '', email: '', company: '', interest: initialInterest, message: '', consent: false, website: '' }); setTouched({});
        submissionId.current = crypto.randomUUID(); track('inquiry_received', { kind });
      } else if (!data.ok) { setResult(data); if (data.errors) setErrors(data.errors); }
      else throw new Error('Request failed');
    } catch { setResult({ ok: false, message: 'We couldn’t confirm your submission. Your entries are still here. Please try again or contact the Chamber directly.' }); }
    finally { setBusy(false); requestAnimationFrame(() => resultRef.current?.focus({ preventScroll: false })); }
  }
  const title = kind === 'membership' ? 'Start your membership journey.' : kind === 'event' ? 'Be part of the conversation.' : 'Let’s connect.';
  return <form ref={form} method="post" action="/api/inquiries" onSubmit={submit} noValidate aria-busy={busy} className="rounded-md border border-slate-200 bg-mist p-6 md:p-8"><h2 className="text-2xl font-semibold tracking-tight">{title}</h2><p className="mt-2 mb-7 text-sm leading-7 text-slate-600">{kind === 'membership' ? 'Tell us about your business. Our team can confirm current benefits, dues, and next steps.' : kind === 'event' ? 'Get in touch about a proposed initiative. Dates and registration are not yet confirmed.' : 'Tell us a little about yourself and what you have in mind.'}</p><noscript><p className="mb-5 rounded border border-slate-300 bg-white p-4 text-sm leading-7">Please enable JavaScript to use this form, or email <a href="mailto:dusaccom1@gmail.com" className="underline">dusaccom1@gmail.com</a>.</p></noscript><fieldset disabled={busy} className="min-w-0 space-y-5"><legend className="sr-only">Your inquiry details</legend><div className="grid gap-5 md:grid-cols-2"><label className="text-xs font-semibold" htmlFor={`${id}-name`}>Full name <span className="text-crimson" aria-hidden="true">*</span><input {...fieldProps('name')} value={values.name} onChange={e => update('name', e.target.value)} className="form-field" placeholder="Your full name" autoComplete="name" required minLength={2} maxLength={100} /><ErrorMessage name="name" /></label><label className="text-xs font-semibold" htmlFor={`${id}-email`}>Email address <span className="text-crimson" aria-hidden="true">*</span><input {...fieldProps('email')} type="email" value={values.email} onChange={e => update('email', e.target.value)} className="form-field" autoComplete="email" placeholder="you@company.com" required maxLength={254} /><ErrorMessage name="email" /></label></div><label className="block text-xs font-semibold">Company / organization<input {...fieldProps('company')} value={values.company} onChange={e => update('company', e.target.value)} className="form-field" placeholder="Your business name" autoComplete="organization" maxLength={150} /><ErrorMessage name="company" /></label><label className="block text-xs font-semibold">{kind === 'membership' ? 'Membership pathway' : kind === 'event' ? 'Initiative' : 'How can we help?'} <span className="text-crimson" aria-hidden="true">*</span><select {...fieldProps('interest')} value={values.interest} onChange={e => { update('interest', e.target.value); track('inquiry_interest_selected', { kind, option: options.findIndex(option => option.value === e.target.value) }); }} className="form-field" required><option value="">Select an option</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ErrorMessage name="interest" /></label><label className="block text-xs font-semibold">Your message <span className="text-crimson" aria-hidden="true">*</span><textarea {...fieldProps('message')} value={values.message} onChange={e => update('message', e.target.value)} className="form-field min-h-32 resize-y" placeholder="Tell us what you have in mind…" rows={4} required minLength={10} maxLength={3000} /><ErrorMessage name="message" /></label><div className="absolute -left-[10000px]" aria-hidden="true"><label>Leave this field empty<input name="website" value={values.website} onChange={e => update('website', e.target.value)} tabIndex={-1} autoComplete="off" /></label></div><div><label className="flex cursor-pointer items-start gap-3 text-xs leading-6 text-slate-600"><input {...fieldProps('consent')} type="checkbox" checked={values.consent} onChange={e => update('consent', e.target.checked)} className="mt-1 size-4.5 shrink-0 accent-crimson" required /><span>I agree to the <Link href="/privacy" target="_blank" rel="noopener" className="underline underline-offset-2">Privacy Policy (opens in a new tab)</Link> and consent to being contacted about my inquiry.</span></label><ErrorMessage name="consent" /></div><button type="submit" className="button w-full" disabled={busy}>{busy ? 'Sending your inquiry…' : kind === 'membership' ? 'Submit membership inquiry' : kind === 'event' ? 'Send expression of interest' : 'Send your message'}{busy ? <LoaderCircle size={19} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}</button></fieldset><p className="mt-4 flex items-center justify-center gap-2 text-center text-[10px] leading-5 text-slate-600"><ShieldCheck size={15} className="shrink-0" aria-hidden="true" />{kind === 'membership' ? 'No payment or membership commitment is made here.' : kind === 'event' ? 'An expression of interest does not reserve a place.' : 'Your details are used to handle your inquiry.'}</p><div ref={resultRef} tabIndex={-1} role="status" aria-live="polite" className={result ? `mt-6 rounded border p-5 ${result.ok ? 'border-emerald-300 bg-emerald-50' : 'border-red-200 bg-red-50'}` : ''}>{result && (result.ok ? <><CheckCircle2 size={24} className="mb-3 text-emerald-700" aria-hidden="true" /><h3 className="text-lg font-semibold">Thank you. Your inquiry is received.</h3><p className="mt-2 text-sm leading-7 text-slate-700">Keep reference <strong>{result.reference}</strong> for any follow-up. {kind === 'event' ? 'This confirms receipt of your interest, not an event reservation.' : kind === 'membership' ? 'Our team will review your inquiry. Membership is confirmed separately.' : 'We look forward to connecting with you.'}</p></> : <><h3 className="font-semibold">Let’s try another way.</h3><p className="mt-2 text-sm leading-7 text-slate-700">{result.message}</p><a className="text-link mt-2" href={`mailto:${site.email}`}><Mail size={17} aria-hidden="true" />Email the Chamber</a><p className="text-xs leading-6 text-slate-600">Or call <a href={`tel:${site.phoneHref}`} className="underline">{site.phone}</a>. {result.requestId && <>Reference: {result.requestId}</>}</p></>)}</div></form>;
}

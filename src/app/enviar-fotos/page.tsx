'use client';
import { useState } from 'react';
import { UploadCloud, CheckCircle, Sparkles, Send } from 'lucide-react';
import { PageIntro, ClosingCTA } from '@/components/ui';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';

export default function EnviarFotosPage() {
  const { lang } = useLanguage();
  const ef = translations[lang].enviarFotosPage;
  const [submitted, setSubmitted] = useState(false);
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <PageIntro
        eyebrow={ef.eyebrow}
        title={ef.title}
        accent={ef.accent}
        description={ef.description}
      />

      <section className="section">
        <div className="container max-w-3xl">
          {submitted ? (
            <div className="rounded-[8px] border border-green-200 bg-green-50 p-8 text-center">
              <CheckCircle className="mx-auto size-14 text-green-600 mb-4" />
              <h2 className="text-2xl font-semibold text-green-900">{ef.successTitle}</h2>
              <p className="mt-3 text-sm text-green-800 leading-7">
                {ef.successDesc}
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="button mt-6 inline-flex"
              >
                <span>{ef.btnAnother}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-[8px] border border-slate-200 bg-white p-8 md:p-10 shadow-sm">
              <div className="mb-6 flex items-center gap-2 rounded-[8px] bg-red-50 p-4 text-xs text-crimson">
                <Sparkles size={18} className="shrink-0" />
                <span>{ef.sidenote}</span>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-navy">{ef.fullName}</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={ef.fullNamePlaceholder}
                    className="form-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-navy">{ef.businessName}</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={ef.businessNamePlaceholder}
                    className="form-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-navy">{ef.email}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={ef.emailPlaceholder}
                    className="form-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-navy">{ef.uploadLabel}</label>
                  <div className="mt-2 flex flex-col items-center justify-center rounded-[8px] border-2 border-dashed border-slate-300 p-8 text-center hover:border-crimson transition">
                    <UploadCloud className="size-10 text-slate-400 mb-3" />
                    <p className="text-sm font-medium text-slate-700">{ef.uploadHelp}</p>
                    <p className="mt-1 text-xs text-slate-500">{ef.uploadFormats}</p>
                    <input type="file" accept="image/*" className="mt-4 text-xs" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-navy">{ef.notesLabel}</label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={ef.notesPlaceholder}
                    className="form-field"
                  />
                </div>

                <button type="submit" className="button w-full justify-center">
                  <span>{ef.btnSubmit}</span>
                  <Send size={18} />
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <ClosingCTA />
    </>
  );
}

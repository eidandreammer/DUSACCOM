'use client';
import { useState } from 'react';
import { Calendar, CheckCircle, Sparkles } from 'lucide-react';
import { PageIntro, ClosingCTA } from '@/components/ui';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';

export default function AgendarCitaPage() {
  const { lang } = useLanguage();
  const ac = translations[lang].agendarCitaPage;
  const [scheduled, setScheduled] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '10:00 AM',
    location: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setScheduled(true);
  };

  return (
    <>
      <PageIntro
        eyebrow={ac.eyebrow}
        title={ac.title}
        accent={ac.accent}
        description={ac.description}
      />

      <section className="section">
        <div className="container max-w-3xl">
          {scheduled ? (
            <div className="rounded-[8px] border border-green-200 bg-green-50 p-8 text-center">
              <CheckCircle className="mx-auto size-14 text-green-600 mb-4" />
              <h2 className="text-2xl font-semibold text-green-900">{ac.successTitle}</h2>
              <p className="mt-3 text-sm text-green-800 leading-7">
                {ac.successDesc}
              </p>
              <button
                onClick={() => setScheduled(false)}
                className="button mt-6 inline-flex"
              >
                <span>{ac.btnAnother}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-[8px] border border-slate-200 bg-white p-8 md:p-10 shadow-sm">
              <div className="mb-6 flex items-center gap-2 rounded-[8px] bg-red-50 p-4 text-xs text-crimson">
                <Sparkles size={18} className="shrink-0" />
                <span>{ac.sidenote}</span>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-navy">{ac.nameLabel}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={ac.namePlaceholder}
                    className="form-field"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-navy">{ac.emailLabel}</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={ac.emailPlaceholder}
                      className="form-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-navy">{ac.phoneLabel}</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={ac.phonePlaceholder}
                      className="form-field"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-navy">{ac.dateLabel}</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="form-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-navy">{ac.timeLabel}</label>
                    <select
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="form-field"
                    >
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="03:30 PM">03:30 PM</option>
                      <option value="05:00 PM">05:00 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-navy">{ac.locationLabel}</label>
                  <select
                    value={formData.location || ac.locations[0]}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="form-field"
                  >
                    {ac.locations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="button w-full justify-center">
                  <span>{ac.btnConfirm}</span>
                  <Calendar size={18} />
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

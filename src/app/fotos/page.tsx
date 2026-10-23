'use client';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { PageIntro, Eyebrow, ClosingCTA, ButtonLink } from '@/components/ui';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';

export default function FotosPage() {
  const { lang } = useLanguage();
  const f = translations[lang].fotosPage;

  return (
    <>
      <PageIntro
        eyebrow={f.eyebrow}
        title={f.title}
        accent={f.accent}
        description={f.description}
      />

      {/* Sidenote highlight for FaceApp Photo / Foto FaceApp */}
      <section className="section bg-mist">
        <div className="container">
          <div className="rounded-[8px] border-2 border-crimson/20 bg-white p-8 md:p-12 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-[8px] bg-red-50 px-3 py-1.5 text-xs font-bold text-crimson mb-4">
                  <Sparkles size={16} />
                  <span>{f.sidenoteBadge}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  {f.sidenoteTitle}
                </h2>
                <p className="mt-3 text-sm leading-8 text-slate-600">
                  {f.sidenoteDesc}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                <ButtonLink href="/enviar-fotos">
                  <span>{f.btnSubmit}</span>
                </ButtonLink>
                <ButtonLink href="/agendar-cita" variant="outline">
                  <span>{f.btnSchedule}</span>
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Showcase */}
      <section className="section">
        <div className="container">
          <Eyebrow>{f.showcaseEyebrow}</Eyebrow>
          <h2 className="section-title mb-6">{f.showcaseTitle}</h2>
          <p className="max-w-2xl text-sm leading-8 text-slate-600 mb-10">
            {f.showcaseDesc}
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {f.cards.map((item, idx) => {
              const images = ['/assets/networking.jpg', '/assets/new-york.jpg', '/assets/networking.jpg'];
              return (
                <article key={idx} className="group overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-xs hover:shadow-lg transition">
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={images[idx] || '/assets/networking.jpg'}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition"
                    />
                    <span className="absolute top-4 left-4 rounded-[8px] bg-navy/85 px-3 py-1 text-xs font-semibold text-white">
                      {item.tag}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.desc}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-6 rounded-[8px] bg-navy p-8 text-white">
            <div>
              <h3 className="text-2xl font-semibold">{f.bannerTitle}</h3>
              <p className="mt-2 text-sm text-slate-300">{f.bannerDesc}</p>
            </div>
            <div className="flex gap-4">
              <ButtonLink href="/enviar-fotos" variant="white">
                <span>{f.bannerBtn1}</span>
              </ButtonLink>
              <ButtonLink
                href="/agendar-cita"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-navy"
              >
                <span>{f.bannerBtn2}</span>
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <ClosingCTA />
    </>
  );
}

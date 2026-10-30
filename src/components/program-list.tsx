'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, CalendarDays, TrendingUp, Search, X } from 'lucide-react';
import { initiatives, type Initiative } from '@/lib/content';
import { eventDateKey } from '@/lib/events';
import { useLanguage } from '@/lib/language-context';

export function InitiativeCard({ initiative }: { initiative: Initiative }) {
  const { lang } = useLanguage();
  const { art, tagline } = initiative;

  const categoryTranslations: Record<string, { en: string; es: string }> = {
    Networking: { en: 'Networking', es: 'Redes y Contactos' },
    Workshop: { en: 'Workshop', es: 'Taller Práctico' },
    'Cross-border': { en: 'Cross-Border', es: 'Transfronterizo' },
  };

  const taglineTranslations: Record<string, { en: [string, string]; es: [string, string] }> = {
    'business-connection': {
      en: ['Stronger connections.', 'Bigger possibilities.'],
      es: ['Conexiones más fuertes.', 'Mayores posibilidades.'],
    },
    'next-chapter': {
      en: ['Small steps.', 'Big ambitions.'],
      es: ['Pequeños pasos.', 'Grandes ambiciones.'],
    },
    'beyond-borders': {
      en: ['Two markets.', 'One conversation.'],
      es: ['Dos mercados.', 'Una conversación.'],
    },
  };

  const titleTranslations: Record<string, { en: string; es: string }> = {
    'business-connection': { en: 'The Business Connection', es: 'La Conexión Empresarial' },
    'next-chapter': { en: 'Ready for Your Next Chapter', es: 'Listos para Tu Próximo Capítulo' },
    'beyond-borders': { en: 'Business Beyond Borders', es: 'Negocios Más Allá de las Fronteras' },
  };

  const descTranslations: Record<string, { en: string; es: string }> = {
    'business-connection': {
      en: 'Introductions, shared ideas, and meaningful conversations with fellow business owners.',
      es: 'Presentaciones, ideas compartidas y conversaciones significativas con otros empresarios.',
    },
    'next-chapter': {
      en: 'Practical conversations for entrepreneurs ready to move their business forward.',
      es: 'Conversaciones prácticas para emprendedores listos para impulsar su negocio.',
    },
    'beyond-borders': {
      en: 'Explore doing business between the Dominican Republic and the United States.',
      es: 'Explora hacer negocios entre la República Dominicana y los Estados Unidos.',
    },
  };

  const category = categoryTranslations[initiative.category]?.[lang] || initiative.category;
  const tag = taglineTranslations[initiative.id]?.[lang] || tagline;
  const title = titleTranslations[initiative.id]?.[lang] || initiative.title;
  const desc = descTranslations[initiative.id]?.[lang] || initiative.description;

  const dateText =
    eventDateKey(initiative)
      ? new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: initiative.schedule!.timeZone }).format(new Date(initiative.schedule!.startsAt))
      : initiative.status === 'confirmed' && initiative.date
      ? initiative.date
      : lang === 'en'
      ? 'PROPOSED · DATE TO BE ANNOUNCED'
      : 'PROPUESTO · FECHA POR ANUNCIAR';

  const actionText =
    initiative.status === 'confirmed'
      ? lang === 'en'
        ? 'Request Registration'
        : 'Solicitar Registro'
      : lang === 'en'
      ? 'Express Your Interest'
      : 'Expresar Tu Interés';

  const footerText =
    lang === 'en'
      ? 'DUSACCOM · CONNECTIONS THAT COUNT'
      : 'DUSACCOM · CONEXIONES QUE CUENTAN';

  return (
    <article className="flex flex-col overflow-hidden rounded-[8px] border border-slate-200 bg-white">
      <div
        className={`relative flex h-56 flex-col justify-between overflow-hidden p-6 ${
          art === 'navy' ? 'bg-[#173b50] text-white' : art === 'red' ? 'bg-crimson text-white' : 'bg-[#ece9e4] text-navy'
        }`}
      >
        <span className="relative z-10 w-fit rounded-[8px] border border-current/35 px-2 py-1 text-xs tracking-widest uppercase">
          {category}
        </span>
        {art === 'light' ? (
          <TrendingUp className="absolute top-15 right-7 size-34 text-navy/70" strokeWidth={0.65} aria-hidden="true" />
        ) : (
          <span
            aria-hidden="true"
            className="absolute top-16 -right-16 size-60 rounded-full border border-white/20 before:absolute before:-inset-6 before:rounded-full before:border before:border-white/15 after:absolute after:-inset-12 after:rounded-full after:border after:border-white/10"
          />
        )}
        <p className="relative z-10 text-[27px] leading-8 font-medium tracking-[-.04em]">
          {tag[0]}
          <br />
          <span className={art === 'navy' ? 'text-red-200' : ''}>{tag[1]}</span>
        </p>
        <span className="relative z-10 text-xs tracking-widest">{footerText}</span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <span className="flex items-center gap-2 text-xs tracking-wider text-slate-600">
          <CalendarDays size={13} aria-hidden="true" />
          {dateText}
        </span>
        <h3 className="mt-4 mb-3 text-xl leading-7 font-semibold tracking-tight">{title}</h3>
        <p className="mb-5 text-sm leading-7 text-slate-600">{desc}</p>
        <Link
          href={`/?event=${initiative.id}#events`}
          className="text-link mt-auto w-full justify-between border-t border-slate-200 pt-3"
        >
          <span>{actionText}</span>
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export function ProgramList() {
  const { lang } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filterOptions = [
    { id: 'all', label: lang === 'en' ? 'All Initiatives' : 'Todas las Iniciativas', category: 'All' },
    { id: 'Networking', label: 'Networking', category: 'Networking' },
    { id: 'Workshop', label: lang === 'en' ? 'Workshops' : 'Talleres', category: 'Workshop' },
    { id: 'Cross-border', label: lang === 'en' ? 'Cross-Border' : 'Transfronterizo', category: 'Cross-border' },
  ];

  const visible = initiatives.filter(
    (event) =>
      (filter === 'all' || event.category === filter) &&
      `${event.title} ${event.description} ${event.category}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <>
      <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter initiatives">
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              aria-pressed={filter === opt.id}
              onClick={() => setFilter(opt.id)}
              className={`min-h-11 rounded-[8px] border px-4 text-xs font-semibold transition ${
                filter === opt.id ? 'border-navy bg-navy text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-navy'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <label className="relative w-full lg:max-w-65">
          <span className="sr-only">{lang === 'en' ? 'Search initiatives' : 'Buscar iniciativas'}</span>
          <Search size={16} className="absolute top-3.5 left-3 text-slate-500" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={lang === 'en' ? 'Search initiatives…' : 'Buscar iniciativas…'}
            className="form-field m-0! min-h-11! pl-10!"
          />
        </label>
      </div>

      <p className="mb-5 text-xs text-slate-600" role="status">
        {lang === 'en'
          ? `${visible.length} ${visible.length === 1 ? 'initiative' : 'initiatives'} found`
          : `${visible.length} ${visible.length === 1 ? 'iniciativa encontrada' : 'iniciativas encontradas'}`}
      </p>

      {visible.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((event) => (
            <InitiativeCard key={event.id} initiative={event} />
          ))}
        </div>
      ) : (
        <div className="rounded-[8px] border border-dashed border-slate-300 bg-white px-7 py-14 text-center">
          <Search className="mx-auto mb-5 text-slate-500" aria-hidden="true" />
          <h3 className="text-xl font-semibold">
            {lang === 'en'
              ? 'No initiatives match your search.'
              : 'No hay iniciativas que coincidan con tu búsqueda.'}
          </h3>
          <p className="mt-3 text-sm text-slate-600">
            {lang === 'en'
              ? 'Try another keyword or explore all initiatives.'
              : 'Prueba con otra palabra clave o explora todas las iniciativas.'}
          </p>
          <button
            className="text-link mt-4"
            onClick={() => {
              setSearch('');
              setFilter('all');
            }}
          >
            <span>{lang === 'en' ? 'Clear filters' : 'Limpiar filtros'}</span>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      <p className="mt-6 text-xs leading-6 text-slate-600">
        {lang === 'en'
          ? 'The initiatives shown are proposed concepts. Our team will confirm dates, venues, availability, and registration separately.'
          : 'Las iniciativas mostradas son conceptos propuestos. Nuestro equipo confirmará fechas, sedes, disponibilidad y registro por separado.'}
      </p>
    </>
  );
}

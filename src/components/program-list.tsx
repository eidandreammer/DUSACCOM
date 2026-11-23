'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, CalendarDays, TrendingUp, Search, X } from 'lucide-react';
import { initiatives, type Initiative } from '@/lib/content';
import { eventDateKey } from '@/lib/events';
import { useLanguage, LOCALE, type Lang } from '@/lib/language-context';

type ListCopy = {
  categories: Record<string, string>; taglines: Record<string, [string, string]>; titles: Record<string, string>; descriptions: Record<string, string>;
  proposedDate: string; requestRegistration: string; expressInterest: string; footer: string;
  all: string; workshops: string; filterAria: string; searchLabel: string; searchPlaceholder: string;
  found: (count: number) => string; noMatch: string; tryAnother: string; clear: string; disclaimer: string;
};

// Record<Lang, ListCopy> keeps all three languages in sync at compile time.
const COPY: Record<Lang, ListCopy> = {
  en: {
    categories: { Networking: 'Networking', Workshop: 'Workshop', 'Cross-border': 'Cross-Border' },
    taglines: { 'business-connection': ['Stronger connections.', 'Bigger possibilities.'], 'next-chapter': ['Small steps.', 'Big ambitions.'], 'beyond-borders': ['Two markets.', 'One conversation.'] },
    titles: { 'business-connection': 'The Business Connection', 'next-chapter': 'Ready for Your Next Chapter', 'beyond-borders': 'Business Beyond Borders' },
    descriptions: {
      'business-connection': 'Introductions, shared ideas, and meaningful conversations with fellow business owners.',
      'next-chapter': 'Practical conversations for entrepreneurs ready to move their business forward.',
      'beyond-borders': 'Explore doing business between the Dominican Republic and the United States.',
    },
    proposedDate: 'PROPOSED · DATE TO BE ANNOUNCED', requestRegistration: 'Request Registration', expressInterest: 'Express Your Interest', footer: 'DUSACCOM · CONNECTIONS THAT COUNT',
    all: 'All Initiatives', workshops: 'Workshops', filterAria: 'Filter initiatives', searchLabel: 'Search initiatives', searchPlaceholder: 'Search initiatives…',
    found: n => `${n} ${n === 1 ? 'initiative' : 'initiatives'} found`,
    noMatch: 'No initiatives match your search.', tryAnother: 'Try another keyword or explore all initiatives.', clear: 'Clear filters',
    disclaimer: 'The initiatives shown are proposed concepts. Our team will confirm dates, venues, availability, and registration separately.',
  },
  es: {
    categories: { Networking: 'Redes y Contactos', Workshop: 'Taller Práctico', 'Cross-border': 'Transfronterizo' },
    taglines: { 'business-connection': ['Conexiones más fuertes.', 'Mayores posibilidades.'], 'next-chapter': ['Pequeños pasos.', 'Grandes ambiciones.'], 'beyond-borders': ['Dos mercados.', 'Una conversación.'] },
    titles: { 'business-connection': 'La Conexión Empresarial', 'next-chapter': 'Listos para Tu Próximo Capítulo', 'beyond-borders': 'Negocios Más Allá de las Fronteras' },
    descriptions: {
      'business-connection': 'Presentaciones, ideas compartidas y conversaciones significativas con otros empresarios.',
      'next-chapter': 'Conversaciones prácticas para emprendedores listos para impulsar su negocio.',
      'beyond-borders': 'Explora hacer negocios entre la República Dominicana y los Estados Unidos.',
    },
    proposedDate: 'PROPUESTO · FECHA POR ANUNCIAR', requestRegistration: 'Solicitar Registro', expressInterest: 'Expresar Tu Interés', footer: 'DUSACCOM · CONEXIONES QUE CUENTAN',
    all: 'Todas las Iniciativas', workshops: 'Talleres', filterAria: 'Filtrar iniciativas', searchLabel: 'Buscar iniciativas', searchPlaceholder: 'Buscar iniciativas…',
    found: n => `${n} ${n === 1 ? 'iniciativa encontrada' : 'iniciativas encontradas'}`,
    noMatch: 'No hay iniciativas que coincidan con tu búsqueda.', tryAnother: 'Prueba con otra palabra clave o explora todas las iniciativas.', clear: 'Limpiar filtros',
    disclaimer: 'Las iniciativas mostradas son conceptos propuestos. Nuestro equipo confirmará fechas, sedes, disponibilidad y registro por separado.',
  },
  pt: {
    categories: { Networking: 'Networking', Workshop: 'Oficina Prática', 'Cross-border': 'Sem Fronteiras' },
    taglines: { 'business-connection': ['Conexões mais fortes.', 'Mais possibilidades.'], 'next-chapter': ['Pequenos passos.', 'Grandes ambições.'], 'beyond-borders': ['Dois mercados.', 'Uma conversa.'] },
    titles: { 'business-connection': 'A Conexão Empresarial', 'next-chapter': 'Prontos para o Seu Próximo Capítulo', 'beyond-borders': 'Negócios Além das Fronteiras' },
    descriptions: {
      'business-connection': 'Apresentações, ideias compartilhadas e conversas significativas com outros empresários.',
      'next-chapter': 'Conversas práticas para empreendedores prontos para levar o negócio adiante.',
      'beyond-borders': 'Explore como fazer negócios entre a República Dominicana e os Estados Unidos.',
    },
    proposedDate: 'PROPOSTO · DATA A SER ANUNCIADA', requestRegistration: 'Solicitar Inscrição', expressInterest: 'Manifeste Seu Interesse', footer: 'DUSACCOM · CONEXÕES QUE CONTAM',
    all: 'Todas as Iniciativas', workshops: 'Oficinas', filterAria: 'Filtrar iniciativas', searchLabel: 'Buscar iniciativas', searchPlaceholder: 'Buscar iniciativas…',
    found: n => `${n} ${n === 1 ? 'iniciativa encontrada' : 'iniciativas encontradas'}`,
    noMatch: 'Nenhuma iniciativa corresponde à sua busca.', tryAnother: 'Tente outra palavra-chave ou veja todas as iniciativas.', clear: 'Limpar filtros',
    disclaimer: 'As iniciativas exibidas são conceitos propostos. Nossa equipe vai confirmar datas, locais, disponibilidade e inscrição separadamente.',
  },
};

export function InitiativeCard({ initiative }: { initiative: Initiative }) {
  const { lang } = useLanguage();
  const { art, tagline } = initiative;

  const c = COPY[lang];
  const category = c.categories[initiative.category] || initiative.category;
  const tag = c.taglines[initiative.id] || tagline;
  const title = c.titles[initiative.id] || initiative.title;
  const desc = c.descriptions[initiative.id] || initiative.description;

  const dateText =
    eventDateKey(initiative)
      ? new Intl.DateTimeFormat(LOCALE[lang], { dateStyle: 'medium', timeStyle: 'short', timeZone: initiative.schedule!.timeZone }).format(new Date(initiative.schedule!.startsAt))
      : initiative.status === 'confirmed' && initiative.date
      ? initiative.date
      : c.proposedDate;

  const actionText = initiative.status === 'confirmed' ? c.requestRegistration : c.expressInterest;
  const footerText = c.footer;

  return (
    <article className="flex flex-col overflow-hidden rounded-[8px] border border-slate-200 bg-white">
      <div
        className={`relative flex h-56 flex-col justify-between overflow-hidden p-6 ${
          art === 'navy' ? 'bg-[#032a63] text-white' : art === 'red' ? 'bg-crimson text-white' : 'bg-[#ece9e4] text-navy'
        }`}
      >
        <span className="relative z-10 w-fit rounded-[8px] border border-current/35 px-2 py-1 font-mid text-xs tracking-widest uppercase">
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
        <p className="relative z-10 font-mid text-[27px] leading-8 font-medium tracking-[-.03em]">
          {tag[0]}
          <br />
          <span className={art === 'navy' ? 'text-red-200' : ''}>{tag[1]}</span>
        </p>
        <span className="relative z-10 font-mid text-xs tracking-widest">{footerText}</span>
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

  const c = COPY[lang];
  const filterOptions = [
    { id: 'all', label: c.all, category: 'All' },
    { id: 'Networking', label: c.categories.Networking, category: 'Networking' },
    { id: 'Workshop', label: c.workshops, category: 'Workshop' },
    { id: 'Cross-border', label: c.categories['Cross-border'], category: 'Cross-border' },
  ];

  const visible = initiatives.filter(
    (event) =>
      (filter === 'all' || event.category === filter) &&
      `${event.title} ${event.description} ${event.category}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <>
      <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row">
        <div className="flex flex-wrap gap-2" role="group" aria-label={c.filterAria}>
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
          <span className="sr-only">{c.searchLabel}</span>
          <Search size={16} className="absolute top-3.5 left-3 text-slate-500" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={c.searchPlaceholder}
            className="form-field m-0! min-h-11! pl-10!"
          />
        </label>
      </div>

      <p className="mb-5 text-xs text-slate-600" role="status">
        {c.found(visible.length)}
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
            {c.noMatch}
          </h3>
          <p className="mt-3 text-sm text-slate-600">
            {c.tryAnother}
          </p>
          <button
            className="text-link mt-4"
            onClick={() => {
              setSearch('');
              setFilter('all');
            }}
          >
            <span>{c.clear}</span>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      <p className="mt-6 text-xs leading-6 text-slate-600">
        {c.disclaimer}
      </p>
    </>
  );
}

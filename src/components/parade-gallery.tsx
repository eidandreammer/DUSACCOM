'use client';
import Image from 'next/image';
import { useRef } from 'react';
import type { Lang } from '@/lib/translations';
import gallery from '@/lib/gallery-images.json';
import { useParallax } from '@/lib/use-parallax';
import styles from '@/app/home.module.css';

const ALTS: Record<string, Record<Lang, string>> = {
  'paterson-dominican-parade-community-leaders-sashes': { en: 'Community leaders with sashes and carnival queens at the Paterson Dominican Parade', es: 'Líderes comunitarios con bandas y reinas del carnaval en el Desfile Dominicano de Paterson', pt: 'Líderes comunitários com faixas e rainhas do carnaval no Desfile Dominicano de Paterson' },
  'paterson-dominican-parade-carnival-queen-headdress': { en: 'Carnival queen in a red feathered headdress at the Paterson Dominican Parade', es: 'Reina del carnaval con tocado de plumas rojas en el Desfile Dominicano de Paterson', pt: 'Rainha do carnaval com um cocar de penas vermelhas no Desfile Dominicano de Paterson' },
  'paterson-dominican-parade-dominican-flag-white-dress': { en: 'Woman in a white dress waving the Dominican flag at the Paterson Dominican Parade', es: 'Mujer con vestido blanco ondeando la bandera dominicana en el Desfile Dominicano de Paterson', pt: 'Mulher de vestido branco agitando a bandeira dominicana no Desfile Dominicano de Paterson' },
  'paterson-dominican-parade-float-street-procession': { en: 'Parade float and marchers moving down the street at the Paterson Dominican Parade', es: 'Carroza y participantes desfilando por la calle en el Desfile Dominicano de Paterson', pt: 'Carro alegórico e participantes desfilando pela rua no Desfile Dominicano de Paterson' },
  'paterson-dominican-parade-float-ventures-group': { en: 'Ventures Group & Associates float with Dominican flags at the Paterson Dominican Parade', es: 'Carroza de Ventures Group & Associates con banderas dominicanas en el Desfile Dominicano de Paterson', pt: 'Carro alegórico da Ventures Group & Associates com bandeiras dominicanas no Desfile Dominicano de Paterson' },
};

function Tile({ name, width, height, className, speed, lang }: { name: string; width: number; height: number; className: string; speed: number; lang: Lang }) {
  const frame = useRef<HTMLElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  useParallax(frame, layer, speed);
  return <figure ref={frame} className={`${styles.galleryTile} ${className}`}>
    <div ref={layer} className={styles.galleryLayer}>
      <Image src={`/assets/${name}.jpg`} alt={ALTS[name]?.[lang] ?? ''} width={width} height={height} sizes="(max-width: 760px) 100vw, 50vw" />
    </div>
  </figure>;
}

const LAYOUT = [styles.galleryWide, styles.galleryTall, styles.galleryPortrait, styles.gallerySquare, styles.galleryWideLow];
const SPEEDS = [0.06, -0.08, 0.1, -0.05, 0.07];

export function ParadeGallery({ lang }: { lang: Lang }) {
  return <div className={styles.gallery}>
    {gallery.map((item, index) => <Tile key={item.name} {...item} lang={lang} className={LAYOUT[index]} speed={SPEEDS[index]} />)}
  </div>;
}

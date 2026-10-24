'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';
import styles from './home.module.css';

export default function Home() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const copy = t.homeOverview;

  return (
    <div className={styles.home}>
      {/* Keep this hook: the transparent header tracks the hero's visibility. */}
      <section className={`home-hero ${styles.hero}`} aria-labelledby="about-title">
        <Image
          src="/assets/new-york.jpg"
          alt=""
          fill
          sizes="100vw"
          priority
          className={styles.heroImage}
        />
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={`${styles.container} ${styles.heroLayout}`}>
          <div className={styles.heroCopy}>
            <p className={styles.label}>{copy.aboutEyebrow}</p>
            <h1 id="about-title" className={styles.heroTitle}>{copy.aboutTitle}</h1>
            <p className={styles.statement}>{copy.aboutStatement}</p>
            <p className={`${styles.body} ${styles.heroDescription}`}>{t.aboutPage.description}</p>
            <Link href="#mission" className={`${styles.link} ${styles.heroLink}`}>
              {copy.discoverPurpose}
              <ArrowDown size={18} aria-hidden="true" />
            </Link>
          </div>
          <p className={styles.heroFootnote}>{copy.aboutFootnote}</p>
        </div>
      </section>

      <section id="mission" className={styles.purpose} aria-labelledby="purpose-title">
        <div className={styles.container}>
          <div className={styles.sectionIntro}>
            <div>
              <p className={`${styles.label} ${styles.accent}`}>{copy.purposeEyebrow}</p>
              <h2 id="purpose-title" className={styles.sectionTitle}>{copy.purposeTitle}</h2>
            </div>
            <p className={`${styles.body} ${styles.purposeIntro}`}>{t.aboutPage.purposeDesc}</p>
          </div>
          <div className={styles.purposeColumns}>
            <article className={styles.purposeIdea}>
              <h3 className={styles.ideaTitle}>{t.aboutPage.missionTitle}</h3>
              <p className={styles.body}>{t.aboutPage.missionText}</p>
            </article>
            <article className={styles.purposeIdea}>
              <h3 className={styles.ideaTitle}>{t.aboutPage.visionTitle}</h3>
              <p className={styles.body}>{t.aboutPage.visionText}</p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.involvement} aria-label={copy.getInvolved}>
        <div className={`${styles.container} ${styles.involvementColumns}`}>
          <article className={styles.path} aria-labelledby="membership-title">
            <p className={styles.label}>{copy.membershipEyebrow}</p>
            <h2 id="membership-title" className={styles.pathTitle}>{copy.membershipTitle}</h2>
            <p className={styles.body}>{copy.membershipDescription}</p>
            <Link href="/membership" className={styles.primaryAction}>
              {t.nav.becomeMember}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </article>
          <article className={styles.path} aria-labelledby="registration-title">
            <p className={styles.label}>{copy.registrationEyebrow}</p>
            <h2 id="registration-title" className={styles.pathTitle}>{copy.registrationTitle}</h2>
            <p className={styles.body}>{copy.registrationDescription}</p>
            <Link href="/membership#apply" className={styles.secondaryAction}>
              {copy.registrationButton}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </article>
        </div>
      </section>

      <section className={styles.training} aria-labelledby="training-title">
        <div className={styles.container}>
          <div className={styles.trainingIntro}>
            <div className={styles.trainingCopy}>
              <p className={`${styles.label} ${styles.accent}`}>{copy.trainingEyebrow}</p>
              <h2 id="training-title" className={styles.sectionTitle}>{copy.trainingTitle}</h2>
              <p className={styles.body}>{copy.trainingDescription}</p>
            </div>
            <Link href="/infotep" className={`${styles.link} ${styles.trainingLink}`}>
              {copy.trainingButton}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.trainingAreas}>
            {copy.trainingAreas.map((area) => (
              <article key={area.title} className={styles.trainingArea}>
                <h3 className={styles.trainingAreaTitle}>{area.title}</h3>
                <p className={styles.body}>{area.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

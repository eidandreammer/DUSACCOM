'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { InquiryForm } from '@/components/inquiry-form';
import { MembershipCards } from '@/components/ui';
import { EventCalendar } from '@/components/event-calendar';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';
import { site } from '@/lib/site';
import styles from './home.module.css';

export default function Home() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const copy = t.homeOverview;
  const [selectedTier, setSelectedTier] = useState('');

  useEffect(() => {
    const tier = new URLSearchParams(window.location.search).get('tier');
    if (tier && translations.en.membershipTiers.some(option => option.id === tier)) setSelectedTier(tier);
  }, []);

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
            <h1 id="about-title" className={styles.heroTitle}>
              <span className={styles.heroBrand} aria-label="DUSACCOM"><span className={styles.brandBlue}>DUS</span><span className={styles.brandWhite}>AC</span><span className={styles.brandRed}>COM</span></span>
            </h1>
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

      <section id="about" className={styles.about} aria-labelledby="about-section-title">
        <div className={`${styles.container} ${styles.sectionIntro}`}>
          <div>
            <p className={`${styles.label} ${styles.accent}`}>{copy.aboutTitle}</p>
            <h2 id="about-section-title" className={styles.sectionTitle}>{copy.aboutSectionTitle}</h2>
          </div>
          <div>
            <p className={styles.body}>{t.aboutPage.purposeDesc}</p>
            <Link href="#mission" className={`${styles.link} ${styles.aboutLink}`}>
              {copy.purposeTitle}<ArrowDown size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section id="mission" className={styles.purpose} aria-labelledby="purpose-title">
        <div className={styles.container}>
          <div className={styles.sectionIntro}>
            <div>
              <p className={`${styles.label} ${styles.accent}`}>{copy.purposeEyebrow}</p>
              <h2 id="purpose-title" className={styles.sectionTitle}>{copy.purposeTitle}</h2>
            </div>
            <p className={`${styles.body} ${styles.purposeIntro}`}>{copy.missionIntroduction}</p>
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

      <section id="membership" className={styles.involvement} aria-labelledby="membership-title">
        <div className={styles.container}>
          <div className={styles.membershipIntro}>
            <div>
              <p className={styles.label}>{copy.membershipEyebrow}</p>
              <h2 id="membership-title" className={styles.pathTitle}>{copy.membershipTitle}</h2>
              <p className={styles.body}>{copy.membershipDescription}</p>
            </div>
            <Link href="#register" className={styles.secondaryAction}>
              {copy.registrationButton}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.membershipCards}>
            <MembershipCards registrationHref="#register-form" onSelect={setSelectedTier} />
          </div>
          <p className={styles.membershipDisclaimer}>{t.home.membershipSec.disclaimer}</p>
        </div>
      </section>

      <section id="register" className={styles.register} aria-labelledby="registration-title">
        <div className={styles.container}>
          <div className={styles.sectionIntro}>
            <div>
              <p className={`${styles.label} ${styles.accent}`}>{copy.registrationEyebrow}</p>
              <h2 id="registration-title" className={styles.sectionTitle}>{copy.registrationTitle}</h2>
            </div>
            <div>
              <p className={styles.body}>{copy.registrationDescription}</p>
              <Link href="#register-form" className={`${styles.link} ${styles.aboutLink}`}>
                {copy.registrationFormButton}<ArrowDown size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <ol className={styles.registrationSteps}>
            {t.membershipPage.steps.map((step, index) => (
              <li key={step.title}>
                <span className={styles.stepNumber}>0{index + 1} /</span>
                <h3 className={styles.ideaTitle}>{step.title}</h3>
                <p className={styles.body}>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="infotep" className={styles.training} aria-labelledby="training-title">
        <div className={styles.container}>
          <div className={styles.trainingIntro}>
            <div className={styles.trainingCopy}>
              <p className={`${styles.label} ${styles.accent}`}>{copy.trainingEyebrow}</p>
              <h2 id="training-title" className={styles.sectionTitle}>{copy.trainingTitle}</h2>
              <p className={styles.body}>{copy.trainingDescription}</p>
            </div>
            <Image src="/imgs/INFOTEP logos's.png" alt="INFOTEP" width={800} height={800} sizes="(max-width: 760px) 112px, 180px" className={styles.infotepLogo} />
          </div>
          <div className={styles.trainingAreas}>
            {copy.trainingAreas.map((area) => (
              <article key={area.title} className={styles.trainingArea}>
                <h3 className={styles.trainingAreaTitle}>{area.title}</h3>
                <p className={styles.body}>{area.description}</p>
              </article>
            ))}
          </div>
          <div className={styles.trainingNext}>
            <p className={styles.body}>{copy.trainingNextStep}</p>
            <a href={`mailto:${site.email}?subject=${encodeURIComponent(copy.trainingEmailSubject)}`} className={`${styles.link} ${styles.trainingLink}`}>
              {copy.trainingInquiryButton}<ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <EventCalendar />

      <section id="register-form" className={styles.registrationForm} aria-labelledby="registration-form-title">
        <div className={`${styles.container} ${styles.formLayout}`}>
          <div>
            <p className={`${styles.label} ${styles.accent}`}>{copy.registrationFormEyebrow}</p>
            <h2 id="registration-form-title" className={styles.sectionTitle}>{t.membershipPage.applyTitle}</h2>
            <p className={`${styles.body} ${styles.formDescription}`}>{t.membershipPage.applyDesc}</p>
            <div className={styles.formNote}>
              <h3 className={styles.ideaTitle}>{t.membershipPage.applyBoxTitle}</h3>
              <p className={styles.body}>{t.membershipPage.applyBoxDesc}</p>
            </div>
            <Link href="#membership" className={`${styles.link} ${styles.aboutLink}`}>{t.nav.viewTiers}</Link>
          </div>
          <InquiryForm kind="membership" initialInterest={selectedTier} onInterestChange={setSelectedTier} />
        </div>
      </section>
    </div>
  );
}

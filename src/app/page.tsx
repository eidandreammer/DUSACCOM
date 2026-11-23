'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { InquiryForm } from '@/components/inquiry-form';
import { MembershipCards } from '@/components/ui';
import { HeroCarousel } from '@/components/hero-carousel';
import { ParallaxVideoBand } from '@/components/parallax-video-band';
import { ParadeGallery } from '@/components/parade-gallery';
import dynamic from 'next/dynamic';

// WebGL flag table loads on the client only.
const FlagTable = dynamic(() => import('@/components/flag-table'), { ssr: false });
import { EventCalendar } from '@/components/event-calendar';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';
import { site } from '@/lib/site';
import { VisitUs } from '@/components/visit-us';
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
      {/* Keep this hook: the header tracks the hero's visibility. */}
      <HeroCarousel>
        <div className={`${styles.container} ${styles.heroLayout}`}>
          <header className={`surface ${styles.heroCopy}`}>
            <p className={styles.label}>{copy.aboutEyebrow}</p>
            <h1 id="about-title" className={styles.heroTitle}>
              <span className={styles.brandBlue}>Dominican</span> <span className={styles.brandWhite}>U.S.A</span>{' '}
              <span className={styles.heroTitleLine}><span className={styles.brandRed}>Chamber of Commerce</span></span>
            </h1>
            <p className={styles.statement}>{copy.aboutStatement}</p>
            <p className={`${styles.body} ${styles.heroDescription}`}>{t.aboutPage.description}</p>
          </header>
          <div className={styles.heroFooter}>
            <p className={styles.heroFootnote}>{copy.aboutFootnote}</p>
            <nav className={styles.heroActions} aria-label={lang === 'en' ? 'Explore DUSACCOM' : 'Explora DUSACCOM'}>
              <a href="#membership-application" className={`${styles.primaryAction} hover-scale`}>
                {copy.startMembership}<ArrowRight size={18} aria-hidden="true" />
              </a>
              <a href="#mission" className={`${styles.link} ${styles.heroLink}`}>
                {copy.discoverPurpose}<ArrowDown size={18} aria-hidden="true" />
              </a>
            </nav>
          </div>
        </div>
      </HeroCarousel>

      <section id="about" className={styles.about} aria-labelledby="about-section-title">
        <div className={`${styles.container} ${styles.sectionIntro}`}>
          <div>
            <p className={`${styles.label} ${styles.accent}`}>{copy.aboutTitle}</p>
            <h2 id="about-section-title" className={styles.sectionTitle}>{copy.aboutSectionTitle}</h2>
          </div>
          <div>
            <p className={styles.body}>{t.aboutPage.purposeDesc}</p>
            <a href="#mission" className={`${styles.link} ${styles.aboutLink}`}>
              {copy.purposeTitle}<ArrowDown size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section id="president" className={styles.president} aria-labelledby="president-title">
        <div className={`${styles.container} ${styles.presidentGrid}`}>
          <figure className={styles.presidentPortrait}>
            <Image src="/assets/heidy-hernandez-president-dominican-usa-chamber-of-commerce.jpg"
              alt={copy.presidentAlt} width={1200} height={1607} sizes="(max-width: 900px) 100vw, 460px" />
          </figure>
          <div className={styles.presidentCopy}>
            <p className={`${styles.label} ${styles.accent}`}>{copy.presidentEyebrow}</p>
            <h2 id="president-title" className={styles.sectionTitle}>Heidy Hernández</h2>
            <p className={styles.presidentRole}>{copy.presidentRole}</p>
            <p className={styles.body}>{copy.presidentBio}</p>
            <a href="/contact" className={`${styles.link} ${styles.aboutLink}`}>
              {copy.presidentCta}<ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <ParallaxVideoBand id="heritage" video="juan-pablo-duarte-statue-dominican-founding-father"
        videoTitle={t.common.heritageVideoTitle}
        eyebrow={copy.heritageEyebrow} title={copy.heritageTitle} caption={copy.heritageCaption} focus="center 8%">
        <p className={styles.videoBandText}>{copy.heritageText}</p>
      </ParallaxVideoBand>

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

      <section id="community" className={styles.community} aria-labelledby="community-title">
        <div className={styles.container}>
          <div className={styles.sectionIntro}>
            <div>
              <p className={`${styles.label} ${styles.accent}`}>{copy.communityEyebrow}</p>
              <h2 id="community-title" className={styles.sectionTitle}>{copy.communityTitle}</h2>
            </div>
            <p className={`${styles.body} ${styles.purposeIntro}`}>{copy.communityText}</p>
          </div>
          <ParadeGallery lang={lang} />
          <p className={styles.galleryCaption}>{copy.communityCaption}</p>
        </div>
      </section>

      <section id="every-flag" className={styles.flags} aria-labelledby="flags-title">
        <div className={`${styles.container} ${styles.flagsIntro}`}>
          <p className={`${styles.label} ${styles.accent}`}>{copy.flagsEyebrow}</p>
          <h2 id="flags-title" className={styles.sectionTitle}>{copy.flagsTitle}</h2>
          <p className={`${styles.body} ${styles.purposeIntro}`}>{copy.flagsText}</p>
        </div>
        <div className={styles.flagsStage}>
          <FlagTable label={copy.flagsLabel} lang={lang} />
        </div>
        <p className={`${styles.container} ${styles.flagsSeat}`}>
          {copy.flagsSeatText} <a href="#register-form" className={styles.flagsSeatLink}>{copy.flagsSeatLink}</a>
        </p>
      </section>

      <section id="membership" className={styles.involvement} aria-labelledby="membership-title">
        <div className={styles.container}>
          <div className={styles.membershipIntro}>
            <div>
              <p className={styles.label}>{copy.membershipEyebrow}</p>
              <h2 id="membership-title" className={styles.pathTitle}>{copy.membershipTitle}</h2>
              <p className={styles.body}>{copy.membershipDescription}</p>
            </div>
          </div>
          <div className={styles.membershipCards}>
            <MembershipCards registrationHref="#register-form" onSelect={setSelectedTier} />
          </div>
          <div className={styles.membershipFooter}>
            <p className={styles.membershipDisclaimer}>{t.home.membershipSec.disclaimer}</p>
            <a href="#register-form" className={`${styles.secondaryAction} ${styles.membershipRegistration} hover-scale`}>
              {copy.registrationButton}
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
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
              <a href="#register-form" className={`${styles.link} ${styles.aboutLink}`}>
                {copy.registrationFormButton}<ArrowDown size={18} aria-hidden="true" />
              </a>
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

      <ParallaxVideoBand id="both-sides" video="george-washington-bridge-night-lights-timelapse"
        videoTitle={t.common.bridgeVideoTitle}
        eyebrow={copy.bridgeEyebrow} title={copy.bridgeTitle}>
        <p className={styles.videoBandText}>{copy.bridgeText}</p>
        <a href="#register-form" className={`${styles.primaryAction} ${styles.videoBandAction} hover-scale`}>
          {copy.startMembership}<ArrowRight size={18} aria-hidden="true" />
        </a>
      </ParallaxVideoBand>

      <section id="infotep" className={styles.training} aria-labelledby="training-title">
        <div className={styles.container}>
          <div className={styles.trainingIntro}>
            <div className={styles.trainingCopy}>
              <p className={`${styles.label} ${styles.accent}`}>{copy.trainingEyebrow}</p>
              <h2 id="training-title" className={styles.sectionTitle}>{copy.trainingTitle}</h2>
              <p className={styles.body}>{copy.trainingDescription}</p>
            </div>
            <Image src="/imgs/INFOTEP logos's.png" alt="INFOTEP" width={2248} height={2048} sizes="(max-width: 540px) 123.2px, (max-width: 760px) 156.8px, 252px" className={styles.infotepLogo} />
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
            <div className={`surface ${styles.formNote}`}>
              <h3 className={styles.ideaTitle}>{t.membershipPage.applyBoxTitle}</h3>
              <p className={styles.body}>{t.membershipPage.applyBoxDesc}</p>
            </div>
            <a href="#register-form" className={`${styles.link} ${styles.aboutLink}`}>{t.nav.viewTiers}</a>
          </div>
          <InquiryForm kind="membership" initialInterest={selectedTier} onInterestChange={setSelectedTier} />
        </div>
      </section>

      <VisitUs tone="mist" />
    </div>
  );
}

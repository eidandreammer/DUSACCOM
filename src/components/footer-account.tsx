'use client';

import { useId } from 'react';
import { useLanguage } from '@/lib/language-context';
import { accountCopy } from '@/lib/account-copy';
import { accountSettingsCopy } from '@/lib/account-settings-copy';
import { accountHref } from '@/lib/account-navigation';

export function FooterAccount() {
  const { lang } = useLanguage();
  const t = accountCopy[lang];
  const settings = accountSettingsCopy[lang];
  const id = useId();
  return <nav className="footer-links sm:col-span-2 lg:col-span-1" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>{t.account}</h2>
    <a href={accountHref({ settings: 'profile' })}>{settings.title}</a>
    <a href={accountHref()}>{t.signIn}</a>
  </nav>;
}

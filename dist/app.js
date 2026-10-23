(() => {
  'use strict';
  const config = window.DUSACCOM_CONFIG || {};
  const { validationMessage, emailDraft, escapeHTML } = window.DusaccomForms;
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const dialog = $('#content-dialog');
  const content = $('#dialog-content');
  const cookieBanner = $('#cookie-banner');
  let returnFocus = null;
  let toastTimer;
  let analyticsAllowed = false;
  let analyticsLoaded = false;
  const getPreference = () => { try { return localStorage.getItem('dusaccom-consent'); } catch { return null; } };
  const track = (event, properties = {}) => {
    if (!analyticsAllowed) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...properties });
    if (typeof config.onAnalyticsEvent === 'function') {
      try { config.onAnalyticsEvent(event, properties); } catch { /* A tracking error must not interrupt the visitor. */ }
    }
  };
  window.dusaccomTrack = track;
  function enableAnalytics() {
    analyticsAllowed = true;
    if (analyticsLoaded || !/^G-[A-Z0-9]+$/.test(config.analyticsId || '')) return;
    analyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', config.analyticsId, { anonymize_ip: true, send_page_view: true });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.analyticsId)}`;
    document.head.append(script);
  }
  function saveConsent(value) {
    const wasAllowed = analyticsAllowed;
    try { localStorage.setItem('dusaccom-consent', value); } catch { /* Choices still apply for this visit. */ }
    cookieBanner.hidden = true;
    analyticsAllowed = value === 'all';
    if (analyticsAllowed) {
      enableAnalytics();
      if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied' });
    }
    if (wasAllowed && !analyticsAllowed) {
      if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied' });
      if (config.analyticsId) window[`ga-disable-${config.analyticsId}`] = true;
      document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        if (/^_ga|^_gid|^_gat/.test(name)) {
          const hostname = location.hostname;
          [`${name}=; Max-Age=0; path=/`, `${name}=; Max-Age=0; path=/; domain=${hostname}`, `${name}=; Max-Age=0; path=/; domain=.${hostname}`].forEach(value => { document.cookie = value; });
        }
      });
    }
    if (analyticsAllowed && config.analyticsId) window[`ga-disable-${config.analyticsId}`] = false;
  }
  const preference = getPreference();
  if (preference === 'all') enableAnalytics();
  if (!['all', 'essential'].includes(preference)) cookieBanner.hidden = false;
  $('#accept-cookies').addEventListener('click', () => saveConsent('all'));
  $('#reject-cookies').addEventListener('click', () => saveConsent('essential'));
  $('#cookie-settings').addEventListener('click', () => { cookieBanner.hidden = false; $('#reject-cookies').focus(); });
  function toast(message) {
    const element = $('.toast');
    clearTimeout(toastTimer);
    element.textContent = message;
    element.hidden = false;
    toastTimer = setTimeout(() => { element.hidden = true; }, 4500);
  }
  const menuToggle = $('.menu-toggle');
  const mobileNav = $('#mobile-nav');
  function closeMenu() { mobileNav.hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Open navigation'); menuToggle.innerHTML = '<svg class="icon"><use href="#menu"/></svg>'; }
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    if (!open) { closeMenu(); return; }
    mobileNav.hidden = false;
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close navigation');
    menuToggle.innerHTML = '<svg class="icon"><use href="#close"/></svg>';
  });
  $$('#mobile-nav a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuToggle.focus(); } });
  window.matchMedia('(min-width:1001px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  function openDialog(html) {
    if (!dialog.open) returnFocus = document.activeElement;
    closeMenu();
    content.innerHTML = html;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = 'hidden';
    $('.dialog-close').focus();
    $$('.inquiry-form', content).forEach(bindForm);
  }
  function closeDialog() { dialog.close(); }
  $('.dialog-close').addEventListener('click', closeDialog);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog();
  });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; if (returnFocus?.isConnected) returnFocus.focus(); });
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#${name}"/></svg>`;
  const intro = (label, title) => `<div class="eyebrow"><span class="red-line"></span>${label}</div><h2 id="dialog-title">${title}</h2>`;
  const programContent = {
    'Business development': { title: 'Build with confidence.', text: 'Every business has a next chapter. Start a conversation with our team about your goals, your challenges, and the resources that could help you move forward.', items: ['Business planning and growth conversations', 'Introductions to relevant business resources', 'Entrepreneur learning and development opportunities'] },
    'Networking & connections': { title: 'Meet your next connection.', text: 'Good business starts with good relationships. Connect with entrepreneurs and professionals who understand your ambition and share your commitment to community.', items: ['Business-to-business introductions', 'Community networking opportunities', 'Conversations with fellow business owners'] },
    'Trade & market access': { title: 'Opportunity crosses borders.', text: 'Thinking about your next market? Talk to a community that connects Dominican and American business perspectives and can help you explore the next step.', items: ['Cross-border business conversations', 'Introductions within the Dominican–American community', 'Resources for exploring new market opportunities'] },
    'Community & advocacy': { title: 'Progress with a purpose.', text: 'A stronger business community creates more possibilities for everyone. Share your ideas for supporting local entrepreneurs and building lasting connections.', items: ['Local business community initiatives', 'Entrepreneur engagement opportunities', 'Collaborations that support shared growth'] }
  };
  document.addEventListener('click', event => {
    const program = event.target.closest('[data-program]');
    const membership = event.target.closest('[data-membership]');
    const eventLink = event.target.closest('[data-event]');
    const legal = event.target.closest('[data-legal]');
    const article = event.target.closest('[data-article]');
    if (program) {
      const name = program.dataset.program;
      const data = programContent[name];
      openDialog(`${intro('PROGRAMS & SERVICES', data.title)}<p>${data.text}</p><ul>${data.items.map(item => `<li>${item}</li>`).join('')}</ul><p class="dialog-notice">Program availability varies. Our team can share current options and help you find the right fit.</p><button class="button" data-inquire="${escapeHTML(name)}">Talk to our team ${icon('arrow')}</button>`);
      track('program_view', { program: name });
    }
    if (membership) { showInquiry('Membership inquiry', `${membership.dataset.membership} membership`, 'Find your place in the Chamber.', `Interested in ${membership.dataset.membership.toLowerCase()} membership? Introduce yourself and we’ll help you explore current membership options, benefits, and dues.`); track('membership_inquiry_start', { tier: membership.dataset.membership }); }
    if (eventLink) { showInquiry('Events & programs', eventLink.dataset.event, 'Be part of the conversation.', `Let our team know you’re interested in ${eventLink.dataset.event}. Dates and registration are not yet confirmed. This is an expression of interest, not a confirmed event registration.`); track('event_interest_start', { program: eventLink.dataset.event }); }
    const inquire = event.target.closest('[data-inquire]');
    if (inquire) showInquiry(inquire.dataset.inquire, inquire.dataset.inquire, 'Let’s explore what’s next.', 'Tell our team a little about your business and the support you’re looking for.');
    if (legal) {
      event.preventDefault();
      if (dialog.open && event.target.closest('form')) { window.open(`/${legal.dataset.legal}/`, '_blank', 'noopener'); return; }
      openDialog(`${intro('DUSACCOM · WEBSITE POLICIES', policies[legal.dataset.legal].title)}${policies[legal.dataset.legal].html}`);
    }
    if (article) { const item = articles[article.dataset.article]; openDialog(`${intro(item.category, item.title)}${item.html}`); track('insight_view', { article: article.dataset.article }); }
    if (event.target.closest('[data-open="mission"]')) openDialog(`${intro('ABOUT DUSACCOM', 'Shared roots. Shared possibilities.')}<h3>Our mission</h3><p>To empower and connect the Dominican and American business community through meaningful relationships, business development opportunities, and community engagement.</p><h3>Our vision</h3><p>A thriving business community where Dominican and American enterprises can connect, collaborate, and grow across borders.</p><h3>A bridge between two nations</h3><p>As a nonprofit organization, DUSACCOM brings entrepreneurs, professionals, and business leaders together around a common ambition: a stronger future for our businesses and our communities.</p><a class="button" href="#contact" data-close-link>Start a conversation ${icon('arrow')}</a>`);
    if (event.target.closest('[data-close-link]')) closeDialog();
  });
  let formCounter = 0;
  function showInquiry(interest, context, title, description) {
    const prefix = `inquiry-${++formCounter}`;
    openDialog(`${intro('LET’S CONNECT', title)}<p>${escapeHTML(description)}</p><form class="inquiry-form dialog-form" novalidate data-context="${escapeHTML(context)}"><div class="form-row"><label>Full name <span aria-hidden="true">*</span><input name="name" autocomplete="name" required minlength="2" maxlength="100" placeholder="Your full name" aria-describedby="${prefix}-name-error"><span class="field-error" id="${prefix}-name-error"></span></label><label>Email address <span aria-hidden="true">*</span><input type="email" name="email" autocomplete="email" required maxlength="254" placeholder="you@company.com" aria-describedby="${prefix}-email-error"><span class="field-error" id="${prefix}-email-error"></span></label></div><label>Company / organization<input name="company" autocomplete="organization" maxlength="150" placeholder="Your business name"></label><input type="hidden" name="interest" value="${escapeHTML(interest)}"><label>Your message <span aria-hidden="true">*</span><textarea name="message" rows="3" required minlength="10" maxlength="3000" aria-describedby="${prefix}-message-error">${escapeHTML(`I'd like to learn more about ${context}.`)}</textarea><span class="field-error" id="${prefix}-message-error"></span></label><label class="checkbox-label"><input type="checkbox" name="consent" required aria-describedby="${prefix}-consent-error"><span>I agree to the <a href="/privacy/" target="_blank" rel="noopener">Privacy Policy (opens in a new tab)</a> and consent to being contacted about my inquiry.</span></label><span class="field-error" id="${prefix}-consent-error"></span><button type="submit" class="button submit-button"><span>Prepare your inquiry</span>${icon('arrow')}</button><p class="form-note">You’ll review and send a prepared draft from your email app.</p><div class="form-result" role="status" aria-live="polite" hidden></div></form>`);
  }
  function validate(field) {
    if (field.type === 'hidden') return true;
    const message = validationMessage(field);
    const errorId = field.getAttribute('aria-describedby');
    const error = errorId && document.getElementById(errorId);
    if (error) error.textContent = message;
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  }
  function bindForm(form) {
    const fields = $$('input, select, textarea', form);
    fields.forEach(field => {
      field.addEventListener('blur', () => { if (field.type !== 'hidden') validate(field); });
      field.addEventListener('input', () => { if (field.getAttribute('aria-invalid') === 'true') validate(field); const result = $('.form-result', form); result.hidden = true; });
      field.addEventListener('change', () => { if (field.type !== 'hidden') validate(field); });
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (form.getAttribute('aria-busy') === 'true') return;
      const results = fields.map(validate);
      if (results.some(result => !result)) { fields[results.indexOf(false)].focus(); return; }
      const button = $('[type="submit"]', form);
      const originalButton = button.innerHTML;
      button.innerHTML = '<span>Preparing your inquiry…</span><span class="spinner" aria-hidden="true"></span>';
      button.disabled = true;
      form.setAttribute('aria-busy', 'true');
      const data = Object.fromEntries(new FormData(form));
      ['name', 'email', 'company', 'message'].forEach(key => { data[key] = String(data[key] || '').trim(); });
      if (form.dataset.context) data.interest += ` — ${form.dataset.context}`;
      const result = $('.form-result', form);
      result.replaceChildren();
      try {
        if (config.inquiryEndpoint) {
          const response = await fetch(config.inquiryEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: AbortSignal.timeout(12000) });
          if (!response.ok) throw new Error('Request could not be delivered.');
          result.innerHTML = '<h4>Thank you for reaching out.</h4><p>Your inquiry has been received. Our team looks forward to connecting with you.</p>';
          track('inquiry_submitted', { topic: form.elements.interest.value, source: form.classList.contains('dialog-form') ? 'dialog' : 'contact' });
          form.reset();
        } else {
          await new Promise(resolve => setTimeout(resolve, 400));
          const draft = emailDraft(data, config.contactEmail || 'dusaccom1@gmail.com');
          result.innerHTML = '<h4>Your next connection is one step away.</h4><p>Your message is ready. Open the email draft below, review it, and press send in your email app. Nothing has been sent yet.</p><div class="result-actions"></div>';
          const actions = $('.result-actions', result);
          const link = document.createElement('a');
          link.className = 'button'; link.href = draft.href; link.innerHTML = `Open email draft ${icon('mail')}`;
          actions.append(link);
          const copy = document.createElement('button');
          copy.type = 'button'; copy.className = 'button button-outline'; copy.textContent = 'Copy message';
          copy.addEventListener('click', async () => {
            try { await navigator.clipboard.writeText(`To: ${config.contactEmail || 'dusaccom1@gmail.com'}\nSubject: ${draft.subject}\n\n${draft.body}`); toast('Message copied. Paste it into an email to the chamber.'); }
            catch { toast('Copy is unavailable. Use the email draft or email us directly.'); }
          });
          actions.append(copy);
          track('inquiry_draft_prepared', { topic: form.elements.interest.value, source: form.classList.contains('dialog-form') ? 'dialog' : 'contact' });
        }
      } catch {
        result.innerHTML = '<h4>Let’s try another way.</h4><p>We couldn’t send your message. Your entries are still here. Please try again, email <a href="mailto:dusaccom1@gmail.com">dusaccom1@gmail.com</a>, or call <a href="tel:+16463266052">646-326-6052</a>.</p>';
      } finally {
        result.hidden = false;
        form.setAttribute('aria-busy', 'false');
        button.disabled = false;
        button.innerHTML = originalButton;
        result.setAttribute('tabindex', '-1'); result.focus({ preventScroll: true });
        result.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
      }
    });
  }
  const policies = {
    privacy: { title: 'Privacy Policy', html: '<p>Website privacy notice · October 23, 2026</p><h3>Your inquiry</h3><p>The name, email address, company, topic, and message you enter are used to prepare an email inquiry on your device. In the current email-draft flow, the website does not submit or store those details on a server. You choose whether to send the prepared message using your email application. Your email provider’s policies apply to that service.</p><h3>When you contact the Chamber</h3><p>If you send an email or call us, DUSACCOM receives the information you choose to share and can use it to respond to your inquiry. Please do not include payment information or other sensitive details in an inquiry.</p><h3>Preferences and analytics</h3><p>This site saves your cookie choice in your browser’s local storage. Optional analytics are disabled unless you select “Accept all.” No analytics provider is configured in this version. If Google Analytics is configured later, it will load only after you consent. You can change your choice using “Cookie preferences” in the footer. Our analytics hooks do not receive form field values.</p><h3>Hosting and external services</h3><p>The hosting provider processes technical information needed to deliver this website, such as IP addresses and request metadata, under its own policies. Email links open your email application. Phone links open your calling application. Photos are served locally.</p><h3>Questions and requests</h3><p>For questions about this website or information you have shared with DUSACCOM, contact <a href="mailto:dusaccom1@gmail.com">dusaccom1@gmail.com</a> or <a href="tel:+16463266052">646-326-6052</a>.</p>' },
    terms: { title: 'Terms of Service', html: '<p>Website terms · October 23, 2026</p><h3>Using this website</h3><p>This website introduces the Dominican USA Chamber of Commerce and its business community. Please use the website lawfully and respectfully. Do not attempt to disrupt the site or misuse its forms.</p><h3>Membership and programs</h3><p>Membership pathways and program descriptions are proposed introductory information. Current membership dues, benefits, eligibility, services, and availability must be confirmed directly with DUSACCOM. Preparing or sending an inquiry does not establish membership or a partnership.</p><h3>Events and registration</h3><p>Program previews are expressions of interest only. Dates, locations, admission, and registration details will be confirmed separately. An event inquiry does not reserve a place or create a registration.</p><h3>No online payments</h3><p>This website does not collect payments, request card details, or enter visitors into a paid agreement. Any future payment or membership agreement must be reviewed and accepted separately.</p><h3>Information and resources</h3><p>Website resources provide general business information. They are not individualized professional advice or a guarantee of business results. Confirm details and seek appropriate professional support for your circumstances.</p><h3>Contact</h3><p>For questions or to verify the latest details, contact <a href="mailto:dusaccom1@gmail.com">dusaccom1@gmail.com</a> or call <a href="tel:+16463266052">646-326-6052</a>.</p>' }
  };
  const articles = {
    networking: { category: 'BUILDING CONNECTIONS · CHAMBER RESOURCE', title: 'A better approach to business networking', html: '<p>Strong business relationships begin with a useful conversation, not a perfect sales pitch. A few thoughtful habits can help you make the most of every introduction.</p><h3>Start with curiosity</h3><p>Ask what someone is building, what they are learning, and what a good connection would look like for them. Listen before introducing your own business.</p><h3>Offer one clear introduction</h3><p>Explain who you help and how in a sentence or two. Concrete examples make it easier for someone to understand your work and remember you later.</p><h3>Make the follow-up personal</h3><p>After meeting, refer to something specific you discussed. Offer a useful resource or suggest a short conversation. Ask permission before sharing contact details with someone else.</p><h3>Build over time</h3><p>Consistency matters. Stay in touch, celebrate others’ progress, and look for ways to be useful without an immediate expectation of return.</p><button class="button" data-inquire="Networking & connections">Meet your community <svg class="icon"><use href="#arrow"/></svg></button>' },
    markets: { category: 'BUSINESS DEVELOPMENT · CHAMBER RESOURCE', title: 'Preparing your business for a new market', html: '<p>A new market starts with questions. Before committing resources, take time to understand the people, operations, and relationships that would support your business.</p><h3>Who is your customer?</h3><p>Identify the specific people or organizations you hope to serve. Speak with potential customers about their needs rather than assuming that demand transfers unchanged between markets.</p><h3>What needs to adapt?</h3><p>Consider language, customer expectations, service delivery, and how you will support customers locally.</p><h3>How will you deliver?</h3><p>Map the practical steps of fulfilling an order or providing a service. Identify dependencies, partners, and costs that need further research.</p><h3>Who can help you verify requirements?</h3><p>Identify qualified local advisers who can help confirm the rules and requirements that apply to your business.</p><h3>What would a small first step look like?</h3><p>Set a manageable research or pilot goal before making a large commitment. Use what you learn to decide your next step.</p><button class="button" data-inquire="Trade & market access">Start a conversation <svg class="icon"><use href="#arrow"/></svg></button>' },
    community: { category: 'COMMUNITY · CHAMBER RESOURCE', title: 'The value of a community in your corner', html: '<p>Building a business comes with questions that are easier to navigate in conversation. A business community creates space to compare experiences, share knowledge, and meet people with complementary perspectives.</p><h3>A place to ask</h3><p>Conversations with fellow entrepreneurs can reveal questions you had not considered and point you toward resources worth exploring.</p><h3>Introductions with context</h3><p>A thoughtful introduction helps people understand why a conversation might be useful. Be clear about what you are looking for, and respect everyone’s time and boundaries.</p><h3>A chance to contribute</h3><p>Community grows when people take part. Share a useful experience, welcome a new business owner, or offer an introduction with permission.</p><h3>Shared roots, new possibilities</h3><p>For Dominican and American business leaders, shared cultural understanding can provide a starting point for relationships that extend across markets and generations.</p><button class="button" data-membership="Small Business">Explore membership <svg class="icon"><use href="#arrow"/></svg></button>' }
  };
  const tabs = $$('[role="tab"]');
  function activateTab(tab) {
    tabs.forEach(item => { const selected = item === tab; item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1; document.getElementById(item.getAttribute('aria-controls')).hidden = !selected; });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowRight') target = tabs[(index + 1) % tabs.length];
      if (event.key === 'ArrowLeft') target = tabs[(index - 1 + tabs.length) % tabs.length];
      if (event.key === 'Home') target = tabs[0];
      if (event.key === 'End') target = tabs.at(-1);
      if (target) { event.preventDefault(); activateTab(target); target.focus(); }
    });
  });
  $$('.inquiry-form').forEach(bindForm);
  $('#copyright-year').textContent = String(new Date().getFullYear());
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { $$('.desktop-nav a').forEach(link => { const active = link.getAttribute('href') === `#${entry.target.id}`; link.classList.toggle('active', active); if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); }); } }); }, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });
    $$('main section[id]').forEach(section => observer.observe(section));
  }
  document.addEventListener('click', event => { const cta = event.target.closest('a[href="#membership"]'); if (cta) track('membership_cta_click', { location: cta.closest('header') ? 'header' : 'page' }); });
})();

const intents = ['events', 'create-event', 'event-registration'] as const;
const sections = ['profile', 'password', 'email', 'team', 'delete'] as const;
type Intent = typeof intents[number];
type Section = typeof sections[number];
type Mode = 'signin' | 'signup';
type AccountNavigation = { intent?: Intent; eventId?: string; settings?: Section };
const validEventId = (value: string | null | undefined): value is string => Boolean(value && /^[A-Za-z0-9_-]{1,128}$/.test(value));

function navigation(search: string): AccountNavigation {
  const params = new URLSearchParams(search);
  const intent = params.get('intent');
  const settings = params.get('settings');
  const event = params.get('event');
  return {
    intent: intents.find(value => value === intent),
    settings: sections.find(value => value === settings),
    eventId: validEventId(event) ? event : undefined,
  };
}

export function accountHref({ mode = 'signin', intent, eventId, settings }: AccountNavigation & { mode?: Mode } = {}) {
  const params = new URLSearchParams();
  if (mode === 'signup') params.set('mode', mode);
  if (intent && intents.includes(intent)) params.set('intent', intent);
  if (intent === 'event-registration' && validEventId(eventId)) params.set('event', eventId);
  if (settings && sections.includes(settings)) params.set('settings', settings);
  return `/account/${params.size ? `?${params}` : ''}`;
}

export function eventRegistrationHref(eventId: string) {
  return validEventId(eventId) ? `/?event=${encodeURIComponent(eventId)}#events` : '/#events';
}

// Return destinations are built from known actions. No caller-supplied URL is
// used, so sign-in links cannot redirect people to another origin or script.
export function afterAuthentication(search: string) {
  const { intent, eventId, settings } = navigation(search);
  if (intent === 'event-registration') return eventRegistrationHref(eventId || '');
  if (intent === 'create-event') return '/?action=create-event#events';
  if (intent === 'events') return '/#events';
  return `/account/?settings=${settings || 'profile'}`;
}

export function accountContinuationHref(search: string) {
  return accountHref(navigation(search));
}

export function accountHrefForContext(location: { pathname: string; search: string; hash: string }, mode: Mode) {
  if (location.pathname.replace(/\/$/, '') === '/account') return accountHref({ ...navigation(location.search), mode });
  if (location.pathname === '/') {
    const params = new URLSearchParams(location.search);
    const eventId = params.get('event');
    if (validEventId(eventId)) return accountHref({ mode, intent: 'event-registration', eventId });
    if (params.get('action') === 'create-event') return accountHref({ mode, intent: 'create-event' });
    if (location.hash === '#events') return accountHref({ mode, intent: 'events' });
  }
  return accountHref({ mode });
}

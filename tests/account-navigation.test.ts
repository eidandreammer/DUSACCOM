import assert from 'node:assert/strict';
import { test } from 'node:test';
import { accountContinuationHref, accountHref, accountHrefForContext, afterAuthentication, eventRegistrationHref } from '../src/lib/account-navigation';

test('ordinary sign-in and signup open account settings instead of the calendar', () => {
  for (const query of ['', '?mode=signup', '?mode=signin', '?intent=unknown', '?returnTo=https://evil.example/']) assert.equal(afterAuthentication(query), '/account/?settings=profile');
  for (const settings of ['password', 'email', 'team', 'delete']) assert.equal(afterAuthentication(`?settings=${settings}`), `/account/?settings=${settings}`);
  assert.equal(afterAuthentication('?settings=unknown'), '/account/?settings=profile');
});
test('event intentions return to the calendar and preserve a selected registration', () => {
  assert.equal(afterAuthentication('?intent=events'), '/#events');
  assert.equal(afterAuthentication('?intent=create-event&mode=signup'), '/?action=create-event#events');
  assert.equal(afterAuthentication('?intent=event-registration&event=live-community-1'), '/?event=live-community-1#events');
  for (const id of ['../account', 'https://evil.example', 'javascript:alert(1)', 'bad\nvalue', 'x'.repeat(129)]) assert.equal(eventRegistrationHref(id), '/#events');
  assert.equal(afterAuthentication('?intent=event-registration&event=%2F%2Fevil.example'), '/#events');
  assert.equal(afterAuthentication('?intent=javascript:alert(1)&settings=%2F%2Fevil.example'), '/account/?settings=profile');
});
test('event context and password-reset continuation preserve only recognized actions', () => {
  assert.equal(accountHrefForContext({ pathname: '/', search: '?event=live-one', hash: '#events' }, 'signup'), '/account/?mode=signup&intent=event-registration&event=live-one');
  assert.equal(accountHrefForContext({ pathname: '/', search: '', hash: '#events' }, 'signin'), '/account/?intent=events');
  assert.equal(accountHrefForContext({ pathname: '/', search: '?action=create-event', hash: '#events' }, 'signin'), '/account/?intent=create-event');
  assert.equal(accountHrefForContext({ pathname: '/contact/', search: '?event=live-one', hash: '#events' }, 'signin'), '/account/');
  assert.equal(accountHrefForContext({ pathname: '/', search: '', hash: '#about' }, 'signup'), '/account/?mode=signup');
  assert.equal(accountHrefForContext({ pathname: '/account/', search: '?intent=event-registration&event=live-one', hash: '' }, 'signup'), '/account/?mode=signup&intent=event-registration&event=live-one');
  assert.equal(accountContinuationHref('?mode=reset&intent=event-registration&event=live-one'), '/account/?intent=event-registration&event=live-one');
  assert.equal(accountContinuationHref('?mode=reset&settings=password'), '/account/?settings=password');
  assert.equal(accountHref({ settings: 'profile' }), '/account/?settings=profile');
});

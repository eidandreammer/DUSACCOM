import assert from 'node:assert/strict';
import { test } from 'node:test';
import { accountEmailMatches, readMembershipProfile } from '../src/lib/membership-profile';

test('membership email matching respects normalized account or shared-mailbox identity', () => {
  assert.equal(accountEmailMatches(' Member@Example.com ', 'member@example.com'), true);
  assert.equal(accountEmailMatches('shared@gmail.com', 'shared+dusaccom-admin1@gmail.com', 'SHARED@gmail.com'), true);
  assert.equal(accountEmailMatches('unrelated@example.com', 'member@example.com'), false);
  assert.equal(accountEmailMatches('', ''), false);
});
test('profile display accepts only bounded submitted membership data and no forged privileges', () => {
  const valid = { company: 'Community Organization', membershipTier: 'nonprofit', status: 'submitted', submissionId: crypto.randomUUID() };
  assert.deepEqual(readMembershipProfile({ ...valid, updatedAt: new Date() }), valid);
  for (const patch of [{ status: 'active' }, { membershipTier: 'gold' }, { company: 'x'.repeat(151) }, { company: 5 }, { isAdmin: true }]) assert.equal(readMembershipProfile({ ...valid, ...patch }), null);
  assert.equal(readMembershipProfile(undefined), null);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adminAccess } from '../src/lib/admin-access';
import { delegatedAdminInput, teamLoginEmail } from '../src/lib/team-login';

test('legacy parent admins retain delegation and child admins require an enabled root', () => {
  assert.deepEqual(adminAccess(), { isAdmin: false, canManageAdmins: false });
  assert.deepEqual(adminAccess({ enabled: true }), { isAdmin: true, canManageAdmins: true });
  assert.deepEqual(adminAccess({ enabled: false }), { isAdmin: false, canManageAdmins: false });
  const child = { enabled: true, parentUid: 'parent' };
  assert.deepEqual(adminAccess(child, { enabled: true }), { isAdmin: true, canManageAdmins: false });
  for (const parent of [undefined, { enabled: false }, { enabled: true, parentUid: 'grandparent' }]) {
    assert.deepEqual(adminAccess(child, parent), { isAdmin: false, canManageAdmins: false });
  }
  assert.equal(adminAccess({ enabled: false, parentUid: 'parent' }, { enabled: true }).isAdmin, false);
});

test('shared mailbox sign-in creates distinct aliases with normalized usernames', () => {
  assert.equal(teamLoginEmail('Parent@gmail.com', ' Admin_One '), 'parent+dusaccom-admin_one@gmail.com');
  assert.notEqual(teamLoginEmail('parent@gmail.com', 'admin1'), teamLoginEmail('parent@gmail.com', 'admin2'));
  assert.equal(teamLoginEmail('parent+chamber@googlemail.com', 'admin1'), 'parent+chamber+dusaccom-admin1@googlemail.com');
  for (const username of ['', 'ab', '1admin', 'admin@other.com', 'admin+root', 'a'.repeat(25)]) {
    assert.throws(() => teamLoginEmail('parent@gmail.com', username));
  }
  assert.throws(() => teamLoginEmail('parent@example.com', 'admin1'));
  assert.throws(() => teamLoginEmail(`${'a'.repeat(60)}@gmail.com`, 'admin1'));
  assert.equal(delegatedAdminInput.safeParse({ displayName: 'Admin One', username: 'admin1', password: 'short' }).success, false);
});

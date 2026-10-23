const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync('dist/form-utils.js', 'utf8'), context);
const { validationMessage, emailDraft, escapeHTML } = context.DusaccomForms;
const field = changes => ({ name: 'name', type: 'text', required: true, value: '', minLength: 2, maxLength: 100, ...changes });
test('required fields reject whitespace and focus-worthy errors are specific', () => {
  assert.equal(validationMessage(field({ value: '   ' })), 'Please enter your full name.');
  assert.equal(validationMessage(field({ value: 'A' })), 'Please enter at least 2 characters.');
  assert.equal(validationMessage(field({ value: ' María García ' })), '');
});
test('email validation handles business addresses and rejects malformed addresses', () => {
  for (const value of ['hello', 'a@b', 'a b@example.com', 'a@@example.com', 'a@example.']) assert.notEqual(validationMessage(field({ name: 'email', type: 'email', value })), '');
  for (const value of ['maria+business@example.com', 'info@company.com.do']) assert.equal(validationMessage(field({ name: 'email', type: 'email', value })), '');
});
test('consent must be explicit and optional company can be empty', () => {
  assert.notEqual(validationMessage(field({ type: 'checkbox', checked: false })), '');
  assert.equal(validationMessage(field({ type: 'checkbox', checked: true })), '');
  assert.equal(validationMessage(field({ name: 'company', required: false })), '');
});
test('message length is enforced before preparing a draft', () => {
  assert.notEqual(validationMessage(field({ name: 'message', value: 'Hi', minLength: 10, maxLength: 3000 })), '');
  assert.equal(validationMessage(field({ name: 'message', value: 'I am interested in membership.', minLength: 10, maxLength: 3000 })), '');
  assert.notEqual(validationMessage(field({ value: 'A'.repeat(101) })), '');
});
test('email draft encodes multilingual content and special characters without header injection', () => {
  const data = { name: 'María García', email: 'maria@example.com', company: 'A & B', interest: 'Startup\r\nBcc: nobody@example.com', message: 'Hello! 50% growth & new connections? #Together' };
  const draft = emailDraft(data, 'dusaccom1@gmail.com');
  assert.ok(draft.href.startsWith('mailto:dusaccom1@gmail.com?subject='));
  const params = new URLSearchParams(draft.href.split('?')[1]);
  assert.equal(params.get('subject'), draft.subject);
  assert.equal(/[\r\n]/.test(draft.subject), false);
  assert.ok(params.get('body').includes(data.message));
  assert.ok(params.get('body').includes(data.name));
  assert.equal(params.has('bcc'), false);
  assert.equal(params.has('cc'), false);
});
test('HTML escaping protects dynamically rendered values', () => {
  assert.equal(escapeHTML('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(escapeHTML("O'Brien & Co"), 'O&#39;Brien &amp; Co');
});

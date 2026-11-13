/** Configure Firebase's transactional sender after Resend and DNS verification.
 * RESEND_API_KEY is read from the environment or RESEND_API_KEY_FILE, never logged.
 * Run with --check for a read-only preflight; no production emails are sent here.
 */
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { resolveTxt, resolveCname } from 'node:dns/promises';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { GoogleAuth } = require('google-auth-library');
const root = resolve(import.meta.dirname, '..');
createRequire(import.meta.url)('@next/env').loadEnvConfig(root, false);
const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!project) throw new Error('Missing Firebase project ID.');
const key = (process.env.RESEND_API_KEY || (process.env.RESEND_API_KEY_FILE ? await readFile(process.env.RESEND_API_KEY_FILE, 'utf8') : '')).trim();
if (!key.startsWith('re_')) throw new Error('Supply RESEND_API_KEY or RESEND_API_KEY_FILE privately.');
const dns = JSON.parse(await readFile(new URL('../docs/resend-dns.json', import.meta.url), 'utf8'));
for (const record of dns.records) {
  const name = `${record.name}.${dns.domain}`;
  const values = record.type === 'TXT' ? (await resolveTxt(name)).map(parts => parts.join('')) : await resolveCname(name);
  if (!values.some(value => value.replace(/\.$/, '') === record.content)) throw new Error(`DNS verification failed for ${name}.`);
}
console.log('DNS: Resend DKIM and both sending CNAME records match.');
const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
const client = await auth.getClient();
const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${project}/config`;
async function readConfig() {
  try { return (await client.request({ url })).data; }
  catch (error) { throw new Error(`Firebase config read failed (${error.response?.status || 'unknown'}).`); }
}
const current = await readConfig();
if (!current.authorizedDomains?.includes('dusaccnj.org')) throw new Error('Add dusaccnj.org to Firebase Authentication authorized domains first.');
if (process.argv.includes('--check')) {
  console.log(`Firebase sender method: ${current.notification?.sendEmail?.method || 'DEFAULT'}.`);
  console.log('Read-only preflight passed.');
  process.exit(0);
}
// A simulator recipient confirms Resend accepts this exact sender without
// requiring a broad management key or sending to a real customer's mailbox.
const preflight = await fetch('https://api.resend.com/emails', {
  method: 'POST', redirect: 'error', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ from: 'DUSACCOM <noreply@dusaccnj.org>', to: ['delivered@resend.dev'], subject: 'DUSACCOM sender verification', text: 'Transactional sender setup verification.' }),
  signal: AbortSignal.timeout(15000),
});
if (!preflight.ok) throw new Error(`Resend sender verification failed (${preflight.status}). No Firebase settings were changed.`);
if (!(await preflight.json()).id) throw new Error('Resend sender verification returned no receipt.');
console.log('Resend: sending-only key and verified sender accepted.');
const definitions = [
  ['resetPasswordTemplate', 'Reset your DUSACCOM password', 'Follow this link to reset the password for your DUSACCOM account (%EMAIL%). If you did not request this, you can ignore this email.', 'Reset password'],
  ['verifyEmailTemplate', 'Verify your DUSACCOM email', 'Please verify your email address for DUSACCOM. If you did not request this, you can ignore this email.', 'Verify email'],
  ['changeEmailTemplate', 'Your DUSACCOM sign-in email was changed', 'Your DUSACCOM sign-in email was changed to %NEW_EMAIL%. If you did not make this change, use the link below to restore your previous email address.', 'Restore email'],
  ['revertSecondFactorAdditionTemplate', 'DUSACCOM security settings changed', 'Two-step verification was added to your DUSACCOM account. If you did not make this change, use the link below to remove it.', 'Review account security'],
];
const templates = Object.fromEntries(definitions.map(([field, subject, message, label]) => [field, {
  senderLocalPart: 'noreply', senderDisplayName: 'DUSACCOM', replyTo: 'dusaccom1@gmail.com', subject, bodyFormat: 'HTML',
  body: `<div style="font-family:Arial,sans-serif;color:#0c2334;max-width:560px;margin:auto;padding:32px"><h1 style="font-size:24px">DUSACCOM</h1><p>Hello,</p><p style="line-height:1.7">${message}</p><p><a href="%LINK%" style="display:inline-block;background:#0c2334;color:#fff;padding:14px 20px;border-radius:8px">${label}</a></p><p>If the button does not work, open this link:<br><a href="%LINK%">%LINK%</a></p><p>Dominican USA Chamber of Commerce<br><a href="mailto:dusaccom1@gmail.com">dusaccom1@gmail.com</a></p></div>`,
}]));
// Firebase permits custom SMTP on this project but locks template bodies and
// callbackUri. Apply transport separately so that restriction cannot prevent
// a verified Resend sender from handling existing Firebase action emails.
const smtp = { senderEmail: 'noreply@dusaccnj.org', host: 'smtp.resend.com', port: 465, username: 'resend', password: key, securityMode: 'SSL' };
async function patch(sendEmail, fields) {
  try {
    await client.request({ url, method: 'PATCH', params: { updateMask: fields.map(field => `notification.sendEmail.${field}`).join(',') }, data: { notification: { sendEmail } } });
    return true;
  } catch (error) {
    // Gaxios error objects include SMTP credentials; emit only a fixed message.
    const status = error.response?.status || 'unknown';
    const code = error.response?.data?.error?.message?.match(/^[A-Z_]+$/)?.[0] || 'CONFIGURATION_REJECTED';
    if (code === 'EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED' && !fields.includes('smtp')) return false;
    throw new Error(`Firebase sender update failed (${status}, ${code}).`);
  }
}
await patch({ method: 'CUSTOM_SMTP', smtp }, ['method', 'smtp']);
const customTemplates = await patch({ ...templates, callbackUri: 'https://dusaccnj.org/__/auth/action' }, ['callbackUri', ...Object.keys(templates)]);
const verified = await readConfig();
const result = verified.notification?.sendEmail;
if (result?.method !== 'CUSTOM_SMTP' || result.smtp?.host !== smtp.host || result.smtp?.senderEmail !== smtp.senderEmail) throw new Error('Firebase SMTP configuration read-back failed.');
console.log('Firebase: Resend SMTP and noreply@dusaccnj.org configured and read back successfully.');
console.log(customTemplates ? 'DUSACCOM action-email templates and domain applied.' : 'Firebase locks action-email text and handler URL on this project; its existing DUSACCOM templates and working Firebase action handler remain in use through Resend SMTP.');
console.log('Next: install the RESEND_API_KEY secret, enable ACCOUNT_EMAILS_ENABLED in functions and NEXT_PUBLIC_ACCOUNT_EMAILS_ENABLED in the website, deploy functions then Hosting, and test delivery to an authorized test mailbox.');

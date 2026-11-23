import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { accountEmail } = require('./lib/account-email.js');
const directory = new URL('../docs/email-templates/', import.meta.url);
await mkdir(directory, { recursive: true });
for (const kind of ['welcome', 'password-changed', 'account-deleted', 'password-reset', 'verify-email', 'change-email']) {
  for (const lang of ['en', 'es']) {
    const modes = { 'password-reset': 'resetPassword', 'verify-email': 'verifyEmail', 'change-email': 'verifyAndChangeEmail' };
    const action = modes[kind] ? `https://dusaccnj.org/__/auth/action?mode=${modes[kind]}&apiKey=EXAMPLE&oobCode=EXAMPLE` : undefined;
    await writeFile(new URL(`${kind}-${lang}.html`, directory), accountEmail(kind, '', lang, action).html);
  }
}
console.log('Wrote twelve account email previews.');

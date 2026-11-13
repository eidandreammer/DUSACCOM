import type { ActionEmailKind } from './action-email-handler';
export type AccountEmailKind = 'welcome' | 'password-changed' | 'account-deleted' | ActionEmailKind;
export const EMAIL_FROM = 'DUSACCOM <noreply@dusaccnj.org>';
export const EMAIL_REPLY_TO = 'dusaccom1@gmail.com';
export const ACCOUNT_URL = 'https://dusaccnj.org/account/';
const escape = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);

export function accountEmail(kind: AccountEmailKind, name = '', lang: 'en' | 'es' = 'en', actionUrl?: string) {
  const spanish = lang === 'es';
  const messages = {
    'password-reset': spanish
      ? ['Restablece tu contraseña de DUSACCOM', 'Recibimos una solicitud para restablecer tu contraseña. Usa el enlace seguro para elegir una nueva. Si no lo solicitaste, puedes ignorar este correo.']
      : ['Reset your DUSACCOM password', 'We received a request to reset your password. Use the secure link to choose a new password. If you did not request this, you can ignore this email.'],
    'verify-email': spanish
      ? ['Verifica tu correo de DUSACCOM', 'Confirma tu dirección de correo para tu cuenta de DUSACCOM usando el enlace seguro. Si no creaste esta cuenta, puedes ignorar este correo.']
      : ['Verify your DUSACCOM email', 'Confirm the email address for your DUSACCOM account using the secure link. If you did not create this account, you can ignore this email.'],
    'change-email': spanish
      ? ['Confirma tu nuevo correo de DUSACCOM', 'Usa el enlace seguro para confirmar esta nueva dirección de acceso. Tu dirección actual permanece activa hasta que confirmes el cambio. Si no lo solicitaste, ignora este correo.']
      : ['Confirm your new DUSACCOM email', 'Use the secure link to confirm this new sign-in address. Your current address stays active until you confirm the change. If you did not request this, ignore this email.'],
    welcome: spanish
      ? ['Bienvenido a DUSACCOM', 'Tu cuenta de DUSACCOM está lista. Ya puedes administrar tu perfil y participar en nuestra comunidad. Crear una cuenta no establece una membresía pagada.']
      : ['Welcome to DUSACCOM', 'Your DUSACCOM account is ready. You can manage your profile and take part in our community. Creating an account does not establish paid Chamber membership.'],
    'password-changed': spanish
      ? ['Tu contraseña de DUSACCOM fue cambiada', 'La contraseña de tu cuenta de DUSACCOM acaba de cambiar. Si no hiciste este cambio, restablece tu contraseña de inmediato y comunícate con nosotros.']
      : ['Your DUSACCOM password was changed', 'The password for your DUSACCOM account was just changed. If you did not make this change, reset your password immediately and contact us.'],
    'account-deleted': spanish
      ? ['Tu cuenta de DUSACCOM fue eliminada', 'Tu cuenta de acceso a DUSACCOM fue eliminada. Si no solicitaste este cambio, comunícate con nosotros.']
      : ['Your DUSACCOM account was deleted', 'Your DUSACCOM sign-in account was deleted. If you did not request this change, contact us.'],
  };
  const [subject, message] = messages[kind];
  const greeting = `${spanish ? 'Hola' : 'Hello'}${name ? ` ${name}` : ''},`;
  const label = actionUrl ? (spanish ? 'Continuar de forma segura' : 'Continue securely') : (spanish ? 'Visitar DUSACCOM' : 'Visit DUSACCOM');
  const destination = actionUrl || ACCOUNT_URL;
  if (actionUrl && (new URL(actionUrl).origin !== 'https://dusaccnj.org' || new URL(actionUrl).pathname !== '/__/auth/action')) throw new Error('Untrusted email action URL.');
  const text = `${greeting}\n\n${message}\n\n${label}: ${destination}\n\nDUSACCOM · Dominican USA Chamber of Commerce\n${EMAIL_REPLY_TO}`;
  const html = `<!doctype html><html lang="${lang}"><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0c2334"><table role="presentation" style="width:100%;padding:32px 16px"><tr><td align="center"><table role="presentation" style="width:100%;max-width:560px;background:#fff;border-radius:16px;padding:32px"><tr><td><p style="font-weight:bold;color:#0c2334;font-size:24px">DUSACCOM</p><h1 style="font-size:22px">${escape(subject)}</h1><p>${escape(greeting)}</p><p style="line-height:1.7">${escape(message)}</p><p style="padding:16px 0"><a href="${escape(destination)}" style="background:#0c2334;color:#fff;padding:14px 20px;border-radius:8px;text-decoration:none">${label}</a></p><p style="font-size:12px;color:#475569;line-height:1.6">Dominican USA Chamber of Commerce<br><a href="mailto:${EMAIL_REPLY_TO}">${EMAIL_REPLY_TO}</a></p></td></tr></table></td></tr></table></body></html>`;
  return { subject, text, html };
}

export async function deliverAccountEmail(input: { kind: AccountEmailKind; to: string; name?: string; lang?: 'en' | 'es'; id: string; actionUrl?: string }, apiKey: string, transport: typeof fetch = fetch) {
  const response = await transport('https://api.resend.com/emails', {
    method: 'POST', redirect: 'error',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `dusaccom-account/${input.id}` },
    body: JSON.stringify({ from: EMAIL_FROM, to: [input.to], reply_to: EMAIL_REPLY_TO, ...accountEmail(input.kind, input.name, input.lang, input.actionUrl) }),
    signal: AbortSignal.timeout(15000),
  });
  // Never log provider responses: they can contain private addresses or content.
  if (!response.ok) throw new Error(`Account email delivery failed (${response.status}).`);
  const result = await response.json() as { id?: string };
  if (!result.id) throw new Error('Account email delivery returned no receipt.');
  return result.id;
}

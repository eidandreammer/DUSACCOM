import type { Lang } from './translations';

const teamBase = {
  en: {
    title: 'Administrator team', manage: 'Manage administrator team', delegated: 'Delegated administrator',
    description: 'Add administrators under your account. They can create, edit, and delete events, but cannot add or manage administrators.',
    sharedEmail: 'Shared email', mailboxHint: 'Each person signs in with this email, their own username, and their own password. Keep access to the shared inbox with the parent administrator: it controls password recovery for these accounts.',
    username: 'Username', usernameHint: 'Use 3–24 letters, numbers, underscores, or hyphens. Start with a letter.',
    useUsername: 'Sign in with a team username', signInHint: 'Enter the username your parent administrator gave you.',
    name: 'Full name', password: 'Initial password', create: 'Add administrator', creating: 'Adding administrator…',
    created: 'Administrator added. Share the username and password privately.',
    empty: 'No delegated administrators yet.', active: 'Active', disabled: 'Disabled', disable: 'Disable access', enable: 'Enable access',
    loading: 'Loading your team…', saving: 'Saving…', saved: 'Administrator access updated.',
    unsupported: 'Shared-email team accounts currently require a Gmail or Googlemail address.',
    invalid: 'Check the name, username, and password. Passwords must contain at least 8 characters.',
    exists: 'This username is already registered for the shared email. Choose another username.',
    failed: 'The administrator could not be saved. Check your connection and try again.',
    loadFailed: 'Your administrator team could not be loaded. Please refresh to retry.',
    permission: 'Only an enabled parent administrator can manage their own team.',
    cleanup: 'Account creation did not finish and could not be rolled back. Contact the chamber before retrying this username.',
  },
  es: {
    title: 'Equipo de administradores', manage: 'Administrar equipo', delegated: 'Administrador delegado',
    description: 'Agrega administradores bajo tu cuenta. Pueden crear, editar y eliminar eventos, pero no agregar ni administrar otros administradores.',
    sharedEmail: 'Correo compartido', mailboxHint: 'Cada persona inicia sesión con este correo, su propio usuario y su propia contraseña. El administrador principal debe conservar el acceso al buzón compartido: controla la recuperación de contraseñas de estas cuentas.',
    username: 'Usuario', usernameHint: 'Usa de 3 a 24 letras, números, guiones bajos o guiones. Empieza con una letra.',
    useUsername: 'Iniciar sesión con un usuario de equipo', signInHint: 'Ingresa el usuario que te dio tu administrador principal.',
    name: 'Nombre completo', password: 'Contraseña inicial', create: 'Agregar administrador', creating: 'Agregando administrador…',
    created: 'Administrador agregado. Comparte el usuario y la contraseña de forma privada.',
    empty: 'Todavía no hay administradores delegados.', active: 'Activo', disabled: 'Desactivado', disable: 'Desactivar acceso', enable: 'Activar acceso',
    loading: 'Cargando tu equipo…', saving: 'Guardando…', saved: 'Acceso del administrador actualizado.',
    unsupported: 'Las cuentas de equipo con correo compartido requieren una dirección de Gmail o Googlemail.',
    invalid: 'Revisa el nombre, el usuario y la contraseña. Las contraseñas deben tener al menos 8 caracteres.',
    exists: 'Este usuario ya está registrado con el correo compartido. Elige otro usuario.',
    failed: 'No se pudo guardar el administrador. Revisa tu conexión e inténtalo de nuevo.',
    loadFailed: 'No se pudo cargar tu equipo. Actualiza la página para reintentar.',
    permission: 'Solo un administrador principal activo puede administrar su propio equipo.',
    cleanup: 'La creación de la cuenta no terminó y no se pudo revertir. Contacta a la cámara antes de reintentar este usuario.',
  },
};

type TeamBaseShape = Record<keyof typeof teamBase.en, string>;
// Parity: Record<Lang, Shape> makes a missing or extra key in any language a compile error.
export const teamCopy: Record<Lang, TeamBaseShape> = {
  ...teamBase,
  pt: {
    title: 'Equipe de administradores', manage: 'Gerenciar equipe de administradores', delegated: 'Administrador delegado',
    description: 'Adicione administradores à sua conta. Eles podem criar, editar e excluir eventos, mas não podem adicionar nem gerenciar administradores.',
    sharedEmail: 'E-mail compartilhado', mailboxHint: 'Cada pessoa entra com este e-mail, o seu próprio nome de usuário e a sua própria senha. O administrador principal deve manter o acesso à caixa de entrada compartilhada: ela controla a recuperação de senha dessas contas.',
    username: 'Nome de usuário', usernameHint: 'Use de 3 a 24 letras, números, sublinhados ou hifens. Comece com uma letra.',
    useUsername: 'Entrar com um nome de usuário da equipe', signInHint: 'Informe o nome de usuário que o seu administrador principal deu a você.',
    name: 'Nome completo', password: 'Senha inicial', create: 'Adicionar administrador', creating: 'Adicionando administrador…',
    created: 'Administrador adicionado. Compartilhe o nome de usuário e a senha de forma privada.',
    empty: 'Ainda não há administradores delegados.', active: 'Ativo', disabled: 'Desativado', disable: 'Desativar acesso', enable: 'Ativar acesso',
    loading: 'Carregando a sua equipe…', saving: 'Salvando…', saved: 'Acesso do administrador atualizado.',
    unsupported: 'Contas de equipe com e-mail compartilhado exigem atualmente um endereço do Gmail ou do Googlemail.',
    invalid: 'Confira o nome, o nome de usuário e a senha. As senhas devem ter pelo menos 8 caracteres.',
    exists: 'Este nome de usuário já está registrado com o e-mail compartilhado. Escolha outro nome de usuário.',
    failed: 'Não foi possível salvar o administrador. Verifique a sua conexão e tente novamente.',
    loadFailed: 'Não foi possível carregar a sua equipe de administradores. Atualize a página para tentar de novo.',
    permission: 'Somente um administrador principal ativo pode gerenciar a sua própria equipe.',
    cleanup: 'A criação da conta não foi concluída e não pôde ser revertida. Entre em contato com a câmara antes de tentar este nome de usuário novamente.',
  },
};

export function teamError(error: unknown, lang: Lang) {
  const copy = teamCopy[lang];
  const code = (error as { code?: string })?.code;
  const message = (error as { message?: string })?.message;
  if (code === 'auth/email-already-in-use') return copy.exists;
  if (code === 'permission-denied' || message === 'team/permission-denied') return copy.permission;
  if (message === 'team/cleanup-required') return copy.cleanup;
  return copy.failed;
}

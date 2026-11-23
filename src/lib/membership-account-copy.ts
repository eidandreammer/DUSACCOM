import type { Lang } from './translations';

const membershipBase = {
  en: {
    title: 'Continue your membership journey',
    question: 'Do you already have a DUSACCOM account with this email? Sign in to continue. If you do not, would you like to create one?',
    create: 'Yes, create an account', signIn: 'I already have an account',
    signupTitle: 'Create your DUSACCOM account', signinTitle: 'Sign in to continue',
    hint: 'Your membership form stays filled in. After signing in or creating your account, review it and submit your application.',
    confirmPassword: 'Confirm password', mismatch: 'The passwords do not match.',
    createSubmit: 'Create account and continue', signinSubmit: 'Sign in and continue',
    created: 'Your account is ready. Review and submit your membership application below.',
    signedIn: 'You are signed in. Review and submit your membership application below.',
    matchingEmail: 'Use the email of your signed-in account, or sign out to apply with another account.',
    required: 'Sign in or create an account to submit your membership application.',
    cancel: 'Not now', useAnother: 'Use another email',
    organization: 'Company or organization', pathway: 'Membership pathway', applicationStatus: 'Application status', submitted: 'Application submitted',
  },
  es: {
    title: 'Continúa tu camino de membresía',
    question: '¿Ya tienes una cuenta de DUSACCOM con este correo? Inicia sesión para continuar. Si no tienes una, ¿quieres crearla?',
    create: 'Sí, crear una cuenta', signIn: 'Ya tengo una cuenta',
    signupTitle: 'Crea tu cuenta de DUSACCOM', signinTitle: 'Inicia sesión para continuar',
    hint: 'Tu formulario de membresía conserva la información. Después de iniciar sesión o crear tu cuenta, revísalo y envía tu solicitud.',
    confirmPassword: 'Confirmar contraseña', mismatch: 'Las contraseñas no coinciden.',
    createSubmit: 'Crear cuenta y continuar', signinSubmit: 'Iniciar sesión y continuar',
    created: 'Tu cuenta está lista. Revisa y envía tu solicitud de membresía abajo.',
    signedIn: 'Has iniciado sesión. Revisa y envía tu solicitud de membresía abajo.',
    matchingEmail: 'Usa el correo de tu cuenta actual o cierra sesión para solicitar con otra cuenta.',
    required: 'Inicia sesión o crea una cuenta para enviar tu solicitud de membresía.',
    cancel: 'Ahora no', useAnother: 'Usar otro correo',
    organization: 'Empresa u organización', pathway: 'Vía de membresía', applicationStatus: 'Estado de la solicitud', submitted: 'Solicitud enviada',
  },
};

type MembershipBaseShape = Record<keyof typeof membershipBase.en, string>;
// Parity: Record<Lang, Shape> makes a missing or extra key in any language a compile error.
export const membershipAccountCopy: Record<Lang, MembershipBaseShape> = {
  ...membershipBase,
  pt: {
    title: 'Continue a sua jornada de associação',
    question: 'Você já tem uma conta da DUSACCOM com este e-mail? Entre para continuar. Se não tiver, quer criar uma?',
    create: 'Sim, criar uma conta', signIn: 'Já tenho uma conta',
    signupTitle: 'Crie a sua conta da DUSACCOM', signinTitle: 'Entre para continuar',
    hint: 'O seu formulário de associação continua preenchido. Depois de entrar ou criar a sua conta, revise-o e envie a sua solicitação.',
    confirmPassword: 'Confirmar senha', mismatch: 'As senhas não coincidem.',
    createSubmit: 'Criar conta e continuar', signinSubmit: 'Entrar e continuar',
    created: 'Sua conta está pronta. Revise e envie a sua solicitação de associação abaixo.',
    signedIn: 'Você está conectado. Revise e envie a sua solicitação de associação abaixo.',
    matchingEmail: 'Use o e-mail da conta em que você está conectado ou saia para solicitar com outra conta.',
    required: 'Entre ou crie uma conta para enviar a sua solicitação de associação.',
    cancel: 'Agora não', useAnother: 'Usar outro e-mail',
    organization: 'Empresa ou organização', pathway: 'Tipo de associação', applicationStatus: 'Status da solicitação', submitted: 'Solicitação enviada',
  },
};

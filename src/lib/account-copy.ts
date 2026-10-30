export const accountCopy = {
  en: {
    status: 'Status', statusSignedIn: 'Signed in', statusSignedOut: 'Signed out', guest: 'Guest',
    account: 'My account', signIn: 'Sign in', signUp: 'Create account', signOut: 'Sign out', name: 'Full name', email: 'Email', password: 'Password',
    title: 'Welcome to DUSACCOM', description: 'Create your account or sign in to your community.', forgot: 'Forgot password?', reset: 'Send reset link', back: 'Back to sign in',
    resetSent: 'If an account exists for that email, a password reset link will be sent.', working: 'Please wait…', member: 'Member', admin: 'Administrator',
    signedIn: 'You are signed in.', calendar: 'Go to the events calendar', unavailable: 'Account access is being configured. Please try again later.',
    failed: 'We could not complete that request. Please try again.', invalid: 'Check your email and password and try again.', exists: 'An account already uses this email. Sign in or reset your password.',
    weak: 'Use a stronger password with at least 8 characters.', limited: 'Too many attempts. Please wait and try again.', network: 'Check your connection and try again.',
    addEvent: 'Create an event', publish: 'Publish event', publishing: 'Publishing…', published: 'Event published. The calendar is up to date.',
    addCategory: '+ Add a new category', newCategory: 'New category name',
    editEvent: 'Edit event', deleteEvent: 'Delete event', saveEvent: 'Save changes', saving: 'Saving…', updated: 'Event updated. The calendar is up to date.',
    deleteQuestion: 'Delete', deleteHint: 'This permanently removes the event from the calendar.', confirmDelete: 'Confirm deletion', deleting: 'Deleting…', deleted: 'Event deleted.', cancel: 'Cancel',
    registration: 'Registration', registrationOpen: 'Open', registrationClosed: 'Closed', validDate: 'Choose a valid date, time, and time zone.',
    allEvents: 'All events', includePast: 'Include past events', showAll: 'Show all events',
    eventTitle: 'Title', eventTitleEs: 'Spanish title (optional)', descriptionLabel: 'Description', descriptionEs: 'Spanish description (optional)', location: 'Location', date: 'Date and time', zone: 'Time zone', category: 'Category',
    signInHint: 'Sign in to your administrator account to publish events.', memberHint: 'Only chamber administrators can publish events.',
    future: 'Choose a valid future date, time, and time zone.', liveError: 'Live events are unavailable. Please retry.', retry: 'Retry',
    adminHint: 'Published events appear for every visitor in real time.',
  },
  es: {
    status: 'Estado', statusSignedIn: 'Sesión iniciada', statusSignedOut: 'Sin iniciar sesión', guest: 'Visitante',
    account: 'Mi cuenta', signIn: 'Iniciar sesión', signUp: 'Crear cuenta', signOut: 'Cerrar sesión', name: 'Nombre completo', email: 'Correo electrónico', password: 'Contraseña',
    title: 'Bienvenido a DUSACCOM', description: 'Crea tu cuenta o inicia sesión en tu comunidad.', forgot: '¿Olvidaste tu contraseña?', reset: 'Enviar enlace', back: 'Volver al inicio de sesión',
    resetSent: 'Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña.', working: 'Espera un momento…', member: 'Miembro', admin: 'Administrador',
    signedIn: 'Has iniciado sesión.', calendar: 'Ir al calendario de eventos', unavailable: 'Estamos configurando el acceso a cuentas. Inténtalo más tarde.',
    failed: 'No pudimos completar la solicitud. Inténtalo de nuevo.', invalid: 'Revisa tu correo y contraseña e inténtalo de nuevo.', exists: 'Ya existe una cuenta con este correo. Inicia sesión o restablece tu contraseña.',
    weak: 'Usa una contraseña más segura de al menos 8 caracteres.', limited: 'Demasiados intentos. Espera e inténtalo de nuevo.', network: 'Revisa tu conexión e inténtalo de nuevo.',
    addEvent: 'Crear un evento', publish: 'Publicar evento', publishing: 'Publicando…', published: 'Evento publicado. El calendario está actualizado.',
    addCategory: '+ Agregar una nueva categoría', newCategory: 'Nombre de la nueva categoría',
    editEvent: 'Editar evento', deleteEvent: 'Eliminar evento', saveEvent: 'Guardar cambios', saving: 'Guardando…', updated: 'Evento actualizado. El calendario está al día.',
    deleteQuestion: '¿Eliminar', deleteHint: 'El evento se eliminará permanentemente del calendario.', confirmDelete: 'Confirmar eliminación', deleting: 'Eliminando…', deleted: 'Evento eliminado.', cancel: 'Cancelar',
    registration: 'Inscripciones', registrationOpen: 'Abiertas', registrationClosed: 'Cerradas', validDate: 'Elige una fecha, una hora y una zona horaria válidas.',
    allEvents: 'Todos los eventos', includePast: 'Incluir eventos pasados', showAll: 'Ver todos los eventos',
    eventTitle: 'Título', eventTitleEs: 'Título en español (opcional)', descriptionLabel: 'Descripción', descriptionEs: 'Descripción en español (opcional)', location: 'Lugar', date: 'Fecha y hora', zone: 'Zona horaria', category: 'Categoría',
    signInHint: 'Inicia sesión con tu cuenta de administrador para publicar eventos.', memberHint: 'Solo los administradores de la cámara pueden publicar eventos.',
    future: 'Elige una fecha futura, una hora y una zona horaria válidas.', liveError: 'Los eventos en vivo no están disponibles. Inténtalo de nuevo.', retry: 'Reintentar',
    adminHint: 'Los eventos publicados aparecen para todos los visitantes en tiempo real.',
  },
};

export function accountError(error: unknown, lang: 'en' | 'es') {
  const t = accountCopy[lang];
  const code = (error as { code?: string })?.code;
  if (code === 'auth/email-already-in-use') return t.exists;
  if (['auth/weak-password', 'auth/password-does-not-meet-requirements'].includes(code || '')) return t.weak;
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(code || '')) return t.invalid;
  if (code === 'auth/too-many-requests') return t.limited;
  if (code === 'auth/network-request-failed') return t.network;
  return t.failed;
}

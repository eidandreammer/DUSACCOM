export const accountSettingsCopy = {
  en: {
    title: 'Account settings', profile: 'Edit profile', password: 'Change password', email: 'Change email',
    name: 'Full name', currentPassword: 'Current password', newPassword: 'New password', confirmPassword: 'Confirm new password', newEmail: 'New email address',
    save: 'Save changes', saving: 'Saving…', nameSaved: 'Your name was updated.', passwordSaved: 'Your password was changed.',
    emailSent: 'A verification link was sent to your new email. Open it to complete the change, then sign in with that email.',
    emailHint: 'Your email changes only after you verify the new address. Existing delegates keep their current shared login email.',
    sharedEmailHint: 'This is a shared team login email. Your parent administrator manages it.',
    mismatch: 'The new passwords do not match.', invalidName: 'Enter a name between 2 and 100 characters.', invalidPassword: 'Use a password between 8 and 128 characters.',
    deleteAccount: 'Delete account', deleteTitle: 'Delete your account?', deleteHint: 'This permanently removes your login. Published events remain. Delete your delegates first if you manage a team.',
    verify: 'Verify password to continue', verifyHint: 'Confirm your current password, then hold the delete button for five seconds.',
    hold: 'Hold for 5 seconds to delete', holding: 'Keep holding…', holdHint: 'Hold the mouse or touch, or hold Space or Enter. Releasing early cancels.',
    deleting: 'Deleting…', cancel: 'Cancel', close: 'Close', confirm: 'Confirm deletion', deleted: 'Your account was deleted.',
    requestDeletion: 'Request account deletion', requestTitle: 'Request account deletion?', requestHint: 'Your parent administrator must approve this request. Your login stays active until they approve.',
    requested: 'Your deletion request was sent to your parent administrator.', pending: 'Deletion request pending parent approval.', declined: 'Your parent declined the previous request. You can submit a new one.',
    delegateDeleteTitle: 'Delete this delegate account?', delegateDeleteHint: 'This permanently removes the delegate’s login and administrator access. Published events remain.',
    approve: 'Approve and delete', decline: 'Decline request', requestBadge: 'Deletion requested', retryDelete: 'Retry deletion',
    delegateDeleted: 'The delegate’s account was deleted.', requestDeclined: 'The deletion request was declined.',
    unavailable: 'Account deletion is temporarily unavailable. Please try again later.',
    recent: 'Confirm your current password again to continue.', parentRequired: 'Only the parent administrator can perform this action.',
    delegatesRemain: 'Delete your delegate accounts before deleting your parent account.', expired: 'This confirmation expired. Close the popup and start again.',
    tooEarly: 'Hold the button continuously for five seconds.', failed: 'The change could not be completed. Please try again.',
  },
  es: {
    title: 'Configuración de la cuenta', profile: 'Editar perfil', password: 'Cambiar contraseña', email: 'Cambiar correo',
    name: 'Nombre completo', currentPassword: 'Contraseña actual', newPassword: 'Nueva contraseña', confirmPassword: 'Confirmar nueva contraseña', newEmail: 'Nuevo correo electrónico',
    save: 'Guardar cambios', saving: 'Guardando…', nameSaved: 'Tu nombre fue actualizado.', passwordSaved: 'Tu contraseña fue cambiada.',
    emailSent: 'Enviamos un enlace de verificación a tu nuevo correo. Ábrelo para completar el cambio e inicia sesión con ese correo.',
    emailHint: 'Tu correo cambia después de verificar la nueva dirección. Los delegados existentes conservan su correo compartido actual.',
    sharedEmailHint: 'Este es un correo compartido del equipo. Tu administrador principal lo administra.',
    mismatch: 'Las nuevas contraseñas no coinciden.', invalidName: 'Ingresa un nombre de entre 2 y 100 caracteres.', invalidPassword: 'Usa una contraseña de entre 8 y 128 caracteres.',
    deleteAccount: 'Eliminar cuenta', deleteTitle: '¿Eliminar tu cuenta?', deleteHint: 'Se eliminará tu acceso de forma permanente. Los eventos publicados permanecen. Elimina primero a tus delegados si administras un equipo.',
    verify: 'Verificar contraseña para continuar', verifyHint: 'Confirma tu contraseña actual y mantén pulsado el botón de eliminar durante cinco segundos.',
    hold: 'Mantén pulsado 5 segundos para eliminar', holding: 'Sigue pulsando…', holdHint: 'Mantén pulsado el ratón, la pantalla, Espacio o Enter. Soltar antes cancela.',
    deleting: 'Eliminando…', cancel: 'Cancelar', close: 'Cerrar', confirm: 'Confirmar eliminación', deleted: 'Tu cuenta fue eliminada.',
    requestDeletion: 'Solicitar eliminación de cuenta', requestTitle: '¿Solicitar la eliminación de tu cuenta?', requestHint: 'Tu administrador principal debe aprobar la solicitud. Tu acceso continúa activo hasta su aprobación.',
    requested: 'Enviamos tu solicitud de eliminación a tu administrador principal.', pending: 'Solicitud de eliminación pendiente de aprobación.', declined: 'Tu administrador rechazó la solicitud anterior. Puedes enviar otra.',
    delegateDeleteTitle: '¿Eliminar esta cuenta delegada?', delegateDeleteHint: 'Se eliminarán permanentemente el acceso y los permisos del delegado. Los eventos publicados permanecen.',
    approve: 'Aprobar y eliminar', decline: 'Rechazar solicitud', requestBadge: 'Eliminación solicitada', retryDelete: 'Reintentar eliminación',
    delegateDeleted: 'La cuenta del delegado fue eliminada.', requestDeclined: 'La solicitud de eliminación fue rechazada.',
    unavailable: 'La eliminación de cuentas no está disponible en este momento. Inténtalo más tarde.',
    recent: 'Confirma tu contraseña actual nuevamente para continuar.', parentRequired: 'Solo el administrador principal puede realizar esta acción.',
    delegatesRemain: 'Elimina las cuentas de tus delegados antes de eliminar tu cuenta principal.', expired: 'Esta confirmación expiró. Cierra el cuadro y empieza de nuevo.',
    tooEarly: 'Mantén pulsado el botón durante cinco segundos seguidos.', failed: 'No se pudo completar el cambio. Inténtalo de nuevo.',
  },
};

export function settingsError(error: unknown, lang: 'en' | 'es') {
  const t = accountSettingsCopy[lang];
  const code = (error as { code?: string })?.code;
  if (['auth/wrong-password', 'auth/invalid-credential', 'auth/requires-recent-login', 'account/recent-login-required', 'account/sign-in-required'].includes(code || '')) return t.recent;
  if (code === 'account/delegates-remain') return t.delegatesRemain;
  if (code === 'account/confirmation-expired') return t.expired;
  if (code === 'account/hold-required') return t.tooEarly;
  if (['account/parent-required', 'account/parent-approval-required', 'account/not-your-delegate'].includes(code || '')) return t.parentRequired;
  if (code === 'account/temporarily-unavailable') return t.unavailable;
  if (code === 'account/invalid-name') return t.invalidName;
  if (['account/invalid-password', 'auth/weak-password', 'auth/password-does-not-meet-requirements'].includes(code || '')) return t.invalidPassword;
  return t.failed;
}

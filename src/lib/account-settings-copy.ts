import type { Lang } from './translations';

const settingsBase = {
  en: {
    verifyEmail: 'Send email verification link', verificationSent: 'A verification link was sent to your current email address.',
    title: 'Account settings', profile: 'Edit profile', password: 'Change password', email: 'Change email',
    name: 'Full name', currentPassword: 'Current password', newPassword: 'New password', confirmPassword: 'Confirm new password', newEmail: 'New email address',
    save: 'Save changes', saving: 'Saving…', nameSaved: 'Your name was updated.', passwordSaved: 'Your password was changed.',
    sendEmailConfirmation: 'Send confirmation to new email', sendingEmailConfirmation: 'Sending confirmation…',
    emailSent: 'Email change pending. We sent a confirmation link to {email}. Your current email is still active. Confirm from the new mailbox to complete the change, then sign in with the new email.',
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
    verifyEmail: 'Enviar enlace de verificación', verificationSent: 'Enviamos un enlace de verificación a tu correo actual.',
    title: 'Configuración de la cuenta', profile: 'Editar perfil', password: 'Cambiar contraseña', email: 'Cambiar correo',
    name: 'Nombre completo', currentPassword: 'Contraseña actual', newPassword: 'Nueva contraseña', confirmPassword: 'Confirmar nueva contraseña', newEmail: 'Nuevo correo electrónico',
    save: 'Guardar cambios', saving: 'Guardando…', nameSaved: 'Tu nombre fue actualizado.', passwordSaved: 'Tu contraseña fue cambiada.',
    sendEmailConfirmation: 'Enviar confirmación al nuevo correo', sendingEmailConfirmation: 'Enviando confirmación…',
    emailSent: 'Cambio de correo pendiente. Enviamos un enlace de confirmación a {email}. Tu correo actual sigue activo. Confirma desde el nuevo buzón para completar el cambio y luego inicia sesión con el nuevo correo.',
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

type SettingsBaseShape = Record<keyof typeof settingsBase.en, string>;
// Parity: Record<Lang, Shape> makes a missing or extra key in any language a compile error.
export const accountSettingsCopy: Record<Lang, SettingsBaseShape> = {
  ...settingsBase,
  pt: {
    verifyEmail: 'Enviar link de verificação', verificationSent: 'Enviamos um link de verificação para o seu e-mail atual.',
    sendEmailConfirmation: 'Enviar confirmação para o novo e-mail', sendingEmailConfirmation: 'Enviando confirmação…',
    title: 'Configurações da conta', profile: 'Editar perfil', password: 'Alterar senha', email: 'Alterar e-mail',
    name: 'Nome completo', currentPassword: 'Senha atual', newPassword: 'Nova senha', confirmPassword: 'Confirmar nova senha', newEmail: 'Novo endereço de e-mail',
    save: 'Salvar alterações', saving: 'Salvando…', nameSaved: 'Seu nome foi atualizado.', passwordSaved: 'Sua senha foi alterada.',
    emailSent: 'Enviamos um link de verificação para o seu novo e-mail. Abra-o para concluir a alteração e depois entre com esse e-mail.',
    emailHint: 'Seu e-mail só muda depois que você verificar o novo endereço. Os delegados existentes mantêm o e-mail de login compartilhado atual.',
    sharedEmailHint: 'Este é um e-mail de login compartilhado da equipe. O seu administrador principal o gerencia.',
    mismatch: 'As novas senhas não coincidem.', invalidName: 'Informe um nome com 2 a 100 caracteres.', invalidPassword: 'Use uma senha com 8 a 128 caracteres.',
    deleteAccount: 'Excluir conta', deleteTitle: 'Excluir a sua conta?', deleteHint: 'Isto remove o seu acesso de forma permanente. Os eventos publicados permanecem. Exclua primeiro os seus delegados se você gerencia uma equipe.',
    verify: 'Confirme a senha para continuar', verifyHint: 'Confirme a sua senha atual e depois mantenha o botão de excluir pressionado por cinco segundos.',
    hold: 'Mantenha pressionado por 5 segundos para excluir', holding: 'Continue segurando…', holdHint: 'Mantenha o mouse ou o toque pressionado, ou segure Espaço ou Enter. Soltar antes cancela.',
    deleting: 'Excluindo…', cancel: 'Cancelar', close: 'Fechar', confirm: 'Confirmar exclusão', deleted: 'Sua conta foi excluída.',
    requestDeletion: 'Solicitar exclusão da conta', requestTitle: 'Solicitar a exclusão da sua conta?', requestHint: 'O seu administrador principal precisa aprovar esta solicitação. Seu acesso continua ativo até a aprovação.',
    requested: 'Sua solicitação de exclusão foi enviada ao seu administrador principal.', pending: 'Solicitação de exclusão aguardando aprovação do administrador principal.', declined: 'O seu administrador principal recusou a solicitação anterior. Você pode enviar uma nova.',
    delegateDeleteTitle: 'Excluir esta conta de delegado?', delegateDeleteHint: 'Isto remove de forma permanente o login e o acesso de administrador do delegado. Os eventos publicados permanecem.',
    approve: 'Aprovar e excluir', decline: 'Recusar solicitação', requestBadge: 'Exclusão solicitada', retryDelete: 'Tentar excluir novamente',
    delegateDeleted: 'A conta do delegado foi excluída.', requestDeclined: 'A solicitação de exclusão foi recusada.',
    unavailable: 'A exclusão de contas está temporariamente indisponível. Tente novamente mais tarde.',
    recent: 'Confirme a sua senha atual novamente para continuar.', parentRequired: 'Somente o administrador principal pode realizar esta ação.',
    delegatesRemain: 'Exclua as contas dos seus delegados antes de excluir a sua conta principal.', expired: 'Esta confirmação expirou. Feche a janela e comece de novo.',
    tooEarly: 'Mantenha o botão pressionado continuamente por cinco segundos.', failed: 'Não foi possível concluir a alteração. Tente novamente.',
  },
};

export function settingsError(error: unknown, lang: Lang) {
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

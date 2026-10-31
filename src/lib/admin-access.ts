export type AdminRole = {
  enabled?: unknown;
  parentUid?: unknown;
};

export function adminAccess(role?: AdminRole, parent?: AdminRole) {
  const enabled = role?.enabled === true;
  const root = role != null && role.parentUid == null;
  const parentActive = typeof role?.parentUid === 'string' && role.parentUid.length > 0
    && parent?.enabled === true && parent.parentUid == null;
  return { isAdmin: enabled && (root || parentActive), canManageAdmins: enabled && root };
}

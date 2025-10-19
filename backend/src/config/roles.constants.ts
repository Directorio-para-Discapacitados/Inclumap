export const ALLOWED_ROLES = ['usuario', 'administrador'] as const;
export type AllowedRole = (typeof ALLOWED_ROLES)[number];
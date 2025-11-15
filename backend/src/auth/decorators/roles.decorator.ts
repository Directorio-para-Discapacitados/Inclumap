import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Enum para mejor organización
export enum UserRole {
  ADMIN = 1,
  USER = 2,
  BUSINESS = 3,
}

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

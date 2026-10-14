import { SetMetadata } from '@nestjs/common';
import { Role } from './role.enum';

export const ROLES_KEY = 'roles';

// Usage: @Roles(Role.Admin, Role.WorkshopStaff)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

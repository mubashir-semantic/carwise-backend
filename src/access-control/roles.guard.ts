import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { normalizeRole, Role } from './role.enum';
import { ROLES_KEY } from './roles.decorator';

// Hamesha AuthGuard('jwt') ke BAAD lagana:
// @UseGuards(AuthGuard('jwt'), RolesGuard)
//
// Role token se nahi, DB se padhte hain. Is tarah admin kisi ka role badle
// to purana token bhi naye role ke saath hi chalta hai.
// Guard request par req.user.role (normalized) bhi set kar deta hai,
// jise controllers/services aage use karte hain.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }

    const userDoc = await this.connection
      .model('User')
      .findById(userId)
      .select('role')
      .lean<{ role?: string }>()
      .exec();

    if (!userDoc) {
      throw new UnauthorizedException('User no longer exists');
    }

    const role = normalizeRole(userDoc.role);
    request.user.role = role;

    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // @Roles() nahi laga = koi bhi logged-in user chal sakta hai
    if (!required || required.length === 0) {
      return true;
    }

    if (!required.includes(role)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }
    return true;
  }
}

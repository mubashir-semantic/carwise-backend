import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Connection, isValidObjectId } from 'mongoose';
import { normalizeRole, Role } from '../access-control/role.enum';
import {
  escapeRegex,
  parsePaging,
} from '../workshops/workshops.service';
import type { AuthUser } from '../workshops/workshops.service';
import {
  CreateAdminUserDto,
  ListUsersQueryDto,
  UpdateAdminUserDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './dto/admin-user.dto';
import type { AssignableRole } from './dto/admin-user.dto';

// Password, OTP aur tokens kabhi bahar nahi jate
const SAFE_SELECT =
  '-password -otp -otpExpires -otpResendAttempts -otpInvalidAttempts -otpLockoutUntil -refreshToken';

// DB mein role alag-alag tarah likha ho sakta hai (Admin, admin, Workshop Staff ...)
const ADMIN_RX = /^admin$/i;
const STAFF_RX = /^(workshop[\s_-]*staff|staff)$/i;

// Role DB mein is shakal mein save karte hain
const STORED_ROLE: Record<AssignableRole, string> = {
  admin: 'admin',
  workshop_staff: 'workshop_staff',
  customer: 'user',
};

export function roleFilter(role: AssignableRole): Record<string, unknown> {
  if (role === 'admin') return { role: ADMIN_RX };
  if (role === 'workshop_staff') return { role: STAFF_RX };
  // Customer = jo admin ya staff nahi (role khali ho tab bhi)
  return { role: { $not: new RegExp(`${ADMIN_RX.source}|${STAFF_RX.source}`, 'i') } };
}

export const ACTIVE_FILTER = { isActive: { $ne: false } };

function present(user: Record<string, any>): Record<string, any> {
  return {
    ...user,
    roleKey: normalizeRole(user.role),
    isActive: user.isActive !== false,
  };
}

@Injectable()
export class AdminUsersService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  private get userModel() {
    return this.connection.model('User');
  }

  private get workshopModel() {
    return this.connection.model('Workshop');
  }

  private assertId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid user id');
    }
  }

  private async findOrFail(id: string): Promise<Record<string, any>> {
    this.assertId(id);
    const user = await this.userModel
      .findById(id)
      .select(SAFE_SELECT)
      .lean<Record<string, any>>()
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // Aakhri active admin ko hatane / deactivate karne se rokta hai
  private async assertAnotherAdminExists(excludeId: string) {
    const others = await this.userModel.countDocuments({
      _id: { $ne: excludeId },
      ...roleFilter('admin'),
      ...ACTIVE_FILTER,
    });
    if (others === 0) {
      throw new BadRequestException(
        'There must be at least one active admin. Make another user admin first.',
      );
    }
  }

  async findAll(query: ListUsersQueryDto): Promise<Record<string, any>> {
    const { page, limit, skip } = parsePaging(query.page, query.limit);
    const conditions: Record<string, unknown>[] = [];

    if (query.role) conditions.push(roleFilter(query.role));
    if (query.status === 'active') conditions.push(ACTIVE_FILTER);
    if (query.status === 'inactive') conditions.push({ isActive: false });
    if (query.search) {
      const rx = new RegExp(escapeRegex(query.search.trim()), 'i');
      conditions.push({
        $or: [
          { username: rx },
          { firstName: rx },
          { lastName: rx },
          { email: rx },
          { mobile: rx },
        ],
      });
    }
    const filter = conditions.length > 0 ? { $and: conditions } : {};

    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select(SAFE_SELECT)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<Record<string, any>[]>()
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      items: items.map(present),
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    };
  }

  async findOne(id: string): Promise<Record<string, any>> {
    const user = await this.findOrFail(id);
    // Ye user kis workshop ka staff hai
    const workshops = await this.workshopModel
      .find({ staff: id })
      .select('name city status')
      .lean<Record<string, any>[]>()
      .exec();
    return { ...present(user), workshops };
  }

  async create(dto: CreateAdminUserDto): Promise<Record<string, any>> {
    const email = dto.email.trim();
    const exists = await this.userModel.exists({
      email: new RegExp(`^${escapeRegex(email)}$`, 'i'),
    });
    if (exists) throw new ConflictException('Email is already registered');

    const created = await this.userModel.create({
      username: dto.username.trim(),
      email,
      password: await bcrypt.hash(dto.password, 10),
      firstName: dto.firstName?.trim(),
      lastName: dto.lastName?.trim(),
      mobile: dto.mobile?.trim(),
      role: STORED_ROLE[dto.role ?? 'customer'],
      // Admin ne khud banaya hai, OTP verification ki zaroorat nahi
      isEmailVerified: true,
      isActive: true,
    });
    return this.findOrFail(String(created._id)).then(present);
  }

  async update(
    id: string,
    dto: UpdateAdminUserDto,
  ): Promise<Record<string, any>> {
    await this.findOrFail(id);

    const data: Record<string, unknown> = {};
    (['username', 'firstName', 'lastName', 'mobile', 'address'] as const).forEach(
      (key) => {
        const value = dto[key];
        if (value !== undefined) data[key] = value.trim();
      },
    );

    if (dto.email !== undefined) {
      const email = dto.email.trim();
      const taken = await this.userModel.exists({
        _id: { $ne: id },
        email: new RegExp(`^${escapeRegex(email)}$`, 'i'),
      });
      if (taken) throw new ConflictException('Email is already registered');
      data.email = email;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Nothing to update');
    }

    await this.userModel.updateOne({ _id: id }, { $set: data }).exec();
    return present(await this.findOrFail(id));
  }

  async setRole(
    id: string,
    dto: UpdateUserRoleDto,
    actor: AuthUser,
  ): Promise<Record<string, any>> {
    const user = await this.findOrFail(id);
    const current = normalizeRole(user.role);

    if (id === actor.userId) {
      throw new BadRequestException('You cannot change your own role');
    }
    if (current === Role.Admin && dto.role !== 'admin') {
      await this.assertAnotherAdminExists(id);
    }

    await this.userModel
      .updateOne({ _id: id }, { $set: { role: STORED_ROLE[dto.role] } })
      .exec();

    // Staff nahi raha to workshop ki staff list se bhi hata do
    if (current === Role.WorkshopStaff && dto.role !== 'workshop_staff') {
      await this.workshopModel
        .updateMany({ staff: id }, { $pull: { staff: id } })
        .exec();
    }

    return present(await this.findOrFail(id));
  }

  async setStatus(
    id: string,
    dto: UpdateUserStatusDto,
    actor: AuthUser,
  ): Promise<Record<string, any>> {
    const user = await this.findOrFail(id);

    if (!dto.isActive) {
      if (id === actor.userId) {
        throw new BadRequestException('You cannot deactivate your own account');
      }
      if (normalizeRole(user.role) === Role.Admin) {
        await this.assertAnotherAdminExists(id);
      }
    }

    await this.userModel
      .updateOne(
        { _id: id },
        dto.isActive
          ? { $set: { isActive: true } }
          // Refresh token hata dete hain taake naya access token na ban sake
          : { $set: { isActive: false }, $unset: { refreshToken: '' } },
      )
      .exec();

    return present(await this.findOrFail(id));
  }
}

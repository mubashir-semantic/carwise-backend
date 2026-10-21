import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { normalizeRole, Role } from '../access-control/role.enum';
import { Workshop, WorkshopDocument } from './workshop.schema';
import {
  CreateWorkshopDto,
  ListWorkshopsQueryDto,
  UpdateWorkshopDto,
  UpdateWorkshopStatusDto,
} from './dto/workshop.dto';

// Staff ki list mein sirf itna user data bhejte hain (password kabhi nahi)
const STAFF_FIELDS = 'username firstName lastName email mobile avatar';

export interface AuthUser {
  userId: string;
  role: Role;
}

export function parsePaging(page?: string, limit?: string) {
  const p = parseInt(page ?? '1', 10);
  const l = parseInt(limit ?? '10', 10);
  const safePage = Number.isNaN(p) ? 1 : Math.max(p, 1);
  const safeLimit = Number.isNaN(l) ? 10 : Math.min(Math.max(l, 1), 100);
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

// Id DB mein ObjectId ya string, dono shakal mein ho sakti hai.
// Query mein dono shakal bhejte hain taake match hamesha ho.
export function idForms(id: string): any[] {
  return isValidObjectId(id) ? [id, new Types.ObjectId(id)] : [id];
}

export function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class WorkshopsService {
  constructor(
    @InjectModel(Workshop.name)
    private readonly model: Model<WorkshopDocument>,
  ) {}

  private assertId(id: string, label = 'workshop') {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid ${label} id`);
    }
  }

  // Ye model 'User' schema se jura hota hai jo Auth module ne register kiya hai
  private get userModel() {
    return this.model.db.model('User');
  }

  // Staff ke ids se user ka data laate hain (populate par depend nahi karte,
  // taake id string ho ya ObjectId, dono mein naam aur email aayein)
  private async withStaff<T extends { staff?: unknown[] }>(
    workshop: T,
  ): Promise<Record<string, any>> {
    const ids = (workshop.staff ?? [])
      .map((s: any) => String(s?._id ?? s))
      .filter((id) => isValidObjectId(id));
    const users = ids.length
      ? await this.userModel
          .find({ _id: { $in: ids } })
          .select(STAFF_FIELDS)
          .lean()
      : [];
    return { ...workshop, staff: users };
  }

  async create(dto: CreateWorkshopDto) {
    return this.model.create(dto);
  }

  async findAll(
    user: AuthUser,
    query: ListWorkshopsQueryDto,
  ): Promise<Record<string, any>> {
    const { page, limit, skip } = parsePaging(query.page, query.limit);
    const filter: Record<string, unknown> = {};

    if (user.role === Role.Admin) {
      if (query.status) filter.status = query.status;
    } else {
      // Baqi sab sirf active workshops dekh sakte hain
      filter.status = 'active';
    }
    if (query.city) {
      filter.city = new RegExp(`^${escapeRegex(query.city)}$`, 'i');
    }
    if (query.search) {
      const rx = new RegExp(escapeRegex(query.search), 'i');
      filter.$or = [{ name: rx }, { city: rx }, { address: rx }];
    }

    const staffSelect = user.role === Role.Admin ? '' : '-staff';
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .select(staffSelect)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    };
  }

  // Workshop Staff: apna workshop
  async findMine(userId: string): Promise<Record<string, any>> {
    const workshop = await this.model
      .findOne({ staff: { $in: idForms(userId) } })
      .lean();
    if (!workshop) {
      throw new NotFoundException('No workshop is assigned to your account');
    }
    return this.withStaff(workshop);
  }

  async findOne(id: string, user: AuthUser): Promise<Record<string, any>> {
    this.assertId(id);
    const workshop = await this.model.findById(id).lean();
    if (!workshop) throw new NotFoundException('Workshop not found');

    const isOwnStaff =
      user.role === Role.WorkshopStaff &&
      workshop.staff.some((s) => String(s) === user.userId);

    if (user.role === Role.Admin || isOwnStaff) {
      return this.withStaff(workshop);
    }

    // Baqi log sirf active workshop dekh sakte hain, staff list ke baghair
    if (workshop.status !== 'active') {
      throw new NotFoundException('Workshop not found');
    }
    const { staff: _staff, ...publicData } = workshop;
    return publicData;
  }

  async update(
    id: string,
    dto: UpdateWorkshopDto,
    user: AuthUser,
  ): Promise<Record<string, any>> {
    this.assertId(id);
    const workshop = await this.model.findById(id).exec();
    if (!workshop) throw new NotFoundException('Workshop not found');

    const data: UpdateWorkshopDto = { ...dto };

    if (user.role !== Role.Admin) {
      const isOwnStaff = workshop.staff.some(
        (s) => String(s) === user.userId,
      );
      if (!isOwnStaff) {
        throw new ForbiddenException('You can only update your own workshop');
      }
      // Staff status nahi badal sakta
      delete data.status;
    }

    workshop.set(data);
    await workshop.save();
    const updated = await this.model.findById(id).lean();
    if (!updated) throw new NotFoundException('Workshop not found');
    return this.withStaff(updated);
  }

  async setStatus(
    id: string,
    dto: UpdateWorkshopStatusDto,
  ): Promise<Record<string, any>> {
    this.assertId(id);
    const workshop = await this.model
      .findByIdAndUpdate(id, { status: dto.status }, { new: true })
      .lean();
    if (!workshop) throw new NotFoundException('Workshop not found');
    return workshop;
  }

  async remove(id: string) {
    this.assertId(id);

    // Bookings wale workshop ko delete karne ki jagah inactive karna behtar hai
    try {
      const hasBookings = await this.model.db
        .model('Booking')
        .exists({ workshop: id });
      if (hasBookings) {
        throw new BadRequestException(
          'This workshop has bookings. Set its status to inactive instead of deleting it.',
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      // Booking model register na ho to check chhor dete hain
    }

    const workshop = await this.model.findByIdAndDelete(id).lean();
    if (!workshop) throw new NotFoundException('Workshop not found');
    return { message: 'Workshop deleted successfully' };
  }

  async addStaff(id: string, userId: string): Promise<Record<string, any>> {
    this.assertId(id);
    this.assertId(userId, 'user');

    const user = await this.userModel
      .findById(userId)
      .select('role')
      .lean<{ role?: string }>()
      .exec();
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.model.findById(id).lean();
    if (!existing) throw new NotFoundException('Workshop not found');
    const alreadyStaff = (existing.staff ?? []).some(
      (s) => String(s) === userId,
    );
    const updatedDoc = alreadyStaff
      ? existing
      : await this.model
          .findByIdAndUpdate(id, { $addToSet: { staff: userId } }, { new: true })
          .lean();
    if (!updatedDoc) throw new NotFoundException('Workshop not found');
    const workshop = await this.withStaff(updatedDoc);

    // Admin ka role kabhi nahi badalte. Baqi ko Workshop Staff bana dete hain.
    if (normalizeRole(user.role) !== Role.Admin) {
      await this.userModel.updateOne(
        { _id: userId },
        { role: Role.WorkshopStaff },
      );
    }
    return workshop;
  }

  async removeStaff(
    id: string,
    userId: string,
  ): Promise<Record<string, any>> {
    this.assertId(id);
    this.assertId(userId, 'user');
    const updatedDoc = await this.model
      .findByIdAndUpdate(
        id,
        { $pull: { staff: { $in: idForms(userId) } } },
        { new: true },
      )
      .lean();
    if (!updatedDoc) throw new NotFoundException('Workshop not found');
    return this.withStaff(updatedDoc);
  }
}

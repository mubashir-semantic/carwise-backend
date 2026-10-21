import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { isValidObjectId, Model } from 'mongoose';
import { Role } from '../access-control/role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { Workshop, WorkshopDocument } from '../workshops/workshop.schema';
import { escapeRegex, idForms, parsePaging } from '../workshops/workshops.service';
import type { AuthUser } from '../workshops/workshops.service';
import { Booking } from './booking.schema';
import type { BookingDocument, BookingStatus } from './booking.schema';
import {
  CreateBookingDto,
  ListBookingsQueryDto,
  UpdateBookingStatusDto,
} from './dto/booking.dto';

const CUSTOMER_FIELDS = 'username firstName lastName email mobile avatar';
const WORKSHOP_FIELDS = 'name city address phone email status';

// Kaun si status se kaun si status mein ja sakte hain
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name)
    private readonly model: Model<BookingDocument>,
    @InjectModel(Workshop.name)
    private readonly workshopModel: Model<WorkshopDocument>,
    private readonly notifications: NotificationsService,
  ) {}

  private assertId(id: string, label = 'booking') {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid ${label} id`);
    }
  }

  private get userModel() {
    return this.model.db.model('User');
  }

  private newReference() {
    const d = new Date();
    const day = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    return `BK-${day}-${randomBytes(3).toString('hex').toUpperCase()}`;
  }

  // Staff ke workshops ke ids
  private async workshopIdsOfStaff(userId: string) {
    const workshops = await this.workshopModel
      .find({ staff: { $in: idForms(userId) } })
      .select('_id')
      .lean();
    // Booking mein workshop id string ho ya ObjectId, dono se match karo
    return workshops.flatMap((w) => idForms(String(w._id)));
  }

  private populateAll<T extends { populate: (...args: any[]) => any }>(q: T) {
    return q
      .populate('customer', CUSTOMER_FIELDS)
      .populate('workshop', WORKSHOP_FIELDS)
      .populate('vehicle');
  }

  // ---------------------------------------------------------------
  // CREATE (mobile app / customer)
  // ---------------------------------------------------------------
  async create(
    user: AuthUser,
    dto: CreateBookingDto,
  ): Promise<Record<string, any>> {
    const workshop = await this.workshopModel.findById(dto.workshopId).lean();
    if (!workshop || workshop.status !== 'active') {
      throw new NotFoundException('Workshop not found or not available');
    }

    // Purani tareekh par booking nahi
    const bookingDate = new Date(dto.bookingDate);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (bookingDate < startOfToday) {
      throw new BadRequestException('Booking date cannot be in the past');
    }

    if (dto.serviceType === 'pickup_delivery' && !dto.pickupAddress) {
      throw new BadRequestException(
        'pickupAddress is required for pickup & delivery bookings',
      );
    }

    // Gaari agar di hai to wo isi customer ki honi chahiye (jahan owner saved hai)
    if (dto.vehicleId) {
      const vehicle = await this.model.db
        .model('Vehicle')
        .findById(dto.vehicleId)
        .lean<{ userId?: unknown }>()
        .exec();
      if (!vehicle) throw new NotFoundException('Vehicle not found');
      if (vehicle.userId && String(vehicle.userId) !== user.userId) {
        throw new ForbiddenException('This vehicle does not belong to you');
      }
    }

    const booking = await this.model.create({
      reference: this.newReference(),
      customer: user.userId,
      workshop: dto.workshopId,
      vehicle: dto.vehicleId,
      services: dto.services,
      bookingDate,
      timeSlot: dto.timeSlot,
      serviceType: dto.serviceType ?? 'workshop',
      pickupAddress: dto.pickupAddress,
      deliveryAddress: dto.deliveryAddress,
      instructions: dto.instructions,
      status: 'pending',
      statusHistory: [
        { status: 'pending', changedBy: user.userId, at: new Date() },
      ],
    });

    // Notifications: workshop staff ko nayi booking, customer ko confirmation
    await Promise.all([
      ...workshop.staff.map((staffId) =>
        this.notifications.notify({
          recipientId: String(staffId),
          senderId: user.userId,
          text: 'placed a new booking:',
          highlightText: booking.reference,
          category: 'service',
        }),
      ),
      this.notifications.notify({
        recipientId: user.userId,
        text: 'Your booking was placed successfully:',
        highlightText: booking.reference,
        category: 'service',
      }),
    ]);

    return this.populateAll(this.model.findById(booking._id)).lean();
  }

  // ---------------------------------------------------------------
  // LIST: role ke hisaab se scope
  //   Admin   -> sab bookings
  //   Staff   -> sirf apne workshop(s) ki bookings
  //   Customer-> sirf apni bookings
  // ---------------------------------------------------------------
  async findAll(
    user: AuthUser,
    query: ListBookingsQueryDto,
  ): Promise<Record<string, any>> {
    const { page, limit, skip } = parsePaging(query.page, query.limit);
    const filter: Record<string, any> = {};

    if (user.role === Role.WorkshopStaff) {
      const ids = await this.workshopIdsOfStaff(user.userId);
      if (ids.length === 0) {
        return { items: [], total: 0, page, limit, totalPages: 1 };
      }
      filter.workshop = { $in: ids };
    } else if (user.role === Role.Customer) {
      filter.customer = { $in: idForms(user.userId) };
    } else if (query.workshopId) {
      filter.workshop = query.workshopId;
    }

    if (query.status) filter.status = query.status;

    if (query.from || query.to) {
      filter.bookingDate = {};
      if (query.from) filter.bookingDate.$gte = new Date(query.from);
      if (query.to) {
        const end = new Date(query.to);
        end.setHours(23, 59, 59, 999);
        filter.bookingDate.$lte = end;
      }
    }

    if (query.search) {
      const rx = new RegExp(escapeRegex(query.search), 'i');
      const matchingUsers = await this.userModel
        .find({
          $or: [
            { username: rx },
            { firstName: rx },
            { lastName: rx },
            { email: rx },
            { mobile: rx },
          ],
        })
        .select('_id')
        .limit(200)
        .lean();
      filter.$or = [
        { reference: rx },
        { customer: { $in: matchingUsers.map((u) => u._id) } },
      ];
    }

    const [items, total] = await Promise.all([
      this.populateAll(this.model.find(filter))
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

  // Ye user is booking ko dekh/chala sakta hai ya nahi
  private async canAccess(user: AuthUser, booking: BookingDocument) {
    if (user.role === Role.Admin) return true;
    if (user.role === Role.WorkshopStaff) {
      const ids = await this.workshopIdsOfStaff(user.userId);
      return ids.some((id) => String(id) === String(booking.workshop));
    }
    return String(booking.customer) === user.userId;
  }

  async findOne(id: string, user: AuthUser): Promise<Record<string, any>> {
    this.assertId(id);
    const booking = await this.model.findById(id).exec();
    if (!booking || !(await this.canAccess(user, booking))) {
      // Dusre ki booking ka pata hi na chale
      throw new NotFoundException('Booking not found');
    }
    return this.populateAll(this.model.findById(id)).lean();
  }

  // ---------------------------------------------------------------
  // STATUS UPDATE
  //   Admin / us workshop ka staff : allowed transitions
  //   Customer (apni booking)      : sirf cancel (pending / confirmed mein)
  // ---------------------------------------------------------------
  async updateStatus(
    id: string,
    dto: UpdateBookingStatusDto,
    user: AuthUser,
  ): Promise<Record<string, any>> {
    this.assertId(id);
    const booking = await this.model.findById(id).exec();
    if (!booking || !(await this.canAccess(user, booking))) {
      throw new NotFoundException('Booking not found');
    }

    const isCustomer = user.role === Role.Customer;
    if (isCustomer) {
      const canCancel =
        dto.status === 'cancelled' &&
        ['pending', 'confirmed'].includes(booking.status);
      if (!canCancel) {
        throw new ForbiddenException(
          'You can only cancel a pending or confirmed booking',
        );
      }
    }

    if (!ALLOWED_TRANSITIONS[booking.status].includes(dto.status)) {
      throw new BadRequestException(
        `Cannot change status from ${STATUS_LABELS[booking.status]} to ${STATUS_LABELS[dto.status]}`,
      );
    }

    booking.status = dto.status;
    if (dto.status === 'cancelled' && dto.note) {
      booking.cancellationReason = dto.note;
    }
    booking.statusHistory.push({
      status: dto.status,
      changedBy: user.userId as any,
      at: new Date(),
      note: dto.note,
    });
    await booking.save();

    await this.notifyStatusChange(booking, user, dto.status);

    return this.populateAll(this.model.findById(id)).lean();
  }

  private async notifyStatusChange(
    booking: BookingDocument,
    actor: AuthUser,
    status: BookingStatus,
  ) {
    if (actor.role === Role.Customer) {
      // Customer ne cancel kiya -> workshop staff ko batao
      const workshop = await this.workshopModel
        .findById(booking.workshop)
        .select('staff')
        .lean();
      await Promise.all(
        (workshop?.staff ?? []).map((staffId) =>
          this.notifications.notify({
            recipientId: String(staffId),
            senderId: actor.userId,
            text: 'cancelled the booking:',
            highlightText: booking.reference,
            category: 'service',
          }),
        ),
      );
      return;
    }

    // Admin/Staff ne badla -> customer ko batao
    await this.notifications.notify({
      recipientId: String(booking.customer),
      senderId: actor.userId,
      text: `Your booking status is now ${STATUS_LABELS[status]}:`,
      highlightText: booking.reference,
      category: 'service',
    });
  }

  async remove(id: string) {
    this.assertId(id);
    const booking = await this.model.findByIdAndDelete(id).lean();
    if (!booking) throw new NotFoundException('Booking not found');
    return { message: 'Booking deleted successfully' };
  }
}

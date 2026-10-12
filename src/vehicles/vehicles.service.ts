import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Vehicle } from './schemas/vehicle.schema';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Role } from '../auth/roles.enum'; // Role enum import kiya hai
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<Vehicle>,
    private notificationsService: NotificationsService,
  ) {}

  // Galat id par 500 ki jagah 400 dene ke liye
  private assertValidId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid vehicle id');
    }
  }

  // Record ke owner ko notification bhejna (fail bhi ho to asli kaam nahi rukta)
  private async notifyOwner(record: unknown, text: string) {
    const ownerId = (record as { userId?: unknown }).userId;
    if (!ownerId) return;
    await this.notificationsService.notify({
      recipientId: String(ownerId),
      text,
      category: 'vehicle',
    });
  }

  // Yahan userId parameter add kiya gaya hai
  async create(
    createVehicleDto: CreateVehicleDto,
    userId: string,
  ): Promise<Vehicle> {
    const newVehicle = new this.vehicleModel({
      ...createVehicleDto,
      userId, // DTO ke sath userId save karwa rahe hain
    });
    const saved = await newVehicle.save();

    // Notification: vehicle add hone par (fail bhi ho to vehicle save rahegi)
    await this.notificationsService.notify({
      recipientId: userId,
      text: 'Your new vehicle was added successfully.',
      category: 'vehicle',
    });

    return saved;
  }

  // Yahan user object parameter add kiya gaya hai aur role check lagaya hai
  async findAll(user: any): Promise<Vehicle[]> {
    // Agar customer hai toh sirf uski apni gaariyan dikhao
    if (user.role === Role.CUSTOMER) {
      return this.vehicleModel
        .find({ userId: user.userId })
        .sort({ createdAt: -1 })
        .exec();
    }
    // Admin aur Workshop Staff ko saari gaariyan dikhao
    return this.vehicleModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Vehicle> {
    this.assertValidId(id);
    const vehicle = await this.vehicleModel.findById(id).exec();
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return vehicle;
  }

  async update(
    id: string,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    this.assertValidId(id);
    const vehicle = await this.vehicleModel
      .findByIdAndUpdate(id, updateVehicleDto, { new: true })
      .exec();
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    await this.notifyOwner(vehicle, 'Your vehicle details were updated.');
    return vehicle;
  }

  async remove(id: string): Promise<{ message: string }> {
    this.assertValidId(id);
    const vehicle = await this.vehicleModel.findByIdAndDelete(id).exec();
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    await this.notifyOwner(vehicle, 'Your vehicle was deleted.');
    return { message: 'Vehicle deleted successfully' };
  }
}

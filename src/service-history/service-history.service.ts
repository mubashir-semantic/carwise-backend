import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { ServiceHistory } from './schemas/service-history.schema';
import { CreateServiceHistoryDto } from './dto/create-service-history.dto';
import { UpdateServiceHistoryDto } from './dto/update-service-history.dto';

@Injectable()
export class ServiceHistoryService {
  constructor(
    @InjectModel(ServiceHistory.name)
    private serviceModel: Model<ServiceHistory>,
  ) {}

  // Galat id par 500 ki jagah 400 dene ke liye
  private assertValidId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid service history id');
    }
  }

  async create(createDto: CreateServiceHistoryDto): Promise<ServiceHistory> {
    const newService = new this.serviceModel(createDto);
    return newService.save();
  }

  async findAll(): Promise<ServiceHistory[]> {
    return this.serviceModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<ServiceHistory> {
    this.assertValidId(id);
    const record = await this.serviceModel.findById(id).exec();
    if (!record) {
      throw new NotFoundException('Service history record not found');
    }
    return record;
  }

  async update(
    id: string,
    updateDto: UpdateServiceHistoryDto,
  ): Promise<ServiceHistory> {
    this.assertValidId(id);
    const record = await this.serviceModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
    if (!record) {
      throw new NotFoundException('Service history record not found');
    }
    return record;
  }

  async remove(id: string): Promise<{ message: string }> {
    this.assertValidId(id);
    const record = await this.serviceModel.findByIdAndDelete(id).exec();
    if (!record) {
      throw new NotFoundException('Service history record not found');
    }
    return { message: 'Service history record deleted successfully' };
  }
}

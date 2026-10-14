import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../access-control/role.enum';
import { Roles } from '../access-control/roles.decorator';
import { RolesGuard } from '../access-control/roles.guard';
import type { AuthUser } from '../workshops/workshops.service';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  ListBookingsQueryDto,
  UpdateBookingStatusDto,
} from './dto/booking.dto';

type AuthRequest = { user: AuthUser };

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(Role.Customer, Role.Admin)
  @ApiOperation({ summary: 'Create a booking (customer)' })
  create(@Request() req: AuthRequest, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.user, dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'List bookings with search, filters and pagination. Admin: all, Workshop Staff: own workshop, Customer: own bookings',
  })
  findAll(@Request() req: AuthRequest, @Query() query: ListBookingsQueryDto) {
    return this.bookingsService.findAll(req.user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Booking details' })
  @ApiParam({ name: 'id', description: 'Booking id' })
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.bookingsService.findOne(id, req.user);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary:
      'Update booking status. Admin / workshop staff: pending > confirmed > in_progress > completed (or cancelled). Customer: cancel only',
  })
  @ApiParam({ name: 'id', description: 'Booking id' })
  updateStatus(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, dto, req.user);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a booking (Admin)' })
  @ApiParam({ name: 'id', description: 'Booking id' })
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(id);
  }
}

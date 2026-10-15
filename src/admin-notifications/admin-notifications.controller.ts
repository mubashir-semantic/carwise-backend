import {
  Body,
  Controller,
  Get,
  Param,
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
import { AdminNotificationsService } from './admin-notifications.service';
import {
  AudienceCountQueryDto,
  ListAdminNotificationsQueryDto,
  SendNotificationDto,
} from './dto/admin-notification.dto';

type AuthRequest = { user: AuthUser };

// Poora controller sirf Admin ke liye
@ApiTags('Admin Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.Admin)
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly service: AdminNotificationsService) {}

  @Post()
  @ApiOperation({
    summary:
      'Send a notification to an audience or selected users (Admin). Duplicate submissions are rejected with 409',
  })
  send(@Request() req: AuthRequest, @Body() dto: SendNotificationDto) {
    return this.service.send(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Notification history with delivery status and read counts (Admin)',
  })
  findAll(@Query() query: ListAdminNotificationsQueryDto) {
    return this.service.findAll(query);
  }

  // NOTE: 'audience-count' ko ':id' se UPAR rakhna zaroori hai
  @Get('audience-count')
  @ApiOperation({ summary: 'How many active users are in an audience (Admin)' })
  audienceCount(@Query() query: AudienceCountQueryDto) {
    return this.service.audienceCount(query.audience);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'One notification with per-recipient delivery status (Admin)',
  })
  @ApiParam({ name: 'id', description: 'Admin notification id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}

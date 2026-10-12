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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  NotificationActionDto,
} from './dto/notification.dto';

type AuthRequest = { user: { userId: string } };

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'My notifications (latest first)' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findAll(@Request() req: AuthRequest, @Query('limit') limit?: string) {
    const parsed = parseInt(limit ?? '10', 10);
    const safeLimit = Math.min(Math.max(Number.isNaN(parsed) ? 10 : parsed, 1), 50);
    return this.notificationsService.findForUser(req.user.userId, safeLimit);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Number of unread notifications' })
  unreadCount(@Request() req: AuthRequest) {
    return this.notificationsService.unreadCount(req.user.userId);
  }

  // NOTE: 'read-all' ko ':id/read' se UPAR rakhna zaroori hai
  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  markAllRead(@Request() req: AuthRequest) {
    return this.notificationsService.markAllRead(req.user.userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  @ApiParam({ name: 'id', description: 'Notification id' })
  markRead(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.notificationsService.markRead(req.user.userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete one of my notifications' })
  @ApiParam({ name: 'id', description: 'Notification id' })
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.notificationsService.remove(req.user.userId, id);
  }

  @Patch(':id/action')
  @ApiOperation({ summary: 'Pay or Skip on an action notification' })
  @ApiParam({ name: 'id', description: 'Notification id' })
  performAction(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: NotificationActionDto,
  ) {
    return this.notificationsService.performAction(
      req.user.userId,
      id,
      dto.action,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Create a notification (testing). recipientId khali = apne aap ko',
  })
  create(@Request() req: AuthRequest, @Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(req.user.userId, dto);
  }
}

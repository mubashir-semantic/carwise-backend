import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
import { WorkshopsService } from './workshops.service';
import type { AuthUser } from './workshops.service';
import {
  AssignStaffDto,
  CreateWorkshopDto,
  ListWorkshopsQueryDto,
  UpdateWorkshopDto,
  UpdateWorkshopStatusDto,
} from './dto/workshop.dto';

type AuthRequest = { user: AuthUser };

@ApiTags('Workshops')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create a workshop (Admin)' })
  create(@Body() dto: CreateWorkshopDto) {
    return this.workshopsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'List workshops with search, filter and pagination. Admin sees all, others only active ones',
  })
  findAll(@Request() req: AuthRequest, @Query() query: ListWorkshopsQueryDto) {
    return this.workshopsService.findAll(req.user, query);
  }

  // NOTE: 'my' ko ':id' se UPAR rakhna zaroori hai
  @Get('my')
  @Roles(Role.WorkshopStaff)
  @ApiOperation({ summary: 'My workshop (Workshop Staff)' })
  findMine(@Request() req: AuthRequest) {
    return this.workshopsService.findMine(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Workshop details' })
  @ApiParam({ name: 'id', description: 'Workshop id' })
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.workshopsService.findOne(id, req.user);
  }

  @Put(':id')
  @Roles(Role.Admin, Role.WorkshopStaff)
  @ApiOperation({
    summary:
      'Update workshop profile. Staff can update only their own workshop and cannot change status',
  })
  @ApiParam({ name: 'id', description: 'Workshop id' })
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateWorkshopDto,
  ) {
    return this.workshopsService.update(id, dto, req.user);
  }

  @Patch(':id/status')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Activate / deactivate a workshop (Admin)' })
  @ApiParam({ name: 'id', description: 'Workshop id' })
  setStatus(@Param('id') id: string, @Body() dto: UpdateWorkshopStatusDto) {
    return this.workshopsService.setStatus(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a workshop (Admin)' })
  @ApiParam({ name: 'id', description: 'Workshop id' })
  remove(@Param('id') id: string) {
    return this.workshopsService.remove(id);
  }

  @Post(':id/staff')
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Assign a user as staff of this workshop (Admin). Makes them Workshop Staff',
  })
  @ApiParam({ name: 'id', description: 'Workshop id' })
  addStaff(@Param('id') id: string, @Body() dto: AssignStaffDto) {
    return this.workshopsService.addStaff(id, dto.userId);
  }

  @Delete(':id/staff/:userId')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Remove a staff member from this workshop (Admin)' })
  @ApiParam({ name: 'id', description: 'Workshop id' })
  @ApiParam({ name: 'userId', description: 'User id' })
  removeStaff(@Param('id') id: string, @Param('userId') userId: string) {
    return this.workshopsService.removeStaff(id, userId);
  }
}

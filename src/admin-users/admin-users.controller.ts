import {
  Body,
  Controller,
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
import type { AuthUser } from '../workshops/workshops.service';
import { AdminUsersService } from './admin-users.service';
import {
  CreateAdminUserDto,
  ListUsersQueryDto,
  UpdateAdminUserDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './dto/admin-user.dto';

type AuthRequest = { user: AuthUser };

// Poora controller sirf Admin ke liye
@ApiTags('Admin Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.Admin)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({
    summary: 'List users with search, role/status filter and pagination (Admin)',
  })
  findAll(@Query() query: ListUsersQueryDto) {
    return this.adminUsersService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a user with a role (Admin)' })
  create(@Body() dto: CreateAdminUserDto) {
    return this.adminUsersService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one user with the workshops they staff (Admin)' })
  @ApiParam({ name: 'id', description: 'User id' })
  findOne(@Param('id') id: string) {
    return this.adminUsersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user profile details (Admin)' })
  @ApiParam({ name: 'id', description: 'User id' })
  update(@Param('id') id: string, @Body() dto: UpdateAdminUserDto) {
    return this.adminUsersService.update(id, dto);
  }

  @Patch(':id/role')
  @ApiOperation({
    summary:
      'Change a user role (Admin). You cannot change your own role or remove the last admin',
  })
  @ApiParam({ name: 'id', description: 'User id' })
  setRole(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminUsersService.setRole(id, dto, req.user);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary:
      'Activate or deactivate a user (Admin). Deactivated users cannot log in',
  })
  @ApiParam({ name: 'id', description: 'User id' })
  setStatus(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminUsersService.setStatus(id, dto, req.user);
  }
}

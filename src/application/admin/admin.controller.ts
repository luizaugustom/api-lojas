import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UpdateFocusNfeConfigDto } from './dto/update-focus-nfe-config.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UuidValidationPipe } from '../../shared/pipes/uuid-validation.pipe';
import { NotificationService } from '../notification/notification.service';
import { BroadcastNotificationDto } from '../notification/dto/broadcast-notification.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar novo admin' })
  @ApiResponse({ status: 201, description: 'Admin criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Login já está em uso' })
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todos os admins' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de admins' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.findAll();
  }

  // Rotas específicas do Focus NFe DEVEM vir ANTES das rotas genéricas com :id
  @Patch('focus-nfe-config')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar configurações globais do Focus NFe' })
  @ApiResponse({ status: 200, description: 'Configurações atualizadas com sucesso' })
  updateFocusNfeConfig(
    @CurrentUser() user: any,
    @Body() updateFocusNfeConfigDto: UpdateFocusNfeConfigDto,
  ) {
    return this.adminService.updateFocusNfeConfig(user.id, updateFocusNfeConfigDto);
  }

  @Get('focus-nfe-config')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obter configurações globais do Focus NFe' })
  @ApiResponse({ status: 200, description: 'Configurações do Focus NFe' })
  getFocusNfeConfig(@CurrentUser() user: any) {
    return this.adminService.getFocusNfeConfig(user.id);
  }

  @Post('broadcast-notification')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Enviar notificação em massa para usuários' })
  @ApiResponse({ status: 201, description: 'Notificação enviada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async broadcastNotification(@Body() broadcastDto: BroadcastNotificationDto) {
    return this.notificationService.broadcastNotification(
      broadcastDto.title,
      broadcastDto.message,
      broadcastDto.target,
      broadcastDto.actionUrl,
      broadcastDto.actionLabel,
      broadcastDto.expiresAt,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Buscar admin por ID' })
  @ApiResponse({ status: 200, description: 'Admin encontrado' })
  @ApiResponse({ status: 404, description: 'Admin não encontrado' })
  findOne(@Param('id', UuidValidationPipe) id: string) {
    return this.adminService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar admin' })
  @ApiResponse({ status: 200, description: 'Admin atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Admin não encontrado' })
  @ApiResponse({ status: 409, description: 'Login já está em uso' })
  update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    return this.adminService.update(id, updateAdminDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover admin' })
  @ApiResponse({ status: 200, description: 'Admin removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Admin não encontrado' })
  remove(@Param('id', UuidValidationPipe) id: string) {
    return this.adminService.remove(id);
  }
}

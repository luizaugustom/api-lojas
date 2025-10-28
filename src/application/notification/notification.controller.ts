import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('notifications')
@Controller('notification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ==================== NOTIFICAÇÕES ====================

  @Post()
  @ApiOperation({ summary: 'Criar notificação (uso interno ou admin)' })
  @ApiResponse({ status: 201, description: 'Notificação criada com sucesso' })
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  // ==================== PREFERÊNCIAS (ANTES DAS ROTAS COM :id) ====================

  @Get('preferences/me')
  @ApiOperation({ summary: 'Obter preferências de notificação do usuário' })
  @ApiResponse({ status: 200, description: 'Preferências de notificação' })
  async getPreferences(@Req() req: any) {
    const user = req.user;
    return this.notificationService.getPreferences(user.id, user.role);
  }

  @Put('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar preferências de notificação' })
  @ApiResponse({ status: 200, description: 'Preferências atualizadas' })
  async updatePreferences(
    @Req() req: any,
    @Body() updateDto: UpdateNotificationPreferencesDto,
  ) {
    const user = req.user;
    return this.notificationService.updatePreferences(user.id, user.role, updateDto);
  }

  // ==================== ROTAS ESPECÍFICAS ====================

  @Get('unread-count')
  @ApiOperation({ summary: 'Obter contagem de notificações não lidas' })
  @ApiResponse({ status: 200, description: 'Contagem de não lidas' })
  async getUnreadCount(@Req() req: any) {
    const user = req.user;
    return this.notificationService.getUnreadCount(user.id, user.role);
  }

  @Put('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar todas as notificações como lidas' })
  @ApiResponse({ status: 200, description: 'Todas as notificações marcadas como lidas' })
  async markAllAsRead(@Req() req: any) {
    const user = req.user;
    return this.notificationService.markAllAsRead(user.id, user.role);
  }

  // ==================== ROTAS GERAIS ====================

  @Get()
  @ApiOperation({ summary: 'Listar notificações do usuário autenticado' })
  @ApiQuery({ name: 'onlyUnread', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de notificações' })
  async findAll(@Req() req: any, @Query('onlyUnread') onlyUnread?: boolean) {
    const user = req.user;
    return this.notificationService.findAllByUser(user.id, user.role, onlyUnread === true);
  }

  // ==================== ROTAS COM PARÂMETROS (SEMPRE POR ÚLTIMO) ====================

  @Get(':id')
  @ApiOperation({ summary: 'Obter notificação por ID' })
  @ApiResponse({ status: 200, description: 'Notificação encontrada' })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  async findOne(@Param('id') id: string) {
    return this.notificationService.findOne(id);
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  @ApiResponse({ status: 200, description: 'Notificação marcada como lida' })
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    return this.notificationService.markAsRead(id, user.id, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar notificação' })
  @ApiResponse({ status: 200, description: 'Notificação deletada' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    return this.notificationService.delete(id, user.id, user.role);
  }
}


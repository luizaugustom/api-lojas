import { Controller, Get, Post, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ScaleService } from './scale.service';

@ApiTags('scale')
@Controller('scale')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ScaleController {
  constructor(private readonly scaleService: ScaleService) {}

  @Post()
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Adicionar balança' })
  async addScale(@CurrentUser() user: any, @Body() data: { name: string; connectionInfo: string }) {
    return this.scaleService.addScale(user.companyId, data);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Listar balanças' })
  async list(@CurrentUser() user: any) {
    if (user.role === UserRole.ADMIN) return this.scaleService.getScales();
    return this.scaleService.getScales(user.companyId);
  }

  @Get('available')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Listar balanças disponíveis no sistema' })
  async available(@CurrentUser() user: any, @Req() req: Request) {
    const computerId = (req.headers['x-computer-id'] as string) || (req.query.computerId as string) || null;
    return this.scaleService.detectAvailable(computerId);
  }

  @Post('register-devices')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Registrar balanças detectadas do computador do cliente' })
  @ApiResponse({ status: 200, description: 'Balanças registradas com sucesso' })
  async registerDevices(
    @CurrentUser() user: any,
    @Body() body: { computerId: string; scales: any[] },
    @Req() req: Request,
  ) {
    const computerId = body.computerId || (req.headers['x-computer-id'] as string);
    if (!computerId) {
      throw new BadRequestException('Identificador do computador é obrigatório');
    }
    return this.scaleService.registerClientDevices(computerId, body.scales || []);
  }

  @Post('discover')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Descobrir balanças' })
  async discover() {
    return this.scaleService.discover();
  }

  @Get('check-drivers')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Verificar drivers de balanças' })
  async checkDrivers() {
    return this.scaleService.checkDrivers();
  }

  @Post('install-drivers')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Instalar drivers de balanças' })
  async installDrivers() {
    return this.scaleService.installDrivers();
  }

  @Get(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Status da balança' })
  async status(@Param('id') id: string) {
    return this.scaleService.status(id);
  }

  @Post(':id/test')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Testar leitura de peso' })
  async test(@Param('id') id: string) {
    return this.scaleService.test(id);
  }
}



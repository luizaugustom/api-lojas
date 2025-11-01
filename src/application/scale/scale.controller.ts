import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
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
  async available() {
    return this.scaleService.detectAvailable();
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



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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('company')
@Controller('company')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar nova empresa' })
  @ApiResponse({ status: 201, description: 'Empresa criada com sucesso' })
  @ApiResponse({ status: 409, description: 'Dados já estão em uso' })
  create(
    @CurrentUser() user: any,
    @Body() createCompanyDto: CreateCompanyDto,
  ) {
    return this.companyService.create(user.id, createCompanyDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Listar empresas' })
  @ApiResponse({ status: 200, description: 'Lista de empresas' })
  findAll(@CurrentUser() user: any) {
    if (user.role === UserRole.ADMIN) {
      return this.companyService.findAll();
    }
    return this.companyService.findAll(user.companyId);
  }

  @Get('my-company')
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Obter dados da própria empresa' })
  @ApiResponse({ status: 200, description: 'Dados da empresa' })
  findMyCompany(@CurrentUser() user: any) {
    return this.companyService.findOne(user.companyId);
  }

  @Get('stats')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter estatísticas da empresa' })
  @ApiResponse({ status: 200, description: 'Estatísticas da empresa' })
  getStats(@CurrentUser() user: any) {
    return this.companyService.getCompanyStats(user.companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Buscar empresa por ID' })
  @ApiResponse({ status: 200, description: 'Empresa encontrada' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.findOne(id);
  }

  @Patch('my-company')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Atualizar dados da própria empresa' })
  @ApiResponse({ status: 200, description: 'Empresa atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  @ApiResponse({ status: 409, description: 'Dados já estão em uso' })
  updateMyCompany(
    @CurrentUser() user: any,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companyService.update(user.companyId, updateCompanyDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar empresa' })
  @ApiResponse({ status: 200, description: 'Empresa atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  @ApiResponse({ status: 409, description: 'Dados já estão em uso' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companyService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover empresa' })
  @ApiResponse({ status: 200, description: 'Empresa removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.remove(id);
  }
}

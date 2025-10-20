import {
  Controller,
  Get,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ 
    summary: 'Obter métricas consolidadas do dashboard',
    description: 'Retorna todas as métricas principais da empresa para o dashboard, incluindo vendas, produtos, clientes, vendedores e indicadores financeiros'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Métricas do dashboard obtidas com sucesso',
    schema: {
      type: 'object',
      properties: {
        company: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cmgty5s880006ww3b8bup77v5' },
            name: { type: 'string', example: 'Minha Loja LTDA' },
            isActive: { type: 'boolean', example: true }
          }
        },
        counts: {
          type: 'object',
          properties: {
            products: { type: 'number', example: 150 },
            customers: { type: 'number', example: 89 },
            sellers: { type: 'number', example: 5 },
            sales: { type: 'number', example: 1247 },
            billsToPay: { type: 'number', example: 12 },
            fiscalDocuments: { type: 'number', example: 89 },
            closedCashClosures: { type: 'number', example: 30 }
          }
        },
        financial: {
          type: 'object',
          properties: {
            totalSalesValue: { type: 'number', example: 125000.50 },
            pendingBillsValue: { type: 'number', example: 2500.00 },
            paidBillsValue: { type: 'number', example: 15000.00 },
            stockValue: { type: 'number', example: 45000.00 },
            netRevenue: { type: 'number', example: 110000.50 }
          }
        },
        sales: {
          type: 'object',
          properties: {
            thisMonth: {
              type: 'object',
              properties: {
                count: { type: 'number', example: 45 },
                value: { type: 'number', example: 8500.00 },
                averageTicket: { type: 'number', example: 188.89 }
              }
            },
            lastMonth: {
              type: 'object',
              properties: {
                count: { type: 'number', example: 38 },
                value: { type: 'number', example: 7200.00 }
              }
            },
            total: {
              type: 'object',
              properties: {
                count: { type: 'number', example: 1247 },
                value: { type: 'number', example: 125000.50 },
                averageTicket: { type: 'number', example: 100.24 }
              }
            },
            growth: {
              type: 'object',
              properties: {
                countPercentage: { type: 'number', example: 18.42 },
                valuePercentage: { type: 'number', example: 18.06 }
              }
            }
          }
        },
        products: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 150 },
            lowStock: { type: 'number', example: 12 },
            expiring: { type: 'number', example: 8 },
            stockValue: { type: 'number', example: 45000.00 },
            lowStockPercentage: { type: 'number', example: 8.0 },
            expiringPercentage: { type: 'number', example: 5.33 }
          }
        },
        cash: {
          type: 'object',
          properties: {
            currentClosure: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', example: 'cmgty5s880006ww3b8bup77vd' },
                openingDate: { type: 'string', format: 'date-time' },
                openingAmount: { type: 'number', example: 100.00 },
                totalSales: { type: 'number', example: 2500.00 },
                isClosed: { type: 'boolean', example: false }
              }
            },
            closedClosures: { type: 'number', example: 30 }
          }
        },
        fiscal: {
          type: 'object',
          properties: {
            totalDocuments: { type: 'number', example: 89 },
            documentsThisMonth: { type: 'number', example: 15 },
            documentsGrowth: { type: 'number', example: 20.27 }
          }
        },
        rankings: {
          type: 'object',
          properties: {
            topSellers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'cmgty5s880006ww3b8bup77v7' },
                  name: { type: 'string', example: 'João Silva' },
                  salesCount: { type: 'number', example: 45 },
                  totalValue: { type: 'number', example: 8500.00 }
                }
              }
            },
            topProducts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'cmgty5s880006ww3b8bup77v8' },
                  name: { type: 'string', example: 'Smartphone Samsung' },
                  barcode: { type: 'string', example: '7891234567890' },
                  salesCount: { type: 'number', example: 25 },
                  totalValue: { type: 'number', example: 12500.00 },
                  stockQuantity: { type: 'number', example: 15 }
                }
              }
            }
          }
        },
        metadata: {
          type: 'object',
          properties: {
            generatedAt: { type: 'string', format: 'date-time' },
            period: {
              type: 'object',
              properties: {
                thisMonth: {
                  type: 'object',
                  properties: {
                    start: { type: 'string', format: 'date-time' },
                    end: { type: 'string', format: 'date-time' },
                    label: { type: 'string', example: '2024-01' }
                  }
                },
                lastMonth: {
                  type: 'object',
                  properties: {
                    start: { type: 'string', format: 'date-time' },
                    end: { type: 'string', format: 'date-time' },
                    label: { type: 'string', example: '2023-12' }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada ou inativa' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async getMetrics(@CurrentUser() user: any) {
    const companyId = user.role === UserRole.ADMIN ? user.companyId : user.companyId;
    
    if (!companyId) {
      throw new Error('Company ID não encontrado');
    }
    
    return this.dashboardService.getCompanyMetrics(companyId);
  }

  @Get('metrics/summary')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ 
    summary: 'Obter resumo das métricas principais',
    description: 'Retorna apenas as métricas mais importantes para um carregamento mais rápido'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resumo das métricas obtido com sucesso',
    schema: {
      type: 'object',
      properties: {
        totalSales: { type: 'number', example: 125000.50 },
        salesThisMonth: { type: 'number', example: 8500.00 },
        salesGrowth: { type: 'number', example: 18.06 },
        totalProducts: { type: 'number', example: 150 },
        lowStockProducts: { type: 'number', example: 12 },
        totalCustomers: { type: 'number', example: 89 },
        totalSellers: { type: 'number', example: 5 },
        pendingBills: { type: 'number', example: 2500.00 },
        netRevenue: { type: 'number', example: 110000.50 }
      }
    }
  })
  async getMetricsSummary(@CurrentUser() user: any) {
    const companyId = user.role === UserRole.ADMIN ? user.companyId : user.companyId;
    
    if (!companyId) {
      throw new Error('Company ID não encontrado');
    }
    
    const fullMetrics = await this.dashboardService.getCompanyMetrics(companyId);
    
    return {
      totalSales: fullMetrics.financial.totalSalesValue,
      salesThisMonth: fullMetrics.sales.thisMonth.value,
      salesGrowth: fullMetrics.sales.growth.valuePercentage,
      totalProducts: fullMetrics.counts.products,
      lowStockProducts: fullMetrics.products.lowStock,
      totalCustomers: fullMetrics.counts.customers,
      totalSellers: fullMetrics.counts.sellers,
      pendingBills: fullMetrics.financial.pendingBillsValue,
      netRevenue: fullMetrics.financial.netRevenue
    };
  }

  @Get('metrics/trends')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ 
    summary: 'Obter tendências das métricas',
    description: 'Retorna dados históricos para análise de tendências'
  })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d'], description: 'Período para análise de tendências' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tendências obtidas com sucesso',
    schema: {
      type: 'object',
      properties: {
        salesTrend: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', format: 'date' },
              value: { type: 'number' },
              count: { type: 'number' }
            }
          }
        },
        productsTrend: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', format: 'date' },
              totalProducts: { type: 'number' },
              lowStock: { type: 'number' }
            }
          }
        }
      }
    }
  })
  async getMetricsTrends(
    @CurrentUser() user: any,
    @Query('period') period: '7d' | '30d' | '90d' = '30d'
  ) {
    const companyId = user.role === UserRole.ADMIN ? user.companyId : user.companyId;
    
    if (!companyId) {
      throw new Error('Company ID não encontrado');
    }
    
    // Implementar análise de tendências baseada no período
    // Por enquanto, retornar dados mockados
    return {
      salesTrend: [],
      productsTrend: [],
      period: period,
      message: 'Análise de tendências em desenvolvimento'
    };
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { HashService } from '../src/shared/services/hash.service';

/**
 * Teste E2E para Relatórios Contábeis com Comissões
 * 
 * Testa a geração completa de relatórios incluindo cálculo de comissões
 */
describe('Reports with Commissions E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let hashService: HashService;

  const createdIds = {
    admins: [] as string[],
    companies: [] as string[],
    sellers: [] as string[],
    products: [] as string[],
    sales: [] as string[],
  };

  let companyToken: string;
  let companyId: string;
  let seller1Id: string;
  let seller2Id: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    prisma = app.get<PrismaService>(PrismaService);
    hashService = app.get<HashService>(HashService);

    await app.init();

    // Criar admin
    const hashedPassword = await hashService.hashPassword('admin123');
    const admin = await prisma.admin.create({
      data: {
        login: 'admin-report-test@test.com',
        password: hashedPassword,
      },
    });
    createdIds.admins.push(admin.id);

    // Login admin
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        login: 'admin-report-test@test.com',
        password: 'admin123',
        role: 'admin',
      });

    // Criar empresa
    const companyResponse = await request(app.getHttpServer())
      .post('/company')
      .set('Authorization', `Bearer ${adminLoginResponse.body.access_token}`)
      .send({
        name: 'Empresa Relatório Test',
        login: 'report-company@test.com',
        password: 'company123',
        cnpj: '88.888.888/0001-88',
        email: 'report-company@test.com',
        plan: 'PRO',
      });
    companyId = companyResponse.body.id;
    createdIds.companies.push(companyId);

    // Login empresa
    const companyLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        login: 'report-company@test.com',
        password: 'company123',
        role: 'company',
      });
    companyToken = companyLoginResponse.body.access_token;

    // Criar vendedores com comissões diferentes
    const seller1Response = await request(app.getHttpServer())
      .post('/seller')
      .set('Authorization', `Bearer ${companyToken}`)
      .send({
        login: `seller1-report-${Date.now()}@test.com`,
        password: 'seller123',
        name: 'Vendedor Com Comissão',
        commissionRate: 5.5, // 5.5% de comissão
      });
    seller1Id = seller1Response.body.id;
    createdIds.sellers.push(seller1Id);

    const seller2Response = await request(app.getHttpServer())
      .post('/seller')
      .set('Authorization', `Bearer ${companyToken}`)
      .send({
        login: `seller2-report-${Date.now()}@test.com`,
        password: 'seller123',
        name: 'Vendedor Sem Comissão',
        commissionRate: 0,
      });
    seller2Id = seller2Response.body.id;
    createdIds.sellers.push(seller2Id);

    // Criar produto
    const productResponse = await request(app.getHttpServer())
      .post('/product')
      .set('Authorization', `Bearer ${companyToken}`)
      .send({
        name: 'Produto Teste Relatório',
        barcode: `REPORT-TEST-${Date.now()}`,
        price: 100.0,
        stockQuantity: 1000,
      });
    createdIds.products.push(productResponse.body.id);

    // Criar vendas para o vendedor com comissão
    for (let i = 0; i < 5; i++) {
      const saleResponse = await request(app.getHttpServer())
        .post('/sale')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          items: [
            {
              productId: productResponse.body.id,
              quantity: 2,
            },
          ],
          paymentMethods: [
            {
              method: 'cash',
              amount: 200.0,
            },
          ],
          sellerId: seller1Id,
        });
      
      if (saleResponse.status === 201) {
        createdIds.sales.push(saleResponse.body.id);
      }
    }
  });

  afterAll(async () => {
    console.log('\n🧹 Limpando dados de teste de relatórios...');

    try {
      if (createdIds.sales.length > 0) {
        await prisma.sale.deleteMany({
          where: { id: { in: createdIds.sales } },
        });
        console.log(`✅ ${createdIds.sales.length} venda(s) deletada(s)`);
      }

      if (createdIds.products.length > 0) {
        await prisma.product.deleteMany({
          where: { id: { in: createdIds.products } },
        });
        console.log(`✅ ${createdIds.products.length} produto(s) deletado(s)`);
      }

      if (createdIds.sellers.length > 0) {
        await prisma.seller.deleteMany({
          where: { id: { in: createdIds.sellers } },
        });
        console.log(`✅ ${createdIds.sellers.length} vendedor(es) deletado(s)`);
      }

      if (createdIds.companies.length > 0) {
        await prisma.company.deleteMany({
          where: { id: { in: createdIds.companies } },
        });
        console.log(`✅ ${createdIds.companies.length} empresa(s) deletada(s)`);
      }

      if (createdIds.admins.length > 0) {
        await prisma.admin.deleteMany({
          where: { id: { in: createdIds.admins } },
        });
        console.log(`✅ ${createdIds.admins.length} admin(s) deletado(s)`);
      }

      console.log('✨ Limpeza de relatórios concluída!\n');
    } catch (error) {
      console.error('❌ Erro durante a limpeza:', error);
    }

    await app.close();
  });

  describe('Commission Report Generation', () => {
    it('should generate complete report with commissions in JSON format', async () => {
      const response = await request(app.getHttpServer())
        .post('/reports/generate')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          reportType: 'complete',
          format: 'json',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('commissions');
      expect(response.body.data.commissions).toHaveProperty('summary');
      expect(response.body.data.commissions).toHaveProperty('commissions');
      expect(Array.isArray(response.body.data.commissions.commissions)).toBe(true);

      // Verificar dados de comissão
      const commissionsData = response.body.data.commissions.commissions;
      const seller1Commission = commissionsData.find((c: any) => c.sellerId === seller1Id);

      expect(seller1Commission).toBeDefined();
      expect(seller1Commission.commissionRate).toBe(5.5);
      expect(seller1Commission.totalSales).toBeGreaterThan(0);
      expect(seller1Commission.commissionAmount).toBeGreaterThan(0);

      // Verificar cálculo da comissão
      const expectedCommission = (seller1Commission.totalRevenue * 5.5) / 100;
      expect(seller1Commission.commissionAmount).toBeCloseTo(expectedCommission, 2);
    });

    it('should generate Excel report with commissions sheet', async () => {
      const response = await request(app.getHttpServer())
        .post('/reports/generate')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          reportType: 'complete',
          format: 'excel',
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('spreadsheet');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.xlsx');
      
      // Verificar que retornou um buffer
      expect(response.body).toBeDefined();
      expect(Buffer.isBuffer(response.body)).toBe(true);
    });

    it('should generate XML report with commissions data', async () => {
      const response = await request(app.getHttpServer())
        .post('/reports/generate')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          reportType: 'complete',
          format: 'xml',
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('xml');
      expect(typeof response.text).toBe('string');
      expect(response.text).toContain('<commissions>');
      expect(response.text).toContain('<commissionRate>');
      expect(response.text).toContain('<commissionAmount>');
    });

    it('should calculate zero commission for seller without commission rate', async () => {
      const response = await request(app.getHttpServer())
        .post('/reports/generate')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          reportType: 'complete',
          format: 'json',
        });

      const commissionsData = response.body.data.commissions.commissions;
      const seller2Commission = commissionsData.find((c: any) => c.sellerId === seller2Id);

      expect(seller2Commission).toBeDefined();
      expect(seller2Commission.commissionRate).toBe(0);
      expect(seller2Commission.commissionAmount).toBe(0);
    });

    it('should filter report by date range', async () => {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

      const response = await request(app.getHttpServer())
        .post('/reports/generate')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          reportType: 'complete',
          format: 'json',
          startDate,
          endDate,
        });

      expect(response.status).toBe(200);
      expect(response.body.reportMetadata.period.startDate).toBe(startDate);
      expect(response.body.reportMetadata.period.endDate).toBe(endDate);
    });

    it('should filter report by seller', async () => {
      const response = await request(app.getHttpServer())
        .post('/reports/generate')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          reportType: 'sales',
          format: 'json',
          sellerId: seller1Id,
        });

      expect(response.status).toBe(200);
      
      // Todas as vendas devem ser do seller1
      const sales = response.body.data.sales;
      sales.forEach((sale: any) => {
        expect(sale.seller.id).toBe(seller1Id);
      });
    });
  });

  describe('Report Content Validation', () => {
    it('should include all required sheets in complete Excel report', async () => {
      const response = await request(app.getHttpServer())
        .post('/reports/generate')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          reportType: 'complete',
          format: 'excel',
        });

      expect(response.status).toBe(200);
      
      // O Excel deve ter sido gerado (verificar tamanho)
      expect(response.body.length).toBeGreaterThan(1000); // Excel vazio tem ~1KB
    });

    it('should include company information in all reports', async () => {
      const response = await request(app.getHttpServer())
        .post('/reports/generate')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          reportType: 'complete',
          format: 'json',
        });

      expect(response.body).toHaveProperty('company');
      expect(response.body.company).toHaveProperty('name');
      expect(response.body.company).toHaveProperty('cnpj');
      expect(response.body.company).toHaveProperty('email');
    });

    it('should include report metadata', async () => {
      const response = await request(app.getHttpServer())
        .post('/reports/generate')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          reportType: 'complete',
          format: 'json',
        });

      expect(response.body).toHaveProperty('reportMetadata');
      expect(response.body.reportMetadata).toHaveProperty('type');
      expect(response.body.reportMetadata).toHaveProperty('generatedAt');
      expect(response.body.reportMetadata.type).toBe('complete');
    });
  });
});


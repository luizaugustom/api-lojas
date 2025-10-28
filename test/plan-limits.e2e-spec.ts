import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { HashService } from '../src/shared/services/hash.service';
import { PlanType } from '@prisma/client';

/**
 * Suite de testes E2E para validação de limites de planos
 * 
 * IMPORTANTE: Esta suite cria dados no banco e os limpa automaticamente ao final
 */
describe('Plan Limits E2E Tests (with auto-cleanup)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let hashService: HashService;

  // IDs criados durante os testes para limpeza
  const createdIds = {
    admins: [] as string[],
    companies: [] as string[],
    sellers: [] as string[],
    products: [] as string[],
    billsToPay: [] as string[],
  };

  let adminToken: string;
  let companyBasicToken: string;
  let companyPlusToken: string;
  let companyProToken: string;
  
  let companyBasicId: string;
  let companyPlusId: string;
  let companyProId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    prisma = app.get<PrismaService>(PrismaService);
    hashService = app.get<HashService>(HashService);

    await app.init();

    // Criar admin para testes
    const hashedPassword = await hashService.hashPassword('admin123');
    const admin = await prisma.admin.create({
      data: {
        login: 'admin-plan-test@test.com',
        password: hashedPassword,
      },
    });
    createdIds.admins.push(admin.id);

    // Login admin
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        login: 'admin-plan-test@test.com',
        password: 'admin123',
        role: 'admin',
      });
    adminToken = adminLoginResponse.body.access_token;

    // Criar empresas de teste com diferentes planos
    const companyBasic = await request(app.getHttpServer())
      .post('/company')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Empresa BASIC Test',
        login: 'basic-test@test.com',
        password: 'basic123',
        cnpj: '11.111.111/0001-11',
        email: 'basic-test@test.com',
        plan: PlanType.BASIC,
      });
    companyBasicId = companyBasic.body.id;
    createdIds.companies.push(companyBasicId);

    const companyPlus = await request(app.getHttpServer())
      .post('/company')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Empresa PLUS Test',
        login: 'plus-test@test.com',
        password: 'plus123',
        cnpj: '22.222.222/0001-22',
        email: 'plus-test@test.com',
        plan: PlanType.PLUS,
      });
    companyPlusId = companyPlus.body.id;
    createdIds.companies.push(companyPlusId);

    const companyPro = await request(app.getHttpServer())
      .post('/company')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Empresa PRO Test',
        login: 'pro-test@test.com',
        password: 'pro123',
        cnpj: '33.333.333/0001-33',
        email: 'pro-test@test.com',
        plan: PlanType.PRO,
      });
    companyProId = companyPro.body.id;
    createdIds.companies.push(companyProId);

    // Login empresas
    const basicLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        login: 'basic-test@test.com',
        password: 'basic123',
        role: 'company',
      });
    companyBasicToken = basicLoginResponse.body.access_token;

    const plusLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        login: 'plus-test@test.com',
        password: 'plus123',
        role: 'company',
      });
    companyPlusToken = plusLoginResponse.body.access_token;

    const proLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        login: 'pro-test@test.com',
        password: 'pro123',
        role: 'company',
      });
    companyProToken = proLoginResponse.body.access_token;
  });

  afterAll(async () => {
    // Limpeza automática de todos os dados criados
    console.log('\n🧹 Iniciando limpeza automática dos dados de teste...');

    try {
      // Deletar contas a pagar
      if (createdIds.billsToPay.length > 0) {
        await prisma.billToPay.deleteMany({
          where: { id: { in: createdIds.billsToPay } },
        });
        console.log(`✅ ${createdIds.billsToPay.length} conta(s) a pagar deletada(s)`);
      }

      // Deletar produtos
      if (createdIds.products.length > 0) {
        await prisma.product.deleteMany({
          where: { id: { in: createdIds.products } },
        });
        console.log(`✅ ${createdIds.products.length} produto(s) deletado(s)`);
      }

      // Deletar vendedores
      if (createdIds.sellers.length > 0) {
        await prisma.seller.deleteMany({
          where: { id: { in: createdIds.sellers } },
        });
        console.log(`✅ ${createdIds.sellers.length} vendedor(es) deletado(s)`);
      }

      // Deletar empresas
      if (createdIds.companies.length > 0) {
        await prisma.company.deleteMany({
          where: { id: { in: createdIds.companies } },
        });
        console.log(`✅ ${createdIds.companies.length} empresa(s) deletada(s)`);
      }

      // Deletar admins
      if (createdIds.admins.length > 0) {
        await prisma.admin.deleteMany({
          where: { id: { in: createdIds.admins } },
        });
        console.log(`✅ ${createdIds.admins.length} admin(s) deletado(s)`);
      }

      console.log('✨ Limpeza concluída com sucesso!\n');
    } catch (error) {
      console.error('❌ Erro durante a limpeza:', error);
    }

    await app.close();
  });

  describe('Product Limits', () => {
    it('should allow creating products within BASIC plan limit (250)', async () => {
      // Criar produto dentro do limite
      const response = await request(app.getHttpServer())
        .post('/product')
        .set('Authorization', `Bearer ${companyBasicToken}`)
        .send({
          name: 'Produto Test Basic 1',
          barcode: `BASIC-TEST-${Date.now()}`,
          price: 10.0,
          stockQuantity: 100,
        });

      expect(response.status).toBe(201);
      createdIds.products.push(response.body.id);
    });

    it('should block creating products beyond BASIC plan limit', async () => {
      // Criar 250 produtos para atingir o limite
      const promises = [];
      for (let i = 0; i < 250; i++) {
        const promise = prisma.product.create({
          data: {
            name: `Produto Limite ${i}`,
            barcode: `LIMIT-${Date.now()}-${i}`,
            price: 10,
            stockQuantity: 1,
            companyId: companyBasicId,
          },
        }).then(product => {
          createdIds.products.push(product.id);
          return product;
        });
        promises.push(promise);
      }
      await Promise.all(promises);

      // Tentar criar mais um produto (deve falhar)
      const response = await request(app.getHttpServer())
        .post('/product')
        .set('Authorization', `Bearer ${companyBasicToken}`)
        .send({
          name: 'Produto Acima do Limite',
          barcode: `OVER-LIMIT-${Date.now()}`,
          price: 10.0,
          stockQuantity: 100,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Limite de produtos atingido');
    });

    it('should allow unlimited products for PRO plan', async () => {
      // Criar 1000 produtos (muito acima dos limites BASIC e PLUS)
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        const promise = prisma.product.create({
          data: {
            name: `Produto PRO ${i}`,
            barcode: `PRO-${Date.now()}-${i}`,
            price: 10,
            stockQuantity: 1,
            companyId: companyProId,
          },
        }).then(product => {
          createdIds.products.push(product.id);
          return product;
        });
        promises.push(promise);
      }
      await Promise.all(promises);

      // Criar mais um produto (deve funcionar)
      const response = await request(app.getHttpServer())
        .post('/product')
        .set('Authorization', `Bearer ${companyProToken}`)
        .send({
          name: 'Produto PRO Ilimitado',
          barcode: `PRO-UNLIMITED-${Date.now()}`,
          price: 10.0,
          stockQuantity: 100,
        });

      expect(response.status).toBe(201);
      createdIds.products.push(response.body.id);
    });
  });

  describe('Seller Limits', () => {
    it('should allow creating 1 seller for BASIC plan', async () => {
      const response = await request(app.getHttpServer())
        .post('/seller')
        .set('Authorization', `Bearer ${companyBasicToken}`)
        .send({
          login: `seller-basic-${Date.now()}@test.com`,
          password: 'seller123',
          name: 'Vendedor Basic',
        });

      expect(response.status).toBe(201);
      createdIds.sellers.push(response.body.id);
    });

    it('should block creating 2nd seller for BASIC plan', async () => {
      const response = await request(app.getHttpServer())
        .post('/seller')
        .set('Authorization', `Bearer ${companyBasicToken}`)
        .send({
          login: `seller-basic-2-${Date.now()}@test.com`,
          password: 'seller123',
          name: 'Vendedor Basic 2',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Limite de vendedores atingido');
    });

    it('should allow creating 2 sellers for PLUS plan', async () => {
      const response1 = await request(app.getHttpServer())
        .post('/seller')
        .set('Authorization', `Bearer ${companyPlusToken}`)
        .send({
          login: `seller-plus-1-${Date.now()}@test.com`,
          password: 'seller123',
          name: 'Vendedor Plus 1',
        });
      expect(response1.status).toBe(201);
      createdIds.sellers.push(response1.body.id);

      const response2 = await request(app.getHttpServer())
        .post('/seller')
        .set('Authorization', `Bearer ${companyPlusToken}`)
        .send({
          login: `seller-plus-2-${Date.now()}@test.com`,
          password: 'seller123',
          name: 'Vendedor Plus 2',
        });
      expect(response2.status).toBe(201);
      createdIds.sellers.push(response2.body.id);
    });

    it('should block creating 3rd seller for PLUS plan', async () => {
      const response = await request(app.getHttpServer())
        .post('/seller')
        .set('Authorization', `Bearer ${companyPlusToken}`)
        .send({
          login: `seller-plus-3-${Date.now()}@test.com`,
          password: 'seller123',
          name: 'Vendedor Plus 3',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Limite de vendedores atingido');
    });

    it('should allow unlimited sellers for PRO plan', async () => {
      // Criar 10 vendedores
      for (let i = 0; i < 10; i++) {
        const response = await request(app.getHttpServer())
          .post('/seller')
          .set('Authorization', `Bearer ${companyProToken}`)
          .send({
            login: `seller-pro-${i}-${Date.now()}@test.com`,
            password: 'seller123',
            name: `Vendedor Pro ${i}`,
          });

        expect(response.status).toBe(201);
        createdIds.sellers.push(response.body.id);
      }
    });
  });

  describe('Bill To Pay Limits', () => {
    it('should allow creating 5 bills for BASIC plan', async () => {
      for (let i = 0; i < 5; i++) {
        const response = await request(app.getHttpServer())
          .post('/bill-to-pay')
          .set('Authorization', `Bearer ${companyBasicToken}`)
          .send({
            title: `Conta Basic ${i}`,
            amount: 100.0,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          });

        expect(response.status).toBe(201);
        createdIds.billsToPay.push(response.body.id);
      }
    });

    it('should block creating 6th bill for BASIC plan', async () => {
      const response = await request(app.getHttpServer())
        .post('/bill-to-pay')
        .set('Authorization', `Bearer ${companyBasicToken}`)
        .send({
          title: 'Conta Basic 6',
          amount: 100.0,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Limite de contas a pagar atingido');
    });

    it('should allow creating bills again after marking one as paid', async () => {
      // Pagar uma conta
      const billId = createdIds.billsToPay[0];
      await request(app.getHttpServer())
        .patch(`/bill-to-pay/${billId}/mark-as-paid`)
        .set('Authorization', `Bearer ${companyBasicToken}`)
        .send({
          paymentInfo: 'Pagamento teste',
        });

      // Agora deve permitir criar nova conta
      const response = await request(app.getHttpServer())
        .post('/bill-to-pay')
        .set('Authorization', `Bearer ${companyBasicToken}`)
        .send({
          title: 'Conta Basic Nova',
          amount: 100.0,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      expect(response.status).toBe(201);
      createdIds.billsToPay.push(response.body.id);
    });

    it('should allow creating 15 bills for PLUS plan', async () => {
      for (let i = 0; i < 15; i++) {
        const response = await request(app.getHttpServer())
          .post('/bill-to-pay')
          .set('Authorization', `Bearer ${companyPlusToken}`)
          .send({
            title: `Conta Plus ${i}`,
            amount: 100.0,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          });

        expect(response.status).toBe(201);
        createdIds.billsToPay.push(response.body.id);
      }
    });

    it('should allow unlimited bills for PRO plan', async () => {
      // Criar 50 contas
      for (let i = 0; i < 50; i++) {
        const response = await request(app.getHttpServer())
          .post('/bill-to-pay')
          .set('Authorization', `Bearer ${companyProToken}`)
          .send({
            title: `Conta Pro ${i}`,
            amount: 100.0,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          });

        expect(response.status).toBe(201);
        createdIds.billsToPay.push(response.body.id);
      }
    });
  });

  describe('Plan Usage Stats', () => {
    it('should return correct usage stats for company', async () => {
      const response = await request(app.getHttpServer())
        .get('/company/plan-usage')
        .set('Authorization', `Bearer ${companyBasicToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('plan');
      expect(response.body).toHaveProperty('limits');
      expect(response.body).toHaveProperty('usage');
      expect(response.body.usage).toHaveProperty('products');
      expect(response.body.usage).toHaveProperty('sellers');
      expect(response.body.usage).toHaveProperty('billsToPay');
    });

    it('should return warnings when near limits', async () => {
      const response = await request(app.getHttpServer())
        .get('/company/plan-warnings')
        .set('Authorization', `Bearer ${companyBasicToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('nearLimit');
      expect(response.body).toHaveProperty('warnings');
      expect(Array.isArray(response.body.warnings)).toBe(true);
    });
  });
});


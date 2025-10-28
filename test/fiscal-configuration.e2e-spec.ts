import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('Fiscal Configuration E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let companyToken: string;
  let adminId: string;
  let companyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    // Criar admin de teste
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register/admin')
      .send({
        login: 'admin-fiscal-test',
        password: 'Admin@123',
      });

    adminId = adminResponse.body.admin?.id || adminResponse.body.id;

    // Login admin
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login/admin')
      .send({
        login: 'admin-fiscal-test',
        password: 'Admin@123',
      });

    adminToken = adminLoginResponse.body.access_token;

    // Criar empresa de teste
    const companyResponse = await request(app.getHttpServer())
      .post('/company')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Empresa Fiscal Test',
        login: 'empresa-fiscal-test',
        password: 'Company@123',
        cnpj: '12345678000199',
        stateRegistration: '123456789',
        email: 'fiscal-test@empresa.com',
        phone: '48999999999',
        street: 'Rua Teste',
        number: '123',
        district: 'Centro',
        city: 'Florianópolis',
        state: 'SC',
        zipCode: '88000000',
      });

    companyId = companyResponse.body.id;

    // Login empresa
    const companyLoginResponse = await request(app.getHttpServer())
      .post('/auth/login/company')
      .send({
        login: 'empresa-fiscal-test',
        password: 'Company@123',
      });

    companyToken = companyLoginResponse.body.access_token;
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (companyId) {
      await prisma.company.delete({ where: { id: companyId } }).catch(() => {});
    }
    if (adminId) {
      await prisma.admin.delete({ where: { id: adminId } }).catch(() => {});
    }

    await app.close();
  });

  describe('Admin - Configuração Global Focus NFe', () => {
    it('deve permitir admin configurar API Key global', async () => {
      const response = await request(app.getHttpServer())
        .patch('/admin/focus-nfe-config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          focusNfeApiKey: 'test-focus-api-key-123456',
          focusNfeEnvironment: 'sandbox',
          ibptToken: 'test-ibpt-token-789',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('sucesso');
      expect(response.body.focusNfeEnvironment).toBe('sandbox');
    });

    it('deve retornar configuração mascarada', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/focus-nfe-config')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.hasFocusNfeApiKey).toBe(true);
      expect(response.body.focusNfeApiKey).toContain('****');
      expect(response.body.hasIbptToken).toBe(true);
    });

    it('deve validar enum de ambiente', async () => {
      const response = await request(app.getHttpServer())
        .patch('/admin/focus-nfe-config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          focusNfeEnvironment: 'invalid-env',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('não deve permitir empresa configurar Focus NFe global', async () => {
      await request(app.getHttpServer())
        .patch('/admin/focus-nfe-config')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          focusNfeApiKey: 'test-key',
        })
        .expect(403); // Forbidden
    });
  });

  describe('Company - Configuração Fiscal Individual', () => {
    it('deve permitir empresa configurar dados fiscais', async () => {
      const response = await request(app.getHttpServer())
        .patch('/company/my-company/fiscal-config')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          taxRegime: 'SIMPLES_NACIONAL',
          cnae: '4761001',
          municipioIbge: '4205407',
          nfceSerie: '1',
          certificatePassword: 'senha-certificado-teste',
          csc: 'CSC-TESTE-123456789',
          idTokenCsc: '000001',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.municipioIbge).toBe('4205407');
      expect(response.body.nfceSerie).toBe('1');
    });

    it('deve retornar configuração com dados mascarados', async () => {
      const response = await request(app.getHttpServer())
        .get('/company/my-company/fiscal-config')
        .set('Authorization', `Bearer ${companyToken}`)
        .expect(200);

      expect(response.body.hasCertificatePassword).toBe(true);
      expect(response.body.hasCsc).toBe(true);
      expect(response.body.cscMasked).toBe('********');
      expect(response.body.taxRegime).toBe('SIMPLES_NACIONAL');
      expect(response.body.cnae).toBe('4761001');
    });

    it('deve validar código IBGE com 7 dígitos', async () => {
      const response = await request(app.getHttpServer())
        .patch('/company/my-company/fiscal-config')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          municipioIbge: '123', // Inválido - 3 dígitos
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('deve validar CNAE com 7 dígitos', async () => {
      const response = await request(app.getHttpServer())
        .patch('/company/my-company/fiscal-config')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          cnae: 'abc1234', // Inválido - não numérico
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('deve validar enum de regime tributário', async () => {
      const response = await request(app.getHttpServer())
        .patch('/company/my-company/fiscal-config')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          taxRegime: 'REGIME_INVALIDO',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('não deve permitir admin acessar config fiscal de empresa', async () => {
      await request(app.getHttpServer())
        .patch('/company/my-company/fiscal-config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          municipioIbge: '4205407',
        })
        .expect(403); // Forbidden
    });
  });

  describe('Fluxo Completo de Configuração', () => {
    it('deve permitir configuração completa do sistema', async () => {
      // 1. Admin configura Focus NFe
      const adminConfigResponse = await request(app.getHttpServer())
        .patch('/admin/focus-nfe-config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          focusNfeApiKey: 'production-api-key-123',
          focusNfeEnvironment: 'production',
          ibptToken: 'ibpt-token-456',
        })
        .expect(200);

      expect(adminConfigResponse.body.message).toContain('sucesso');

      // 2. Empresa configura dados fiscais
      const companyConfigResponse = await request(app.getHttpServer())
        .patch('/company/my-company/fiscal-config')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          taxRegime: 'SIMPLES_NACIONAL',
          cnae: '4761001',
          municipioIbge: '4205407',
          nfceSerie: '1',
          certificatePassword: 'senha-certificado-producao',
          csc: 'CSC-PRODUCAO-987654321',
          idTokenCsc: '000001',
        })
        .expect(200);

      expect(companyConfigResponse.body.message).toContain('sucesso');

      // 3. Verificar se dados foram salvos corretamente
      const getFiscalResponse = await request(app.getHttpServer())
        .get('/company/my-company/fiscal-config')
        .set('Authorization', `Bearer ${companyToken}`)
        .expect(200);

      expect(getFiscalResponse.body.taxRegime).toBe('SIMPLES_NACIONAL');
      expect(getFiscalResponse.body.cnae).toBe('4761001');
      expect(getFiscalResponse.body.municipioIbge).toBe('4205407');
      expect(getFiscalResponse.body.hasCertificatePassword).toBe(true);
      expect(getFiscalResponse.body.hasCsc).toBe(true);

      // 4. Verificar que admin também pode ver suas configs
      const getAdminConfigResponse = await request(app.getHttpServer())
        .get('/admin/focus-nfe-config')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(getAdminConfigResponse.body.hasFocusNfeApiKey).toBe(true);
      expect(getAdminConfigResponse.body.focusNfeEnvironment).toBe('production');
      expect(getAdminConfigResponse.body.hasIbptToken).toBe(true);
    });

    it('deve manter isolamento entre empresas', async () => {
      // Criar segunda empresa
      const company2Response = await request(app.getHttpServer())
        .post('/company')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Empresa 2 Test',
          login: 'empresa2-fiscal-test',
          password: 'Company@123',
          cnpj: '98765432000188',
          stateRegistration: '987654321',
          email: 'empresa2@test.com',
        });

      const company2Id = company2Response.body.id;

      // Login empresa 2
      const company2LoginResponse = await request(app.getHttpServer())
        .post('/auth/login/company')
        .send({
          login: 'empresa2-fiscal-test',
          password: 'Company@123',
        });

      const company2Token = company2LoginResponse.body.access_token;

      // Configurar empresa 2
      await request(app.getHttpServer())
        .patch('/company/my-company/fiscal-config')
        .set('Authorization', `Bearer ${company2Token}`)
        .send({
          municipioIbge: '4209102', // Joinville
          csc: 'CSC-EMPRESA-2',
        })
        .expect(200);

      // Verificar que empresa 1 ainda tem seus dados
      const company1Config = await request(app.getHttpServer())
        .get('/company/my-company/fiscal-config')
        .set('Authorization', `Bearer ${companyToken}`)
        .expect(200);

      // Empresa 1 deve ter Florianópolis
      expect(company1Config.body.municipioIbge).toBe('4205407');

      // Verificar que empresa 2 tem dados diferentes
      const company2Config = await request(app.getHttpServer())
        .get('/company/my-company/fiscal-config')
        .set('Authorization', `Bearer ${company2Token}`)
        .expect(200);

      // Empresa 2 deve ter Joinville
      expect(company2Config.body.municipioIbge).toBe('4209102');

      // Limpar empresa 2
      await prisma.company.delete({ where: { id: company2Id } }).catch(() => {});
    });
  });

  describe('Segurança e Criptografia', () => {
    it('deve criptografar senha do certificado', async () => {
      const senha = 'senha-super-secreta-123';

      await request(app.getHttpServer())
        .patch('/company/my-company/fiscal-config')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          certificatePassword: senha,
        })
        .expect(200);

      // Buscar diretamente no banco
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { certificatePassword: true },
      });

      // Senha no banco deve estar criptografada (diferente da original)
      expect(company?.certificatePassword).toBeDefined();
      expect(company?.certificatePassword).not.toBe(senha);
      expect(company?.certificatePassword?.length).toBeGreaterThan(senha.length);
    });

    it('deve criptografar CSC', async () => {
      const csc = 'CSC-CODIGO-SECRETO-987654321';

      await request(app.getHttpServer())
        .patch('/company/my-company/fiscal-config')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          csc: csc,
        })
        .expect(200);

      // Buscar diretamente no banco
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { csc: true },
      });

      // CSC no banco deve estar criptografado
      expect(company?.csc).toBeDefined();
      expect(company?.csc).not.toBe(csc);
    });

    it('não deve retornar dados sensíveis descriptografados na API', async () => {
      const response = await request(app.getHttpServer())
        .get('/company/my-company/fiscal-config')
        .set('Authorization', `Bearer ${companyToken}`)
        .expect(200);

      // Não deve retornar senha ou CSC em texto claro
      expect(response.body).not.toHaveProperty('certificatePassword');
      expect(response.body).not.toHaveProperty('csc');

      // Deve retornar apenas indicadores
      expect(response.body).toHaveProperty('hasCertificatePassword');
      expect(response.body).toHaveProperty('hasCsc');
      expect(response.body).toHaveProperty('cscMasked');
    });
  });

  describe('Validações de Campos', () => {
    it('deve aceitar regime tributário válido', async () => {
      const regimes = ['SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL', 'MEI'];

      for (const regime of regimes) {
        const response = await request(app.getHttpServer())
          .patch('/company/my-company/fiscal-config')
          .set('Authorization', `Bearer ${companyToken}`)
          .send({ taxRegime: regime })
          .expect(200);

        expect(response.body).toBeDefined();
      }
    });

    it('deve validar código IBGE', async () => {
      // Válido - 7 dígitos
      await request(app.getHttpServer())
        .patch('/company/my-company/fiscal-config')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ municipioIbge: '4205407' })
        .expect(200);

      // Inválido - menos de 7 dígitos
      await request(app.getHttpServer())
        .patch('/company/my-company/fiscal-config')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ municipioIbge: '123' })
        .expect(400);

      // Inválido - mais de 7 dígitos
      await request(app.getHttpServer())
        .patch('/company/my-company/fiscal-config')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ municipioIbge: '12345678' })
        .expect(400);
    });

    it('deve validar CNAE', async () => {
      // Válido
      await request(app.getHttpServer())
        .patch('/company/my-company/fiscal-config')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ cnae: '4761001' })
        .expect(200);

      // Inválido - letras
      await request(app.getHttpServer())
        .patch('/company/my-company/fiscal-config')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ cnae: 'abc1234' })
        .expect(400);
    });
  });

  describe('Autenticação e Autorização', () => {
    it('deve rejeitar requisição sem token', async () => {
      await request(app.getHttpServer())
        .get('/company/my-company/fiscal-config')
        .expect(401);
    });

    it('deve rejeitar token inválido', async () => {
      await request(app.getHttpServer())
        .get('/company/my-company/fiscal-config')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });

    it('deve rejeitar empresa acessando config de admin', async () => {
      await request(app.getHttpServer())
        .get('/admin/focus-nfe-config')
        .set('Authorization', `Bearer ${companyToken}`)
        .expect(403);
    });
  });
});


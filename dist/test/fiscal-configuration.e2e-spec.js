"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
const prisma_service_1 = require("../src/infrastructure/database/prisma.service");
describe('Fiscal Configuration E2E Tests', () => {
    let app;
    let prisma;
    let adminToken;
    let companyToken;
    let adminId;
    let companyId;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        await app.init();
        prisma = app.get(prisma_service_1.PrismaService);
        const adminResponse = await request(app.getHttpServer())
            .post('/auth/register/admin')
            .send({
            login: 'admin-fiscal-test',
            password: 'Admin@123',
        });
        adminId = adminResponse.body.admin?.id || adminResponse.body.id;
        const adminLoginResponse = await request(app.getHttpServer())
            .post('/auth/login/admin')
            .send({
            login: 'admin-fiscal-test',
            password: 'Admin@123',
        });
        adminToken = adminLoginResponse.body.access_token;
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
        const companyLoginResponse = await request(app.getHttpServer())
            .post('/auth/login/company')
            .send({
            login: 'empresa-fiscal-test',
            password: 'Company@123',
        });
        companyToken = companyLoginResponse.body.access_token;
    });
    afterAll(async () => {
        if (companyId) {
            await prisma.company.delete({ where: { id: companyId } }).catch(() => { });
        }
        if (adminId) {
            await prisma.admin.delete({ where: { id: adminId } }).catch(() => { });
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
                .expect(403);
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
                municipioIbge: '123',
            })
                .expect(400);
            expect(response.body.message).toBeDefined();
        });
        it('deve validar CNAE com 7 dígitos', async () => {
            const response = await request(app.getHttpServer())
                .patch('/company/my-company/fiscal-config')
                .set('Authorization', `Bearer ${companyToken}`)
                .send({
                cnae: 'abc1234',
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
                .expect(403);
        });
    });
    describe('Fluxo Completo de Configuração', () => {
        it('deve permitir configuração completa do sistema', async () => {
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
            const getFiscalResponse = await request(app.getHttpServer())
                .get('/company/my-company/fiscal-config')
                .set('Authorization', `Bearer ${companyToken}`)
                .expect(200);
            expect(getFiscalResponse.body.taxRegime).toBe('SIMPLES_NACIONAL');
            expect(getFiscalResponse.body.cnae).toBe('4761001');
            expect(getFiscalResponse.body.municipioIbge).toBe('4205407');
            expect(getFiscalResponse.body.hasCertificatePassword).toBe(true);
            expect(getFiscalResponse.body.hasCsc).toBe(true);
            const getAdminConfigResponse = await request(app.getHttpServer())
                .get('/admin/focus-nfe-config')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(getAdminConfigResponse.body.hasFocusNfeApiKey).toBe(true);
            expect(getAdminConfigResponse.body.focusNfeEnvironment).toBe('production');
            expect(getAdminConfigResponse.body.hasIbptToken).toBe(true);
        });
        it('deve manter isolamento entre empresas', async () => {
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
            const company2LoginResponse = await request(app.getHttpServer())
                .post('/auth/login/company')
                .send({
                login: 'empresa2-fiscal-test',
                password: 'Company@123',
            });
            const company2Token = company2LoginResponse.body.access_token;
            await request(app.getHttpServer())
                .patch('/company/my-company/fiscal-config')
                .set('Authorization', `Bearer ${company2Token}`)
                .send({
                municipioIbge: '4209102',
                csc: 'CSC-EMPRESA-2',
            })
                .expect(200);
            const company1Config = await request(app.getHttpServer())
                .get('/company/my-company/fiscal-config')
                .set('Authorization', `Bearer ${companyToken}`)
                .expect(200);
            expect(company1Config.body.municipioIbge).toBe('4205407');
            const company2Config = await request(app.getHttpServer())
                .get('/company/my-company/fiscal-config')
                .set('Authorization', `Bearer ${company2Token}`)
                .expect(200);
            expect(company2Config.body.municipioIbge).toBe('4209102');
            await prisma.company.delete({ where: { id: company2Id } }).catch(() => { });
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
            const company = await prisma.company.findUnique({
                where: { id: companyId },
                select: { certificatePassword: true },
            });
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
            const company = await prisma.company.findUnique({
                where: { id: companyId },
                select: { csc: true },
            });
            expect(company?.csc).toBeDefined();
            expect(company?.csc).not.toBe(csc);
        });
        it('não deve retornar dados sensíveis descriptografados na API', async () => {
            const response = await request(app.getHttpServer())
                .get('/company/my-company/fiscal-config')
                .set('Authorization', `Bearer ${companyToken}`)
                .expect(200);
            expect(response.body).not.toHaveProperty('certificatePassword');
            expect(response.body).not.toHaveProperty('csc');
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
            await request(app.getHttpServer())
                .patch('/company/my-company/fiscal-config')
                .set('Authorization', `Bearer ${companyToken}`)
                .send({ municipioIbge: '4205407' })
                .expect(200);
            await request(app.getHttpServer())
                .patch('/company/my-company/fiscal-config')
                .set('Authorization', `Bearer ${companyToken}`)
                .send({ municipioIbge: '123' })
                .expect(400);
            await request(app.getHttpServer())
                .patch('/company/my-company/fiscal-config')
                .set('Authorization', `Bearer ${companyToken}`)
                .send({ municipioIbge: '12345678' })
                .expect(400);
        });
        it('deve validar CNAE', async () => {
            await request(app.getHttpServer())
                .patch('/company/my-company/fiscal-config')
                .set('Authorization', `Bearer ${companyToken}`)
                .send({ cnae: '4761001' })
                .expect(200);
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
//# sourceMappingURL=fiscal-configuration.e2e-spec.js.map
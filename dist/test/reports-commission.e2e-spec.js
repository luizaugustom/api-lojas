"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
const prisma_service_1 = require("../src/infrastructure/database/prisma.service");
const hash_service_1 = require("../src/shared/services/hash.service");
describe('Reports with Commissions E2E Tests', () => {
    let app;
    let prisma;
    let hashService;
    const createdIds = {
        admins: [],
        companies: [],
        sellers: [],
        products: [],
        sales: [],
    };
    let companyToken;
    let companyId;
    let seller1Id;
    let seller2Id;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
        prisma = app.get(prisma_service_1.PrismaService);
        hashService = app.get(hash_service_1.HashService);
        await app.init();
        const hashedPassword = await hashService.hashPassword('admin123');
        const admin = await prisma.admin.create({
            data: {
                login: 'admin-report-test@test.com',
                password: hashedPassword,
            },
        });
        createdIds.admins.push(admin.id);
        const adminLoginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
            login: 'admin-report-test@test.com',
            password: 'admin123',
            role: 'admin',
        });
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
        const companyLoginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
            login: 'report-company@test.com',
            password: 'company123',
            role: 'company',
        });
        companyToken = companyLoginResponse.body.access_token;
        const seller1Response = await request(app.getHttpServer())
            .post('/seller')
            .set('Authorization', `Bearer ${companyToken}`)
            .send({
            login: `seller1-report-${Date.now()}@test.com`,
            password: 'seller123',
            name: 'Vendedor Com Comissão',
            commissionRate: 5.5,
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
        }
        catch (error) {
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
            const commissionsData = response.body.data.commissions.commissions;
            const seller1Commission = commissionsData.find((c) => c.sellerId === seller1Id);
            expect(seller1Commission).toBeDefined();
            expect(seller1Commission.commissionRate).toBe(5.5);
            expect(seller1Commission.totalSales).toBeGreaterThan(0);
            expect(seller1Commission.commissionAmount).toBeGreaterThan(0);
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
            const seller2Commission = commissionsData.find((c) => c.sellerId === seller2Id);
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
            const sales = response.body.data.sales;
            sales.forEach((sale) => {
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
            expect(response.body.length).toBeGreaterThan(1000);
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
//# sourceMappingURL=reports-commission.e2e-spec.js.map
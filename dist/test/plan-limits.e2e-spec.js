"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
const prisma_service_1 = require("../src/infrastructure/database/prisma.service");
const hash_service_1 = require("../src/shared/services/hash.service");
const client_1 = require("@prisma/client");
describe('Plan Limits E2E Tests (with auto-cleanup)', () => {
    let app;
    let prisma;
    let hashService;
    const createdIds = {
        admins: [],
        companies: [],
        sellers: [],
        products: [],
        billsToPay: [],
    };
    let adminToken;
    let companyTrialToken;
    let companyProLimitedToken;
    let companyProToken;
    let companyBasicToken;
    let companyPlusToken;
    let companyBasicId;
    let companyPlusId;
    let companyProId;
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
                login: 'admin-plan-test@test.com',
                password: hashedPassword,
            },
        });
        createdIds.admins.push(admin.id);
        const adminLoginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
            login: 'admin-plan-test@test.com',
            password: 'admin123',
            role: 'admin',
        });
        adminToken = adminLoginResponse.body.access_token;
        const companyTrial = await request(app.getHttpServer())
            .post('/company')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            name: 'Empresa TRIAL Test',
            login: 'trial-test@test.com',
            password: 'trial123',
            cnpj: '11.111.111/0001-11',
            email: 'trial-test@test.com',
            plan: client_1.PlanType.TRIAL_7_DAYS,
            maxProducts: 250,
            maxSellers: 1,
        });
        companyBasicId = companyTrial.body.id;
        createdIds.companies.push(companyBasicId);
        const companyProLimited = await request(app.getHttpServer())
            .post('/company')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            name: 'Empresa PRO Limited Test',
            login: 'pro-limited-test@test.com',
            password: 'prolimited123',
            cnpj: '22.222.222/0001-22',
            email: 'pro-limited-test@test.com',
            plan: client_1.PlanType.PRO,
            maxProducts: 800,
            maxSellers: 2,
        });
        companyPlusId = companyProLimited.body.id;
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
            plan: client_1.PlanType.PRO,
        });
        companyProId = companyPro.body.id;
        createdIds.companies.push(companyProId);
        const trialLoginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
            login: 'trial-test@test.com',
            password: 'trial123',
            role: 'company',
        });
        companyTrialToken = trialLoginResponse.body.access_token;
        companyBasicToken = companyTrialToken;
        const proLimitedLoginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
            login: 'pro-limited-test@test.com',
            password: 'prolimited123',
            role: 'company',
        });
        companyProLimitedToken = proLimitedLoginResponse.body.access_token;
        companyPlusToken = companyProLimitedToken;
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
        console.log('\n🧹 Iniciando limpeza automática dos dados de teste...');
        try {
            if (createdIds.billsToPay.length > 0) {
                await prisma.billToPay.deleteMany({
                    where: { id: { in: createdIds.billsToPay } },
                });
                console.log(`✅ ${createdIds.billsToPay.length} conta(s) a pagar deletada(s)`);
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
            console.log('✨ Limpeza concluída com sucesso!\n');
        }
        catch (error) {
            console.error('❌ Erro durante a limpeza:', error);
        }
        await app.close();
    });
    describe('Product Limits', () => {
        it('should allow creating products within custom limit (250)', async () => {
            const response = await request(app.getHttpServer())
                .post('/product')
                .set('Authorization', `Bearer ${companyBasicToken}`)
                .send({
                name: 'Produto Test 1',
                barcode: `TEST-${Date.now()}`,
                price: 10.0,
                stockQuantity: 100,
            });
            expect(response.status).toBe(201);
            createdIds.products.push(response.body.id);
        });
        it('should block creating products beyond custom limit', async () => {
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
        it('should allow creating 1 seller within custom limit', async () => {
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
        it('should block creating 2nd seller when limit is reached', async () => {
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
        it('should allow creating 2 sellers within custom limit', async () => {
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
        it('should block creating 3rd seller when limit is reached', async () => {
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
        it('should allow creating bills (unlimited by default)', async () => {
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
        it('should allow creating bills again after marking one as paid', async () => {
            const billId = createdIds.billsToPay[0];
            await request(app.getHttpServer())
                .patch(`/bill-to-pay/${billId}/mark-as-paid`)
                .set('Authorization', `Bearer ${companyBasicToken}`)
                .send({
                paymentInfo: 'Pagamento teste',
            });
            const response = await request(app.getHttpServer())
                .post('/bill-to-pay')
                .set('Authorization', `Bearer ${companyBasicToken}`)
                .send({
                title: 'Conta Nova',
                amount: 100.0,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            });
            expect(response.status).toBe(201);
            createdIds.billsToPay.push(response.body.id);
        });
        it('should allow unlimited bills for PRO plan', async () => {
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
//# sourceMappingURL=plan-limits.e2e-spec.js.map
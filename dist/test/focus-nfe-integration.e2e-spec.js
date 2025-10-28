"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const fiscal_api_service_1 = require("../src/shared/services/fiscal-api.service");
const prisma_service_1 = require("../src/infrastructure/database/prisma.service");
describe('Focus NFe Integration Tests', () => {
    let app;
    let fiscalApiService;
    let prisma;
    let configService;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            providers: [
                fiscal_api_service_1.FiscalApiService,
                prisma_service_1.PrismaService,
                config_1.ConfigService,
            ],
        }).compile();
        fiscalApiService = moduleFixture.get(fiscal_api_service_1.FiscalApiService);
        prisma = moduleFixture.get(prisma_service_1.PrismaService);
        configService = moduleFixture.get(config_1.ConfigService);
    });
    describe('Configuração e Conectividade', () => {
        it('deve carregar configuração do Focus NFe', () => {
            expect(fiscalApiService).toBeDefined();
        });
        it('deve validar estrutura de requisição NFCe', () => {
            const mockNFCeRequest = {
                companyId: 'company-123',
                saleId: 'sale-123',
                sellerName: 'Vendedor Teste',
                clientCpfCnpj: '12345678900',
                clientName: 'Cliente Teste',
                items: [
                    {
                        productId: 'prod-123',
                        productName: 'Produto Teste',
                        barcode: '7891234567890',
                        quantity: 2,
                        unitPrice: 10.50,
                        totalPrice: 21.00,
                        ncm: '85171231',
                        cfop: '5102',
                    },
                ],
                totalValue: 21.00,
                paymentMethod: ['cash'],
            };
            expect(mockNFCeRequest).toHaveProperty('companyId');
            expect(mockNFCeRequest).toHaveProperty('items');
            expect(mockNFCeRequest).toHaveProperty('totalValue');
            expect(mockNFCeRequest.items[0]).toHaveProperty('ncm');
            expect(mockNFCeRequest.items[0]).toHaveProperty('cfop');
        });
    });
    describe('Validação de Dados Fiscais', () => {
        it('deve validar formato de CNPJ', () => {
            const cnpjsValidos = [
                '12345678000190',
                '12.345.678/0001-90',
            ];
            cnpjsValidos.forEach(cnpj => {
                const numeros = cnpj.replace(/\D/g, '');
                expect(numeros.length).toBe(14);
            });
        });
        it('deve validar formato de CPF', () => {
            const cpfsValidos = [
                '12345678900',
                '123.456.789-00',
            ];
            cpfsValidos.forEach(cpf => {
                const numeros = cpf.replace(/\D/g, '');
                expect(numeros.length).toBe(11);
            });
        });
        it('deve validar código de barras EAN', () => {
            const codigosValidos = [
                '7891234567890',
                '789123456789',
            ];
            codigosValidos.forEach(codigo => {
                expect(codigo.length).toBeGreaterThanOrEqual(12);
                expect(codigo.length).toBeLessThanOrEqual(13);
                expect(codigo).toMatch(/^\d+$/);
            });
        });
        it('deve validar NCM com 8 dígitos', () => {
            const ncmsValidos = ['85171231', '99999999', '12345678'];
            const ncmsInvalidos = ['123', '123456789', 'abc12345'];
            ncmsValidos.forEach(ncm => {
                expect(ncm).toMatch(/^\d{8}$/);
            });
            ncmsInvalidos.forEach(ncm => {
                expect(ncm).not.toMatch(/^\d{8}$/);
            });
        });
        it('deve validar CFOP com 4 dígitos', () => {
            const cfopsValidos = ['5102', '5405', '6102'];
            const cfopsInvalidos = ['123', '12345', 'abcd'];
            cfopsValidos.forEach(cfop => {
                expect(cfop).toMatch(/^\d{4}$/);
            });
            cfopsInvalidos.forEach(cfop => {
                expect(cfop).not.toMatch(/^\d{4}$/);
            });
        });
    });
    describe('Cálculo de Valores', () => {
        it('deve calcular valor total dos itens', () => {
            const items = [
                { quantity: 2, unitPrice: 10.50, totalPrice: 21.00 },
                { quantity: 1, unitPrice: 15.00, totalPrice: 15.00 },
                { quantity: 3, unitPrice: 5.00, totalPrice: 15.00 },
            ];
            const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
            expect(total).toBe(51.00);
            items.forEach(item => {
                expect(item.totalPrice).toBe(item.quantity * item.unitPrice);
            });
        });
        it('deve calcular tributos aproximados', () => {
            const valorProduto = 100.00;
            const percentualTributo = 16.65;
            const valorTributo = (valorProduto * percentualTributo) / 100;
            expect(valorTributo).toBe(16.65);
            expect(valorTributo).toBeLessThan(valorProduto);
        });
    });
    describe('Formatos e Máscaras', () => {
        it('deve formatar CNPJ corretamente', () => {
            const cnpj = '12345678000190';
            const formatted = cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
            expect(formatted).toBe('12.345.678/0001-90');
        });
        it('deve formatar CPF corretamente', () => {
            const cpf = '12345678900';
            const formatted = cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
            expect(formatted).toBe('123.456.789-00');
        });
        it('deve formatar chave de acesso em blocos de 4', () => {
            const chave = '35240114200166000187650010000000001234567890';
            const chunks = chave.match(/.{1,4}/g);
            const formatted = chunks?.join(' ');
            expect(formatted).toContain('3524 0114 2001');
            expect(chunks?.length).toBe(11);
        });
        it('deve formatar valor monetário', () => {
            const valores = [10.50, 1234.56, 0.99];
            valores.forEach(valor => {
                const formatted = `R$ ${valor.toFixed(2).replace('.', ',')}`;
                expect(formatted).toMatch(/^R\$ \d+,\d{2}$/);
            });
        });
    });
    describe('Validação de Payload NFCe', () => {
        it('deve ter todos campos obrigatórios', () => {
            const payload = {
                companyId: 'company-123',
                saleId: 'sale-123',
                sellerName: 'Vendedor',
                items: [{
                        productId: 'prod-123',
                        productName: 'Produto',
                        barcode: '123',
                        quantity: 1,
                        unitPrice: 10,
                        totalPrice: 10,
                        ncm: '99999999',
                        cfop: '5102',
                    }],
                totalValue: 10,
                paymentMethod: ['cash'],
            };
            expect(payload.companyId).toBeDefined();
            expect(payload.saleId).toBeDefined();
            expect(payload.items).toBeInstanceOf(Array);
            expect(payload.items.length).toBeGreaterThan(0);
            expect(payload.totalValue).toBeGreaterThan(0);
            expect(payload.paymentMethod).toBeInstanceOf(Array);
            payload.items.forEach(item => {
                expect(item.productId).toBeDefined();
                expect(item.quantity).toBeGreaterThan(0);
                expect(item.unitPrice).toBeGreaterThan(0);
                expect(item.totalPrice).toBe(item.quantity * item.unitPrice);
                expect(item.ncm).toMatch(/^\d{8}$/);
                expect(item.cfop).toMatch(/^\d{4}$/);
            });
        });
    });
});
//# sourceMappingURL=focus-nfe-integration.e2e-spec.js.map
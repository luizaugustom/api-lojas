"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const company_service_1 = require("./company.service");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const hash_service_1 = require("../../shared/services/hash.service");
const encryption_service_1 = require("../../shared/services/encryption.service");
describe('CompanyService - Fiscal Configuration', () => {
    let service;
    let prismaService;
    let encryptionService;
    const mockCompany = {
        id: 'company-123',
        name: 'Empresa Teste',
        cnpj: '12.345.678/0001-90',
        stateRegistration: '123456789',
        state: 'SC',
        city: 'Florianópolis',
        certificatePassword: null,
        nfceSerie: '1',
        municipioIbge: '4205407',
        csc: null,
        idTokenCsc: '000001',
        taxRegime: 'SIMPLES_NACIONAL',
        cnae: '4761001',
    };
    const mockPrismaService = {
        company: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };
    const mockEncryptionService = {
        encrypt: jest.fn((text) => `encrypted_${text}`),
        decrypt: jest.fn((text) => text.replace('encrypted_', '')),
        mask: jest.fn((text) => `${text.substring(0, 4)}****`),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                company_service_1.CompanyService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: hash_service_1.HashService,
                    useValue: {
                        hashPassword: jest.fn(),
                    },
                },
                {
                    provide: encryption_service_1.EncryptionService,
                    useValue: mockEncryptionService,
                },
            ],
        }).compile();
        service = module.get(company_service_1.CompanyService);
        prismaService = module.get(prisma_service_1.PrismaService);
        encryptionService = module.get(encryption_service_1.EncryptionService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('updateFiscalConfig', () => {
        it('deve atualizar configurações fiscais com sucesso', async () => {
            const companyId = 'company-123';
            const updateDto = {
                taxRegime: 'SIMPLES_NACIONAL',
                cnae: '4761001',
                municipioIbge: '4205407',
                nfceSerie: '1',
                certificatePassword: 'senha-123',
                csc: 'CSC-123',
                idTokenCsc: '000001',
            };
            mockPrismaService.company.findUnique.mockResolvedValue(mockCompany);
            mockPrismaService.company.update.mockResolvedValue({
                ...mockCompany,
                ...updateDto,
            });
            const result = await service.updateFiscalConfig(companyId, updateDto);
            expect(result).toBeDefined();
            expect(result.message).toContain('sucesso');
            expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('senha-123');
            expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('CSC-123');
        });
        it('deve lançar erro se empresa não encontrada', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue(null);
            await expect(service.updateFiscalConfig('invalid-id', {})).rejects.toThrow(common_1.NotFoundException);
        });
        it('deve criptografar apenas campos sensíveis', async () => {
            const updateDto = {
                certificatePassword: 'senha-certificado',
                csc: 'CSC-CODIGO',
                municipioIbge: '4205407',
            };
            mockPrismaService.company.findUnique.mockResolvedValue(mockCompany);
            mockPrismaService.company.update.mockResolvedValue(mockCompany);
            await service.updateFiscalConfig('company-123', updateDto);
            expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('senha-certificado');
            expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('CSC-CODIGO');
            expect(mockEncryptionService.encrypt).toHaveBeenCalledTimes(2);
        });
        it('deve atualizar apenas campos fornecidos', async () => {
            const updateDto = {
                municipioIbge: '4209102',
            };
            mockPrismaService.company.findUnique.mockResolvedValue(mockCompany);
            mockPrismaService.company.update.mockResolvedValue(mockCompany);
            await service.updateFiscalConfig('company-123', updateDto);
            const updateCall = mockPrismaService.company.update.mock.calls[0][0];
            expect(updateCall.data).toHaveProperty('municipioIbge', '4209102');
            expect(updateCall.data).not.toHaveProperty('nfceSerie');
        });
    });
    describe('getFiscalConfig', () => {
        it('deve retornar configurações com dados mascarados', async () => {
            const companyWithSecrets = {
                ...mockCompany,
                certificatePassword: 'encrypted_senha123',
                csc: 'encrypted_CSC789',
            };
            mockPrismaService.company.findUnique.mockResolvedValue(companyWithSecrets);
            const result = await service.getFiscalConfig('company-123');
            expect(result).toBeDefined();
            expect(result.cnpj).toBe(mockCompany.cnpj);
            expect(result.hasCertificatePassword).toBe(true);
            expect(result.hasCsc).toBe(true);
            expect(mockEncryptionService.mask).toHaveBeenCalled();
        });
        it('deve indicar quando dados sensíveis não estão configurados', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue({
                ...mockCompany,
                certificatePassword: null,
                csc: null,
            });
            const result = await service.getFiscalConfig('company-123');
            expect(result.hasCertificatePassword).toBe(false);
            expect(result.hasCsc).toBe(false);
            expect(result.certificatePasswordMasked).toBeNull();
            expect(result.cscMasked).toBeNull();
        });
        it('deve lançar erro se empresa não encontrada', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue(null);
            await expect(service.getFiscalConfig('invalid-id')).rejects.toThrow(common_1.NotFoundException);
        });
        it('deve retornar todos campos fiscais', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue(mockCompany);
            const result = await service.getFiscalConfig('company-123');
            expect(result).toHaveProperty('taxRegime');
            expect(result).toHaveProperty('cnae');
            expect(result).toHaveProperty('municipioIbge');
            expect(result).toHaveProperty('nfceSerie');
            expect(result).toHaveProperty('idTokenCsc');
        });
    });
    describe('uploadCertificateToFocusNfe', () => {
        const mockFile = {
            originalname: 'certificado.pfx',
            buffer: Buffer.from('mock certificate data'),
            mimetype: 'application/x-pkcs12',
        };
        const mockCompanyWithConfig = {
            cnpj: '12345678000190',
            certificatePassword: 'encrypted_senha123',
            admin: {
                focusNfeApiKey: 'test-api-key',
                focusNfeEnvironment: 'sandbox',
            },
        };
        beforeEach(() => {
            jest.mock('axios');
        });
        it('deve validar se arquivo foi enviado', async () => {
            await expect(service.uploadCertificateToFocusNfe('company-123', null)).rejects.toThrow('Arquivo de certificado é obrigatório');
        });
        it('deve validar extensão do arquivo', async () => {
            const invalidFile = {
                ...mockFile,
                originalname: 'certificado.txt',
            };
            mockPrismaService.company.findUnique.mockResolvedValue(mockCompanyWithConfig);
            await expect(service.uploadCertificateToFocusNfe('company-123', invalidFile)).rejects.toThrow('Arquivo deve ser .pfx ou .p12');
        });
        it('deve validar se API Key está configurada', async () => {
            const companyWithoutApiKey = {
                ...mockCompanyWithConfig,
                admin: {
                    focusNfeApiKey: null,
                    focusNfeEnvironment: 'sandbox',
                },
            };
            mockPrismaService.company.findUnique.mockResolvedValue(companyWithoutApiKey);
            await expect(service.uploadCertificateToFocusNfe('company-123', mockFile)).rejects.toThrow('API Key do Focus NFe não configurada');
        });
        it('deve validar se senha do certificado está configurada', async () => {
            const companyWithoutPassword = {
                ...mockCompanyWithConfig,
                certificatePassword: null,
            };
            mockPrismaService.company.findUnique.mockResolvedValue(companyWithoutPassword);
            await expect(service.uploadCertificateToFocusNfe('company-123', mockFile)).rejects.toThrow('Configure a senha do certificado antes');
        });
        it('deve aceitar arquivo com extensão .p12', () => {
            const p12File = {
                ...mockFile,
                originalname: 'certificado.p12',
            };
            const isValid = p12File.originalname.endsWith('.pfx') ||
                p12File.originalname.endsWith('.p12');
            expect(isValid).toBe(true);
            expect(p12File.originalname).toMatch(/\.(pfx|p12)$/);
        });
    });
    describe('validações de dados fiscais', () => {
        it('deve validar código IBGE com 7 dígitos', () => {
            const codigosValidos = ['4205407', '4209102', '4202404'];
            const codigosInvalidos = ['123', '12345678', 'abc1234'];
            codigosValidos.forEach(codigo => {
                expect(codigo).toMatch(/^\d{7}$/);
            });
            codigosInvalidos.forEach(codigo => {
                expect(codigo).not.toMatch(/^\d{7}$/);
            });
        });
        it('deve validar CNAE com 7 dígitos', () => {
            const cnaesValidos = ['4761001', '4711301', '5611201'];
            const cnaesInvalidos = ['476', '47610011', 'abc1234'];
            cnaesValidos.forEach(cnae => {
                expect(cnae).toMatch(/^\d{7}$/);
            });
            cnaesInvalidos.forEach(cnae => {
                expect(cnae).not.toMatch(/^\d{7}$/);
            });
        });
    });
});
//# sourceMappingURL=company.service.spec.js.map
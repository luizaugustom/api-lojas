"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const encryption_service_1 = require("./encryption.service");
describe('EncryptionService', () => {
    let service;
    let configService;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                encryption_service_1.EncryptionService,
                {
                    provide: config_1.ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue('test-secret-key-for-encryption'),
                    },
                },
            ],
        }).compile();
        service = module.get(encryption_service_1.EncryptionService);
        configService = module.get(config_1.ConfigService);
    });
    it('deve ser definido', () => {
        expect(service).toBeDefined();
    });
    describe('encrypt', () => {
        it('deve criptografar um texto', () => {
            const texto = 'minha-senha-secreta';
            const encrypted = service.encrypt(texto);
            expect(encrypted).toBeDefined();
            expect(encrypted).not.toBe(texto);
            expect(typeof encrypted).toBe('string');
        });
        it('deve retornar string vazia para texto vazio', () => {
            const encrypted = service.encrypt('');
            expect(encrypted).toBe('');
        });
        it('deve gerar criptografia diferente do texto original', () => {
            const texto = 'teste123';
            const encrypted = service.encrypt(texto);
            expect(encrypted).not.toBe(texto);
            expect(encrypted.length).toBeGreaterThan(0);
        });
    });
    describe('decrypt', () => {
        it('deve descriptografar um texto criptografado', () => {
            const textoOriginal = 'senha-super-secreta';
            const encrypted = service.encrypt(textoOriginal);
            const decrypted = service.decrypt(encrypted);
            expect(decrypted).toBe(textoOriginal);
        });
        it('deve retornar string vazia para texto vazio', () => {
            const decrypted = service.decrypt('');
            expect(decrypted).toBe('');
        });
        it('deve retornar string vazia para texto inválido', () => {
            const decrypted = service.decrypt('texto-invalido-nao-criptografado');
            expect(decrypted).toBe('');
        });
        it('deve descriptografar corretamente múltiplos textos', () => {
            const textos = [
                'senha1',
                'CSC123456789',
                'token-api-key-12345',
                'certificado-senha-complexa-!@#$',
            ];
            textos.forEach(texto => {
                const encrypted = service.encrypt(texto);
                const decrypted = service.decrypt(encrypted);
                expect(decrypted).toBe(texto);
            });
        });
    });
    describe('mask', () => {
        it('deve mascarar um texto mostrando apenas primeiros caracteres', () => {
            const texto = 'abc123def456ghi789';
            const masked = service.mask(texto, 4);
            expect(masked).toContain('abc1');
            expect(masked).toContain('*');
            expect(masked.length).toBeGreaterThanOrEqual(texto.length);
        });
        it('deve mascarar texto curto completamente se menor que visibleChars', () => {
            const texto = 'abc';
            const masked = service.mask(texto, 4);
            expect(masked).toBe('***');
        });
        it('deve retornar string vazia para texto vazio', () => {
            const masked = service.mask('');
            expect(masked).toBe('');
        });
        it('deve mascarar com padrão de 4 caracteres visíveis', () => {
            const texto = 'senha1234567890';
            const masked = service.mask(texto);
            expect(masked.substring(0, 4)).toBe('senh');
            expect(masked).toContain('*');
        });
        it('deve criar máscara com no mínimo 8 asteriscos', () => {
            const texto = 'abcde';
            const masked = service.mask(texto, 1);
            const asteriscos = masked.match(/\*/g);
            expect(asteriscos).toBeDefined();
            expect(asteriscos.length).toBeGreaterThanOrEqual(8);
        });
    });
    describe('encrypt/decrypt ciclo completo', () => {
        it('deve manter integridade em múltiplos ciclos', () => {
            const textoOriginal = 'CSC-CODIGO-SEGURANCA-123456789';
            const enc1 = service.encrypt(textoOriginal);
            const dec1 = service.decrypt(enc1);
            expect(dec1).toBe(textoOriginal);
            const enc2 = service.encrypt(textoOriginal);
            const dec2 = service.decrypt(enc2);
            expect(dec2).toBe(textoOriginal);
            expect(enc1).toBe(enc2);
        });
        it('deve lidar com caracteres especiais', () => {
            const textos = [
                'Senha@123!',
                'CSC#2024$%',
                'API_KEY-abc.def',
                'Ãçêntos são válidos',
            ];
            textos.forEach(texto => {
                const encrypted = service.encrypt(texto);
                const decrypted = service.decrypt(encrypted);
                expect(decrypted).toBe(texto);
            });
        });
        it('deve lidar com textos longos', () => {
            const textoLongo = 'A'.repeat(1000);
            const encrypted = service.encrypt(textoLongo);
            const decrypted = service.decrypt(encrypted);
            expect(decrypted).toBe(textoLongo);
            expect(decrypted.length).toBe(1000);
        });
    });
});
//# sourceMappingURL=encryption.service.spec.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestModuleWithMockedPrisma = createTestModuleWithMockedPrisma;
const testing_1 = require("@nestjs/testing");
const prisma_service_1 = require("../../src/infrastructure/database/prisma.service");
const prisma_mock_1 = require("./prisma-mock");
async function createTestModuleWithMockedPrisma(serviceClass, additionalProviders = []) {
    const prismaMock = (0, prisma_mock_1.createPrismaMock)();
    return testing_1.Test.createTestingModule({
        providers: [
            serviceClass,
            {
                provide: prisma_service_1.PrismaService,
                useValue: prismaMock,
            },
            ...additionalProviders,
        ],
    }).compile();
}
//# sourceMappingURL=test-helpers.js.map
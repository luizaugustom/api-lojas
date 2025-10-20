"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const prisma_mock_1 = require("../../../test/utils/prisma-mock");
const test_helpers_1 = require("../../../test/utils/test-helpers");
const bill_to_pay_service_1 = require("./bill-to-pay.service");
describe('BillToPayService', () => {
    let service;
    const prismaMock = (0, prisma_mock_1.createPrismaMock)();
    beforeEach(async () => {
        const mod = await (0, test_helpers_1.createTestModuleWithMockedPrisma)(bill_to_pay_service_1.BillToPayService);
        service = mod.get(bill_to_pay_service_1.BillToPayService);
        jest.clearAllMocks();
    });
    it('should create bill', async () => {
        const created = { id: 'b1', title: 'Conta', amount: 10 };
        prismaMock.billToPay.create.mockResolvedValue(created);
        const result = await service.create('comp1', { title: 'Conta', amount: 10 });
        expect(prismaMock.billToPay.create).toHaveBeenCalled();
        expect(result).toEqual(created);
    });
    it('should not update paid bill', async () => {
        prismaMock.billToPay.findUnique.mockResolvedValue({ id: 'b1', isPaid: true });
        await expect(service.update('b1', { title: 'x' })).rejects.toThrow(common_1.BadRequestException);
    });
    it('should delete unpaid bill', async () => {
        prismaMock.billToPay.findUnique.mockResolvedValue({ id: 'b2', isPaid: false });
        prismaMock.billToPay.delete.mockResolvedValue({});
        const result = await service.remove('b2');
        expect(prismaMock.billToPay.delete).toHaveBeenCalled();
        expect(result).toHaveProperty('message');
    });
});
//# sourceMappingURL=bill-to-pay.service.spec.js.map
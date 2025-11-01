import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createPrismaMock } from '../../../test/utils/prisma-mock';
import { createTestModuleWithMockedPrisma } from '../../../test/utils/test-helpers';
import { BillToPayService } from './bill-to-pay.service';

describe('BillToPayService', () => {
  let service: BillToPayService;
  const prismaMock = createPrismaMock();

  beforeEach(async () => {
    const mod = await createTestModuleWithMockedPrisma(BillToPayService);
    service = mod.get<BillToPayService>(BillToPayService);
    jest.clearAllMocks();
  });

  it('should create bill', async () => {
    const created = { id: 'b1', title: 'Conta', amount: 10 };
    prismaMock.billToPay.create.mockResolvedValue(created);

    const result = await service.create('comp1', { title: 'Conta', amount: 10 } as any);
    expect(prismaMock.billToPay.create).toHaveBeenCalled();
    expect(result).toEqual(created);
  });

  it('should not update paid bill', async () => {
    prismaMock.billToPay.findUnique.mockResolvedValue({ id: 'b1', isPaid: true });
    await expect(service.update('b1', { title: 'x' } as any)).rejects.toThrow(BadRequestException);
  });

  it('should delete unpaid bill', async () => {
    prismaMock.billToPay.findUnique.mockResolvedValue({ id: 'b2', isPaid: false });
    prismaMock.billToPay.delete.mockResolvedValue({});

    const result = await service.remove('b2');
    expect(prismaMock.billToPay.delete).toHaveBeenCalled();
    expect(result).toHaveProperty('message');
  });

  it('should delete paid bill', async () => {
    prismaMock.billToPay.findUnique.mockResolvedValue({ id: 'b3', isPaid: true });
    prismaMock.billToPay.delete.mockResolvedValue({});

    const result = await service.remove('b3');
    expect(prismaMock.billToPay.delete).toHaveBeenCalled();
    expect(result).toHaveProperty('message');
  });
});

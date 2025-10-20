import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { createPrismaMock } from './prisma-mock';

export async function createTestModuleWithMockedPrisma(
  serviceClass: any,
  additionalProviders: any[] = [],
): Promise<TestingModule> {
  const prismaMock = createPrismaMock();

  return Test.createTestingModule({
    providers: [
      serviceClass,
      {
        provide: PrismaService,
        useValue: prismaMock,
      },
      ...additionalProviders,
    ],
  }).compile();
}

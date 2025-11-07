import { DataPeriodFilter } from '@prisma/client';

export interface DataPeriodRange {
  startDate?: Date;
  endDate?: Date;
}

const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

export function resolveDataPeriodRange(
  period?: DataPeriodFilter | null,
  options?: { now?: Date },
): DataPeriodRange {
  if (!period || period === DataPeriodFilter.ALL) {
    return {};
  }

  const now = options?.now ? new Date(options.now) : new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);

  switch (period) {
    case DataPeriodFilter.THIS_YEAR: {
      startDate.setMonth(0, 1);
      return { startDate, endDate };
    }
    case DataPeriodFilter.LAST_6_MONTHS: {
      startDate.setMonth(startDate.getMonth() - 6);
      return { startDate, endDate };
    }
    case DataPeriodFilter.LAST_3_MONTHS: {
      startDate.setMonth(startDate.getMonth() - 3);
      return { startDate, endDate };
    }
    case DataPeriodFilter.LAST_1_MONTH: {
      startDate.setMonth(startDate.getMonth() - 1);
      return { startDate, endDate };
    }
    case DataPeriodFilter.LAST_15_DAYS: {
      startDate.setTime(startDate.getTime() - 14 * MILLISECONDS_IN_DAY);
      return { startDate, endDate };
    }
    case DataPeriodFilter.THIS_WEEK: {
      const day = startDate.getDay();
      const diff = (day === 0 ? 6 : day - 1); // Ajusta para semana começando na segunda-feira
      startDate.setDate(startDate.getDate() - diff);
      return { startDate, endDate };
    }
    default:
      return {};
  }
}

export function resolveDataPeriodRangeAsISOString(
  period?: DataPeriodFilter | null,
  options?: { now?: Date },
): { startDate?: string; endDate?: string } {
  const { startDate, endDate } = resolveDataPeriodRange(period, options);

  return {
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString(),
  };
}


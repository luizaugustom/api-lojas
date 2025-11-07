import { Request } from 'express';

export interface ClientTimeInfo {
  timeZone?: string;
  locale?: string;
  utcOffsetMinutes?: number;
  currentDate?: Date;
}

function parseHeaderDate(value?: string | string[]): Date | undefined {
  if (!value) {
    return undefined;
  }

  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    return undefined;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed;
}

function parseHeaderNumber(value?: string | string[]): number | undefined {
  if (!value) {
    return undefined;
  }

  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined) {
    return undefined;
  }

  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return parsed;
}

function parseHeaderString(value?: string | string[]): string | undefined {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
}

export function extractClientTimeInfo(req: Request): ClientTimeInfo {
  const currentDate = parseHeaderDate(req.headers['x-client-datetime']);
  const utcOffsetMinutes = parseHeaderNumber(req.headers['x-client-utc-offset']);
  const timeZone = parseHeaderString(req.headers['x-client-timezone']);
  const locale = parseHeaderString(req.headers['x-client-locale']);

  return {
    currentDate,
    utcOffsetMinutes,
    timeZone,
    locale,
  };
}

export function getClientNow(clientTimeInfo?: ClientTimeInfo): Date {
  const date = clientTimeInfo?.currentDate;
  if (date && !Number.isNaN(date.getTime())) {
    return date;
  }
  return new Date();
}

export function formatClientDate(
  dateInput: Date | string | number | null | undefined,
  clientTimeInfo?: ClientTimeInfo,
  options?: Intl.DateTimeFormatOptions,
  fallbackLocale = 'pt-BR',
): string {
  if (dateInput === null || dateInput === undefined) {
    return '';
  }

  const date = typeof dateInput === 'string' || typeof dateInput === 'number'
    ? new Date(dateInput)
    : dateInput;

  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  const locale = clientTimeInfo?.locale ?? fallbackLocale;
  const formatOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(options ?? {}),
  };

  if (clientTimeInfo?.timeZone) {
    formatOptions.timeZone = clientTimeInfo.timeZone;
  }

  try {
    return new Intl.DateTimeFormat(locale, formatOptions).format(date);
  } catch (error) {
    return date.toLocaleString(locale);
  }
}

export function formatClientDateOnly(
  dateInput: Date | string | number | null | undefined,
  clientTimeInfo?: ClientTimeInfo,
  fallbackLocale = 'pt-BR',
): string {
  return formatClientDate(dateInput, clientTimeInfo, { day: '2-digit', month: '2-digit', year: 'numeric' }, fallbackLocale);
}


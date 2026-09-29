/**
 * VnExpress OV Adblock Control Tower - Data Processing & Analytics Service
 */

import Papa from 'papaparse';
import { RAW_FOLDER_CSV } from '../data/rawFolderCsv';
import { RAW_COUNTRY_CSV } from '../data/rawCountryCsv';
import { RAW_DATE_CSV } from '../data/rawDateCsv';
import {
  RawFolderRecord,
  RawCountryRecord,
  RawDateRecord,
  NormalizedFolderRecord,
  NormalizedCountryRecord,
  NormalizedDateRecord,
  FilterState,
  ExecutiveKpiSummary,
  SampleAllocationRow,
  MarketPerformanceRow,
  FolderPerformanceRow,
  DataQualityReport,
  DataQualityAudit,
  ActiveAlert,
  AlertThresholds,
} from '../types';

/**
 * Case-insensitive, accent-insensitive, and BOM-safe column field accessor
 */
export function getFieldCaseInsensitive(row: Record<string, any>, possibleNames: string[]): any {
  if (!row || typeof row !== 'object') return undefined;

  // 1. Exact match
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && String(row[name]).trim() !== '') {
      return row[name];
    }
  }

  // 2. Normalized key match (strip BOM, trim, lowercase, remove accents and spaces)
  const normalize = (s: string) =>
    s
      .replace(/^\uFEFF/, '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[_\s-]+/g, '');

  const rowKeys = Object.keys(row);
  const normalizedPossible = possibleNames.map(normalize);

  for (const key of rowKeys) {
    const normKey = normalize(key);
    for (let i = 0; i < normalizedPossible.length; i++) {
      if (normKey === normalizedPossible[i]) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
          return row[key];
        }
      }
    }
  }

  // 3. Partial contains match
  for (const key of rowKeys) {
    const normKey = normalize(key);
    for (let i = 0; i < normalizedPossible.length; i++) {
      const target = normalizedPossible[i];
      if (normKey.length >= 2 && (normKey.includes(target) || target.includes(normKey))) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
          return row[key];
        }
      }
    }
  }

  return undefined;
}

/**
 * Parse and normalize date strings in ISO (YYYY-MM-DD) or VN/European (DD/MM/YYYY)
 */
export function normalizeDateString(raw: string): {
  dayString: string;
  year: number;
  month: number;
  timestamp: number;
} {
  if (!raw) {
    return { dayString: '2026-09-01', year: 2026, month: 9, timestamp: Date.now() };
  }
  const clean = String(raw).trim().replace(/"/g, '').split(' ')[0].split('T')[0];

  // 1. ISO format: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    const mStr = m < 10 ? `0${m}` : `${m}`;
    const dStr = d < 10 ? `0${d}` : `${d}`;
    const dayString = `${y}-${mStr}-${dStr}`;
    return {
      dayString,
      year: y,
      month: m,
      timestamp: new Date(`${dayString}T00:00:00Z`).getTime(),
    };
  }

  // 2. Compact format: YYYYMMDD
  const compactMatch = clean.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    const y = parseInt(compactMatch[1], 10);
    const m = parseInt(compactMatch[2], 10);
    const d = parseInt(compactMatch[3], 10);
    const mStr = m < 10 ? `0${m}` : `${m}`;
    const dStr = d < 10 ? `0${d}` : `${d}`;
    const dayString = `${y}-${mStr}-${dStr}`;
    return {
      dayString,
      year: y,
      month: m,
      timestamp: new Date(`${dayString}T00:00:00Z`).getTime(),
    };
  }

  // 3. DD/MM/YYYY or MM/DD/YYYY or D/M/YYYY
  const slashMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (slashMatch) {
    const p1 = parseInt(slashMatch[1], 10);
    const p2 = parseInt(slashMatch[2], 10);
    const y = parseInt(slashMatch[3], 10);
    let d = p1;
    let m = p2;
    // If second number > 12 and first <= 12, then it's US format: MM/DD/YYYY
    if (p2 > 12 && p1 <= 12) {
      m = p1;
      d = p2;
    } else {
      // Default to DD/MM/YYYY for Vietnamese context
      d = p1;
      m = p2;
    }
    const mStr = m < 10 ? `0${m}` : `${m}`;
    const dStr = d < 10 ? `0${d}` : `${d}`;
    const dayString = `${y}-${mStr}-${dStr}`;
    return {
      dayString,
      year: y,
      month: m,
      timestamp: new Date(`${dayString}T00:00:00Z`).getTime(),
    };
  }

  // Fallback: standard Date parsing
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = parsed.getMonth() + 1;
    const d = parsed.getDate();
    const mStr = m < 10 ? `0${m}` : `${m}`;
    const dStr = d < 10 ? `0${d}` : `${d}`;
    const dayString = `${y}-${mStr}-${dStr}`;
    return {
      dayString,
      year: y,
      month: m,
      timestamp: new Date(`${dayString}T00:00:00Z`).getTime(),
    };
  }

  const fallbackDay = clean.slice(0, 10);
  return {
    dayString: fallbackDay,
    year: 2026,
    month: 9,
    timestamp: Date.now(),
  };
}

/**
 * Robustly extract month number (1 - 12) from arbitrary representations
 * Supports: 9, '9', '09', 'Tháng 9', 'Tháng 09', 'T9', 'thang 9', 'September', 'Sep', '2026-09', '09/2026', etc.
 */
export function parseMonthValue(val: any): number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number') {
    return val >= 1 && val <= 12 ? Math.round(val) : null;
  }
  const str = String(val).trim();
  if (!str) return null;

  // Direct number: '9', '09', '9.0'
  const directNum = parseFloat(str);
  if (!isNaN(directNum) && directNum >= 1 && directNum <= 12 && String(directNum).length <= 4) {
    return Math.round(directNum);
  }

  // Vietnamese 'Tháng 9', 'Tháng 09', 'T9', 'Thang 9'
  const vnMatch = str.match(/(?:tháng|thang|t)\s*(\d{1,2})/i);
  if (vnMatch) {
    const m = parseInt(vnMatch[1], 10);
    if (m >= 1 && m <= 12) return m;
  }

  // English month names
  const enMonths: Record<string, number> = {
    jan: 1, january: 1,
    feb: 2, february: 2,
    mar: 3, march: 3,
    apr: 4, april: 4,
    may: 5,
    jun: 6, june: 6,
    jul: 7, july: 7,
    aug: 8, august: 8,
    sep: 9, september: 9,
    oct: 10, october: 10,
    nov: 11, november: 11,
    dec: 12, december: 12,
  };
  const lower = str.toLowerCase().replace(/[^a-z]/g, '');
  if (enMonths[lower]) return enMonths[lower];

  // Date pattern: '2026-09' or '09/2026' or '2026/09/01'
  const yyyymm = str.match(/\d{4}[-/](\d{1,2})/);
  if (yyyymm) {
    const m = parseInt(yyyymm[1], 10);
    if (m >= 1 && m <= 12) return m;
  }
  const mmyyyy = str.match(/(\d{1,2})[-/]\d{4}/);
  if (mmyyyy) {
    const m = parseInt(mmyyyy[1], 10);
    if (m >= 1 && m <= 12) return m;
  }

  const digits = str.replace(/[^\d]/g, '');
  if (digits.length >= 1 && digits.length <= 2) {
    const m = parseInt(digits, 10);
    if (m >= 1 && m <= 12) return m;
  }

  return null;
}

/**
 * Clean and parse numeric values supporting US and Vietnamese formats
 */
export function cleanNumber(val: string | number | undefined | null): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  let str = String(val).trim().replace(/[\s\u00A0\"']/g, '');
  if (!str) return 0;

  const hasComma = str.includes(',');
  const hasDot = str.includes('.');

  if (hasDot && hasComma) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (hasDot && !hasComma) {
    const dotParts = str.split('.');
    if (dotParts.length > 2) {
      str = str.replace(/\./g, '');
    } else if (dotParts.length === 2) {
      // If dot followed by 3 digits and integer part is 1..3 digits, it's thousands separator (1.234)
      if (dotParts[1].length === 3 && dotParts[0].length >= 1 && dotParts[0].length <= 3) {
        str = str.replace('.', '');
      }
    }
  } else if (hasComma && !hasDot) {
    const commaParts = str.split(',');
    if (commaParts.length > 2) {
      str = str.replace(/,/g, '');
    } else if (commaParts.length === 2) {
      if (commaParts[1].length === 3 && commaParts[0].length >= 1 && commaParts[0].length <= 3) {
        str = str.replace(',', '');
      } else {
        str = str.replace(',', '.');
      }
    }
  }

  const num = Number(str);
  return isNaN(num) ? 0 : num;
}

export function cleanPercent(val: string | number | undefined | null): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/%/g, '').trim();
  const commaCount = (cleaned.match(/,/g) || []).length;
  if (commaCount === 1 && !cleaned.includes('.')) {
    return Number(cleaned.replace(',', '.')) || 0;
  }
  return cleanNumber(cleaned);
}

/**
 * Format numbers for Vietnamese executive presentation
 */
export function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return new Intl.NumberFormat('vi-VN').format(Math.round(val));
}

export function formatCompactNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(2)} tỷ`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(2)} tr`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(1)} k`;
  }
  return `${sign}${Math.round(abs)}`;
}

export function formatPercent(val: number | null | undefined, decimals = 2): string {
  if (val === null || val === undefined || isNaN(val)) return '0.00%';
  return `${val.toFixed(decimals)}%`;
}

export function formatDiff(val: number | null | undefined, isPercent = false): string {
  if (val === null || val === undefined || isNaN(val)) return '-';
  const prefix = val > 0 ? '+' : '';
  return isPercent ? `${prefix}${val.toFixed(2)}%` : `${prefix}${formatNumber(val)}`;
}

export function formatDiffPp(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '-';
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(2)} pp`;
}

/**
 * Format ISO date string (YYYY-MM-DD) to Vietnamese presentation (DD/MM/YYYY)
 */
export function formatDateVi(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const clean = dateStr.slice(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Get the latest recorded date string dynamically
 */
export function getLatestDateString(): string {
  let latestCountryDay = '';
  countryRecords.forEach((r) => {
    if (r.dayString) {
      if (!latestCountryDay || r.dayString.localeCompare(latestCountryDay) > 0) {
        latestCountryDay = r.dayString;
      }
    }
  });

  const recorded = dateRecords.filter((d) => d.pageview !== null).sort((a, b) => a.timestamp - b.timestamp);
  const latestDateDay = recorded.length > 0 ? recorded[recorded.length - 1].dayString : '';

  if (latestCountryDay && latestDateDay) {
    return latestCountryDay.localeCompare(latestDateDay) > 0 ? latestCountryDay : latestDateDay;
  }
  if (latestCountryDay) return latestCountryDay;
  if (latestDateDay) return latestDateDay;
  return '2026-09-03';
}

/**
 * Get the previous recorded date string dynamically
 */
export function getPreviousDateString(): string {
  const latest = getLatestDateString();
  const allDays = new Set<string>();
  dateRecords.forEach((d) => {
    if (d.pageview !== null) allDays.add(d.dayString);
  });
  countryRecords.forEach((r) => {
    if (r.dayString) allDays.add(r.dayString);
  });
  const sorted = Array.from(allDays).sort();
  const idx = sorted.indexOf(latest);
  if (idx > 0) {
    return sorted[idx - 1];
  }
  return '2026-09-02';
}

/**
 * Get the earliest recorded date string dynamically
 */
export function getEarliestDateString(): string {
  if (dateRecords.length > 0) {
    const sorted = [...dateRecords].sort((a, b) => a.timestamp - b.timestamp);
    return sorted[0].dayString;
  }
  return '2026-01-01';
}

/**
 * Extract active months from filter state
 */
export function getActiveMonthsFromFilter(filter: FilterState): number[] | 'all' {
  if (filter.timeMode === 'month') {
    return filter.selectedMonth === 'all' ? 'all' : [Number(filter.selectedMonth)];
  }
  if (
    filter.dateRangePreset === 'today' ||
    filter.dateRangePreset === 'yesterday' ||
    filter.dateRangePreset === 'this_month'
  ) {
    const latest = getLatestDateString();
    const m = Number(latest.slice(5, 7)) || 9;
    return [m];
  }
  if (filter.dateRangePreset === 'prev_month') {
    const latest = getLatestDateString();
    const m = Number(latest.slice(5, 7)) || 9;
    return [Math.max(1, m - 1)];
  }
  if (filter.dateRangePreset === 'q1') {
    return [1, 2, 3];
  }
  if (filter.dateRangePreset === 'q2') {
    return [4, 5, 6];
  }
  if (filter.dateRangePreset === 'q3') {
    return [7, 8, 9];
  }
  if (filter.dateRangePreset === 'last7' || filter.dateRangePreset === 'last14' || filter.dateRangePreset === 'last30') {
    const latest = getLatestDateString();
    const m = Number(latest.slice(5, 7)) || 9;
    return [m];
  }
  if (filter.dateRangePreset === 'custom' && filter.customStartDate && filter.customEndDate) {
    const startM = Number(filter.customStartDate.slice(5, 7)) || 1;
    const endM = Number(filter.customEndDate.slice(5, 7)) || 9;
    const months: number[] = [];
    const minM = Math.min(startM, endM);
    const maxM = Math.max(startM, endM);
    for (let m = minM; m <= maxM; m++) {
      months.push(m);
    }
    return months.length > 0 ? months : 'all';
  }
  return 'all';
}

/**
 * Extract date range bounds from filter state dynamically adapting to uploaded date data
 */
export function getDateBoundsFromFilter(filter: FilterState): { startDate: string; endDate: string } {
  const latestRecordedDate = getLatestDateString();
  const earliestRecordedDate = getEarliestDateString();

  if (filter.timeMode === 'month') {
    if (filter.selectedMonth === 'all') {
      return { startDate: earliestRecordedDate, endDate: latestRecordedDate };
    }
    const m = Number(filter.selectedMonth);
    const mStr = m < 10 ? `0${m}` : `${m}`;
    
    // Find max day recorded for this specific month in dateRecords
    const daysInMonth = dateRecords.filter((d) => d.month === m);
    let lastDayStr = '';
    if (daysInMonth.length > 0) {
      const sortedMonthDays = daysInMonth.sort((a, b) => a.timestamp - b.timestamp);
      lastDayStr = sortedMonthDays[sortedMonthDays.length - 1].dayString.slice(8, 10);
    } else {
      const lastDayNum = new Date(2026, m, 0).getDate();
      lastDayStr = lastDayNum < 10 ? `0${lastDayNum}` : `${lastDayNum}`;
    }

    return { startDate: `2026-${mStr}-01`, endDate: `2026-${mStr}-${lastDayStr}` };
  }

  if (filter.dateRangePreset === 'today') {
    return { startDate: latestRecordedDate, endDate: latestRecordedDate };
  }
  if (filter.dateRangePreset === 'yesterday') {
    const recorded = dateRecords.filter((d) => d.pageview !== null).sort((a, b) => a.timestamp - b.timestamp);
    const prev = recorded.length >= 2 ? recorded[recorded.length - 2].dayString : latestRecordedDate;
    return { startDate: prev, endDate: prev };
  }
  if (filter.dateRangePreset === 'this_month') {
    const m = Number(latestRecordedDate.slice(5, 7)) || 9;
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return { startDate: `2026-${mStr}-01`, endDate: latestRecordedDate };
  }
  if (filter.dateRangePreset === 'prev_month') {
    const m = Number(latestRecordedDate.slice(5, 7)) || 9;
    const prevM = Math.max(1, m - 1);
    const prevMStr = prevM < 10 ? `0${prevM}` : `${prevM}`;
    const lastDayNum = new Date(2026, prevM, 0).getDate();
    return { startDate: `2026-${prevMStr}-01`, endDate: `2026-${prevMStr}-${lastDayNum}` };
  }
  if (filter.dateRangePreset === 'last7') {
    const latestTs = new Date(`${latestRecordedDate}T00:00:00Z`).getTime();
    const start7 = new Date(latestTs - 6 * 86400000).toISOString().slice(0, 10);
    return { startDate: start7, endDate: latestRecordedDate };
  }
  if (filter.dateRangePreset === 'last14') {
    const latestTs = new Date(`${latestRecordedDate}T00:00:00Z`).getTime();
    const start14 = new Date(latestTs - 13 * 86400000).toISOString().slice(0, 10);
    return { startDate: start14, endDate: latestRecordedDate };
  }
  if (filter.dateRangePreset === 'last30') {
    const latestTs = new Date(`${latestRecordedDate}T00:00:00Z`).getTime();
    const start30 = new Date(latestTs - 29 * 86400000).toISOString().slice(0, 10);
    return { startDate: start30, endDate: latestRecordedDate };
  }
  if (filter.dateRangePreset === 'q1') {
    return { startDate: '2026-01-01', endDate: '2026-03-31' };
  }
  if (filter.dateRangePreset === 'q2') {
    return { startDate: '2026-04-01', endDate: '2026-06-30' };
  }
  if (filter.dateRangePreset === 'q3') {
    return { startDate: '2026-07-01', endDate: latestRecordedDate };
  }
  if (filter.dateRangePreset === 'custom' && filter.customStartDate && filter.customEndDate) {
    return { startDate: filter.customStartDate, endDate: filter.customEndDate };
  }

  return { startDate: earliestRecordedDate, endDate: latestRecordedDate };
}

/**
 * Parse Raw Folder CSV with robust column aliases, UTF-8 BOM removal, and formatting tolerance
 */
export function parseFolderCsv(csvContent: string): NormalizedFolderRecord[] {
  if (!csvContent || !csvContent.trim()) return [];

  const parsed = Papa.parse<Record<string, any>>(csvContent.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.replace(/^\uFEFF/, '').trim(),
  });

  return parsed.data
    .filter((row) => {
      const folderVal = getFieldCaseInsensitive(row, [
        'Folder',
        'folder',
        'Chuyên mục',
        'Chuyen muc',
        'Category',
        'category',
        'Name',
        'danh mục',
      ]);
      return folderVal !== undefined && String(folderVal).trim() !== '';
    })
    .map((row, index) => {
      const rawFolder = getFieldCaseInsensitive(row, [
        'Folder',
        'folder',
        'Chuyên mục',
        'Chuyen muc',
        'Category',
        'category',
        'Name',
      ]);
      const folder = String(rawFolder).trim();

      const rawMonth = getFieldCaseInsensitive(row, [
        'Month Number',
        'Month',
        'month',
        'Tháng',
        'thang',
        'Thang',
        'month_number',
        'Month_Number',
        'Mo',
        'MonthNo',
        'Kỳ',
      ]);
      const month = parseMonthValue(rawMonth) ?? 1;

      const rawPvs = getFieldCaseInsensitive(row, [
        'PVS',
        'Pvs',
        'pvs',
        'Pageviews',
        'pageviews',
        'Pageview',
        'pageview',
        'PV',
        'pv',
        'Total PV',
        'Total PVs',
        'Lượt xem',
      ]);
      const pvs = cleanNumber(rawPvs);

      const rawRunAds = getFieldCaseInsensitive(row, [
        'PVS run ads',
        'Pvs run ads',
        'pvs run ads',
        'pvs_run_ads',
        'Run ads',
        'run ads',
        'Run Ads PV',
        'Can run ads',
        'Lượt chạy ads',
      ]);
      const pvsRunAds = cleanNumber(rawRunAds);

      const blockAds = Math.max(0, pvs - pvsRunAds);
      const blockRate = pvs > 0 ? (blockAds / pvs) * 100 : 0;
      const canRunAdsRate = pvs > 0 ? (pvsRunAds / pvs) * 100 : 0;

      const rawKpi = getFieldCaseInsensitive(row, ['%KPI', '%kpi', 'KPI%', 'KPI', 'kpi', 'Target%', '%Target', 'Mục tiêu']);
      const kpiPercent = cleanPercent(rawKpi);

      return {
        id: `folder-${folder}-${month}-${index}`,
        folder,
        month,
        pvs,
        pvsRunAds,
        blockAds,
        blockRate,
        canRunAdsRate,
        kpiPercent,
      };
    });
}

/**
 * Parse Raw Country CSV with robust column aliases, UTF-8 BOM removal, and formatting tolerance
 */
export function parseCountryCsv(csvContent: string): NormalizedCountryRecord[] {
  if (!csvContent || !csvContent.trim()) return [];

  const parsed = Papa.parse<Record<string, any>>(csvContent.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.replace(/^\uFEFF/, '').trim(),
  });

  return parsed.data
    .filter((row) => {
      const countryVal = getFieldCaseInsensitive(row, [
        'Country',
        'country',
        'Quốc gia',
        'quoc gia',
        'Market',
        'market',
        'Thị trường',
        'thi truong',
        'Country Name',
        'Nation',
      ]);
      return countryVal !== undefined && countryVal !== null && String(countryVal).trim() !== '';
    })
    .map((row, index) => {
      const rawCountry = getFieldCaseInsensitive(row, [
        'Country',
        'country',
        'Quốc gia',
        'quoc gia',
        'Market',
        'market',
        'Thị trường',
        'thi truong',
        'Country Name',
        'Nation',
      ]);
      const country = String(rawCountry).trim();

      // Check if Date / Day column is present
      const rawDate = getFieldCaseInsensitive(row, [
        'Date',
        'date',
        'Day',
        'day',
        'Ngày',
        'ngay',
        'Timestamp',
        'timestamp',
        'Thời gian',
        'Time',
      ]);

      const rawMonth = getFieldCaseInsensitive(row, [
        'month',
        'Month',
        'Month Number',
        'month number',
        'Month_Number',
        'month_number',
        'Tháng',
        'thang',
        'Thang',
        'Mo',
        'MonthNo',
        'Month_No',
        'Kỳ',
        'Period',
      ]);

      let month = 1;
      let year = 2026;
      let dayString: string | undefined = undefined;

      const parsedM = parseMonthValue(rawMonth);
      if (rawDate !== undefined && rawDate !== null && String(rawDate).trim() !== '') {
        const norm = normalizeDateString(String(rawDate));
        dayString = norm.dayString;
        month = norm.month >= 1 && norm.month <= 12 ? norm.month : 1;
        year = norm.year || 2026;
      }
      if (parsedM !== null) {
        month = parsedM;
      }

      const rawPvs = getFieldCaseInsensitive(row, [
        'Pvs',
        'PVS',
        'pvs',
        'Pageviews',
        'pageviews',
        'Pageview',
        'pageview',
        'PV',
        'pv',
        'Total PV',
        'Total PVs',
        'Lượt xem',
        'Traffic',
      ]);
      const pvs = cleanNumber(rawPvs);

      const rawRunAds = getFieldCaseInsensitive(row, [
        'Pvs run ads',
        'PVS run ads',
        'pvs run ads',
        'pvs_run_ads',
        'Run ads',
        'run ads',
        'Run Ads PV',
        'Can run ads',
        'Lượt chạy ads',
        'Pvs Run Ads',
        'Ads run',
      ]);

      const rawBlock = getFieldCaseInsensitive(row, [
        'Block ads',
        'Block Ads',
        'block ads',
        'block_ads',
        'Blocked',
        'Bị chặn',
        'Block PV',
      ]);

      let pvsRunAds = 0;
      let blockAds = 0;

      if (rawRunAds !== undefined && rawRunAds !== null && String(rawRunAds).trim() !== '') {
        pvsRunAds = cleanNumber(rawRunAds);
        blockAds = Math.max(0, pvs - pvsRunAds);
      } else if (rawBlock !== undefined && rawBlock !== null && String(rawBlock).trim() !== '') {
        blockAds = cleanNumber(rawBlock);
        pvsRunAds = Math.max(0, pvs - blockAds);
      } else {
        // Fallback: estimate from baseline 86% run rate if neither provided
        pvsRunAds = Math.round(pvs * 0.86);
        blockAds = Math.max(0, pvs - pvsRunAds);
      }

      const blockRate = pvs > 0 ? (blockAds / pvs) * 100 : 0;
      const canRunAdsRate = pvs > 0 ? (pvsRunAds / pvs) * 100 : 0;

      return {
        id: `country-${country}-${dayString || month}-${index}`,
        country,
        month,
        year,
        dayString,
        pvs,
        pvsRunAds,
        blockAds,
        blockRate,
        canRunAdsRate,
      };
    });
}

/**
 * Parse Raw Date CSV with robust column aliases, UTF-8 BOM removal, and multi-format date normalization
 */
export function parseDateCsv(csvContent: string): NormalizedDateRecord[] {
  if (!csvContent || !csvContent.trim()) return [];

  const parsed = Papa.parse<Record<string, any>>(csvContent.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.replace(/^\uFEFF/, '').trim(),
  });

  return parsed.data
    .filter((row) => {
      const dayVal = getFieldCaseInsensitive(row, [
        'Day',
        'day',
        'Date',
        'date',
        'Ngày',
        'ngay',
        'Timestamp',
        'timestamp',
        'Thời gian',
        'Time',
      ]);
      return dayVal !== undefined && String(dayVal).trim() !== '';
    })
    .map((row, index) => {
      const rawDay = String(
        getFieldCaseInsensitive(row, [
          'Day',
          'day',
          'Date',
          'date',
          'Ngày',
          'ngay',
          'Timestamp',
          'timestamp',
          'Thời gian',
          'Time',
        ])
      ).trim();
      const dateInfo = normalizeDateString(rawDay);

      const rawKpi = getFieldCaseInsensitive(row, [
        'KPI',
        'kpi',
        'Target',
        'target',
        'Mục tiêu',
        'muc tieu',
        'KPI Target',
        'Kế hoạch',
      ]);
      const kpiTarget = cleanNumber(rawKpi) || 1542859;

      const rawPageview = getFieldCaseInsensitive(row, [
        'Pageview',
        'pageview',
        'Pageviews',
        'pageviews',
        'PV',
        'pv',
        'Pvs',
        'PVS',
        'Lượt xem',
      ]);
      const pageview =
        rawPageview !== undefined && rawPageview !== null && String(rawPageview).trim() !== ''
          ? cleanNumber(rawPageview)
          : null;

      const rawRunAds = getFieldCaseInsensitive(row, [
        'Pvs run ads',
        'PVS run ads',
        'pvs run ads',
        'Run ads',
        'run ads',
        'Can run ads',
      ]);
      const canRunAdsPv =
        rawRunAds !== undefined && rawRunAds !== null && String(rawRunAds).trim() !== ''
          ? cleanNumber(rawRunAds)
          : undefined;

      const rawBlock = getFieldCaseInsensitive(row, [
        'Block ads',
        'Block Ads',
        'block ads',
        'Bị chặn',
      ]);
      const blockAdsPv =
        rawBlock !== undefined && rawBlock !== null && String(rawBlock).trim() !== ''
          ? cleanNumber(rawBlock)
          : canRunAdsPv !== undefined && pageview !== null
          ? Math.max(0, pageview - canRunAdsPv)
          : undefined;

      const blockRate =
        pageview && pageview > 0 && blockAdsPv !== undefined
          ? (blockAdsPv / pageview) * 100
          : undefined;

      return {
        id: `date-${dateInfo.dayString}-${index}`,
        dayString: dateInfo.dayString,
        timestamp: dateInfo.timestamp,
        month: dateInfo.month,
        year: dateInfo.year,
        kpiTarget,
        pageview,
        canRunAdsPv,
        blockAdsPv,
        blockRate,
      };
    });
}

/**
 * Upsert functions to intelligently merge incoming updates into baseline datasets
 * PREVENTS wiping out historical baseline months when updating recent numbers
 */
export function upsertCountryRecords(
  base: NormalizedCountryRecord[],
  incoming: NormalizedCountryRecord[]
): NormalizedCountryRecord[] {
  if (!incoming || incoming.length === 0) return base;

  const map = new Map<string, NormalizedCountryRecord>();
  base.forEach((r) => {
    const key = r.dayString
      ? `${r.country.toLowerCase()}_d_${r.dayString}`
      : `${r.country.toLowerCase()}_m_${r.month}`;
    map.set(key, r);
  });

  incoming.forEach((r) => {
    const key = r.dayString
      ? `${r.country.toLowerCase()}_d_${r.dayString}`
      : `${r.country.toLowerCase()}_m_${r.month}`;
    map.set(key, r);
  });

  return Array.from(map.values());
}

export function upsertDateRecords(
  base: NormalizedDateRecord[],
  incoming: NormalizedDateRecord[]
): NormalizedDateRecord[] {
  if (!incoming || incoming.length === 0) return base;

  const map = new Map<string, NormalizedDateRecord>();
  base.forEach((d) => map.set(d.dayString, d));

  incoming.forEach((d) => {
    const existing = map.get(d.dayString);
    if (existing) {
      existing.pageview = d.pageview !== null ? d.pageview : existing.pageview;
      existing.kpiTarget = d.kpiTarget > 0 ? d.kpiTarget : existing.kpiTarget;
      if (d.canRunAdsPv !== undefined && d.canRunAdsPv !== null) {
        existing.canRunAdsPv = d.canRunAdsPv;
      }
      if (d.blockAdsPv !== undefined && d.blockAdsPv !== null) {
        existing.blockAdsPv = d.blockAdsPv;
      }
      if (d.blockRate !== undefined && d.blockRate !== null) {
        existing.blockRate = d.blockRate;
      }
      map.set(d.dayString, existing);
    } else {
      map.set(d.dayString, d);
    }
  });

  return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
}

export function upsertFolderRecords(
  base: NormalizedFolderRecord[],
  incoming: NormalizedFolderRecord[]
): NormalizedFolderRecord[] {
  if (!incoming || incoming.length === 0) return base;

  const map = new Map<string, NormalizedFolderRecord>();
  base.forEach((f) => {
    const key = `${f.folder.toLowerCase()}_m_${f.month}`;
    map.set(key, f);
  });

  incoming.forEach((f) => {
    const key = `${f.folder.toLowerCase()}_m_${f.month}`;
    map.set(key, f);
  });

  return Array.from(map.values());
}

/**
 * Effective country records deduplication:
 * If a country has daily records in month m, use daily records so daily granularity is preserved.
 * Otherwise, use the monthly record.
 */
export function getEffectiveCountryRecordsForMonth(m: number): NormalizedCountryRecord[] {
  const mRecords = countryRecords.filter((r) => r.month === m);
  const countriesWithDaily = new Set(
    mRecords.filter((r) => !!r.dayString).map((r) => r.country.toLowerCase())
  );
  return mRecords.filter((r) => {
    if (countriesWithDaily.has(r.country.toLowerCase())) {
      return !!r.dayString;
    }
    return true;
  });
}

/**
 * In-memory state holding the parsed records with localStorage persistence fallback & auto-healing
 */
function getInitialFolderRecords(): NormalizedFolderRecord[] {
  const base = parseFolderCsv(RAW_FOLDER_CSV);
  try {
    const saved = localStorage.getItem('vnexpress_uploaded_folder_csv');
    if (saved) {
      const parsed = parseFolderCsv(saved);
      const totalPv = parsed.reduce((acc, r) => acc + r.pvs, 0);
      if (totalPv > 0) {
        return upsertFolderRecords(base, parsed);
      } else {
        localStorage.removeItem('vnexpress_uploaded_folder_csv');
      }
    }
  } catch {}
  return base;
}

function getInitialCountryRecords(): NormalizedCountryRecord[] {
  const base = parseCountryCsv(RAW_COUNTRY_CSV);
  try {
    const saved = localStorage.getItem('vnexpress_uploaded_country_csv');
    if (saved) {
      const parsed = parseCountryCsv(saved);
      const totalPv = parsed.reduce((acc, r) => acc + r.pvs, 0);
      if (totalPv > 0) {
        return upsertCountryRecords(base, parsed);
      } else {
        // Auto-heal corrupt local storage
        localStorage.removeItem('vnexpress_uploaded_country_csv');
      }
    }
  } catch {}
  return base;
}

function getInitialDateRecords(): NormalizedDateRecord[] {
  const base = parseDateCsv(RAW_DATE_CSV);
  try {
    const saved = localStorage.getItem('vnexpress_uploaded_date_csv');
    if (saved) {
      const parsed = parseDateCsv(saved);
      if (parsed.length > 0) {
        return upsertDateRecords(base, parsed);
      }
    }
  } catch {}
  return base;
}

let folderRecords = getInitialFolderRecords();
let countryRecords = getInitialCountryRecords();
let dateRecords = getInitialDateRecords();
let lastRefreshTime = new Date();
let dataSourceInfo = 'Dữ liệu nội bộ VnExpress OV (Tháng 1 - Tháng 9/2026)';

/**
 * Automatically synchronize and enrich dateRecords using granular daily country data if available
 */
export function syncDateRecordsWithDailyCountryData(): void {
  const dailyCountryMap = new Map<string, { totalPv: number; canRunAds: number; blockAds: number }>();
  countryRecords.forEach((r) => {
    if (r.dayString) {
      const existing = dailyCountryMap.get(r.dayString) || { totalPv: 0, canRunAds: 0, blockAds: 0 };
      existing.totalPv += r.pvs;
      existing.canRunAds += r.pvsRunAds;
      existing.blockAds += r.blockAds;
      dailyCountryMap.set(r.dayString, existing);
    }
  });

  if (dailyCountryMap.size > 0) {
    const existingDateMap = new Map<string, NormalizedDateRecord>();
    dateRecords.forEach((d) => existingDateMap.set(d.dayString, d));

    dailyCountryMap.forEach((stats, dayStr) => {
      const norm = normalizeDateString(dayStr);
      const existing = existingDateMap.get(norm.dayString);
      const blockRate = stats.totalPv > 0 ? (stats.blockAds / stats.totalPv) * 100 : 0;
      if (existing) {
        existing.pageview = stats.totalPv;
        existing.canRunAdsPv = stats.canRunAds;
        existing.blockAdsPv = stats.blockAds;
        existing.blockRate = blockRate;
      } else {
        const kpiTarget = 1542859;
        const newRecord: NormalizedDateRecord = {
          id: `date-${norm.dayString}-generated`,
          dayString: norm.dayString,
          timestamp: norm.timestamp,
          month: norm.month,
          year: norm.year,
          kpiTarget,
          pageview: stats.totalPv,
          canRunAdsPv: stats.canRunAds,
          blockAdsPv: stats.blockAds,
          blockRate,
        };
        dateRecords.push(newRecord);
        existingDateMap.set(norm.dayString, newRecord);
      }
    });

    dateRecords.sort((a, b) => a.timestamp - b.timestamp);
  }
}

// Initial sync upon module load
syncDateRecordsWithDailyCountryData();

export function getDatasets() {
  return {
    folders: folderRecords,
    countries: countryRecords,
    dates: dateRecords,
    lastRefreshTime,
    dataSourceInfo,
  };
}

export interface DetectedDatasetInfo {
  type: 'date' | 'country' | 'folder' | 'unknown';
  confidence: number;
  detectedFields: string[];
  missingRequiredFields: string[];
  totalRows: number;
  previewRows: Record<string, string>[];
}

export function analyzeCsvContent(csvContent: string, fileName?: string): DetectedDatasetInfo {
  const trimmed = csvContent.trim();
  if (!trimmed) {
    return {
      type: 'unknown',
      confidence: 0,
      detectedFields: [],
      missingRequiredFields: ['File rỗng'],
      totalRows: 0,
      previewRows: [],
    };
  }

  const parsed = Papa.parse<Record<string, string>>(trimmed, {
    header: true,
    preview: 10,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.replace(/^\uFEFF/, '').trim(),
  });

  const fields = (parsed.meta.fields || []).map((f) => f.trim());
  const lowerFields = fields.map((f) => f.toLowerCase().replace(/^\uFEFF/, ''));
  const lowerName = (fileName || '').toLowerCase();

  // Count rows approximately
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const totalRows = Math.max(0, lines.length - 1);

  // Field flags
  const hasFolder = lowerFields.some((f) => f.includes('folder') || f.includes('chuyên mục') || f.includes('chuyen muc') || f.includes('category'));
  const hasCountry = lowerFields.some((f) => f.includes('country') || f.includes('quốc gia') || f.includes('quoc gia') || f.includes('market') || f.includes('thị trường'));
  const hasDay = lowerFields.some((f) => f === 'day' || f === 'date' || f.includes('ngày') || f.includes('timestamp'));
  const hasPvsRunAds = lowerFields.some((f) => f.includes('run ads') || f.includes('runads') || f.includes('pvs_run_ads'));
  const hasKpi = lowerFields.some((f) => f.includes('kpi') || f.includes('target') || f.includes('mục tiêu'));
  const hasMonth = lowerFields.some((f) => f.includes('month') || f.includes('tháng'));

  // Calculate scores
  let folderScore = 0;
  if (hasFolder) folderScore += 60;
  if (hasPvsRunAds) folderScore += 20;
  if (hasMonth) folderScore += 15;
  if (lowerName.includes('folder') || lowerName.includes('chuyen_muc') || lowerName.includes('chuyen muc')) folderScore += 40;

  let countryScore = 0;
  if (hasCountry) countryScore += 80;
  if (hasPvsRunAds) countryScore += 30;
  if (hasMonth || hasDay) countryScore += 20;
  if (lowerName.includes('country') || lowerName.includes('market') || lowerName.includes('quoc_gia') || lowerName.includes('thi_truong')) countryScore += 40;

  let dateScore = 0;
  if (hasDay) dateScore += 50;
  if (hasKpi) dateScore += 40;
  if (lowerFields.some((f) => f.includes('pageview') || f === 'pv' || f === 'pvs')) dateScore += 15;
  if (lowerName.includes('date') || lowerName.includes('day') || lowerName.includes('daily') || lowerName.includes('ngay')) dateScore += 40;
  if (hasCountry) dateScore -= 40;

  let type: 'date' | 'country' | 'folder' | 'unknown' = 'unknown';
  const maxScore = Math.max(folderScore, countryScore, dateScore);

  if (maxScore >= 30) {
    if (folderScore === maxScore) type = 'folder';
    else if (countryScore === maxScore) type = 'country';
    else type = 'date';
  }

  const missingRequiredFields: string[] = [];
  if (type === 'folder') {
    if (!hasFolder) missingRequiredFields.push('Folder/Chuyên mục');
    if (!hasPvsRunAds) missingRequiredFields.push('PVS run ads');
  } else if (type === 'country') {
    if (!hasCountry) missingRequiredFields.push('Country/Quốc gia');
    if (!hasPvsRunAds) missingRequiredFields.push('Pvs run ads');
    if (!hasMonth && !hasDay) missingRequiredFields.push('Date hoặc month');
  } else if (type === 'date') {
    if (!hasDay) missingRequiredFields.push('Day/Date');
  }

  return {
    type,
    confidence: maxScore >= 60 ? 1 : 0.75,
    detectedFields: fields,
    missingRequiredFields,
    totalRows,
    previewRows: parsed.data.slice(0, 5),
  };
}

export function updateFolderDataset(csv: string) {
  const parsed = parseFolderCsv(csv);
  if (parsed.length > 0) {
    const base = parseFolderCsv(RAW_FOLDER_CSV);
    folderRecords = upsertFolderRecords(base, parsed);
    try {
      localStorage.setItem('vnexpress_uploaded_folder_csv', csv);
    } catch {}
    lastRefreshTime = new Date();
    dataSourceInfo = `Dữ liệu chuyên mục cập nhật thành công (${parsed.length} dòng cập nhật / ${folderRecords.length} dòng tổng)`;
  }
}

export function updateCountryDataset(csv: string) {
  const parsed = parseCountryCsv(csv);
  if (parsed.length > 0) {
    const base = parseCountryCsv(RAW_COUNTRY_CSV);
    countryRecords = upsertCountryRecords(base, parsed);
    try {
      localStorage.setItem('vnexpress_uploaded_country_csv', csv);
    } catch {}
    syncDateRecordsWithDailyCountryData();
    lastRefreshTime = new Date();
    dataSourceInfo = `Dữ liệu thị trường cập nhật thành công (${parsed.length} dòng cập nhật / ${countryRecords.length} dòng tổng)`;
  }
}

export function updateDateDataset(csv: string) {
  const parsed = parseDateCsv(csv);
  if (parsed.length > 0) {
    const base = parseDateCsv(RAW_DATE_CSV);
    dateRecords = upsertDateRecords(base, parsed);
    try {
      localStorage.setItem('vnexpress_uploaded_date_csv', csv);
    } catch {}
    syncDateRecordsWithDailyCountryData();
    lastRefreshTime = new Date();
    dataSourceInfo = `Dữ liệu ngày cập nhật thành công (${parsed.length} ngày cập nhật / ${dateRecords.length} ngày tổng)`;
  }
}

export function updateAllDatasets(datasets: {
  folderCsv?: string;
  countryCsv?: string;
  dateCsv?: string;
}) {
  let updatedCount = 0;

  if (datasets.folderCsv && datasets.folderCsv.trim()) {
    const parsed = parseFolderCsv(datasets.folderCsv);
    if (parsed.length > 0) {
      const base = parseFolderCsv(RAW_FOLDER_CSV);
      folderRecords = upsertFolderRecords(base, parsed);
      updatedCount++;
      try {
        localStorage.setItem('vnexpress_uploaded_folder_csv', datasets.folderCsv);
      } catch {}
    }
  }

  if (datasets.countryCsv && datasets.countryCsv.trim()) {
    const parsed = parseCountryCsv(datasets.countryCsv);
    if (parsed.length > 0) {
      const base = parseCountryCsv(RAW_COUNTRY_CSV);
      countryRecords = upsertCountryRecords(base, parsed);
      updatedCount++;
      try {
        localStorage.setItem('vnexpress_uploaded_country_csv', datasets.countryCsv);
      } catch {}
    }
  }

  if (datasets.dateCsv && datasets.dateCsv.trim()) {
    const parsed = parseDateCsv(datasets.dateCsv);
    if (parsed.length > 0) {
      const base = parseDateCsv(RAW_DATE_CSV);
      dateRecords = upsertDateRecords(base, parsed);
      updatedCount++;
      try {
        localStorage.setItem('vnexpress_uploaded_date_csv', datasets.dateCsv);
      } catch {}
    }
  }

  syncDateRecordsWithDailyCountryData();
  lastRefreshTime = new Date();
  const folderRows = folderRecords.length;
  const countryRows = countryRecords.length;
  const dateRows = dateRecords.length;
  dataSourceInfo = `Dữ liệu cập nhật từ ${updatedCount} file CSV mới (${folderRows} dòng Chuyên mục, ${countryRows} dòng Thị trường, ${dateRows} ngày KPI)`;

  return {
    updatedCount,
    folderRows,
    countryRows,
    dateRows,
    success: updatedCount > 0,
  };
}

export function resetToDefaultDatasets() {
  try {
    localStorage.removeItem('vnexpress_uploaded_folder_csv');
    localStorage.removeItem('vnexpress_uploaded_country_csv');
    localStorage.removeItem('vnexpress_uploaded_date_csv');
  } catch {}

  folderRecords = parseFolderCsv(RAW_FOLDER_CSV);
  countryRecords = parseCountryCsv(RAW_COUNTRY_CSV);
  dateRecords = parseDateCsv(RAW_DATE_CSV);
  syncDateRecordsWithDailyCountryData();
  lastRefreshTime = new Date();
  dataSourceInfo = 'Dữ liệu gốc nội bộ VnExpress OV (Tháng 1 - Tháng 9/2026)';
}

/**
 * List all unique markets
 */
export function getUniqueMarkets(): string[] {
  const map = new Map<string, number>();
  countryRecords.forEach((r) => {
    map.set(r.country, (map.get(r.country) || 0) + r.pvs);
  });
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map((e) => e[0]);
}

/**
 * List all unique folders
 */
export function getUniqueFolders(): string[] {
  const map = new Map<string, number>();
  folderRecords.forEach((r) => {
    map.set(r.folder, (map.get(r.folder) || 0) + r.pvs);
  });
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map((e) => e[0]);
}

/**
 * Get available recorded months
 */
export function getAvailableMonths(): number[] {
  const months = new Set<number>();
  folderRecords.forEach((r) => months.add(r.month));
  countryRecords.forEach((r) => months.add(r.month));
  dateRecords.forEach((r) => {
    if (r.pageview !== null) months.add(r.month);
  });
  return Array.from(months).sort((a, b) => a - b);
}

export interface CountryKpiSpec {
  country: string;
  flag: string;
  phase: 1 | 2 | 3;
  priorityLabel: string;
  pvsMonthlyAvg: number;
  blockRateBaseline: number;
  targetBlockRate10: number;
  targetBlockRate15: number;
  runAdsBaselineMonthly: number;
  targetRunAds10: number;
  targetRunAds15: number;
  stabilityStd: number;
  complaints: number;
  notes: string;
  timezone: string;
}

export const COUNTRY_KPI_SPECS: Record<string, CountryKpiSpec> = {
  Australia: {
    country: 'Australia',
    flag: '🇦🇺',
    phase: 1,
    priorityLabel: 'Giai đoạn 1 — Ưu tiên #1',
    pvsMonthlyAvg: 3186000,
    blockRateBaseline: 15.26,
    targetBlockRate10: 13.74,
    targetBlockRate15: 12.97,
    runAdsBaselineMonthly: 2734586,
    targetRunAds10: 3008045,
    targetRunAds15: 3144774,
    stabilityStd: 0.58,
    complaints: 0,
    notes: 'Volume lớn nhất trong nhóm khả thi, độ ổn định 9 tháng tốt nhất (std 0.58), 0 complaint, APAC timezone UTC+10 thuận tiện.',
    timezone: 'UTC+10',
  },
  Japan: {
    country: 'Japan',
    flag: '🇯🇵',
    phase: 1,
    priorityLabel: 'Giai đoạn 1 — Ưu tiên #2',
    pvsMonthlyAvg: 2178000,
    blockRateBaseline: 16.06,
    targetBlockRate10: 14.45,
    targetBlockRate15: 13.65,
    runAdsBaselineMonthly: 1852986,
    targetRunAds10: 2038285,
    targetRunAds15: 2130934,
    stabilityStd: 1.08,
    complaints: 0,
    notes: 'Chạy song song với Úc. Gap đang tăng T5-T9 cần monitor riêng.',
    timezone: 'UTC+9',
  },
  'Hong Kong': {
    country: 'Hong Kong',
    flag: '🇭🇰',
    phase: 2,
    priorityLabel: 'Giai đoạn 2',
    pvsMonthlyAvg: 1308000,
    blockRateBaseline: 15.87,
    targetBlockRate10: 14.28,
    targetBlockRate15: 13.49,
    runAdsBaselineMonthly: 1261580,
    targetRunAds10: 1387738,
    targetRunAds15: 1450817,
    stabilityStd: 1.19,
    complaints: 0,
    notes: 'APAC timezone tốt, sau khi GĐ1 ổn định ≥2 tuần.',
    timezone: 'UTC+8',
  },
  France: {
    country: 'France',
    flag: '🇫🇷',
    phase: 2,
    priorityLabel: 'Giai đoạn 2',
    pvsMonthlyAvg: 892000,
    blockRateBaseline: 17.67,
    targetBlockRate10: 15.90,
    targetBlockRate15: 15.02,
    runAdsBaselineMonthly: 718261,
    targetRunAds10: 790087,
    targetRunAds15: 826000,
    stabilityStd: 0.95,
    complaints: 0,
    notes: 'Block rate cao 17.67%.',
    timezone: 'UTC+2',
  },
  Czechia: {
    country: 'Czechia',
    flag: '🇨🇿',
    phase: 2,
    priorityLabel: 'Giai đoạn 2',
    pvsMonthlyAvg: 473000,
    blockRateBaseline: 19.60,
    targetBlockRate10: 17.64,
    targetBlockRate15: 16.66,
    runAdsBaselineMonthly: 386014,
    targetRunAds10: 424615,
    targetRunAds15: 443916,
    stabilityStd: 0.88,
    complaints: 0,
    notes: 'Block rate cao nhất nhóm Giai đoạn 2 (19.60%).',
    timezone: 'UTC+2',
  },
  'United Kingdom': {
    country: 'United Kingdom',
    flag: '🇬🇧',
    phase: 2,
    priorityLabel: 'Giai đoạn 2',
    pvsMonthlyAvg: 463000,
    blockRateBaseline: 13.62,
    targetBlockRate10: 12.26,
    targetBlockRate15: 11.58,
    runAdsBaselineMonthly: 411891,
    targetRunAds10: 453080,
    targetRunAds15: 473675,
    stabilityStd: 0.32,
    complaints: 0,
    notes: 'Độ ổn định cao nhất (std 0.32 thấp nhất).',
    timezone: 'UTC+1',
  },
  'South Korea': {
    country: 'South Korea',
    flag: '🇰🇷',
    phase: 2,
    priorityLabel: 'Giai đoạn 2',
    pvsMonthlyAvg: 684000,
    blockRateBaseline: 10.92,
    targetBlockRate10: 9.83,
    targetBlockRate15: 9.28,
    runAdsBaselineMonthly: 623951,
    targetRunAds10: 686346,
    targetRunAds15: 717543,
    stabilityStd: 0.73,
    complaints: 0,
    notes: 'APAC timezone thuận tiện.',
    timezone: 'UTC+9',
  },
  Germany: {
    country: 'Germany',
    flag: '🇩🇪',
    phase: 3,
    priorityLabel: 'Giai đoạn 3 — Chờ fix bug',
    pvsMonthlyAvg: 2310000,
    blockRateBaseline: 16.50,
    targetBlockRate10: 14.85,
    targetBlockRate15: 14.03,
    runAdsBaselineMonthly: 1930000,
    targetRunAds10: 2123000,
    targetRunAds15: 2219500,
    stabilityStd: 1.20,
    complaints: 4,
    notes: 'Bắt buộc fix Safari/Vivaldi bug trước khi bật (4 complaints ngày 08-09/09).',
    timezone: 'UTC+2',
  },
  Canada: {
    country: 'Canada',
    flag: '🇨🇦',
    phase: 3,
    priorityLabel: 'Giai đoạn 3',
    pvsMonthlyAvg: 2150000,
    blockRateBaseline: 15.80,
    targetBlockRate10: 14.22,
    targetBlockRate15: 13.43,
    runAdsBaselineMonthly: 1810000,
    targetRunAds10: 1991000,
    targetRunAds15: 2081500,
    stabilityStd: 1.15,
    complaints: 1,
    notes: 'Bật sau khi Germany ổn định (1 complaint ngày pilot).',
    timezone: 'UTC-4',
  },
  'United States': {
    country: 'United States',
    flag: '🇺🇸',
    phase: 3,
    priorityLabel: 'Giai đoạn 3 — Sau cùng',
    pvsMonthlyAvg: 18500000,
    blockRateBaseline: 14.70,
    targetBlockRate10: 13.23,
    targetBlockRate15: 12.50,
    runAdsBaselineMonthly: 15780000,
    targetRunAds10: 17358000,
    targetRunAds15: 18147000,
    stabilityStd: 1.30,
    complaints: 0,
    notes: 'Volume >18M PVS/tháng — rủi ro cao nhất, bật sau khi có ≥1 tháng data G1+G2.',
    timezone: 'UTC-5',
  },
};

function attachBaselineKpi(
  summaryPartial: Omit<
    ExecutiveKpiSummary,
    | 'baselineBlockRate'
    | 'targetBlockRate15'
    | 'targetBlockRate10'
    | 'blockRateVsBaselineDelta'
    | 'blockRateReductionPct'
    | 'isBlockRate15Attained'
    | 'isBlockRate10Attained'
    | 'baselineRunAds'
    | 'targetRunAds10'
    | 'targetRunAds15'
    | 'kpiAttainmentVsBaselineTarget'
    | 'isAttainment10Attained'
  >,
  filter: FilterState,
  scaleDays: number = 30.5
): ExecutiveKpiSummary {
  const countryKey = Object.keys(COUNTRY_KPI_SPECS).find(
    (k) => k.toLowerCase() === filter.market.toLowerCase()
  );
  const spec = countryKey ? COUNTRY_KPI_SPECS[countryKey] : null;

  const baselineBlockRate = spec ? spec.blockRateBaseline : 14.80;
  const targetBlockRate10 = spec ? spec.targetBlockRate10 : 13.32;
  const targetBlockRate15 = spec ? spec.targetBlockRate15 : 12.58;

  const baseMonthlyRunAds = spec ? spec.runAdsBaselineMonthly : 31184996;
  const baseMonthlyTarget10 = spec ? spec.targetRunAds10 : 34303496;
  const baseMonthlyTarget15 = spec ? spec.targetRunAds15 : 35862745;

  const scale = scaleDays / 30.5;
  const baselineRunAds = Math.round(baseMonthlyRunAds * scale);
  const targetRunAds10 = Math.round(baseMonthlyTarget10 * scale);
  const targetRunAds15 = Math.round(baseMonthlyTarget15 * scale);

  const blockRate = summaryPartial.blockRate;
  const blockRateVsBaselineDelta = blockRate - baselineBlockRate;
  const blockRateReductionPct =
    baselineBlockRate > 0 ? ((baselineBlockRate - blockRate) / baselineBlockRate) * 100 : 0;
  const isBlockRate15Attained = blockRate <= targetBlockRate15;
  const isBlockRate10Attained = blockRate <= targetBlockRate10;

  const canRunAdsPv = summaryPartial.canRunAdsPv;
  const kpiAttainmentVsBaselineTarget =
    targetRunAds10 > 0 ? (canRunAdsPv / targetRunAds10) * 100 : summaryPartial.kpiAttainment;
  const isAttainment10Attained = kpiAttainmentVsBaselineTarget >= 100;

  return {
    ...summaryPartial,
    baselineBlockRate,
    targetBlockRate15,
    targetBlockRate10,
    blockRateVsBaselineDelta,
    blockRateReductionPct,
    isBlockRate15Attained,
    isBlockRate10Attained,
    baselineRunAds,
    targetRunAds10,
    targetRunAds15,
    kpiAttainmentVsBaselineTarget,
    isAttainment10Attained,
  };
}

/**
 * Core KPI Summary calculation taking into account FilterState and Grain restrictions
 */
export function calculateExecutiveSummary(filter: FilterState): ExecutiveKpiSummary {
  const isMarketFiltered = filter.market !== 'all';
  const isFolderFiltered = filter.folder !== 'all';
  let grainNotice: string | null = null;

  // Determine active months
  let activeMonths: number[] = [];
  const extractedMonths = getActiveMonthsFromFilter(filter);
  if (extractedMonths === 'all') {
    activeMonths = getAvailableMonths();
  } else if (Array.isArray(extractedMonths)) {
    activeMonths = extractedMonths;
  } else {
    activeMonths = [Number(extractedMonths)];
  }

  // 1. If Market is filtered (Country level data)
  if (isMarketFiltered) {
    const marketRecords = countryRecords.filter(
      (r) => r.country.toLowerCase() === filter.market.toLowerCase()
    );
    const hasDaily = marketRecords.some((r) => !!r.dayString);

    if (filter.timeMode === 'date-range' && hasDaily) {
      const dailyRecords = marketRecords.filter((r) => !!r.dayString);
      const sortedDaily = [...dailyRecords].sort((a, b) => a.dayString!.localeCompare(b.dayString!));
      const latestDayStr = sortedDaily.length > 0 ? sortedDaily[sortedDaily.length - 1].dayString! : getLatestDateString();

      let targetFiltered: NormalizedCountryRecord[] = [];
      let comparisonFiltered: NormalizedCountryRecord[] = [];
      let comparisonTitle = 'So với hôm trước';
      let durationDays = 1;

      if (filter.dateRangePreset === 'today') {
        targetFiltered = dailyRecords.filter((r) => r.dayString === latestDayStr);
        const priorDays = sortedDaily.filter((r) => r.dayString! < latestDayStr);
        const prevDayStr = priorDays.length > 0 ? priorDays[priorDays.length - 1].dayString! : '';
        if (prevDayStr) {
          comparisonFiltered = dailyRecords.filter((r) => r.dayString === prevDayStr);
          comparisonTitle = `So với hôm trước (${formatDateVi(prevDayStr)})`;
        }
        grainNotice = `Số liệu thị trường ${filter.market} ngày ${formatDateVi(latestDayStr)} (Ghi nhận thực tế theo ngày).`;
      } else if (filter.dateRangePreset === 'yesterday') {
        const priorDays = sortedDaily.filter((r) => r.dayString! < latestDayStr);
        const yesterdayStr = priorDays.length > 0 ? priorDays[priorDays.length - 1].dayString! : latestDayStr;
        targetFiltered = dailyRecords.filter((r) => r.dayString === yesterdayStr);
        const beforeYesterday = sortedDaily.filter((r) => r.dayString! < yesterdayStr);
        const prevPrevStr = beforeYesterday.length > 0 ? beforeYesterday[beforeYesterday.length - 1].dayString! : '';
        if (prevPrevStr) {
          comparisonFiltered = dailyRecords.filter((r) => r.dayString === prevPrevStr);
          comparisonTitle = `So với ngày trước đó (${formatDateVi(prevPrevStr)})`;
        }
        grainNotice = `Số liệu thị trường ${filter.market} ngày ${formatDateVi(yesterdayStr)} (Hôm qua).`;
      } else {
        const bounds = getDateBoundsFromFilter(filter);
        targetFiltered = dailyRecords.filter(
          (r) => r.dayString! >= bounds.startDate && r.dayString! <= bounds.endDate
        );
        durationDays = Math.max(1, targetFiltered.length);
        const priorDaily = sortedDaily.filter((r) => r.dayString! < bounds.startDate).slice(-durationDays);
        comparisonFiltered = priorDaily;
        if (priorDaily.length > 0) {
          comparisonTitle = `So với ${priorDaily.length} ngày liền trước (${formatDateVi(priorDaily[0].dayString!)} - ${formatDateVi(priorDaily[priorDaily.length - 1].dayString!)})`;
        }
        grainNotice = `Số liệu thị trường ${filter.market} từ ${formatDateVi(bounds.startDate)} đến ${formatDateVi(bounds.endDate)} (${targetFiltered.length} ngày ghi nhận thực tế).`;
      }

      const totalPageviews = targetFiltered.reduce((acc, r) => acc + r.pvs, 0);
      const canRunAdsPv = targetFiltered.reduce((acc, r) => acc + r.pvsRunAds, 0);
      const blockAdsPv = Math.max(0, totalPageviews - canRunAdsPv);
      const blockRate = totalPageviews > 0 ? (blockAdsPv / totalPageviews) * 100 : 0;
      const canRunAdsRate = totalPageviews > 0 ? (canRunAdsPv / totalPageviews) * 100 : 0;

      const overallDateKpi = dateRecords
        .filter((d) => targetFiltered.some((t) => t.dayString === d.dayString))
        .reduce((acc, d) => acc + d.kpiTarget, 0) || (1542859 * durationDays);
      const overallDatePv = dateRecords
        .filter((d) => targetFiltered.some((t) => t.dayString === d.dayString) && d.pageview !== null)
        .reduce((acc, d) => acc + (d.pageview || 0), 0) || (totalPageviews * 10);
      const marketShare = overallDatePv > 0 ? totalPageviews / overallDatePv : 0.1;
      const kpiTarget = overallDateKpi * marketShare;
      const kpiAttainment = kpiTarget > 0 ? (canRunAdsPv / kpiTarget) * 100 : 0;
      const kpiGap = canRunAdsPv - kpiTarget;

      const prevTotalPv = comparisonFiltered.reduce((acc, r) => acc + r.pvs, 0);
      const prevCanRunAds = comparisonFiltered.reduce((acc, r) => acc + r.pvsRunAds, 0);
      const prevBlockAds = Math.max(0, prevTotalPv - prevCanRunAds);
      const prevBlockRate = prevTotalPv > 0 ? (prevBlockAds / prevTotalPv) * 100 : 0;

      const totalPvChange = totalPageviews - prevTotalPv;
      const totalPvChangePct = prevTotalPv > 0 ? (totalPvChange / prevTotalPv) * 100 : 0;
      const canRunAdsChange = canRunAdsPv - prevCanRunAds;
      const canRunAdsChangePct = prevCanRunAds > 0 ? (canRunAdsChange / prevCanRunAds) * 100 : 0;
      const blockAdsChange = blockAdsPv - prevBlockAds;
      const blockAdsChangePct = prevBlockAds > 0 ? (blockAdsChange / prevBlockAds) * 100 : 0;
      const blockRateChangePp = blockRate - prevBlockRate;

      return attachBaselineKpi({
        totalPageviews,
        canRunAdsPv,
        blockAdsPv,
        blockRate,
        canRunAdsRate,
        kpiTarget,
        kpiAttainment,
        kpiGap,
        comparisonTitle,
        totalPvChange,
        totalPvChangePct,
        canRunAdsChange,
        canRunAdsChangePct,
        blockAdsChange,
        blockAdsChangePct,
        blockRateChangePp,
        kpiAttainmentChangePp: 0,
        grainNotice,
      }, filter, durationDays);
    }

    if (isFolderFiltered) {
      grainNotice = `Dữ liệu Thị trường (${filter.market}) và Chuyên mục (${filter.folder}) là hai chiều độc lập. Hiển thị số liệu theo Thị trường.`;
    } else if (filter.timeMode === 'date-range' && ['today', 'yesterday', 'last7', 'last30'].includes(filter.dateRangePreset)) {
      grainNotice = `Dữ liệu thị trường (${filter.market}) được ghi nhận ở cấp độ Tháng (Monthly). Hiển thị tổng hợp theo Tháng tương ứng.`;
    }

    const filtered = countryRecords.filter(
      (r) => r.country.toLowerCase() === filter.market.toLowerCase() && activeMonths.includes(r.month)
    );

    const totalPageviews = filtered.reduce((acc, r) => acc + r.pvs, 0);
    const canRunAdsPv = filtered.reduce((acc, r) => acc + r.pvsRunAds, 0);
    const blockAdsPv = Math.max(0, totalPageviews - canRunAdsPv);
    const blockRate = totalPageviews > 0 ? (blockAdsPv / totalPageviews) * 100 : 0;
    const canRunAdsRate = totalPageviews > 0 ? (canRunAdsPv / totalPageviews) * 100 : 0;

    // Target for Country: proportionally estimate from Date KPI or use average attainment
    const overallDateKpi = dateRecords
      .filter((d) => activeMonths.includes(d.month))
      .reduce((acc, d) => acc + d.kpiTarget, 0);
    const overallDatePv = dateRecords
      .filter((d) => activeMonths.includes(d.month) && d.pageview !== null)
      .reduce((acc, d) => acc + (d.pageview || 0), 0);
    const marketShare = overallDatePv > 0 ? totalPageviews / overallDatePv : 0;
    const kpiTarget = overallDateKpi * marketShare;
    const kpiAttainment = kpiTarget > 0 ? (canRunAdsPv / kpiTarget) * 100 : 0;
    const kpiGap = canRunAdsPv - kpiTarget;

    // Previous period for MoM comparison
    const prevMonths = activeMonths.map((m) => Math.max(1, m - 1));
    const prevFiltered = countryRecords.filter(
      (r) => r.country.toLowerCase() === filter.market.toLowerCase() && prevMonths.includes(r.month)
    );
    const prevTotalPv = prevFiltered.reduce((acc, r) => acc + r.pvs, 0);
    const prevCanRunAds = prevFiltered.reduce((acc, r) => acc + r.pvsRunAds, 0);
    const prevBlockAds = Math.max(0, prevTotalPv - prevCanRunAds);
    const prevBlockRate = prevTotalPv > 0 ? (prevBlockAds / prevTotalPv) * 100 : 0;

    const totalPvChange = totalPageviews - prevTotalPv;
    const totalPvChangePct = prevTotalPv > 0 ? (totalPvChange / prevTotalPv) * 100 : 0;
    const canRunAdsChange = canRunAdsPv - prevCanRunAds;
    const canRunAdsChangePct = prevCanRunAds > 0 ? (canRunAdsChange / prevCanRunAds) * 100 : 0;
    const blockAdsChange = blockAdsPv - prevBlockAds;
    const blockAdsChangePct = prevBlockAds > 0 ? (blockAdsChange / prevBlockAds) * 100 : 0;
    const blockRateChangePp = blockRate - prevBlockRate;

    return attachBaselineKpi({
      totalPageviews,
      canRunAdsPv,
      blockAdsPv,
      blockRate,
      canRunAdsRate,
      kpiTarget,
      kpiAttainment,
      kpiGap,
      comparisonTitle: 'So với tháng trước (MoM)',
      totalPvChange,
      totalPvChangePct,
      canRunAdsChange,
      canRunAdsChangePct,
      blockAdsChange,
      blockAdsChangePct,
      blockRateChangePp,
      kpiAttainmentChangePp: 0,
      grainNotice,
    }, filter, activeMonths.length * 30.5);
  }

  // 2. If Folder is filtered (Folder level data)
  if (isFolderFiltered) {
    if (filter.timeMode === 'date-range' && ['today', 'yesterday', 'last7', 'last30'].includes(filter.dateRangePreset)) {
      grainNotice = `Dữ liệu chuyên mục (${filter.folder}) được ghi nhận ở cấp độ Tháng (Monthly). Chưa có dữ liệu theo từng ngày cho riêng chuyên mục này. Hiển thị tổng hợp theo Tháng tương ứng.`;
    }

    const filtered = folderRecords.filter(
      (r) => r.folder.toLowerCase() === filter.folder.toLowerCase() && activeMonths.includes(r.month)
    );

    const totalPageviews = filtered.reduce((acc, r) => acc + r.pvs, 0);
    const canRunAdsPv = filtered.reduce((acc, r) => acc + r.pvsRunAds, 0);
    const blockAdsPv = Math.max(0, totalPageviews - canRunAdsPv);
    const blockRate = totalPageviews > 0 ? (blockAdsPv / totalPageviews) * 100 : 0;
    const canRunAdsRate = totalPageviews > 0 ? (canRunAdsPv / totalPageviews) * 100 : 0;

    // Use KPI% from file: %KPI = PVS run ads / target => Target = PVS run ads / (%KPI / 100)
    let totalTarget = 0;
    filtered.forEach((r) => {
      const kpiPctDecimal = r.kpiPercent > 0 ? r.kpiPercent / 100 : 1;
      const target = r.pvsRunAds / kpiPctDecimal;
      totalTarget += target;
    });

    const kpiTarget = totalTarget;
    const kpiAttainment = kpiTarget > 0 ? (canRunAdsPv / kpiTarget) * 100 : 0;
    const kpiGap = canRunAdsPv - kpiTarget;

    // Previous period
    const prevMonths = activeMonths.map((m) => Math.max(1, m - 1));
    const prevFiltered = folderRecords.filter(
      (r) => r.folder.toLowerCase() === filter.folder.toLowerCase() && prevMonths.includes(r.month)
    );
    const prevTotalPv = prevFiltered.reduce((acc, r) => acc + r.pvs, 0);
    const prevCanRunAds = prevFiltered.reduce((acc, r) => acc + r.pvsRunAds, 0);
    const prevBlockAds = Math.max(0, prevTotalPv - prevCanRunAds);
    const prevBlockRate = prevTotalPv > 0 ? (prevBlockAds / prevTotalPv) * 100 : 0;

    const totalPvChange = totalPageviews - prevTotalPv;
    const totalPvChangePct = prevTotalPv > 0 ? (totalPvChange / prevTotalPv) * 100 : 0;
    const canRunAdsChange = canRunAdsPv - prevCanRunAds;
    const canRunAdsChangePct = prevCanRunAds > 0 ? (canRunAdsChange / prevCanRunAds) * 100 : 0;
    const blockAdsChange = blockAdsPv - prevBlockAds;
    const blockAdsChangePct = prevBlockAds > 0 ? (blockAdsChange / prevBlockAds) * 100 : 0;
    const blockRateChangePp = blockRate - prevBlockRate;

    return attachBaselineKpi({
      totalPageviews,
      canRunAdsPv,
      blockAdsPv,
      blockRate,
      canRunAdsRate,
      kpiTarget,
      kpiAttainment,
      kpiGap,
      comparisonTitle: 'So với tháng trước (MoM)',
      totalPvChange,
      totalPvChangePct,
      canRunAdsChange,
      canRunAdsChangePct,
      blockAdsChange,
      blockAdsChangePct,
      blockRateChangePp,
      kpiAttainmentChangePp: 0,
      grainNotice,
    }, filter, activeMonths.length * 30.5);
  }

  // 3. Overall Dashboard (All markets & All folders)
  // When looking at Date Range presets like "today" (2026-09-03) or "yesterday" (2026-09-02)
  if (filter.timeMode === 'date-range') {
    const recordedDays = dateRecords.filter((d) => d.pageview !== null);
    const latestDay = recordedDays[recordedDays.length - 1]; // 2026-09-03
    const prevDay = recordedDays[recordedDays.length - 2]; // 2026-09-02

    if (filter.dateRangePreset === 'today' && latestDay) {
      const totalPageviews = latestDay.pageview || 0;
      const kpiTarget = latestDay.kpiTarget;
      
      const hasRealDaily = latestDay.canRunAdsPv !== undefined && latestDay.canRunAdsPv !== null;
      let canRunAdsPv = 0;
      let blockAdsPv = 0;

      if (hasRealDaily) {
        canRunAdsPv = latestDay.canRunAdsPv!;
        blockAdsPv = latestDay.blockAdsPv ?? Math.max(0, totalPageviews - canRunAdsPv);
      } else {
        const m9Folders = folderRecords.filter((r) => r.month === 9);
        const m9CanRunAdsRate =
          m9Folders.length > 0
            ? m9Folders.reduce((acc, r) => acc + r.pvsRunAds, 0) /
              Math.max(1, m9Folders.reduce((acc, r) => acc + r.pvs, 0))
            : 0.86;
        canRunAdsPv = Math.round(totalPageviews * m9CanRunAdsRate);
        blockAdsPv = totalPageviews - canRunAdsPv;
      }

      const blockRate = totalPageviews > 0 ? (blockAdsPv / totalPageviews) * 100 : 0;
      const canRunAdsRate = totalPageviews > 0 ? (canRunAdsPv / totalPageviews) * 100 : 0;
      const kpiAttainment = kpiTarget > 0 ? (canRunAdsPv / kpiTarget) * 100 : 0;
      const kpiGap = canRunAdsPv - kpiTarget;

      const prevPv = prevDay ? prevDay.pageview || 0 : 0;
      let prevCanRunAds = 0;
      let prevBlockAds = 0;
      if (prevDay && prevDay.canRunAdsPv !== undefined && prevDay.canRunAdsPv !== null) {
        prevCanRunAds = prevDay.canRunAdsPv;
        prevBlockAds = prevDay.blockAdsPv ?? Math.max(0, prevPv - prevCanRunAds);
      } else {
        const m9Folders = folderRecords.filter((r) => r.month === 9);
        const m9CanRunAdsRate =
          m9Folders.length > 0
            ? m9Folders.reduce((acc, r) => acc + r.pvsRunAds, 0) /
              Math.max(1, m9Folders.reduce((acc, r) => acc + r.pvs, 0))
            : 0.86;
        prevCanRunAds = Math.round(prevPv * m9CanRunAdsRate);
        prevBlockAds = prevPv - prevCanRunAds;
      }
      const prevBlockRate = prevPv > 0 ? (prevBlockAds / prevPv) * 100 : 0;

      const totalPvChange = totalPageviews - prevPv;
      const totalPvChangePct = prevPv > 0 ? (totalPvChange / prevPv) * 100 : 0;
      const canRunAdsChange = canRunAdsPv - prevCanRunAds;
      const canRunAdsChangePct = prevCanRunAds > 0 ? (canRunAdsChange / prevCanRunAds) * 100 : 0;
      const blockAdsChange = blockAdsPv - prevBlockAds;
      const blockAdsChangePct = prevBlockAds > 0 ? (blockAdsChange / prevBlockAds) * 100 : 0;
      const blockRateChangePp = blockRate - prevBlockRate;

      return attachBaselineKpi({
        totalPageviews,
        canRunAdsPv,
        blockAdsPv,
        blockRate,
        canRunAdsRate,
        kpiTarget,
        kpiAttainment,
        kpiGap,
        comparisonTitle: prevDay ? `So với hôm trước (DoD: ${formatDateVi(prevDay.dayString)})` : 'So với hôm trước',
        totalPvChange,
        totalPvChangePct,
        canRunAdsChange,
        canRunAdsChangePct,
        blockAdsChange,
        blockAdsChangePct,
        blockRateChangePp,
        kpiAttainmentChangePp: 0,
        grainNotice: `Số liệu ngày ${formatDateVi(latestDay.dayString)} (Ngày mới nhất có dữ liệu thực tế).`,
      }, filter, 1);
    }

    if (filter.dateRangePreset === 'yesterday' && prevDay) {
      const prevPrevDay = recordedDays[recordedDays.length - 3];
      const totalPageviews = prevDay.pageview || 0;
      const kpiTarget = prevDay.kpiTarget;

      let canRunAdsPv = 0;
      let blockAdsPv = 0;
      if (prevDay.canRunAdsPv !== undefined && prevDay.canRunAdsPv !== null) {
        canRunAdsPv = prevDay.canRunAdsPv;
        blockAdsPv = prevDay.blockAdsPv ?? Math.max(0, totalPageviews - canRunAdsPv);
      } else {
        const m9Folders = folderRecords.filter((r) => r.month === 9);
        const m9CanRunAdsRate =
          m9Folders.length > 0
            ? m9Folders.reduce((acc, r) => acc + r.pvsRunAds, 0) /
              Math.max(1, m9Folders.reduce((acc, r) => acc + r.pvs, 0))
            : 0.86;
        canRunAdsPv = Math.round(totalPageviews * m9CanRunAdsRate);
        blockAdsPv = totalPageviews - canRunAdsPv;
      }

      const blockRate = totalPageviews > 0 ? (blockAdsPv / totalPageviews) * 100 : 0;
      const canRunAdsRate = totalPageviews > 0 ? (canRunAdsPv / totalPageviews) * 100 : 0;
      const kpiAttainment = kpiTarget > 0 ? (canRunAdsPv / kpiTarget) * 100 : 0;
      const kpiGap = canRunAdsPv - kpiTarget;

      const prevPv = prevPrevDay ? prevPrevDay.pageview || 0 : 0;
      let prevCanRunAds = 0;
      let prevBlockAds = 0;
      if (prevPrevDay && prevPrevDay.canRunAdsPv !== undefined && prevPrevDay.canRunAdsPv !== null) {
        prevCanRunAds = prevPrevDay.canRunAdsPv;
        prevBlockAds = prevPrevDay.blockAdsPv ?? Math.max(0, prevPv - prevCanRunAds);
      } else {
        const m9Folders = folderRecords.filter((r) => r.month === 9);
        const m9CanRunAdsRate =
          m9Folders.length > 0
            ? m9Folders.reduce((acc, r) => acc + r.pvsRunAds, 0) /
              Math.max(1, m9Folders.reduce((acc, r) => acc + r.pvs, 0))
            : 0.86;
        prevCanRunAds = Math.round(prevPv * m9CanRunAdsRate);
        prevBlockAds = prevPv - prevCanRunAds;
      }
      const prevBlockRate = prevPv > 0 ? (prevBlockAds / prevPv) * 100 : 0;

      return attachBaselineKpi({
        totalPageviews,
        canRunAdsPv,
        blockAdsPv,
        blockRate,
        canRunAdsRate,
        kpiTarget,
        kpiAttainment,
        kpiGap,
        comparisonTitle: prevPrevDay ? `So với ngày trước đó (${formatDateVi(prevPrevDay.dayString)})` : 'So với ngày trước đó',
        totalPvChange: totalPageviews - prevPv,
        totalPvChangePct: prevPv > 0 ? ((totalPageviews - prevPv) / prevPv) * 100 : 0,
        canRunAdsChange: canRunAdsPv - prevCanRunAds,
        canRunAdsChangePct: prevCanRunAds > 0 ? ((canRunAdsPv - prevCanRunAds) / prevCanRunAds) * 100 : 0,
        blockAdsChange: blockAdsPv - prevBlockAds,
        blockAdsChangePct: prevBlockAds > 0 ? ((blockAdsPv - prevBlockAds) / prevBlockAds) * 100 : 0,
        blockRateChangePp: blockRate - prevBlockRate,
        kpiAttainmentChangePp: 0,
        grainNotice: `Số liệu ngày ${formatDateVi(prevDay.dayString)} (Hôm qua).`,
      }, filter, 1);
    }

    // Custom or multi-day date range mode (last7, last14, last30, q1, q2, q3, custom)
    if (
      filter.timeMode === 'date-range' &&
      !['today', 'yesterday'].includes(filter.dateRangePreset)
    ) {
      const bounds = getDateBoundsFromFilter(filter);
      const rangeStartDate = bounds.startDate;
      const rangeEndDate = bounds.endDate;

      const inRangeDates = dateRecords.filter(
        (d) => d.dayString.slice(0, 10) >= rangeStartDate && d.dayString.slice(0, 10) <= rangeEndDate
      );
      const recordedDates = inRangeDates.filter((d) => d.pageview !== null);
      const totalPageviews = recordedDates.reduce((acc, d) => acc + (d.pageview || 0), 0);
      const kpiTarget = inRangeDates.reduce((acc, d) => acc + d.kpiTarget, 0);

      // Determine average run ads rate or sum actual canRunAdsPv
      const hasRealCanRun = recordedDates.some((d) => d.canRunAdsPv !== undefined && d.canRunAdsPv !== null);
      let canRunAdsPv = 0;
      let blockAdsPv = 0;

      if (hasRealCanRun) {
        canRunAdsPv = recordedDates.reduce((acc, d) => acc + (d.canRunAdsPv || 0), 0);
        blockAdsPv = recordedDates.reduce((acc, d) => acc + (d.blockAdsPv || 0), 0);
      } else {
        const rangeMonths = Array.from(new Set(inRangeDates.map((d) => d.month)));
        const matchingFolders = folderRecords.filter((r) =>
          rangeMonths.length > 0 ? rangeMonths.includes(r.month) : true
        );
        const totalFolderPv = matchingFolders.reduce((acc, r) => acc + r.pvs, 0);
        const totalFolderRun = matchingFolders.reduce((acc, r) => acc + r.pvsRunAds, 0);
        const avgCanRunAdsRate = totalFolderPv > 0 ? totalFolderRun / totalFolderPv : 0.835;

        canRunAdsPv = Math.round(totalPageviews * avgCanRunAdsRate);
        blockAdsPv = Math.max(0, totalPageviews - canRunAdsPv);
      }

      const blockRate = totalPageviews > 0 ? (blockAdsPv / totalPageviews) * 100 : 0;
      const canRunAdsRate = totalPageviews > 0 ? (canRunAdsPv / totalPageviews) * 100 : 0;
      const kpiAttainment = kpiTarget > 0 ? (canRunAdsPv / kpiTarget) * 100 : 0;
      const kpiGap = canRunAdsPv - kpiTarget;

      // Prior period for comparison: equal duration shifted back
      const numDays = Math.max(1, inRangeDates.length);
      const priorDates = dateRecords
        .filter((d) => d.dayString.slice(0, 10) < rangeStartDate)
        .slice(-numDays);
      const priorRecorded = priorDates.filter((d) => d.pageview !== null);
      const prevTotalPv = priorRecorded.reduce((acc, d) => acc + (d.pageview || 0), 0);

      const hasPriorReal = priorRecorded.some((d) => d.canRunAdsPv !== undefined && d.canRunAdsPv !== null);
      let prevCanRunAds = 0;
      let prevBlockAds = 0;

      if (hasPriorReal) {
        prevCanRunAds = priorRecorded.reduce((acc, d) => acc + (d.canRunAdsPv || 0), 0);
        prevBlockAds = priorRecorded.reduce((acc, d) => acc + (d.blockAdsPv || 0), 0);
      } else {
        const rangeMonths = Array.from(new Set(inRangeDates.map((d) => d.month)));
        const matchingFolders = folderRecords.filter((r) =>
          rangeMonths.length > 0 ? rangeMonths.includes(r.month) : true
        );
        const totalFolderPv = matchingFolders.reduce((acc, r) => acc + r.pvs, 0);
        const totalFolderRun = matchingFolders.reduce((acc, r) => acc + r.pvsRunAds, 0);
        const avgCanRunAdsRate = totalFolderPv > 0 ? totalFolderRun / totalFolderPv : 0.835;
        prevCanRunAds = Math.round(prevTotalPv * avgCanRunAdsRate);
        prevBlockAds = Math.max(0, prevTotalPv - prevCanRunAds);
      }
      const prevBlockRate = prevTotalPv > 0 ? (prevBlockAds / prevTotalPv) * 100 : 0;

      const totalPvChange = totalPageviews - prevTotalPv;
      const totalPvChangePct = prevTotalPv > 0 ? (totalPvChange / prevTotalPv) * 100 : 0;
      const canRunAdsChange = canRunAdsPv - prevCanRunAds;
      const canRunAdsChangePct = prevCanRunAds > 0 ? (canRunAdsChange / prevCanRunAds) * 100 : 0;
      const blockAdsChange = blockAdsPv - prevBlockAds;
      const blockAdsChangePct = prevBlockAds > 0 ? (blockAdsChange / prevBlockAds) * 100 : 0;
      const blockRateChangePp = blockRate - prevBlockRate;

      const comparisonTitle =
        priorDates.length > 0
          ? `So với ${priorDates.length} ngày liền trước (${formatDateVi(priorDates[0].dayString)} - ${formatDateVi(priorDates[priorDates.length - 1].dayString)})`
          : 'So với kỳ trước liền kề';

      return attachBaselineKpi({
        totalPageviews,
        canRunAdsPv,
        blockAdsPv,
        blockRate,
        canRunAdsRate,
        kpiTarget,
        kpiAttainment,
        kpiGap,
        comparisonTitle,
        totalPvChange,
        totalPvChangePct,
        canRunAdsChange,
        canRunAdsChangePct,
        blockAdsChange,
        blockAdsChangePct,
        blockRateChangePp,
        kpiAttainmentChangePp: 0,
        grainNotice: `Khoảng thời gian: ${formatDateVi(rangeStartDate)} đến ${formatDateVi(rangeEndDate)} (${recordedDates.length} ngày có dữ liệu thực tế / ${inRangeDates.length} ngày).`,
      }, filter, inRangeDates.length || 30.5);
    }
  }

  // Monthly / All-time / MTD aggregated calculation from Folder data (canonical for Can Run Ads & Block)
  const currentFolders = folderRecords.filter((r) => activeMonths.includes(r.month));
  let totalPageviews = currentFolders.reduce((acc, r) => acc + r.pvs, 0);
  let canRunAdsPv = currentFolders.reduce((acc, r) => acc + r.pvsRunAds, 0);

  // If folder records are empty or have 0 PV for active months, fall back to country records
  if (totalPageviews === 0) {
    const countryRecs = activeMonths.flatMap((m) => getEffectiveCountryRecordsForMonth(m));
    totalPageviews = countryRecs.reduce((acc, r) => acc + r.pvs, 0);
    canRunAdsPv = countryRecs.reduce((acc, r) => acc + r.pvsRunAds, 0);
  }

  const blockAdsPv = Math.max(0, totalPageviews - canRunAdsPv);
  const blockRate = totalPageviews > 0 ? (blockAdsPv / totalPageviews) * 100 : 0;
  const canRunAdsRate = totalPageviews > 0 ? (canRunAdsPv / totalPageviews) * 100 : 0;

  // KPI Target: sum of target from Date records or Folder targets
  const currentDates = dateRecords.filter((d) => activeMonths.includes(d.month));
  const kpiTarget = currentDates.reduce((acc, d) => acc + d.kpiTarget, 0);
  const kpiAttainment = kpiTarget > 0 ? (canRunAdsPv / kpiTarget) * 100 : 0;
  const kpiGap = canRunAdsPv - kpiTarget;

  // Comparison period (Previous period automatically determined by grain)
  let prevMonths: number[] = [];
  let comparisonTitle = 'So với kỳ trước';
  if (filter.timeMode === 'month' || filter.dateRangePreset === 'this_month' || filter.dateRangePreset === 'prev_month') {
    prevMonths = activeMonths.map((m) => Math.max(1, m - 1));
    comparisonTitle = 'So với tháng trước (MoM)';
  } else if (filter.dateRangePreset === 'today' || filter.dateRangePreset === 'yesterday') {
    prevMonths = activeMonths;
    comparisonTitle = 'So với ngày trước (DoD)';
  } else {
    prevMonths = activeMonths.map((m) => Math.max(1, m - 1));
    comparisonTitle = 'So với kỳ trước';
  }

  const prevFolders = folderRecords.filter((r) => prevMonths.includes(r.month));
  let prevTotalPv = prevFolders.reduce((acc, r) => acc + r.pvs, 0);
  let prevCanRunAds = prevFolders.reduce((acc, r) => acc + r.pvsRunAds, 0);

  if (prevTotalPv === 0) {
    const prevCountryRecs = prevMonths.flatMap((m) => getEffectiveCountryRecordsForMonth(m));
    prevTotalPv = prevCountryRecs.reduce((acc, r) => acc + r.pvs, 0);
    prevCanRunAds = prevCountryRecs.reduce((acc, r) => acc + r.pvsRunAds, 0);
  }

  const prevBlockAds = Math.max(0, prevTotalPv - prevCanRunAds);
  const prevBlockRate = prevTotalPv > 0 ? (prevBlockAds / prevTotalPv) * 100 : 0;

  const totalPvChange = totalPageviews - prevTotalPv;
  const totalPvChangePct = prevTotalPv > 0 ? (totalPvChange / prevTotalPv) * 100 : 0;
  const canRunAdsChange = canRunAdsPv - prevCanRunAds;
  const canRunAdsChangePct = prevCanRunAds > 0 ? (canRunAdsChange / prevCanRunAds) * 100 : 0;
  const blockAdsChange = blockAdsPv - prevBlockAds;
  const blockAdsChangePct = prevBlockAds > 0 ? (blockAdsChange / prevBlockAds) * 100 : 0;
  const blockRateChangePp = blockRate - prevBlockRate;

  return attachBaselineKpi({
    totalPageviews,
    canRunAdsPv,
    blockAdsPv,
    blockRate,
    canRunAdsRate,
    kpiTarget,
    kpiAttainment,
    kpiGap,
    comparisonTitle,
    totalPvChange,
    totalPvChangePct,
    canRunAdsChange,
    canRunAdsChangePct,
    blockAdsChange,
    blockAdsChangePct,
    blockRateChangePp,
    kpiAttainmentChangePp: 0,
    grainNotice,
  }, filter, activeMonths.length * 30.5);
}

/**
 * Calculate Sample Allocation Table
 */
export function calculateSampleAllocation(
  targetAllocations: Record<string, number>,
  selectedMonth: number | 'all' | number[]
): SampleAllocationRow[] {
  let records: NormalizedCountryRecord[] = [];
  if (Array.isArray(selectedMonth)) {
    records = selectedMonth.flatMap((m) => getEffectiveCountryRecordsForMonth(m));
  } else if (selectedMonth === 'all') {
    const allMonths = getAvailableMonths();
    records = allMonths.flatMap((m) => getEffectiveCountryRecordsForMonth(m));
  } else {
    records = getEffectiveCountryRecordsForMonth(Number(selectedMonth));
  }

  const totalPv = records.reduce((acc, r) => acc + r.pvs, 0);
  const countryPvMap = new Map<string, number>();

  records.forEach((r) => {
    countryPvMap.set(r.country, (countryPvMap.get(r.country) || 0) + r.pvs);
  });

  const sortedCountries = Array.from(countryPvMap.entries()).sort((a, b) => b[1] - a[1]);

  return sortedCountries.map(([country, pv]) => {
    const actualSamplePct = totalPv > 0 ? (pv / totalPv) * 100 : 0;
    const targetSamplePct =
      targetAllocations[country] !== undefined && targetAllocations[country] !== null
        ? targetAllocations[country]
        : null;

    let variance: number | null = null;
    let status: 'On Target' | 'Under Sample' | 'Over Sample' | 'Not Configured' = 'Not Configured';

    if (targetSamplePct !== null) {
      variance = actualSamplePct - targetSamplePct;
      if (Math.abs(variance) <= 2.0) {
        status = 'On Target';
      } else if (variance < -2.0) {
        status = 'Under Sample';
      } else {
        status = 'Over Sample';
      }
    }

    return {
      market: country,
      actualPv: pv,
      actualSamplePct,
      targetSamplePct,
      variance,
      status,
    };
  });
}

/**
 * Calculate Market Performance Table
 */
export function calculateMarketPerformance(
  selectedMonth: number | 'all' | number[]
): MarketPerformanceRow[] {
  let records: NormalizedCountryRecord[] = [];
  if (Array.isArray(selectedMonth)) {
    records = selectedMonth.flatMap((m) => getEffectiveCountryRecordsForMonth(m));
  } else if (selectedMonth === 'all') {
    const allMonths = getAvailableMonths();
    records = allMonths.flatMap((m) => getEffectiveCountryRecordsForMonth(m));
  } else {
    records = getEffectiveCountryRecordsForMonth(Number(selectedMonth));
  }

  const totalBlockAll = records.reduce((acc, r) => acc + r.blockAds, 0);

  // Group by country
  const map = new Map<
    string,
    {
      country: string;
      totalPv: number;
      canRunAdsPv: number;
      blockAdsPv: number;
    }
  >();

  records.forEach((r) => {
    const existing = map.get(r.country) || {
      country: r.country,
      totalPv: 0,
      canRunAdsPv: 0,
      blockAdsPv: 0,
    };
    existing.totalPv += r.pvs;
    existing.canRunAdsPv += r.pvsRunAds;
    existing.blockAdsPv += r.blockAds;
    map.set(r.country, existing);
  });

  // Calculate MoM if single month selected
  const prevMonthMap = new Map<string, number>();
  if (selectedMonth !== 'all' && !Array.isArray(selectedMonth) && Number(selectedMonth) > 1) {
    const prevRecords = getEffectiveCountryRecordsForMonth(Number(selectedMonth) - 1);
    prevRecords.forEach((r) => {
      prevMonthMap.set(r.country, (prevMonthMap.get(r.country) || 0) + r.pvsRunAds);
    });
  }

  const rows: MarketPerformanceRow[] = Array.from(map.values()).map((item) => {
    const canRunAdsRate = item.totalPv > 0 ? (item.canRunAdsPv / item.totalPv) * 100 : 0;
    const blockRate = item.totalPv > 0 ? (item.blockAdsPv / item.totalPv) * 100 : 0;
    const contributionToTotalBlock =
      totalBlockAll > 0 ? (item.blockAdsPv / totalBlockAll) * 100 : 0;

    let momChangePct: number | null = null;
    if (prevMonthMap.has(item.country)) {
      const prev = prevMonthMap.get(item.country)!;
      momChangePct = prev > 0 ? ((item.canRunAdsPv - prev) / prev) * 100 : 0;
    }

    return {
      country: item.country,
      totalPv: item.totalPv,
      canRunAdsPv: item.canRunAdsPv,
      blockAdsPv: item.blockAdsPv,
      canRunAdsRate,
      blockRate,
      kpiAttainment: canRunAdsRate, // Relative achievement
      contributionToTotalBlock,
      momChangePct,
    };
  });

  // Default sort: Block Ads PV DESC
  return rows.sort((a, b) => b.blockAdsPv - a.blockAdsPv);
}

/**
 * Calculate Folder Performance Table
 */
export function calculateFolderPerformance(
  selectedMonth: number | 'all' | number[]
): FolderPerformanceRow[] {
  const records = Array.isArray(selectedMonth)
    ? folderRecords.filter((r) => selectedMonth.includes(r.month))
    : selectedMonth === 'all'
    ? folderRecords
    : folderRecords.filter((r) => r.month === Number(selectedMonth));

  const totalBlockAll = records.reduce((acc, r) => acc + r.blockAds, 0);

  const map = new Map<
    string,
    {
      folder: string;
      pvs: number;
      pvsRunAds: number;
      blockAdsPv: number;
      kpiPercentWeightedSum: number;
      count: number;
    }
  >();

  records.forEach((r) => {
    const existing = map.get(r.folder) || {
      folder: r.folder,
      pvs: 0,
      pvsRunAds: 0,
      blockAdsPv: 0,
      kpiPercentWeightedSum: 0,
      count: 0,
    };
    existing.pvs += r.pvs;
    existing.pvsRunAds += r.pvsRunAds;
    existing.blockAdsPv += r.blockAds;
    existing.kpiPercentWeightedSum += r.kpiPercent * r.pvs;
    existing.count += 1;
    map.set(r.folder, existing);
  });

  const rows: FolderPerformanceRow[] = Array.from(map.values()).map((item) => {
    const runAdsRate = item.pvs > 0 ? (item.pvsRunAds / item.pvs) * 100 : 0;
    const blockRate = item.pvs > 0 ? (item.blockAdsPv / item.pvs) * 100 : 0;
    const contributionToBlock =
      totalBlockAll > 0 ? (item.blockAdsPv / totalBlockAll) * 100 : 0;
    const avgKpiPercent =
      item.pvs > 0 ? item.kpiPercentWeightedSum / item.pvs : 0;

    return {
      folder: item.folder,
      pvs: item.pvs,
      pvsRunAds: item.pvsRunAds,
      blockAdsPv: item.blockAdsPv,
      runAdsRate,
      blockRate,
      kpiPercent: avgKpiPercent,
      contributionToBlock,
    };
  });

  return rows.sort((a, b) => b.blockAdsPv - a.blockAdsPv);
}

/**
 * Generate Executive Insights strictly derived from data
 */
export function generateExecutiveInsights(filter: FilterState): string[] {
  const summary = calculateExecutiveSummary(filter);
  const markets = calculateMarketPerformance(filter.selectedMonth);
  const folders = calculateFolderPerformance(filter.selectedMonth);

  const insights: string[] = [];

  // Insight 1: Attainment & PV Gap
  if (summary.kpiTarget > 0) {
    const attainmentStr = summary.kpiAttainment.toFixed(1);
    if (summary.kpiGap >= 0) {
      insights.push(
        `Can Run Ads PV đạt ${attainmentStr}% KPI mục tiêu, vượt kế hoạch ${formatCompactNumber(summary.kpiGap)} Pageviews.`
      );
    } else {
      insights.push(
        `Can Run Ads PV đạt ${attainmentStr}% KPI mục tiêu, còn thiếu ${formatCompactNumber(Math.abs(summary.kpiGap))} Pageviews so với kế hoạch.`
      );
    }
  }

  // Insight 2: Block Ads Volume & Rate
  insights.push(
    `Pageview bị Block Ads chiếm ${summary.blockRate.toFixed(2)}% tổng lượng truy cập (${formatCompactNumber(summary.blockAdsPv)} PVs trên tổng số ${formatCompactNumber(summary.totalPageviews)} PVs).`
  );

  // Insight 3: Top market contributors
  if (markets.length > 0) {
    const top1 = markets[0];
    const top2 = markets[1];
    const top3 = markets[2];
    insights.push(
      `Thị trường ${top1.country} đóng góp nhiều lượt Block Ads nhất với ${formatCompactNumber(top1.blockAdsPv)} PVs (${top1.contributionToTotalBlock.toFixed(1)}% tổng lượng Block Ads toàn bộ thị trường OV).`
    );

    if (top2 && top3) {
      const top3Share = (top1.contributionToTotalBlock + top2.contributionToTotalBlock + top3.contributionToTotalBlock).toFixed(1);
      insights.push(
        `Top 3 thị trường có Block Ads cao nhất (${top1.country}, ${top2.country}, ${top3.country}) chiếm ${top3Share}% toàn bộ lượng Pageview bị block.`
      );
    }
  }

  // Insight 4: Top folder contributors
  if (folders.length > 0) {
    const topFolder = folders[0];
    const topFolder2 = folders[1];
    insights.push(
      `Chuyên mục "${topFolder.folder}" chiếm tỷ trọng block cao nhất (${topFolder.contributionToBlock.toFixed(1)}%), tiếp theo là "${topFolder2?.folder}" (${topFolder2?.contributionToBlock.toFixed(1)}%).`
    );
  }

  // Insight 5: Trend & Rate change
  if (summary.blockRateChangePp !== 0) {
    const dir = summary.blockRateChangePp > 0 ? 'tăng' : 'giảm';
    insights.push(
      `Tỷ lệ Block Rate kỳ này ${dir} ${Math.abs(summary.blockRateChangePp).toFixed(2)} điểm phần trăm (pp) so với kỳ đối chiếu trước đó.`
    );
  }

  // Rule from prompt: Không được bịa nguyên nhân kỹ thuật nếu dữ liệu không chứa nguyên nhân
  insights.push(
    `Lưu ý điều hành: Dữ liệu hiện tại phản ánh số lượng Pageview kỹ thuật thu nhận được. Chưa đủ dữ liệu về loại trình duyệt/thiết bị để khẳng định nguyên nhân gia tăng block ở từng thị trường cụ thể.`
  );

  return insights;
}

/**
 * Generate Active Alerts based on configurable thresholds
 */
export function generateActiveAlerts(
  filter: FilterState,
  thresholds: AlertThresholds,
  sampleAllocationRows: SampleAllocationRow[]
): ActiveAlert[] {
  const summary = calculateExecutiveSummary(filter);
  const alerts: ActiveAlert[] = [];
  const now = '2026-09-21 19:38:00';

  // 1. KPI Attainment Alert
  if (summary.kpiTarget > 0) {
    if (summary.kpiAttainment < thresholds.kpiCriticalThreshold) {
      alerts.push({
        id: 'alert-kpi-crit',
        level: 'critical',
        title: 'KPI Attainment ở mức Nguy cấp',
        message: `Tỷ lệ đạt KPI hiện tại là ${summary.kpiAttainment.toFixed(1)}%, thấp hơn ngưỡng nghiêm trọng (${thresholds.kpiCriticalThreshold}%). Thiếu hụt ${formatCompactNumber(Math.abs(summary.kpiGap))} PV.`,
        metric: 'KPI Attainment',
        timestamp: now,
      });
    } else if (summary.kpiAttainment < thresholds.kpiWarningThreshold) {
      alerts.push({
        id: 'alert-kpi-warn',
        level: 'warning',
        title: 'KPI Attainment dưới mức Mục tiêu',
        message: `Tỷ lệ đạt KPI là ${summary.kpiAttainment.toFixed(1)}%, đang dưới ngưỡng cảnh báo (${thresholds.kpiWarningThreshold}%).`,
        metric: 'KPI Attainment',
        timestamp: now,
      });
    }
  }

  // 2. Block Rate Surge Alert
  if (summary.blockRateChangePp > thresholds.blockRateSurgePp) {
    alerts.push({
      id: 'alert-block-rate-surge',
      level: 'warning',
      title: 'Tỷ lệ Block Rate gia tăng đột biến',
      message: `Block Rate đã tăng +${summary.blockRateChangePp.toFixed(2)} pp so với kỳ trước, vượt ngưỡng cho phép (+${thresholds.blockRateSurgePp} pp).`,
      metric: 'Block Rate',
      timestamp: now,
    });
  }

  // 3. Sample Allocation Deviations
  const deviatingMarkets = sampleAllocationRows.filter(
    (row) => row.status !== 'On Target' && row.status !== 'Not Configured' && Math.abs(row.variance || 0) > thresholds.sampleVariancePp
  );

  if (deviatingMarkets.length > 0) {
    const listStr = deviatingMarkets.slice(0, 3).map((m) => `${m.market} (${m.variance! > 0 ? '+' : ''}${m.variance!.toFixed(1)}%)`).join(', ');
    alerts.push({
      id: 'alert-sample-variance',
      level: 'warning',
      title: 'Phân bổ mẫu lệch kế hoạch tại một số thị trường',
      message: `Có ${deviatingMarkets.length} thị trường có độ lệch mẫu vượt ngưỡng ${thresholds.sampleVariancePp} pp: ${listStr}.`,
      metric: 'Sample Allocation',
      timestamp: now,
    });
  }

  return alerts;
}

/**
 * Data Quality Monitor validation
 */
export function runDataQualityAudit(): DataQualityReport {
  const issues: DataQualityReport['issues'] = [];

  // Check Rule: Pvs run ads <= Pvs
  let violatedRuleCount = 0;
  folderRecords.forEach((r) => {
    if (r.pvsRunAds > r.pvs) {
      violatedRuleCount++;
      issues.push({
        id: `dq-folder-pvs-overflow-${r.id}`,
        level: 'error',
        dataset: 'Folder',
        field: 'PVS run ads',
        description: `Folder "${r.folder}" tháng ${r.month} có PVS run ads (${r.pvsRunAds}) lớn hơn tổng PVS (${r.pvs}).`,
        affectedCount: 1,
      });
    }
    if (r.pvs < 0 || r.pvsRunAds < 0) {
      issues.push({
        id: `dq-folder-negative-${r.id}`,
        level: 'error',
        dataset: 'Folder',
        field: 'PVS',
        description: `Folder "${r.folder}" có giá trị Pageview âm.`,
        affectedCount: 1,
      });
    }
  });

  countryRecords.forEach((r) => {
    if (r.pvsRunAds > r.pvs) {
      violatedRuleCount++;
      issues.push({
        id: `dq-country-pvs-overflow-${r.id}`,
        level: 'error',
        dataset: 'Country',
        field: 'Pvs run ads',
        description: `Thị trường "${r.country}" tháng ${r.month} có Pvs run ads (${r.pvsRunAds}) lớn hơn tổng Pvs (${r.pvs}).`,
        affectedCount: 1,
      });
    }
    if (!r.country || r.country.trim() === '') {
      issues.push({
        id: `dq-country-empty-${r.id}`,
        level: 'warning',
        dataset: 'Country',
        field: 'Country',
        description: `Bản ghi có tên Quốc gia rỗng (tháng ${r.month}).`,
        affectedCount: 1,
      });
    }
  });

  // Check Dates: check duplicates and missing days
  const dateSet = new Set<string>();
  let duplicateDates = 0;
  let missingPvFutureDays = 0;

  dateRecords.forEach((d) => {
    if (dateSet.has(d.dayString)) {
      duplicateDates++;
      issues.push({
        id: `dq-date-duplicate-${d.dayString}`,
        level: 'warning',
        dataset: 'Date',
        field: 'Day',
        description: `Ngày ${d.dayString} bị trùng lặp trong dữ liệu date.`,
        affectedCount: 1,
      });
    }
    dateSet.add(d.dayString);

    if (d.pageview === null) {
      missingPvFutureDays++;
    }
  });

  if (missingPvFutureDays > 0) {
    issues.push({
      id: 'dq-date-future-missing',
      level: 'warning',
      dataset: 'Date',
      field: 'Pageview',
      description: `Có ${missingPvFutureDays} ngày trong tháng 9 chưa có số Pageview thực tế (ngày tương lai từ 04/09 đến 30/09/2026).`,
      affectedCount: missingPvFutureDays,
    });
  }

  // Totals for validation check
  const folderTotalPv = folderRecords.reduce((acc, r) => acc + r.pvs, 0);
  const folderCanRunAdsPv = folderRecords.reduce((acc, r) => acc + r.pvsRunAds, 0);
  const folderBlockAdsPv = folderTotalPv - folderCanRunAdsPv;
  const folderBlockRate = folderTotalPv > 0 ? (folderBlockAdsPv / folderTotalPv) * 100 : 0;

  const countryTotalPv = countryRecords.reduce((acc, r) => acc + r.pvs, 0);
  const countryCanRunAdsPv = countryRecords.reduce((acc, r) => acc + r.pvsRunAds, 0);
  const countryBlockAdsPv = countryTotalPv - countryCanRunAdsPv;

  const dateTotalActualPv = dateRecords.reduce((acc, d) => acc + (d.pageview || 0), 0);
  const dateTotalKpi = dateRecords.reduce((acc, d) => acc + d.kpiTarget, 0);

  const errorCount = issues.filter((i) => i.level === 'error').length;
  const warningCount = issues.filter((i) => i.level === 'warning').length;

  return {
    totalRecordsChecked: folderRecords.length + countryRecords.length + dateRecords.length,
    errorCount,
    warningCount,
    rulePassed: violatedRuleCount === 0,
    issues,
    validationTotals: {
      folderTotalPv,
      folderCanRunAdsPv,
      folderBlockAdsPv,
      folderBlockRate,
      countryTotalPv,
      countryCanRunAdsPv,
      countryBlockAdsPv,
      dateTotalActualPv,
      dateTotalKpi,
    },
  };
}

export function performDataQualityAudit(): DataQualityAudit {
  const folderSumPvs = folderRecords.reduce((acc, r) => acc + r.pvs, 0);
  const countrySumPvs = countryRecords.reduce((acc, r) => acc + r.pvs, 0);
  const dateSumActual = dateRecords.reduce((acc, d) => acc + (d.pageview || 0), 0);
  const dateSumKpi = dateRecords.reduce((acc, d) => acc + d.kpiTarget, 0);
  const folderRecordCount = folderRecords.length;
  const countryRecordCount = countryRecords.length;
  const dateRecordedDays = dateRecords.filter((d) => d.pageview !== null).length;
  const dateMissingDays = dateRecords.filter((d) => d.pageview === null).length;
  const reconciliationDeltaFolderCountry = countrySumPvs - folderSumPvs;
  const reconciliationDeltaDateFolder = dateSumActual - folderSumPvs;
  const reconciliationDeltaPct =
    folderSumPvs > 0 ? (reconciliationDeltaDateFolder / folderSumPvs) * 100 : 0;
  const isFolderCountryMatch = reconciliationDeltaFolderCountry === 0;

  return {
    folderSumPvs,
    countrySumPvs,
    dateSumActual,
    dateSumKpi,
    folderRecordCount,
    countryRecordCount,
    dateRecordedDays,
    dateMissingDays,
    isFolderCountryMatch,
    reconciliationDeltaFolderCountry,
    reconciliationDeltaDateFolder,
    reconciliationDeltaPct,
    latestRecordedDate: getLatestDateString(),
    earliestRecordedDate: getEarliestDateString(),
  };
}

export function loadAndNormalizeAllData() {
  const datasets = getDatasets();
  return {
    folders: datasets.folders,
    countries: datasets.countries,
    dates: datasets.dates,
    uniqueCountries: getUniqueMarkets(),
    uniqueFolders: getUniqueFolders(),
    availableMonths: getAvailableMonths(),
    lastRefreshTime: datasets.lastRefreshTime,
    dataSourceInfo: datasets.dataSourceInfo,
  };
}

export const calculateSampleAllocations = calculateSampleAllocation;

/**
 * Monthly KPI breakdown data point
 */
export interface MonthlyKpiPoint {
  month: number;
  monthLabel: string;
  totalPv: number;
  canRunAdsPv: number;
  blockAdsPv: number;
  blockRate: number;
  momBlockRateDiffPp: number | null; // change compared to previous month in percentage points
  isBlockRateIncreased: boolean | null; // true = tăng (xấu hơn), false = giảm (tốt hơn), null = no prev month
  momRunAdsDiffPct: number | null;
  isRunAdsIncreased: boolean | null;
  vsBaselineDiffPp: number; // current block rate - baseline block rate
  isTargetMet10: boolean; // blockRate <= targetBlockRate10
  isTargetMet15: boolean; // blockRate <= targetBlockRate15
}

export interface MonthlyKpiSeries {
  id: 'baseline' | 'japan';
  title: string;
  subtitle: string;
  flag: string;
  tag: string;
  baselineBlockRate: number;
  targetBlockRate10: number;
  targetBlockRate15: number;
  baselineRunAdsMonthly: number;
  points: MonthlyKpiPoint[];
  activePoint: MonthlyKpiPoint;
  comparisonWithPrevMonth: {
    prevMonthLabel: string;
    blockRateDiffPp: number;
    isBlockRateIncreased: boolean;
    runAdsDiffPct: number;
    isRunAdsIncreased: boolean;
  } | null;
  summaryText: string;
}

/**
 * Calculate Monthly KPI data for Baseline (All OV) and Japan (Pilot)
 */
export function getBaselineAndJapanMonthlyKpis(selectedMonth: number | 'all' = 'all'): {
  baselineSeries: MonthlyKpiSeries;
  japanSeries: MonthlyKpiSeries;
  availableMonths: number[];
  activeMonthNumber: number;
} {
  const months = getAvailableMonths(); // [1, 2, 3, 4, 5, 6, 7, 8, 9]
  const activeMonthNumber =
    selectedMonth === 'all' ? (months.length > 0 ? months[months.length - 1] : 9) : Number(selectedMonth);

  // 1. Calculate Baseline (All OV) monthly points
  const baselineSpec = {
    baselineBlockRate: 14.80,
    targetBlockRate10: 13.32,
    targetBlockRate15: 12.58,
    baselineRunAdsMonthly: 31184996,
  };

  const baselinePoints: MonthlyKpiPoint[] = months.map((m, idx) => {
    const monthRecords = getEffectiveCountryRecordsForMonth(m);
    const totalPv = monthRecords.reduce((acc, r) => acc + r.pvs, 0);
    const canRunAdsPv = monthRecords.reduce((acc, r) => acc + r.pvsRunAds, 0);
    const blockAdsPv = Math.max(0, totalPv - canRunAdsPv);
    const blockRate = totalPv > 0 ? (blockAdsPv / totalPv) * 100 : 0;

    let momBlockRateDiffPp: number | null = null;
    let isBlockRateIncreased: boolean | null = null;
    let momRunAdsDiffPct: number | null = null;
    let isRunAdsIncreased: boolean | null = null;

    if (idx > 0) {
      const prevMonth = months[idx - 1];
      const prevRecords = getEffectiveCountryRecordsForMonth(prevMonth);
      const prevTotalPv = prevRecords.reduce((acc, r) => acc + r.pvs, 0);
      const prevCanRunAds = prevRecords.reduce((acc, r) => acc + r.pvsRunAds, 0);
      const prevBlockAds = Math.max(0, prevTotalPv - prevCanRunAds);
      const prevBlockRate = prevTotalPv > 0 ? (prevBlockAds / prevTotalPv) * 100 : 0;

      momBlockRateDiffPp = blockRate - prevBlockRate;
      isBlockRateIncreased = momBlockRateDiffPp > 0.001;
      if (prevCanRunAds > 0) {
        momRunAdsDiffPct = ((canRunAdsPv - prevCanRunAds) / prevCanRunAds) * 100;
        isRunAdsIncreased = momRunAdsDiffPct > 0;
      }
    }

    const vsBaselineDiffPp = blockRate - baselineSpec.baselineBlockRate;
    const isTargetMet10 = blockRate <= baselineSpec.targetBlockRate10;
    const isTargetMet15 = blockRate <= baselineSpec.targetBlockRate15;

    return {
      month: m,
      monthLabel: m === 9 ? 'Tháng 9 (MTD)' : `Tháng ${m}`,
      totalPv,
      canRunAdsPv,
      blockAdsPv,
      blockRate,
      momBlockRateDiffPp,
      isBlockRateIncreased,
      momRunAdsDiffPct,
      isRunAdsIncreased,
      vsBaselineDiffPp,
      isTargetMet10,
      isTargetMet15,
    };
  });

  // 2. Calculate Japan (Pilot) monthly points
  const jpSpec = COUNTRY_KPI_SPECS['Japan'] || {
    blockRateBaseline: 16.06,
    targetBlockRate10: 14.45,
    targetBlockRate15: 13.65,
    runAdsBaselineMonthly: 1852986,
  };

  const japanPoints: MonthlyKpiPoint[] = months.map((m, idx) => {
    const monthRecords = getEffectiveCountryRecordsForMonth(m).filter(
      (r) => r.country.toLowerCase() === 'japan'
    );
    const totalPv = monthRecords.reduce((acc, r) => acc + r.pvs, 0);
    const canRunAdsPv = monthRecords.reduce((acc, r) => acc + r.pvsRunAds, 0);
    const blockAdsPv = Math.max(0, totalPv - canRunAdsPv);
    const blockRate = totalPv > 0 ? (blockAdsPv / totalPv) * 100 : 0;

    let momBlockRateDiffPp: number | null = null;
    let isBlockRateIncreased: boolean | null = null;
    let momRunAdsDiffPct: number | null = null;
    let isRunAdsIncreased: boolean | null = null;

    if (idx > 0) {
      const prevMonth = months[idx - 1];
      const prevRecords = getEffectiveCountryRecordsForMonth(prevMonth).filter(
        (r) => r.country.toLowerCase() === 'japan'
      );
      const prevTotalPv = prevRecords.reduce((acc, r) => acc + r.pvs, 0);
      const prevCanRunAds = prevRecords.reduce((acc, r) => acc + r.pvsRunAds, 0);
      const prevBlockAds = Math.max(0, prevTotalPv - prevCanRunAds);
      const prevBlockRate = prevTotalPv > 0 ? (prevBlockAds / prevTotalPv) * 100 : 0;

      momBlockRateDiffPp = blockRate - prevBlockRate;
      isBlockRateIncreased = momBlockRateDiffPp > 0.001;
      if (prevCanRunAds > 0) {
        momRunAdsDiffPct = ((canRunAdsPv - prevCanRunAds) / prevCanRunAds) * 100;
        isRunAdsIncreased = momRunAdsDiffPct > 0;
      }
    }

    const vsBaselineDiffPp = blockRate - jpSpec.blockRateBaseline;
    const isTargetMet10 = blockRate <= jpSpec.targetBlockRate10;
    const isTargetMet15 = blockRate <= jpSpec.targetBlockRate15;

    return {
      month: m,
      monthLabel: m === 9 ? 'Tháng 9 (MTD)' : `Tháng ${m}`,
      totalPv,
      canRunAdsPv,
      blockAdsPv,
      blockRate,
      momBlockRateDiffPp,
      isBlockRateIncreased,
      momRunAdsDiffPct,
      isRunAdsIncreased,
      vsBaselineDiffPp,
      isTargetMet10,
      isTargetMet15,
    };
  });

  let activeBaselinePoint: MonthlyKpiPoint;
  let activeJapanPoint: MonthlyKpiPoint;

  if (selectedMonth === 'all') {
    const totalAllPv = baselinePoints.reduce((acc, p) => acc + p.totalPv, 0);
    const totalAllCanRun = baselinePoints.reduce((acc, p) => acc + p.canRunAdsPv, 0);
    const totalAllBlock = baselinePoints.reduce((acc, p) => acc + p.blockAdsPv, 0);
    const allBlockRate = totalAllPv > 0 ? (totalAllBlock / totalAllPv) * 100 : 0;
    const vsBaselineDiffPp = allBlockRate - baselineSpec.baselineBlockRate;

    activeBaselinePoint = {
      month: 0,
      monthLabel: 'Toàn kỳ (T1 - T9)',
      totalPv: totalAllPv,
      canRunAdsPv: totalAllCanRun,
      blockAdsPv: totalAllBlock,
      blockRate: allBlockRate,
      momBlockRateDiffPp: null,
      isBlockRateIncreased: null,
      momRunAdsDiffPct: null,
      isRunAdsIncreased: null,
      vsBaselineDiffPp,
      isTargetMet10: allBlockRate <= baselineSpec.targetBlockRate10,
      isTargetMet15: allBlockRate <= baselineSpec.targetBlockRate15,
    };

    const jpTotalPv = japanPoints.reduce((acc, p) => acc + p.totalPv, 0);
    const jpTotalCanRun = japanPoints.reduce((acc, p) => acc + p.canRunAdsPv, 0);
    const jpTotalBlock = japanPoints.reduce((acc, p) => acc + p.blockAdsPv, 0);
    const jpBlockRate = jpTotalPv > 0 ? (jpTotalBlock / jpTotalPv) * 100 : 0;
    const jpVsBaselineDiff = jpBlockRate - jpSpec.blockRateBaseline;

    activeJapanPoint = {
      month: 0,
      monthLabel: 'Toàn kỳ Nhật Bản (T1 - T9)',
      totalPv: jpTotalPv,
      canRunAdsPv: jpTotalCanRun,
      blockAdsPv: jpTotalBlock,
      blockRate: jpBlockRate,
      momBlockRateDiffPp: null,
      isBlockRateIncreased: null,
      momRunAdsDiffPct: null,
      isRunAdsIncreased: null,
      vsBaselineDiffPp: jpVsBaselineDiff,
      isTargetMet10: jpBlockRate <= jpSpec.targetBlockRate10,
      isTargetMet15: jpBlockRate <= jpSpec.targetBlockRate15,
    };
  } else {
    activeBaselinePoint =
      baselinePoints.find((p) => p.month === activeMonthNumber) ||
      baselinePoints[baselinePoints.length - 1];

    activeJapanPoint =
      japanPoints.find((p) => p.month === activeMonthNumber) ||
      japanPoints[japanPoints.length - 1];
  }

  // Comparisons
  const activeMonthIdx = months.indexOf(activeMonthNumber);
  const prevMonthIdx = activeMonthIdx > 0 ? activeMonthIdx - 1 : -1;

  let baselineComparison = null;
  if (prevMonthIdx >= 0) {
    const prev = baselinePoints[prevMonthIdx];
    const diff = activeBaselinePoint.blockRate - prev.blockRate;
    baselineComparison = {
      prevMonthLabel: prev.monthLabel,
      blockRateDiffPp: diff,
      isBlockRateIncreased: diff > 0,
      runAdsDiffPct:
        prev.canRunAdsPv > 0
          ? ((activeBaselinePoint.canRunAdsPv - prev.canRunAdsPv) / prev.canRunAdsPv) * 100
          : 0,
      isRunAdsIncreased: activeBaselinePoint.canRunAdsPv >= prev.canRunAdsPv,
    };
  }

  let japanComparison = null;
  if (prevMonthIdx >= 0) {
    const prev = japanPoints[prevMonthIdx];
    const diff = activeJapanPoint.blockRate - prev.blockRate;
    japanComparison = {
      prevMonthLabel: prev.monthLabel,
      blockRateDiffPp: diff,
      isBlockRateIncreased: diff > 0,
      runAdsDiffPct:
        prev.canRunAdsPv > 0
          ? ((activeJapanPoint.canRunAdsPv - prev.canRunAdsPv) / prev.canRunAdsPv) * 100
          : 0,
      isRunAdsIncreased: activeJapanPoint.canRunAdsPv >= prev.canRunAdsPv,
    };
  }

  const baselineSeries: MonthlyKpiSeries = {
    id: 'baseline',
    title: 'KPI Theo Tháng của Baseline',
    subtitle: 'Toàn bộ thị trường Hải ngoại (All OV)',
    flag: '🌐',
    tag: 'Baseline Chuẩn hóa T7-T8: 14.80%',
    baselineBlockRate: baselineSpec.baselineBlockRate,
    targetBlockRate10: baselineSpec.targetBlockRate10,
    targetBlockRate15: baselineSpec.targetBlockRate15,
    baselineRunAdsMonthly: baselineSpec.baselineRunAdsMonthly,
    points: baselinePoints,
    activePoint: activeBaselinePoint,
    comparisonWithPrevMonth: baselineComparison,
    summaryText:
      baselineComparison?.isBlockRateIncreased === false
        ? `Tỷ lệ chặn ${activeBaselinePoint.monthLabel} đang GIẢM ${Math.abs(baselineComparison.blockRateDiffPp).toFixed(2)} pp so với ${baselineComparison.prevMonthLabel} (Cải thiện tích cực).`
        : `Tỷ lệ chặn ${activeBaselinePoint.monthLabel} đang TĂNG ${Math.abs(baselineComparison?.blockRateDiffPp || 0).toFixed(2)} pp so với ${baselineComparison?.prevMonthLabel} (Cần chú ý).`,
  };

  const japanSeries: MonthlyKpiSeries = {
    id: 'japan',
    title: 'KPI của Nhật Bản Theo Tháng',
    subtitle: 'Thị trường Thí điểm Trọng điểm (Pilot Phase 1)',
    flag: '🇯🇵',
    tag: 'Baseline Chuẩn hóa T7-T8: 16.06%',
    baselineBlockRate: jpSpec.blockRateBaseline,
    targetBlockRate10: jpSpec.targetBlockRate10,
    targetBlockRate15: jpSpec.targetBlockRate15,
    baselineRunAdsMonthly: jpSpec.runAdsBaselineMonthly,
    points: japanPoints,
    activePoint: activeJapanPoint,
    comparisonWithPrevMonth: japanComparison,
    summaryText:
      japanComparison?.isBlockRateIncreased === true
        ? `Tỷ lệ chặn tại Nhật Bản ${activeJapanPoint.monthLabel} đang TĂNG ${Math.abs(japanComparison.blockRateDiffPp).toFixed(2)} pp so với ${japanComparison.prevMonthLabel} (Cần gỡ chặn kỹ thuật).`
        : `Tỷ lệ chặn tại Nhật Bản ${activeJapanPoint.monthLabel} đang GIẢM ${Math.abs(japanComparison?.blockRateDiffPp || 0).toFixed(2)} pp so với ${japanComparison?.prevMonthLabel} (Tín hiệu tốt).`,
  };

  return {
    baselineSeries,
    japanSeries,
    availableMonths: months,
    activeMonthNumber,
  };
}


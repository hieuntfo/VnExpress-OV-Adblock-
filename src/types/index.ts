/**
 * VnExpress OV Adblock Control Tower - Types
 */

export interface RawFolderRecord {
  Folder: string;
  'Month Number': string | number;
  PVS: string | number;
  '%KPI': string | number;
  'PVS run ads': string | number;
}

export interface RawCountryRecord {
  Country: string;
  month: string | number;
  Pvs: string | number;
  'Pvs run ads': string | number;
}

export interface RawDateRecord {
  KPI: string | number;
  Pageview: string | number;
  Day: string;
}

export interface NormalizedFolderRecord {
  id: string;
  folder: string;
  month: number;
  pvs: number;
  pvsRunAds: number;
  blockAds: number;
  blockRate: number; // 0 to 100 %
  canRunAdsRate: number; // 0 to 100 %
  kpiPercent: number; // from file, e.g. 116.7
}

export interface NormalizedCountryRecord {
  id: string;
  country: string;
  month: number;
  pvs: number;
  pvsRunAds: number;
  blockAds: number;
  blockRate: number; // 0 to 100 %
  canRunAdsRate: number; // 0 to 100 %
}

export interface NormalizedDateRecord {
  id: string;
  dayString: string; // "YYYY-MM-DD"
  timestamp: number;
  month: number;
  year: number;
  kpiTarget: number;
  pageview: number | null; // null if future date (no data yet)
  canRunAdsPv?: number | null;
  blockAdsPv?: number | null;
  blockRate?: number | null;
}

export type TimeMode = 'date-range' | 'month';

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'this_month'
  | 'prev_month'
  | 'all'
  | 'custom';

export type ComparisonMode = 'DoD' | 'WoW' | 'MoM';

export interface FilterState {
  market: string; // 'all' or country name
  timeMode: TimeMode;
  dateRangePreset: DateRangePreset;
  customStartDate: string;
  customEndDate: string;
  selectedMonth: number | 'all'; // 1-12 or 'all'
  folder: string; // 'all' or folder name
  comparisonMode: ComparisonMode;
}

export interface ExecutiveKpiSummary {
  totalPageviews: number;
  canRunAdsPv: number;
  blockAdsPv: number;
  blockRate: number; // %
  canRunAdsRate: number; // %
  kpiTarget: number;
  kpiAttainment: number; // %
  kpiGap: number; // canRunAdsPv - kpiTarget (or actual - target)
  
  // Comparative metrics
  comparisonTitle: string;
  totalPvChange: number;
  totalPvChangePct: number;
  canRunAdsChange: number;
  canRunAdsChangePct: number;
  blockAdsChange: number;
  blockAdsChangePct: number;
  blockRateChangePp: number;
  kpiAttainmentChangePp: number;
  
  // Grain notice if filter is incompatible
  grainNotice?: string | null;
}

export interface SampleAllocationRow {
  market: string;
  actualPv: number;
  actualSamplePct: number; // %
  targetSamplePct: number | null; // % or null if not configured
  variance: number | null; // pp
  status: 'On Target' | 'Under Sample' | 'Over Sample' | 'Not Configured';
}

export interface MarketPerformanceRow {
  country: string;
  totalPv: number;
  canRunAdsPv: number;
  blockAdsPv: number;
  canRunAdsRate: number;
  blockRate: number;
  kpiAttainment: number;
  contributionToTotalBlock: number; // %
  momChangePct: number | null;
  dodChangePct?: number | null;
}

export interface FolderPerformanceRow {
  folder: string;
  pvs: number;
  pvsRunAds: number;
  blockAdsPv: number;
  runAdsRate: number;
  blockRate: number;
  kpiPercent: number;
  contributionToBlock: number; // %
  momChangePct?: number | null;
}

export interface AlertThresholds {
  kpiWarningThreshold: number; // default 90%
  kpiCriticalThreshold: number; // default 80%
  blockRateSurgePp: number; // default 2.0 percentage points
  sampleVariancePp: number; // default 5.0 percentage points
  consecutiveDaysDropCount: number; // default 3
}

export interface ActiveAlert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  metric: string;
  timestamp: string;
}

export interface DataQualityAudit {
  folderSumPvs: number;
  countrySumPvs: number;
  dateSumActual: number;
  dateSumKpi: number;
  folderRecordCount: number;
  countryRecordCount: number;
  dateRecordedDays: number;
  dateMissingDays: number;
  isFolderCountryMatch: boolean;
  reconciliationDeltaFolderCountry: number;
  reconciliationDeltaDateFolder: number;
  reconciliationDeltaPct: number;
}

export interface DataQualityReport {
  totalRecordsChecked: number;
  errorCount: number;
  warningCount: number;
  rulePassed: boolean; // Pvs run ads <= Pvs
  issues: Array<{
    id: string;
    level: 'error' | 'warning';
    dataset: 'Date' | 'Country' | 'Folder';
    field: string;
    description: string;
    affectedCount: number;
  }>;
  validationTotals: {
    folderTotalPv: number;
    folderCanRunAdsPv: number;
    folderBlockAdsPv: number;
    folderBlockRate: number;
    countryTotalPv: number;
    countryCanRunAdsPv: number;
    countryBlockAdsPv: number;
    dateTotalActualPv: number;
    dateTotalKpi: number;
  };
}

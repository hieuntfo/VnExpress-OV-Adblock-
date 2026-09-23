import React, { useState, useMemo, useEffect } from 'react';
import {
  FilterState,
  ExecutiveKpiSummary,
  ActiveAlert,
  AlertThresholds,
} from './types';
import {
  loadAndNormalizeAllData,
  calculateExecutiveSummary,
  calculateSampleAllocation,
  calculateMarketPerformance,
  calculateFolderPerformance,
  generateExecutiveInsights,
  performDataQualityAudit,
  runDataQualityAudit,
  generateActiveAlerts,
  resetToDefaultDatasets,
  getActiveMonthsFromFilter,
  formatDateVi,
  getLatestDateString,
  getEarliestDateString,
} from './services/dataService';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { KpiCards } from './components/KpiCards';
import { DailyKpiSection } from './components/DailyKpiSection';
import { CumulativeChart } from './components/CumulativeChart';
import { BlockTrendsSection } from './components/BlockTrendsSection';
import { SampleAllocationSection } from './components/SampleAllocationSection';
import { MarketTable } from './components/MarketTable';
import { FolderTable } from './components/FolderTable';
import { BlockCompositionSection } from './components/BlockCompositionSection';
import { ExecutiveBriefing } from './components/ExecutiveBriefing';
import { DataQualityMonitor } from './components/DataQualityMonitor';
import { DrillDownModal, ModalType } from './components/DrillDownModal';
import { UploadModal } from './components/UploadModal';
import { SettingsModal } from './components/SettingsModal';
import { DataQualityModal } from './components/DataQualityModal';
import { MetricFormulaModal, MetricKey } from './components/MetricFormulaModal';
import { TechOrderSpecModal } from './components/TechOrderSpecModal';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Users,
  Globe2,
  FolderOpen,
  PieChart,
  FileText,
  ShieldCheck,
  ChevronUp,
} from 'lucide-react';

const DEFAULT_TARGET_ALLOCATIONS: Record<string, number> = {
  'United States': 43.0,
  Australia: 10.0,
  Singapore: 8.5,
  Japan: 7.5,
  Germany: 6.5,
  Canada: 6.0,
  China: 3.5,
  'Hong Kong': 3.0,
  France: 2.5,
  'South Korea': 2.0,
  Czechia: 1.5,
  Taiwan: 1.5,
  Cambodia: 1.2,
  Thailand: 1.2,
  'United Kingdom': 1.1,
};

const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  kpiWarningThreshold: 90,
  kpiCriticalThreshold: 80,
  blockRateSurgePp: 2.0,
  sampleVariancePp: 5.0,
  consecutiveDaysDropCount: 3,
};

export default function App() {
  // Data version counter to trigger recalculation when CSVs are updated
  const [dataVersion, setDataVersion] = useState(0);

  // Load and memoize all normalized data from the 3 CSV sources
  const normalizedData = useMemo(() => loadAndNormalizeAllData(), [dataVersion]);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    market: 'all',
    folder: 'all',
    timeMode: 'month',
    dateRangePreset: 'all',
    customStartDate: '',
    customEndDate: '',
    selectedMonth: 'all',
    comparisonMode: 'MoM',
  });

  // Target allocations for sample distribution monitoring
  const [targetAllocations, setTargetAllocations] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('vnexpress_ov_allocations');
      return saved ? JSON.parse(saved) : DEFAULT_TARGET_ALLOCATIONS;
    } catch {
      return DEFAULT_TARGET_ALLOCATIONS;
    }
  });

  // Alert thresholds configuration state
  const [alertThresholds, setAlertThresholds] = useState<AlertThresholds>(() => {
    try {
      const saved = localStorage.getItem('vnexpress_alert_thresholds');
      return saved ? JSON.parse(saved) : DEFAULT_ALERT_THRESHOLDS;
    } catch {
      return DEFAULT_ALERT_THRESHOLDS;
    }
  });

  // Modal states
  const [modalState, setModalState] = useState<ModalType>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isTechSpecModalOpen, setIsTechSpecModalOpen] = useState(false);
  const [formulaModalMetric, setFormulaModalMetric] = useState<MetricKey | null>(null);

  // Active view tab for clean executive navigation
  const [activeTab, setActiveTab] = useState<
    'all' | 'daily' | 'trends' | 'markets' | 'composition' | 'briefing'
  >('all');

  // Show "back to top" button
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Perform calculations through the clean service transformation layer
  const summary: ExecutiveKpiSummary = useMemo(() => {
    return calculateExecutiveSummary(filters);
  }, [filters, dataVersion]);

  // Active months resolution for tables and breakdowns
  const activeMonthsForTables = useMemo(() => {
    return getActiveMonthsFromFilter(filters);
  }, [filters, dataVersion]);

  const selectedMonthForProps: number | 'all' = useMemo(() => {
    if (activeMonthsForTables === 'all') return 'all';
    if (Array.isArray(activeMonthsForTables)) {
      return activeMonthsForTables.length === 1 ? activeMonthsForTables[0] : 'all';
    }
    return Number(activeMonthsForTables);
  }, [activeMonthsForTables]);

  const sampleAllocationRows = useMemo(() => {
    return calculateSampleAllocation(targetAllocations, activeMonthsForTables);
  }, [targetAllocations, activeMonthsForTables, dataVersion]);

  const marketPerformance = useMemo(() => {
    return calculateMarketPerformance(activeMonthsForTables);
  }, [activeMonthsForTables, dataVersion]);

  const folderPerformance = useMemo(() => {
    return calculateFolderPerformance(activeMonthsForTables);
  }, [activeMonthsForTables, dataVersion]);

  const insights = useMemo(() => {
    return generateExecutiveInsights(filters);
  }, [filters, dataVersion]);

  const audit = useMemo(() => {
    return performDataQualityAudit();
  }, [dataVersion]);

  const dataQualityReport = useMemo(() => {
    return runDataQualityAudit();
  }, [dataVersion]);

  const alerts: ActiveAlert[] = useMemo(() => {
    return generateActiveAlerts(filters, alertThresholds, sampleAllocationRows);
  }, [filters, alertThresholds, sampleAllocationRows]);

  // Handlers for Target Allocation changes
  const handleUpdateTargetAllocation = (market: string, targetPct: number | null) => {
    setTargetAllocations((prev) => {
      const next = { ...prev };
      if (targetPct === null) {
        delete next[market];
      } else {
        next[market] = targetPct;
      }
      try {
        localStorage.setItem('vnexpress_ov_allocations', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const handleSaveAllAllocations = (newAllocations: Record<string, number>) => {
    setTargetAllocations(newAllocations);
    try {
      localStorage.setItem('vnexpress_ov_allocations', JSON.stringify(newAllocations));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetAllocations = () => {
    setTargetAllocations(DEFAULT_TARGET_ALLOCATIONS);
    try {
      localStorage.setItem('vnexpress_ov_allocations', JSON.stringify(DEFAULT_TARGET_ALLOCATIONS));
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers for Alert Thresholds
  const handleSaveThresholds = (newThresholds: AlertThresholds) => {
    setAlertThresholds(newThresholds);
    try {
      localStorage.setItem('vnexpress_alert_thresholds', JSON.stringify(newThresholds));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetThresholds = () => {
    setAlertThresholds(DEFAULT_ALERT_THRESHOLDS);
    try {
      localStorage.setItem('vnexpress_alert_thresholds', JSON.stringify(DEFAULT_ALERT_THRESHOLDS));
    } catch (e) {
      console.error(e);
    }
  };

  // Handler for exporting summary CSV report
  const handleExportCsv = () => {
    const rows: string[][] = [];
    rows.push(['--- BAO CAO DIEU HANH THI DIEM ADBLOCK VNEXPRESS OVERSEAS (OV) ---']);
    rows.push(['Thoi diem xuat bao cao', new Date().toLocaleString('vi-VN')]);
    rows.push(['Thang quan sat', filters.selectedMonth === 'all' ? 'Toan bo (T1-T9)' : `Thang ${filters.selectedMonth}`]);
    rows.push([]);
    rows.push(['=== 1. TONG QUAN KPI DIEU HANH (NORTH STAR METRICS) ===']);
    rows.push(['Chi so', 'Gia tri', 'Don vi', 'Mo ta']);
    rows.push(['Pageview Can Run Ads', String(summary.canRunAdsPv), 'PV', 'Luot xem quang cao kha dung']);
    rows.push(['Pageview Block Ads', String(summary.blockAdsPv), 'PV', 'Luot xem bi chan boi Adblock']);
    rows.push(['Tong Pageview thuc te', String(summary.totalPageviews), 'PV', 'Tong luot truy cap']);
    rows.push(['Ty le Block Ads', `${summary.blockRate.toFixed(2)}%`, '%', 'Phan tram truy cap bi chan']);
    rows.push(['Ty le Can Run Ads', `${summary.canRunAdsRate.toFixed(2)}%`, '%', 'Phan tram quang cao kha dung']);
    rows.push(['Ty le Dat KPI', `${summary.kpiAttainment.toFixed(2)}%`, '%', 'Tien do hoan thanh muc tieu']);
    rows.push([]);
    rows.push(['=== 2. PHAN BO HIEU QUA THEO THI TRUONG (COUNTRY) ===']);
    rows.push(['Thi truong (Country)', 'Tong PVS', 'PVS Run Ads', 'Block Ads', 'Ty le Block (%)', 'Ty le Can Run Ads (%)']);
    marketPerformance.forEach((m) => {
      rows.push([
        m.country,
        String(m.totalPv),
        String(m.canRunAdsPv),
        String(m.blockAdsPv),
        `${m.blockRate.toFixed(2)}%`,
        `${m.canRunAdsRate.toFixed(2)}%`,
      ]);
    });
    rows.push([]);
    rows.push(['=== 3. PHAN BO HIEU QUA THEO CHUYEN MUC (FOLDER) ===']);
    rows.push(['Chuyen muc (Folder)', 'Tong PVS', 'PVS Run Ads', 'Block Ads', 'Ty le Block (%)', '% Dong gop Block']);
    folderPerformance.forEach((f) => {
      rows.push([
        f.folder,
        String(f.pvs),
        String(f.pvsRunAds),
        String(f.blockAdsPv),
        `${f.blockRate.toFixed(2)}%`,
        `${f.contributionToBlock.toFixed(2)}%`,
      ]);
    });

    const csvContent =
      '\uFEFF' +
      rows
        .map((row) =>
          row
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(',')
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `VnExpress_OV_Adblock_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-16">
      {/* Top Navbar */}
      <Navbar
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDataQuality={() => setIsAuditModalOpen(true)}
        onOpenTechDoc={() => setIsTechSpecModalOpen(true)}
        onResetData={() => {
          resetToDefaultDatasets();
          setDataVersion((v) => v + 1);
        }}
        onPrint={() => window.print()}
        onExportCsv={handleExportCsv}
        dataQuality={dataQualityReport}
        lastRefresh={normalizedData.lastRefreshTime}
        dataSourceInfo={normalizedData.dataSourceInfo}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-5">
        {/* Global Filter Bar */}
        <FilterBar
          filter={filters}
          onChangeFilter={setFilters}
          uniqueMarkets={normalizedData.uniqueCountries}
          uniqueFolders={normalizedData.uniqueFolders}
          availableMonths={normalizedData.availableMonths}
          grainNotice={summary.grainNotice || null}
        />

        {/* Section View Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar text-xs font-semibold py-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Toàn bộ Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('briefing')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'briefing'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-red-600" />
              <span>Bản tin Điều hành</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('daily')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'daily'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Daily KPI & Lũy kế</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('trends')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'trends'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Xu hướng Block & Run Ads</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('markets')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'markets'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Globe2 className="h-3.5 w-3.5" />
              <span>Thị trường & Phân bổ mẫu</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('composition')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'composition'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <PieChart className="h-3.5 w-3.5" />
              <span>Cấu thành Block (Pareto)</span>
            </button>
          </nav>
        </div>

        {/* 6 Executive KPI Cards (Always visible on all tabs as North Star metrics) */}
        <section aria-label="Executive KPI Cards">
          <KpiCards
            summary={summary}
            onOpenFormula={(metric) => setFormulaModalMetric(metric)}
            onOpenTechDoc={() => setIsTechSpecModalOpen(true)}
          />
        </section>

        {/* Tab 1: Executive Briefing */}
        {(activeTab === 'all' || activeTab === 'briefing') && (
          <section id="executive-briefing" aria-label="Bản tin Điều hành">
            <ExecutiveBriefing
              summary={summary}
              insights={insights}
              alerts={alerts}
              sampleAllocationRows={sampleAllocationRows}
              selectedMonth={selectedMonthForProps}
              onOpenFormula={(metric) => setFormulaModalMetric(metric)}
            />
          </section>
        )}

        {/* Tab 2: Daily KPI & Cumulative */}
        {(activeTab === 'all' || activeTab === 'daily') && (
          <>
            <section id="daily-kpi" aria-label="Daily KPI Control">
              <DailyKpiSection
                dates={normalizedData.dates}
                onSelectDay={(record) => setModalState({ type: 'day', data: record })}
              />
            </section>

            <section id="cumulative-performance" aria-label="Tiến độ Lũy kế">
              <CumulativeChart dates={normalizedData.dates} />
            </section>
          </>
        )}

        {/* Tab 3: Monthly Trends */}
        {(activeTab === 'all' || activeTab === 'trends') && (
          <section id="block-trends" aria-label="Xu hướng Block Ads & Can Run Ads">
            <BlockTrendsSection folders={normalizedData.folders} />
          </section>
        )}

        {/* Tab 4: Markets & Sample Allocation */}
        {(activeTab === 'all' || activeTab === 'markets') && (
          <>
            <section id="sample-allocation" aria-label="Kiểm tra phân bổ mẫu">
              <SampleAllocationSection
                rows={sampleAllocationRows}
                targetAllocations={targetAllocations}
                onUpdateTargetAllocation={handleUpdateTargetAllocation}
                onSaveAllAllocations={handleSaveAllAllocations}
                onResetAllocations={handleResetAllocations}
                selectedMonth={selectedMonthForProps}
              />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <section id="market-performance" aria-label="Hiệu quả theo thị trường">
                <MarketTable
                  markets={marketPerformance}
                  onSelectMarket={(country) => setModalState({ type: 'market', country })}
                  selectedMonth={selectedMonthForProps}
                />
              </section>

              <section id="folder-performance" aria-label="Hiệu quả theo chuyên mục">
                <FolderTable
                  folders={folderPerformance}
                  onSelectFolder={(folder) => setModalState({ type: 'folder', folder })}
                  selectedMonth={selectedMonthForProps}
                />
              </section>
            </div>
          </>
        )}

        {/* Tab 5: Block Composition & Pareto */}
        {(activeTab === 'all' || activeTab === 'composition') && (
          <section id="block-composition" aria-label="Cấu thành Block Ads">
            <BlockCompositionSection
              markets={marketPerformance}
              folders={folderPerformance}
              rawFolders={normalizedData.folders}
              rawCountries={normalizedData.countries}
              rawDates={normalizedData.dates}
              selectedMonth={selectedMonthForProps}
            />
          </section>
        )}

        {/* Data Quality & Integrity Monitor (Always visible in 'all' view or bottom) */}
        {activeTab === 'all' && (
          <section id="data-quality" aria-label="Giám sát chất lượng dữ liệu">
            <DataQualityMonitor audit={audit} />
          </section>
        )}
      </main>

      {/* Drill-down Modal */}
      <DrillDownModal
        modalState={modalState}
        onClose={() => setModalState(null)}
        allCountries={normalizedData.countries}
        allFolders={normalizedData.folders}
        allDates={normalizedData.dates}
      />

      {/* CSV Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDataUpdated={() => setDataVersion((v) => v + 1)}
      />

      {/* Alert Thresholds Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        thresholds={alertThresholds}
        onSaveThresholds={handleSaveThresholds}
        onResetThresholds={handleResetThresholds}
      />

      {/* Data Quality & Audit Modal */}
      <DataQualityModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        audit={audit}
        dataQualityReport={dataQualityReport}
      />

      {/* Metric Formula Explanation Modal */}
      <MetricFormulaModal
        isOpen={formulaModalMetric !== null}
        onClose={() => setFormulaModalMetric(null)}
        initialMetric={formulaModalMetric || 'kpiAttainment'}
        summary={summary}
      />

      {/* Tech Order Spec & Country Roadmap Modal */}
      <TechOrderSpecModal
        isOpen={isTechSpecModalOpen}
        onClose={() => setIsTechSpecModalOpen(false)}
        onSelectCountry={(country) => {
          setFilters((prev) => ({ ...prev, market: country }));
        }}
      />

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-2.5 rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition-all z-40"
          title="Lên đầu trang"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200 text-center text-xs text-slate-500 max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            VnExpress OV Adblock Control Tower &copy; 2026 &bull; Ban Kỹ thuật & Phát triển Sản phẩm VnExpress
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Dữ liệu ghi nhận: {formatDateVi(getEarliestDateString())} - {formatDateVi(getLatestDateString())} &bull; No Data Interpolation Enforced
          </span>
        </div>
      </footer>
    </div>
  );
}

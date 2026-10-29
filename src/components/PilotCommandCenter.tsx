import React, { useState, useMemo } from 'react';
import {
  Target,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  CalendarDays,
  Sliders,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Info,
  Check,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  getPilotMonthlyKpis,
  getDayOfWeekAnalysis,
  getDailyPilotTrend,
  getPilotHeadToHeadComparison,
  formatNumber,
  formatCompactNumber,
  formatPercent,
  formatSignedPercent,
  DynamicPilotCustomTargets,
  COUNTRY_KPI_SPECS,
} from '../services/dataService';

interface PilotCommandCenterProps {
  selectedMonth: number | 'all';
  dataVersion?: number;
  onSelectMonth: (month: number | 'all') => void;
  onOpenUploadModal: () => void;
  onOpenTechDoc?: () => void;
  onSwitchToFullOverview: () => void;
}

export const PilotCommandCenter: React.FC<PilotCommandCenterProps> = ({
  selectedMonth,
  dataVersion,
  onSelectMonth,
  onOpenUploadModal,
  onOpenTechDoc,
  onSwitchToFullOverview,
}) => {
  // Pilot Focus Market tab: 'both' | 'Japan' | 'Australia'
  const [pilotFocusMarket, setPilotFocusMarket] = useState<'both' | 'Japan' | 'Australia'>('both');

  // Day-of-week selected market view: 'Japan' | 'Australia' | 'all'
  const [dowMarket, setDowMarket] = useState<'Japan' | 'Australia' | 'all'>('Japan');

  // Dynamic Targets Tuning Modal / Drawer state
  const [isTunerOpen, setIsTunerOpen] = useState(false);
  const [customTargets, setCustomTargets] = useState<DynamicPilotCustomTargets>(() => {
    try {
      const saved = localStorage.getItem('vnexpress_pilot_custom_targets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      japan: COUNTRY_KPI_SPECS['Japan'].targetBlockRate10, // 14.45
      australia: COUNTRY_KPI_SPECS['Australia'].targetBlockRate10, // 13.74
    };
  });

  // Target Tuner temporary edit state
  const [tempJpTarget, setTempJpTarget] = useState<number>(
    customTargets.japan ?? COUNTRY_KPI_SPECS['Japan'].targetBlockRate10
  );
  const [tempAuTarget, setTempAuTarget] = useState<number>(
    customTargets.australia ?? COUNTRY_KPI_SPECS['Australia'].targetBlockRate10
  );

  // Active Daily Trend hover tooltip state
  const [activeHoverDay, setActiveHoverDay] = useState<string | null>(null);

  // 1. Compute Pilot Series with current custom targets
  const { japanSeries, australiaSeries, baselineSeries, availableMonths, activeMonthNumber } =
    useMemo(() => {
      return getPilotMonthlyKpis(selectedMonth, customTargets);
    }, [selectedMonth, customTargets, dataVersion]);

  const activeJp = japanSeries.activePoint;
  const activeAu = australiaSeries.activePoint;
  const activeBase = baselineSeries.activePoint;

  // 2. Compute Day-of-Week Summary
  const dowSummary = useMemo(() => {
    const target =
      dowMarket === 'Japan'
        ? customTargets.japan
        : dowMarket === 'Australia'
        ? customTargets.australia
        : undefined;
    return getDayOfWeekAnalysis(dowMarket, selectedMonth, target);
  }, [dowMarket, selectedMonth, customTargets, dataVersion]);

  // 3. Compute Daily Trend Points
  const dailyTrend = useMemo(() => {
    const trendMarket = dowMarket;
    const target =
      trendMarket === 'Japan'
        ? customTargets.japan
        : trendMarket === 'Australia'
        ? customTargets.australia
        : undefined;
    return getDailyPilotTrend(trendMarket, selectedMonth, target);
  }, [dowMarket, selectedMonth, customTargets, dataVersion]);

  // 4. Compute Head-to-Head Comparison
  const headToHead = useMemo(() => {
    return getPilotHeadToHeadComparison(selectedMonth, customTargets);
  }, [selectedMonth, customTargets, dataVersion]);

  // Save custom targets
  const handleApplyCustomTargets = () => {
    const updated = {
      japan: tempJpTarget,
      australia: tempAuTarget,
    };
    setCustomTargets(updated);
    try {
      localStorage.setItem('vnexpress_pilot_custom_targets', JSON.stringify(updated));
    } catch {}
    setIsTunerOpen(false);
  };

  const handleResetCustomTargets = () => {
    const defaults = {
      japan: COUNTRY_KPI_SPECS['Japan'].targetBlockRate10,
      australia: COUNTRY_KPI_SPECS['Australia'].targetBlockRate10,
    };
    setTempJpTarget(defaults.japan);
    setTempAuTarget(defaults.australia);
    setCustomTargets(defaults);
    try {
      localStorage.removeItem('vnexpress_pilot_custom_targets');
    } catch {}
  };

  // Export Pilot Data to CSV
  const handleExportPilotCsv = () => {
    const headers = [
      'Thị trường',
      'Tháng',
      'Tổng PV',
      'PV Chạy Ads',
      'PV Bị Chặn',
      'Tỷ lệ Chặn (%)',
      'Baseline (%)',
      'Mục tiêu (-10%)',
      'Mục tiêu (-15%)',
      'Mục tiêu Tùy chỉnh (%)',
      'Độ lệch vs Baseline (pp)',
      'Đạt Mục tiêu 10%',
    ];

    const rows: (string | number)[][] = [];

    // Japan rows
    japanSeries.points.forEach((p) => {
      rows.push([
        'Nhật Bản (Japan)',
        p.monthLabel,
        p.totalPv,
        p.canRunAdsPv,
        p.blockAdsPv,
        p.blockRate.toFixed(2),
        japanSeries.baselineBlockRate.toFixed(2),
        COUNTRY_KPI_SPECS['Japan'].targetBlockRate10.toFixed(2),
        COUNTRY_KPI_SPECS['Japan'].targetBlockRate15.toFixed(2),
        (customTargets.japan ?? COUNTRY_KPI_SPECS['Japan'].targetBlockRate10).toFixed(2),
        p.vsBaselineDiffPp.toFixed(2),
        p.isTargetMet10 ? 'Đạt' : 'Chưa đạt',
      ]);
    });

    // Australia rows
    australiaSeries.points.forEach((p) => {
      rows.push([
        'Úc (Australia)',
        p.monthLabel,
        p.totalPv,
        p.canRunAdsPv,
        p.blockAdsPv,
        p.blockRate.toFixed(2),
        australiaSeries.baselineBlockRate.toFixed(2),
        COUNTRY_KPI_SPECS['Australia'].targetBlockRate10.toFixed(2),
        COUNTRY_KPI_SPECS['Australia'].targetBlockRate15.toFixed(2),
        (customTargets.australia ?? COUNTRY_KPI_SPECS['Australia'].targetBlockRate10).toFixed(2),
        p.vsBaselineDiffPp.toFixed(2),
        p.isTargetMet10 ? 'Đạt' : 'Chưa đạt',
      ]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `VnExpress_OV_Pilot_Japan_Australia_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. PILOT COMMAND CENTER HERO HEADER & TOP BAR
         ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-slate-900 via-slate-900/95 to-blue-950/40 p-5 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-md bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-blue-300">
                <Target className="h-3.5 w-3.5" />
                Trung Tâm Thí Điểm Adblock (Pilot Command Center)
              </span>
              <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                Giai đoạn 1 &amp; 2 Thí điểm
              </span>
              <span className="text-xs text-slate-400">
                Nhật Bản 🇯🇵 &amp; Úc 🇦🇺
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Giám Sát Mục Tiêu Thí Điểm Chống Adblock
            </h1>
            <p className="max-w-3xl text-xs leading-relaxed text-slate-300 sm:text-sm">
              Theo dõi trực quan tiến độ giảm tỷ lệ chặn (Block Rate) tại 2 thị trường trọng điểm Tokyo &amp; Sydney. 
              Phân tích quy luật lưu lượng và hành vi độc giả theo ngày, thứ trong tuần (T2–CN) và so sánh đối đầu toàn cầu.
            </p>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Custom Target Tuner Button */}
            <button
              onClick={() => setIsTunerOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-xs font-medium text-purple-200 transition-colors hover:bg-purple-500/20 shadow-sm"
              title="Tùy chỉnh mục tiêu động cho Nhật Bản và Úc"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-purple-300" />
              <span>Chỉnh mục tiêu</span>
              {(customTargets.japan !== COUNTRY_KPI_SPECS['Japan'].targetBlockRate10 ||
                customTargets.australia !== COUNTRY_KPI_SPECS['Australia'].targetBlockRate10) && (
                <span className="h-2 w-2 rounded-full bg-purple-400" />
              )}
            </button>

            {/* Export Pilot Report */}
            <button
              onClick={handleExportPilotCsv}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
              title="Xuất bảng dữ liệu thí điểm dạng CSV"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>Xuất CSV</span>
            </button>

            {/* Switch to Full Overview */}
            <button
              onClick={onSwitchToFullOverview}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700"
              title="Xem toàn bộ số liệu 19 chuyên mục, Pareto thị trường và kiểm toán chất lượng"
            >
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              <span>Tháp Điều Khiển Toàn diện</span>
              <ChevronRight className="h-3 w-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Sub-bar: Month Filter & Focus Market Switch */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
          {/* Month selector tabs */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1 text-xs font-medium text-slate-400">Kỳ báo cáo:</span>
            <button
              onClick={() => onSelectMonth('all')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                selectedMonth === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Toàn kỳ (T1–T9)
            </button>
            {availableMonths.map((m) => (
              <button
                key={m}
                onClick={() => onSelectMonth(m)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  selectedMonth === m
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {m === 9 ? 'Tháng 9 (MTD)' : `T${m}`}
              </button>
            ))}
          </div>

          {/* Market view pills */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
            <span className="px-2 text-xs text-slate-400">Xem thị trường:</span>
            <button
              onClick={() => setPilotFocusMarket('both')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                pilotFocusMarket === 'both'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🇯🇵 Nhật + 🇦🇺 Úc
            </button>
            <button
              onClick={() => setPilotFocusMarket('Japan')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                pilotFocusMarket === 'Japan'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🇯🇵 Nhật Bản
            </button>
            <button
              onClick={() => setPilotFocusMarket('Australia')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                pilotFocusMarket === 'Australia'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🇦🇺 Úc
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SECTION: GOAL-FIRST SCORECARDS ("NHÌN PHÁT THẤY MỤC TIÊU")
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* CARD 1: NHẬT BẢN (JAPAN) */}
        {(pilotFocusMarket === 'both' || pilotFocusMarket === 'Japan') && (
          <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-md">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🇯🇵</span>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      Nhật Bản (Japan)
                      <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300 uppercase">
                        Phase 1 Pilot
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tokyo Hub · {activeJp.monthLabel}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`rounded-full px-2.5 py-1 text-xs font-semibold flex items-center gap-1 ${
                  activeJp.isTargetMet10
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : activeJp.blockRate <= (customTargets.japan ?? 14.45) + 1.0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {activeJp.isTargetMet10 ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Đạt mục tiêu</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>
                      {activeJp.blockRate > (customTargets.japan ?? 14.45)
                        ? `Cách mục tiêu +${(activeJp.blockRate - (customTargets.japan ?? 14.45)).toFixed(2)} pp`
                        : 'Sát mục tiêu'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Big Primary Metric */}
            <div className="mt-4 flex items-baseline justify-between border-b border-slate-800/80 pb-3">
              <div>
                <div className="text-xs font-medium text-slate-400">Tỷ lệ Chặn Hiện Tại (Block Rate)</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tabular-nums tracking-tight text-white">
                    {activeJp.blockRate.toFixed(2)}%
                  </span>
                  <span className="text-xs text-slate-400">
                    / {formatCompactNumber(activeJp.totalPv)} PVs
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-medium text-slate-400">Mục tiêu Đặt ra</div>
                <div className="text-lg font-bold tabular-nums text-emerald-400">
                  ≤ {(customTargets.japan ?? COUNTRY_KPI_SPECS['Japan'].targetBlockRate10).toFixed(2)}%
                </div>
                <div className="text-[11px] text-slate-500">
                  (Giảm 10% từ {COUNTRY_KPI_SPECS['Japan'].blockRateBaseline.toFixed(2)}%)
                </div>
              </div>
            </div>

            {/* Visual Target Range Progress Bar */}
            <div className="mt-3.5 space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Vùng An Toàn (&le; {(customTargets.japan ?? 14.45).toFixed(2)}%)</span>
                <span>Baseline ({COUNTRY_KPI_SPECS['Japan'].blockRateBaseline.toFixed(2)}%)</span>
                <span className="text-rose-400">Hiện tại ({activeJp.blockRate.toFixed(2)}%)</span>
              </div>
              <div className="relative h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                {/* Safe Target Zone */}
                <div
                  className="absolute left-0 top-0 h-full bg-emerald-500/40"
                  style={{ width: `${Math.min(100, ((customTargets.japan ?? 14.45) / 25) * 100)}%` }}
                />
                {/* Current Value Indicator Marker */}
                <div
                  className={`absolute top-0 h-full w-2 rounded-full shadow ${
                    activeJp.isTargetMet10 ? 'bg-emerald-400' : 'bg-rose-500'
                  }`}
                  style={{
                    left: `calc(${Math.min(98, Math.max(2, (activeJp.blockRate / 25) * 100))}% - 4px)`,
                  }}
                />
              </div>
            </div>

            {/* 3 Key Deltas Grid */}
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
              {/* vs Baseline */}
              <div>
                <div className="text-[11px] text-slate-400">vs Baseline</div>
                <div
                  className={`text-xs font-bold tabular-nums flex items-center gap-0.5 mt-0.5 ${
                    activeJp.vsBaselineDiffPp <= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {activeJp.vsBaselineDiffPp <= 0 ? (
                    <ArrowDownRight className="h-3 w-3 shrink-0" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3 shrink-0" />
                  )}
                  {activeJp.vsBaselineDiffPp > 0 ? '+' : ''}
                  {activeJp.vsBaselineDiffPp.toFixed(2)} pp
                </div>
              </div>

              {/* vs Prev Month (MoM) */}
              <div>
                <div className="text-[11px] text-slate-400">So tháng trước</div>
                <div
                  className={`text-xs font-bold tabular-nums flex items-center gap-0.5 mt-0.5 ${
                    activeJp.momBlockRateDiffPp === null
                      ? 'text-slate-400'
                      : activeJp.momBlockRateDiffPp <= 0
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {activeJp.momBlockRateDiffPp === null ? (
                    '—'
                  ) : (
                    <>
                      {activeJp.momBlockRateDiffPp <= 0 ? (
                        <ArrowDownRight className="h-3 w-3 shrink-0" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3 shrink-0" />
                      )}
                      {activeJp.momBlockRateDiffPp > 0 ? '+' : ''}
                      {activeJp.momBlockRateDiffPp.toFixed(2)} pp
                    </>
                  )}
                </div>
              </div>

              {/* Recovered PV Potential */}
              <div>
                <div className="text-[11px] text-slate-400">PV Quảng Cáo Thu Hồi</div>
                <div className="text-xs font-bold tabular-nums text-blue-400 mt-0.5">
                  +{formatCompactNumber(Math.round(activeJp.totalPv * 0.1445))} PV
                </div>
              </div>
            </div>

            {/* Bottom Insight */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                Khiếu nại: 0 trường hợp
              </span>
              <button
                onClick={() => setDowMarket('Japan')}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Xem quy luật thứ trong tuần →
              </button>
            </div>
          </div>
        )}

        {/* CARD 2: ÚC (AUSTRALIA) */}
        {(pilotFocusMarket === 'both' || pilotFocusMarket === 'Australia') && (
          <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-md">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🇦🇺</span>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      Úc (Australia)
                      <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300 uppercase">
                        Phase 2 Expansion
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Sydney Hub · {activeAu.monthLabel}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`rounded-full px-2.5 py-1 text-xs font-semibold flex items-center gap-1 ${
                  activeAu.isTargetMet10
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : activeAu.blockRate <= (customTargets.australia ?? 13.74) + 1.0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {activeAu.isTargetMet10 ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Đạt mục tiêu</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>
                      {activeAu.blockRate > (customTargets.australia ?? 13.74)
                        ? `Cách mục tiêu +${(activeAu.blockRate - (customTargets.australia ?? 13.74)).toFixed(2)} pp`
                        : 'Sát mục tiêu'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Big Primary Metric */}
            <div className="mt-4 flex items-baseline justify-between border-b border-slate-800/80 pb-3">
              <div>
                <div className="text-xs font-medium text-slate-400">Tỷ lệ Chặn Hiện Tại (Block Rate)</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tabular-nums tracking-tight text-white">
                    {activeAu.blockRate.toFixed(2)}%
                  </span>
                  <span className="text-xs text-slate-400">
                    / {formatCompactNumber(activeAu.totalPv)} PVs
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-medium text-slate-400">Mục tiêu Đặt ra</div>
                <div className="text-lg font-bold tabular-nums text-emerald-400">
                  ≤ {(customTargets.australia ?? COUNTRY_KPI_SPECS['Australia'].targetBlockRate10).toFixed(2)}%
                </div>
                <div className="text-[11px] text-slate-500">
                  (Giảm 10% từ {COUNTRY_KPI_SPECS['Australia'].blockRateBaseline.toFixed(2)}%)
                </div>
              </div>
            </div>

            {/* Visual Target Range Progress Bar */}
            <div className="mt-3.5 space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Vùng An Toàn (&le; {(customTargets.australia ?? 13.74).toFixed(2)}%)</span>
                <span>Baseline ({COUNTRY_KPI_SPECS['Australia'].blockRateBaseline.toFixed(2)}%)</span>
                <span className="text-rose-400">Hiện tại ({activeAu.blockRate.toFixed(2)}%)</span>
              </div>
              <div className="relative h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-emerald-500/40"
                  style={{ width: `${Math.min(100, ((customTargets.australia ?? 13.74) / 25) * 100)}%` }}
                />
                <div
                  className={`absolute top-0 h-full w-2 rounded-full shadow ${
                    activeAu.isTargetMet10 ? 'bg-emerald-400' : 'bg-rose-500'
                  }`}
                  style={{
                    left: `calc(${Math.min(98, Math.max(2, (activeAu.blockRate / 25) * 100))}% - 4px)`,
                  }}
                />
              </div>
            </div>

            {/* 3 Key Deltas Grid */}
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
              {/* vs Baseline */}
              <div>
                <div className="text-[11px] text-slate-400">vs Baseline</div>
                <div
                  className={`text-xs font-bold tabular-nums flex items-center gap-0.5 mt-0.5 ${
                    activeAu.vsBaselineDiffPp <= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {activeAu.vsBaselineDiffPp <= 0 ? (
                    <ArrowDownRight className="h-3 w-3 shrink-0" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3 shrink-0" />
                  )}
                  {activeAu.vsBaselineDiffPp > 0 ? '+' : ''}
                  {activeAu.vsBaselineDiffPp.toFixed(2)} pp
                </div>
              </div>

              {/* vs Prev Month (MoM) */}
              <div>
                <div className="text-[11px] text-slate-400">So tháng trước</div>
                <div
                  className={`text-xs font-bold tabular-nums flex items-center gap-0.5 mt-0.5 ${
                    activeAu.momBlockRateDiffPp === null
                      ? 'text-slate-400'
                      : activeAu.momBlockRateDiffPp <= 0
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {activeAu.momBlockRateDiffPp === null ? (
                    '—'
                  ) : (
                    <>
                      {activeAu.momBlockRateDiffPp <= 0 ? (
                        <ArrowDownRight className="h-3 w-3 shrink-0" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3 shrink-0" />
                      )}
                      {activeAu.momBlockRateDiffPp > 0 ? '+' : ''}
                      {activeAu.momBlockRateDiffPp.toFixed(2)} pp
                    </>
                  )}
                </div>
              </div>

              {/* Recovered PV Potential */}
              <div>
                <div className="text-[11px] text-slate-400">PV Quảng Cáo Thu Hồi</div>
                <div className="text-xs font-bold tabular-nums text-blue-400 mt-0.5">
                  +{formatCompactNumber(Math.round(activeAu.totalPv * 0.1374))} PV
                </div>
              </div>
            </div>

            {/* Bottom Insight */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                Độ ổn định: Cao nhất (std 0.58)
              </span>
              <button
                onClick={() => setDowMarket('Australia')}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Xem quy luật thứ trong tuần →
              </button>
            </div>
          </div>
        )}

        {/* CARD 3: THAM CHIẾU TOÀN CẦU (GLOBAL OV REFERENCE) */}
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-md">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌐</span>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    Toàn Cầu Hải Ngoại (All OV)
                    <span className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 uppercase">
                      Hệ Thống Tham Chiếu
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Toàn bộ độc giả ngoài VN · {activeBase.monthLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Dưới Baseline -1.04 pp</span>
            </div>
          </div>

          {/* Big Primary Metric */}
          <div className="mt-4 flex items-baseline justify-between border-b border-slate-800/80 pb-3">
            <div>
              <div className="text-xs font-medium text-slate-400">Tỷ lệ Chặn Toàn Bộ OV (Block Rate)</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tabular-nums tracking-tight text-white">
                  {activeBase.blockRate.toFixed(2)}%
                </span>
                <span className="text-xs text-slate-400">
                  / {formatCompactNumber(activeBase.totalPv)} PVs
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-medium text-slate-400">Mục tiêu Hệ thống</div>
              <div className="text-lg font-bold tabular-nums text-emerald-400">
                ≤ 13.32%
              </div>
              <div className="text-[11px] text-slate-500">
                (Baseline: 14.80%)
              </div>
            </div>
          </div>

          {/* Visual Target Range Progress Bar */}
          <div className="mt-3.5 space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Mục tiêu (&le; 13.32%)</span>
              <span>Baseline (14.80%)</span>
              <span className="text-emerald-400">Hiện tại ({activeBase.blockRate.toFixed(2)}%)</span>
            </div>
            <div className="relative h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-emerald-500/40"
                style={{ width: `${(13.32 / 25) * 100}%` }}
              />
              <div
                className="absolute top-0 h-full w-2 rounded-full bg-emerald-400 shadow"
                style={{
                  left: `calc(${Math.min(98, Math.max(2, (activeBase.blockRate / 25) * 100))}% - 4px)`,
                }}
              />
            </div>
          </div>

          {/* 3 Key Deltas Grid */}
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
            <div>
              <div className="text-[11px] text-slate-400">vs Baseline</div>
              <div
                className={`text-xs font-bold tabular-nums flex items-center gap-0.5 mt-0.5 ${
                  activeBase.vsBaselineDiffPp <= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                <ArrowDownRight className="h-3 w-3 shrink-0" />
                {activeBase.vsBaselineDiffPp.toFixed(2)} pp
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400">Can Run Ads PV</div>
              <div className="text-xs font-bold tabular-nums text-blue-400 mt-0.5">
                {formatCompactNumber(activeBase.canRunAdsPv)} PV
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400">Tỷ lệ Chạy Ads</div>
              <div className="text-xs font-bold tabular-nums text-emerald-400 mt-0.5">
                {(100 - activeBase.blockRate).toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Bottom Note */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>9 tháng: 328.9M PV tổng</span>
            <button
              onClick={() => setDowMarket('all')}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Xem quy luật toàn cầu →
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. SECTION: BẢNG PHÂN TÍCH THỨ TRONG TUẦN (T2 ĐẾN CN)
         ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-400" />
              <h2 className="text-base font-bold text-white">
                Bảng Phân Tích Quy Luật Các Thứ Trong Tuần (Thứ 2 – Chủ Nhật)
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Tổng hợp chi tiết khối lượng truy cập, tỷ lệ chặn và khoảng cách so với mục tiêu theo từng thứ trong tuần tại{' '}
              <strong className="text-slate-200">
                {dowSummary.marketFlag} {dowSummary.market}
              </strong>.
            </p>
          </div>

          {/* Switch Market for Day-of-Week Table */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setDowMarket('Japan')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                dowMarket === 'Japan'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🇯🇵 Nhật Bản
            </button>
            <button
              onClick={() => setDowMarket('Australia')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                dowMarket === 'Australia'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🇦🇺 Úc
            </button>
            <button
              onClick={() => setDowMarket('all')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                dowMarket === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🌐 Toàn Cầu
            </button>
          </div>
        </div>

        {/* Highlight Summary Stats Bar */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-400">Trung bình Ngày Làm Việc (T2–T6)</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-bold tabular-nums text-white">
                {dowSummary.weekdayAvgBlockRate.toFixed(2)}%
              </span>
              <span className="text-[11px] text-amber-400">Cao điểm Desktop</span>
            </div>
          </div>

          <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-400">Trung bình Cuối Tuần (T7–CN)</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-bold tabular-nums text-emerald-400">
                {dowSummary.weekendAvgBlockRate.toFixed(2)}%
              </span>
              <span className="text-[11px] text-emerald-400/80">Ưu thế Mobile</span>
            </div>
          </div>

          <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-400">Chênh Lệch Cuối Tuần vs Trong Tuần</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span
                className={`text-lg font-bold tabular-nums ${
                  dowSummary.weekendVsWeekdayDeltaPp <= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {dowSummary.weekendVsWeekdayDeltaPp > 0 ? '+' : ''}
                {dowSummary.weekendVsWeekdayDeltaPp.toFixed(2)} pp
              </span>
              <span className="text-[11px] text-slate-400">
                {dowSummary.weekendVsWeekdayDeltaPp <= 0 ? 'Giảm chặn cuối tuần' : 'Tăng chặn'}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-400">Ngày Đạt Tỷ Lệ Sạch Tốt Nhất</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-bold text-emerald-300">
                {dowSummary.lowestBlockDay}
              </span>
              <span className="text-xs tabular-nums text-emerald-400">
                ({dowSummary.lowestBlockRate.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Day-of-Week Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Thứ Trong Tuần</th>
                <th className="py-2.5 px-3">Phân loại</th>
                <th className="py-2.5 px-3 text-right">Tổng PVs</th>
                <th className="py-2.5 px-3 text-right">TB PV / Ngày</th>
                <th className="py-2.5 px-3 text-right">PV Chạy Ads</th>
                <th className="py-2.5 px-3 text-right">PV Bị Chặn</th>
                <th className="py-2.5 px-3 text-right font-bold text-white">Tỷ lệ Chặn (%)</th>
                <th className="py-2.5 px-3 text-right text-emerald-400 font-medium">Khả Dụng Ads (%)</th>
                <th className="py-2.5 px-3 text-right">vs TB Tuần (pp)</th>
                <th className="py-2.5 px-3 text-right">vs Mục tiêu (pp)</th>
                <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                <th className="py-2.5 px-3">Đặc Tính Hành Vi Độc Giả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-normal">
              {dowSummary.rows.map((row) => (
                <tr
                  key={row.dayIndex}
                  className={`transition-colors hover:bg-slate-800/40 ${
                    row.isWeekend ? 'bg-blue-950/10' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">
                    {row.dayName} ({row.shortDay})
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        row.isWeekend
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {row.isWeekend ? 'Cuối tuần' : 'Ngày làm việc'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-300 font-medium">
                    {formatNumber(row.totalPv)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-400">
                    {formatNumber(row.avgPvPerDay)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-emerald-400">
                    {formatNumber(row.canRunAdsPv)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-rose-400">
                    {formatNumber(row.blockAdsPv)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-bold text-white">
                    {row.blockRate.toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-emerald-400 font-semibold">
                    {row.canRunAdsRate.toFixed(2)}%
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right tabular-nums font-medium ${
                      row.varianceVsWeekAvgPp > 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {row.varianceVsWeekAvgPp > 0 ? '+' : ''}
                    {row.varianceVsWeekAvgPp.toFixed(2)} pp
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right tabular-nums font-semibold ${
                      row.varianceVsTargetPp <= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {row.varianceVsTargetPp <= 0 ? '≤ 0' : `+${row.varianceVsTargetPp.toFixed(2)}`} pp
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        row.isTargetMet
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : row.blockRate <= dowSummary.targetBlockRate + 1.0
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {row.isTargetMet ? 'Đạt' : 'Chưa đạt'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px] leading-tight max-w-xs">
                    {row.behaviorNote}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actionable Operating Advice from Day-of-Week */}
        <div className="mt-4 rounded-lg bg-slate-950/60 p-3.5 border border-slate-800 text-xs text-slate-300 space-y-1.5">
          <div className="font-semibold text-white flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Khuyến Nghị Điều Hành Thí Điểm Theo Thứ Trong Tuần (Tokyo &amp; Sydney):
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-400">
            <div>
              <strong className="text-slate-300">1. Từ Thứ Hai đến Thứ Năm (Cao điểm Adblock trên Desktop):</strong> Áp dụng kịch bản Anti-Adblock chủ động (thông báo popup tế nhị mời whitelist hoặc ưu tiên nạp backfill ad units không bị chặn bởi uBlock).
            </div>
            <div>
              <strong className="text-slate-300">2. Thứ Bảy và Chủ Nhật (Cơ hội Doanh thu Mobile):</strong> Tỷ lệ sạch tự nhiên đạt đỉnh (&gt; 85%), lưu lượng giải trí tăng mạnh. Khuyến nghị phân bổ các chiến dịch Direct Sales và High-CPM formats vào các khung giờ cuối tuần.
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. SECTION: BIỂU ĐỒ TIẾN ĐỘ THEO NGÀY (DAILY TARGET TRENDLINE)
         ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-md">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              <h2 className="text-base font-bold text-white">
                Biểu Đồ Tỷ Lệ Chặn Từng Ngày So Với Đường Mục Tiêu (Daily Target Trendline)
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Kiểm tra biến động từng ngày có vượt đường mục tiêu hay không ({dowSummary.marketFlag} {dowSummary.market}).
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Đạt mục tiêu (&le; {dowSummary.targetBlockRate.toFixed(2)}%)
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              Vượt mục tiêu (&gt; {dowSummary.targetBlockRate.toFixed(2)}%)
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="h-0.5 w-4 bg-emerald-400" />
              Đường Mục tiêu
            </span>
          </div>
        </div>

        {/* Bar & Trendline Canvas Representation */}
        <div className="mt-6 space-y-4">
          <div className="relative h-48 w-full flex items-end gap-1.5 px-2 pb-6 pt-2 border-b border-slate-800">
            {/* Target Line Guide */}
            <div
              className="absolute left-0 right-0 border-b-2 border-dashed border-emerald-400 z-10 pointer-events-none"
              style={{
                bottom: `${Math.min(95, Math.max(5, (dowSummary.targetBlockRate / 25) * 100))}%`,
              }}
            >
              <span className="absolute right-2 -top-4 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                Mục tiêu: {dowSummary.targetBlockRate.toFixed(2)}%
              </span>
            </div>

            {/* Baseline Guide */}
            <div
              className="absolute left-0 right-0 border-b border-dotted border-slate-500 z-10 pointer-events-none opacity-60"
              style={{
                bottom: `${(16.06 / 25) * 100}%`,
              }}
            >
              <span className="absolute left-2 -top-4 text-[10px] text-slate-400">
                Baseline: 16.06%
              </span>
            </div>

            {/* Daily Bars */}
            {dailyTrend.slice(-31).map((day) => {
              const heightPct = Math.min(100, Math.max(10, (day.blockRate / 25) * 100));
              const isHovered = activeHoverDay === day.dayString;

              return (
                <div
                  key={day.dayString}
                  onMouseEnter={() => setActiveHoverDay(day.dayString)}
                  onMouseLeave={() => setActiveHoverDay(null)}
                  className="group relative flex-1 flex flex-col items-center h-full justify-end cursor-pointer"
                >
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute -top-24 z-30 min-w-40 rounded-lg bg-slate-950 border border-slate-700 p-2 shadow-xl text-xs pointer-events-none">
                      <div className="font-semibold text-white flex justify-between">
                        <span>{day.dayOfWeekFull} ({day.displayDate})</span>
                        <span className={day.isWeekend ? 'text-purple-400' : 'text-slate-400'}>
                          {day.isWeekend ? 'Cuối tuần' : 'Trong tuần'}
                        </span>
                      </div>
                      <div className="mt-1 text-slate-300">
                        Block Rate:{' '}
                        <strong className={day.isTargetMet ? 'text-emerald-400' : 'text-rose-400'}>
                          {day.blockRate.toFixed(2)}%
                        </strong>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Lưu lượng: {formatNumber(day.totalPv)} PVs
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Khoảng cách:{' '}
                        <span className={day.gapPp <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {day.gapPp <= 0 ? 'Đạt mục tiêu' : `+${day.gapPp.toFixed(2)} pp`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Vertical Column Bar */}
                  <div
                    className={`w-full max-w-4 rounded-t transition-all ${
                      day.isTargetMet
                        ? 'bg-emerald-500/80 hover:bg-emerald-400'
                        : 'bg-rose-500/80 hover:bg-rose-400'
                    } ${isHovered ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900' : ''}`}
                    style={{ height: `${heightPct}%` }}
                  />

                  {/* Date Label Underneath */}
                  <span className="absolute -bottom-5 text-[10px] text-slate-400 whitespace-nowrap">
                    {day.dayOfWeekShort}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span>Dữ liệu thực tế 30 ngày gần nhất</span>
            <span>Trục tung: Tỷ lệ Chặn (0% - 25%)</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. SECTION: SO SÁNH ĐỐI ĐẦU (HEAD-TO-HEAD MATRIX)
         ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-md">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-400" />
              <h2 className="text-base font-bold text-white">
                Bảng So Sánh Đối Đầu Trực Diện (Head-to-Head: Nhật Bản vs Úc vs Toàn Cầu)
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Đánh giá toàn diện các tiêu chí kỹ thuật, khối lượng, độ ổn định và mức độ sẵn sàng thương mại hóa.
            </p>
          </div>

          <button
            onClick={onOpenTechDoc}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            <Info className="h-3.5 w-3.5" />
            <span>Xem Lệnh Kỹ Thuật (Tech Specs)</span>
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Thị Trường</th>
                <th className="py-2.5 px-3">Vai Trò Chiến Dịch</th>
                <th className="py-2.5 px-3 text-right">Lưu Lượng TB/Tháng</th>
                <th className="py-2.5 px-3 text-right">Tỷ Trọng OV</th>
                <th className="py-2.5 px-3 text-right">Baseline Chặn</th>
                <th className="py-2.5 px-3 text-right font-bold text-white">Tỷ lệ Chặn Hiện Tại</th>
                <th className="py-2.5 px-3 text-right">Mục Tiêu (-10%)</th>
                <th className="py-2.5 px-3 text-right">Mục Tiêu (-15%)</th>
                <th className="py-2.5 px-3 text-center">Đạt Mục Tiêu 10%</th>
                <th className="py-2.5 px-3 text-right text-blue-400 font-semibold">PV Thu Hồi Dự Kiến</th>
                <th className="py-2.5 px-3">Độ Ổn Định</th>
                <th className="py-2.5 px-3">Khiếu Nại</th>
                <th className="py-2.5 px-3">Đánh Giá Thương Mại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {headToHead.map((row) => (
                <tr
                  key={row.marketKey}
                  className={`transition-colors hover:bg-slate-800/40 ${
                    row.marketKey === 'japan'
                      ? 'bg-rose-950/10'
                      : row.marketKey === 'australia'
                      ? 'bg-blue-950/10'
                      : ''
                  }`}
                >
                  <td className="py-3 px-3 font-bold text-white whitespace-nowrap flex items-center gap-1.5">
                    <span className="text-base">{row.flag}</span>
                    <span>{row.marketName}</span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="text-slate-300 font-medium">{row.priorityTag}</span>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-slate-300 font-medium">
                    {formatCompactNumber(row.monthlyAvgPv)} PV
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-slate-400">
                    {row.shareOfTotalPvPct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-slate-400">
                    {row.baselineBlockRate.toFixed(2)}%
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold text-white">
                    {row.currentBlockRate.toFixed(2)}%
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-emerald-400 font-medium">
                    ≤ {row.targetBlockRate10.toFixed(2)}%
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-emerald-400 font-medium">
                    ≤ {row.targetBlockRate15.toFixed(2)}%
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        row.isTarget10Met
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {row.isTarget10Met ? 'Đạt chuẩn' : 'Chưa đạt'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold text-blue-400">
                    +{formatCompactNumber(row.monthlyCanRunAdsGainPv)} PV
                  </td>
                  <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                    {row.stabilityScore}
                  </td>
                  <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                    {row.complaintCount} vụ
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${
                        row.commercialReadiness === 'Sẵn sàng mở rộng'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : row.commercialReadiness === 'Đang theo dõi thí điểm'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {row.commercialReadiness}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. MODAL: DYNAMIC TARGET CUSTOMIZER (TÙY CHỈNH MỤC TIÊU ĐỘNG)
         ───────────────────────────────────────────────────────────── */}
      {isTunerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">
                  Tùy Chỉnh Mục Tiêu Thí Điểm Động (Dynamic Target Tuner)
                </h3>
              </div>
              <button
                onClick={() => setIsTunerOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tùy biến mục tiêu Block Rate (%) mong muốn cho Nhật Bản và Úc. Hệ thống sẽ ngay lập tức tính toán lại toàn bộ
              mức độ đạt mục tiêu, độ lệch (gap) và dự phóng lượng PV quảng cáo thu hồi thêm (Can Run Ads PV) theo thời gian thực.
            </p>

            {/* Japan Target Input */}
            <div className="space-y-2 rounded-lg bg-slate-950/60 p-4 border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span>🇯🇵</span>
                  <span>Mục Tiêu Block Rate Cho Nhật Bản</span>
                </label>
                <span className="text-sm font-bold tabular-nums text-purple-400">
                  {tempJpTarget.toFixed(2)}%
                </span>
              </div>
              <input
                type="range"
                min="8.0"
                max="20.0"
                step="0.05"
                value={tempJpTarget}
                onChange={(e) => setTempJpTarget(parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                <span className="text-slate-400">Chọn nhanh:</span>
                <button
                  type="button"
                  onClick={() => setTempJpTarget(14.45)}
                  className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700"
                >
                  Giảm 10% (14.45%)
                </button>
                <button
                  type="button"
                  onClick={() => setTempJpTarget(13.65)}
                  className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700"
                >
                  Giảm 15% (13.65%)
                </button>
                <button
                  type="button"
                  onClick={() => setTempJpTarget(12.5)}
                  className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700"
                >
                  Thắt chặt (12.50%)
                </button>
                <button
                  type="button"
                  onClick={() => setTempJpTarget(16.06)}
                  className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700"
                >
                  Baseline (16.06%)
                </button>
              </div>
            </div>

            {/* Australia Target Input */}
            <div className="space-y-2 rounded-lg bg-slate-950/60 p-4 border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span>🇦🇺</span>
                  <span>Mục Tiêu Block Rate Cho Úc</span>
                </label>
                <span className="text-sm font-bold tabular-nums text-blue-400">
                  {tempAuTarget.toFixed(2)}%
                </span>
              </div>
              <input
                type="range"
                min="8.0"
                max="20.0"
                step="0.05"
                value={tempAuTarget}
                onChange={(e) => setTempAuTarget(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                <span className="text-slate-400">Chọn nhanh:</span>
                <button
                  type="button"
                  onClick={() => setTempAuTarget(13.74)}
                  className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700"
                >
                  Giảm 10% (13.74%)
                </button>
                <button
                  type="button"
                  onClick={() => setTempAuTarget(12.97)}
                  className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700"
                >
                  Giảm 15% (12.97%)
                </button>
                <button
                  type="button"
                  onClick={() => setTempAuTarget(12.0)}
                  className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700"
                >
                  Thắt chặt (12.00%)
                </button>
                <button
                  type="button"
                  onClick={() => setTempAuTarget(15.26)}
                  className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700"
                >
                  Baseline (15.26%)
                </button>
              </div>
            </div>

            {/* Simulation Preview Impact */}
            <div className="rounded-lg bg-purple-950/30 border border-purple-800/40 p-3 text-xs text-purple-200 space-y-1">
              <div className="font-semibold flex items-center gap-1 text-purple-300">
                <Sparkles className="h-3.5 w-3.5" />
                Dự Phóng Tác Động Kinh Doanh (What-If Impact):
              </div>
              <p className="text-[11px] leading-relaxed text-purple-300/80">
                Nếu Nhật Bản đạt mức <strong>{tempJpTarget.toFixed(2)}%</strong> và Úc đạt mức{' '}
                <strong>{tempAuTarget.toFixed(2)}%</strong>, VnExpress OV sẽ thu hồi thêm khoảng{' '}
                <strong className="text-white">
                  +{formatCompactNumber(
                    Math.round(
                      (Math.max(0, 16.06 - tempJpTarget) / 100) * 2178000 +
                        (Math.max(0, 15.26 - tempAuTarget) / 100) * 3186000
                    )
                  )}{' '}
                  PVs quảng cáo mỗi tháng
                </strong>{' '}
                để thương mại hóa.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetCustomTargets}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Khôi phục mặc định ban đầu</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTunerOpen(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustomTargets}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 shadow-md flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Áp Dụng Mục Tiêu Mới</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

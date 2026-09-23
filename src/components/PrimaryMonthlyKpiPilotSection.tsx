import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Target,
  ShieldAlert,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  getBaselineAndJapanMonthlyKpis,
  formatNumber,
  formatCompactNumber,
} from '../services/dataService';

interface PrimaryMonthlyKpiPilotSectionProps {
  selectedMonth: number | 'all';
  activeMarket?: string;
  onSelectMonth: (month: number | 'all') => void;
  onSelectMarket: (market: string) => void;
  onOpenTechDoc?: () => void;
}

export const PrimaryMonthlyKpiPilotSection: React.FC<PrimaryMonthlyKpiPilotSectionProps> = ({
  selectedMonth,
  activeMarket,
  onSelectMonth,
  onSelectMarket,
  onOpenTechDoc,
}) => {
  const [showDetailedTable, setShowDetailedTable] = useState(false);

  const { baselineSeries, japanSeries, availableMonths, activeMonthNumber } = useMemo(() => {
    return getBaselineAndJapanMonthlyKpis(selectedMonth);
  }, [selectedMonth]);

  const activeBaseline = baselineSeries.activePoint;
  const activeJapan = japanSeries.activePoint;

  return (
    <div className="bg-white border-2 border-slate-300/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* 1. Header: Thông tin điều hành chính */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider uppercase bg-red-700 text-white shadow-2xs">
              <Sparkles className="h-3 w-3" />
              Thông tin Điều hành Chính
            </span>
            <span className="text-sm font-bold text-slate-900">
              1/ KPI Theo Tháng Baseline &amp; 2/ KPI Thí Điểm Nhật Bản
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-amber-100 text-amber-900 border border-amber-300">
              Đang xem: {activeBaseline.monthLabel}
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Giám sát trực diện hai trục cốt lõi theo chỉ đạo điều hành: Mốc chuẩn toàn bộ thị trường OV (Baseline) và Tiến độ kiểm thử tại Nhật Bản (Tăng hay Giảm theo từng tháng).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
          {/* Quick Month Switcher Pills */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
            <span className="text-[11px] text-slate-500 px-1.5 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Tháng:
            </span>
            {availableMonths.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onSelectMonth(m)}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  activeMonthNumber === m && selectedMonth !== 'all'
                    ? 'bg-[#9f224e] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
                title={`Xem số liệu Tháng ${m}`}
              >
                T{m}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onSelectMonth('all')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                selectedMonth === 'all'
                  ? 'bg-slate-800 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
              title="Tổng hợp cả kỳ T1-T9"
            >
              Cả kỳ
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowDetailedTable((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            title="Bật/tắt bảng đối chiếu 9 tháng giữa Baseline và Nhật Bản"
          >
            {showDetailedTable ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            <span>{showDetailedTable ? 'Ẩn bảng 9 tháng' : 'Bảng đối chiếu 9 tháng'}</span>
          </button>

          {onOpenTechDoc && (
            <button
              type="button"
              onClick={onOpenTechDoc}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#9f224e] hover:bg-rose-50 transition-colors cursor-pointer"
              title="Xem đặc tả kỹ thuật và tiêu chuẩn KPI"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Chuẩn KPI Tech</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Hai Khối KPI Trọng Tâm: 1/ Baseline vs 2/ Nhật Bản */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ============================================================ */}
        {/* KHỐI 1: KPI THEO THÁNG CỦA BASELINE (TOÀN BỘ THỊ TRƯỜNG OV)   */}
        {/* ============================================================ */}
        <div className="rounded-xl border-2 border-slate-300 bg-gradient-to-b from-slate-50/70 via-white to-white p-4 shadow-xs relative flex flex-col justify-between">
          <div className="space-y-3">
            {/* Card Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌐</span>
                  <span className="text-sm font-black uppercase tracking-wide text-slate-900">
                    1/ KPI Theo Tháng của Baseline
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  Toàn bộ thị trường Hải ngoại (All OV) — Chuẩn hóa T7-T8/2026
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                  Mốc Baseline: 14.80%
                </span>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  MT an toàn: ≤ 13.32%
                </div>
              </div>
            </div>

            {/* Chỉ số chính tháng đang xem */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold">Block Rate ({activeBaseline.monthLabel}):</span>
                <span className="text-[11px] text-slate-500">
                  Can Run Ads: <strong className="text-slate-800 font-mono">{formatCompactNumber(activeBaseline.canRunAdsPv)}</strong> PV
                </span>
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-950">
                    {activeBaseline.blockRate.toFixed(2)}%
                  </span>

                  {/* Badge TĂNG hay GIẢM */}
                  {baselineSeries.comparisonWithPrevMonth ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black ${
                        baselineSeries.comparisonWithPrevMonth.isBlockRateIncreased
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {baselineSeries.comparisonWithPrevMonth.isBlockRateIncreased ? (
                        <>
                          <TrendingUp className="h-3.5 w-3.5 text-rose-700" />
                          <span>TĂNG +{Math.abs(baselineSeries.comparisonWithPrevMonth.blockRateDiffPp).toFixed(2)} pp</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3.5 w-3.5 text-emerald-700" />
                          <span>GIẢM -{Math.abs(baselineSeries.comparisonWithPrevMonth.blockRateDiffPp).toFixed(2)} pp</span>
                        </>
                      )}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">Tháng khởi điểm</span>
                  )}
                </div>

                <div className="text-right text-xs">
                  <div className="text-slate-500">So với Baseline 14.80%:</div>
                  <div
                    className={`font-black font-mono text-sm ${
                      activeBaseline.vsBaselineDiffPp <= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {activeBaseline.vsBaselineDiffPp <= 0
                      ? `↘ GIẢM ${Math.abs(activeBaseline.vsBaselineDiffPp).toFixed(2)} pp`
                      : `↗ TĂNG +${activeBaseline.vsBaselineDiffPp.toFixed(2)} pp`}
                  </div>
                </div>
              </div>

              {/* Nhận xét điều hành */}
              <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  {activeBaseline.blockRate <= baselineSeries.targetBlockRate10 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  )}
                  <span>{baselineSeries.summaryText}</span>
                </span>
                <span className="text-[10px] font-bold text-slate-500 shrink-0">
                  {activeBaseline.blockRate <= baselineSeries.targetBlockRate10 ? '✓ Đạt mục tiêu -10%' : 'Chưa đạt -10%'}
                </span>
              </div>
            </div>

            {/* Dải diễn biến 9 tháng của Baseline (T1 -> T9) */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                <span>Diễn biến Block Rate từng tháng (T1 – T9)</span>
                <span className="text-[10px] font-normal text-slate-400">Click tháng để lọc</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
                {baselineSeries.points.map((pt) => {
                  const isSelected = pt.month === activeBaseline.month;
                  return (
                    <button
                      key={pt.month}
                      type="button"
                      onClick={() => onSelectMonth(pt.month)}
                      className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-400 shadow-xs'
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-2xs'
                      }`}
                      title={`Tháng ${pt.month}: Block Rate ${pt.blockRate.toFixed(2)}%`}
                    >
                      <div className="text-[10px] font-bold opacity-80">T{pt.month}</div>
                      <div className="text-xs font-black font-mono my-0.5">
                        {pt.blockRate.toFixed(1)}%
                      </div>
                      <div className="text-[9px] font-semibold">
                        {pt.momBlockRateDiffPp === null ? (
                          <span className="text-slate-400">—</span>
                        ) : pt.isBlockRateIncreased ? (
                          <span className={isSelected ? 'text-rose-300' : 'text-rose-700'}>
                            ↗ +{pt.momBlockRateDiffPp.toFixed(1)}
                          </span>
                        ) : (
                          <span className={isSelected ? 'text-emerald-300' : 'text-emerald-700'}>
                            ↘ {pt.momBlockRateDiffPp.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Xu hướng Baseline T6-T9: <strong className="text-emerald-700">GIẢM LIÊN TỤC (-2.94 pp)</strong>
            </span>
            <button
              type="button"
              onClick={() => onSelectMarket('all')}
              className="font-bold text-[#9f224e] hover:underline cursor-pointer"
            >
              Xem toàn bộ OV →
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* KHỐI 2: KPI CỦA NHẬT BẢN THEO THÁNG (THÍ ĐIỂM - PILOT)       */}
        {/* ============================================================ */}
        <div className="rounded-xl border-2 border-rose-300 bg-gradient-to-b from-rose-50/50 via-white to-white p-4 shadow-xs relative flex flex-col justify-between">
          <div className="space-y-3">
            {/* Card Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🇯🇵</span>
                  <span className="text-sm font-black uppercase tracking-wide text-slate-900">
                    2/ KPI của Nhật Bản Theo Tháng
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-700 text-white uppercase shadow-2xs">
                    Thí điểm
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  Thị trường kiểm thử trọng điểm (Pilot Phase 1) — Theo dõi riêng biệt
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-300">
                  Mốc Baseline: 16.06%
                </span>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  MT Thí điểm: ≤ 14.45%
                </div>
              </div>
            </div>

            {/* Chỉ số chính tháng đang xem của Nhật */}
            <div className="p-3.5 rounded-xl bg-white border border-rose-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold">Block Rate Nhật ({activeJapan.monthLabel}):</span>
                <span className="text-[11px] text-slate-500">
                  Can Run Ads: <strong className="text-slate-800 font-mono">{formatCompactNumber(activeJapan.canRunAdsPv)}</strong> PV
                </span>
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-950">
                    {activeJapan.blockRate.toFixed(2)}%
                  </span>

                  {/* Badge TĂNG hay GIẢM */}
                  {japanSeries.comparisonWithPrevMonth ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black ${
                        japanSeries.comparisonWithPrevMonth.isBlockRateIncreased
                          ? 'bg-rose-100 text-rose-800 border border-rose-300 ring-1 ring-rose-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {japanSeries.comparisonWithPrevMonth.isBlockRateIncreased ? (
                        <>
                          <TrendingUp className="h-3.5 w-3.5 text-rose-700" />
                          <span>TĂNG +{Math.abs(japanSeries.comparisonWithPrevMonth.blockRateDiffPp).toFixed(2)} pp</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3.5 w-3.5 text-emerald-700" />
                          <span>GIẢM -{Math.abs(japanSeries.comparisonWithPrevMonth.blockRateDiffPp).toFixed(2)} pp</span>
                        </>
                      )}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">Tháng khởi điểm</span>
                  )}
                </div>

                <div className="text-right text-xs">
                  <div className="text-slate-500">So với Baseline Nhật 16.06%:</div>
                  <div
                    className={`font-black font-mono text-sm ${
                      activeJapan.vsBaselineDiffPp <= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {activeJapan.vsBaselineDiffPp <= 0
                      ? `↘ GIẢM ${Math.abs(activeJapan.vsBaselineDiffPp).toFixed(2)} pp`
                      : `↗ TĂNG +${activeJapan.vsBaselineDiffPp.toFixed(2)} pp`}
                  </div>
                </div>
              </div>

              {/* Nhận xét điều hành thí điểm */}
              <div className="mt-2 pt-2 border-t border-rose-100 text-xs text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>{japanSeries.summaryText}</span>
                </span>
                <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 shrink-0">
                  {activeJapan.blockRate <= japanSeries.targetBlockRate10 ? '✓ Đạt mục tiêu thí điểm' : 'Cần can thiệp gỡ chặn'}
                </span>
              </div>
            </div>

            {/* Dải diễn biến 9 tháng của Nhật Bản (T1 -> T9) */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                <span>Diễn biến Block Rate Nhật Bản từng tháng (T1 – T9)</span>
                <span className="text-[10px] font-normal text-slate-400">Click tháng để lọc</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
                {japanSeries.points.map((pt) => {
                  const isSelected = pt.month === activeJapan.month;
                  return (
                    <button
                      key={pt.month}
                      type="button"
                      onClick={() => onSelectMonth(pt.month)}
                      className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-rose-750 bg-[#9f224e] text-white border-rose-800 ring-2 ring-rose-300 shadow-xs'
                          : 'bg-white hover:bg-rose-50 border-rose-200 text-slate-700 shadow-2xs'
                      }`}
                      title={`Nhật Bản Tháng ${pt.month}: Block Rate ${pt.blockRate.toFixed(2)}%`}
                    >
                      <div className="text-[10px] font-bold opacity-80">T{pt.month}</div>
                      <div className="text-xs font-black font-mono my-0.5">
                        {pt.blockRate.toFixed(1)}%
                      </div>
                      <div className="text-[9px] font-semibold">
                        {pt.momBlockRateDiffPp === null ? (
                          <span className="text-slate-400">—</span>
                        ) : pt.isBlockRateIncreased ? (
                          <span className={isSelected ? 'text-rose-200' : 'text-rose-700'}>
                            ↗ +{pt.momBlockRateDiffPp.toFixed(1)}
                          </span>
                        ) : (
                          <span className={isSelected ? 'text-emerald-200' : 'text-emerald-700'}>
                            ↘ {pt.momBlockRateDiffPp.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-rose-200 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              Cảnh báo thí điểm: <strong className="text-rose-700">Tỷ lệ chặn T6-T9 tăng (+2.83 pp)</strong>
            </span>
            <button
              type="button"
              onClick={() => onSelectMarket('Japan')}
              className="inline-flex items-center gap-1 font-bold text-rose-700 hover:text-rose-900 cursor-pointer"
            >
              <span>Lọc riêng Nhật Bản</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Bảng Đối Chiếu 9 Tháng Giữa Baseline OV & Nhật Bản (Khi người dùng bấm mở) */}
      {showDetailedTable && (
        <div className="pt-3 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Bảng Đối Chiếu Diễn Biến 9 Tháng (Baseline Toàn bộ OV vs. Thí Điểm Nhật Bản)
            </span>
            <span className="text-[11px] text-slate-500">
              * Tăng = Block rate tăng (bị chặn nhiều hơn). Giảm = Block rate giảm (gỡ chặn thành công).
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Tháng</th>
                  <th className="py-2.5 px-3 text-right">Baseline OV: Block Rate</th>
                  <th className="py-2.5 px-3 text-center">Xu hướng Baseline (MoM)</th>
                  <th className="py-2.5 px-3 text-right">Nhật Bản: Block Rate</th>
                  <th className="py-2.5 px-3 text-center">Xu hướng Nhật Bản (MoM)</th>
                  <th className="py-2.5 px-3 text-right">Chênh lệch (Nhật vs OV)</th>
                  <th className="py-2.5 px-3 text-center">Đánh giá Thí điểm Nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {baselineSeries.points.map((basePt, idx) => {
                  const jpPt = japanSeries.points[idx];
                  const diffJpVsBase = jpPt ? jpPt.blockRate - basePt.blockRate : 0;
                  const isCurrent = basePt.month === activeBaseline.month;

                  return (
                    <tr
                      key={basePt.month}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCurrent ? 'bg-amber-50/60 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-sans font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{basePt.monthLabel}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-200 text-amber-950">
                              Đang chọn
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Baseline Block Rate */}
                      <td className="py-2 px-3 text-right text-slate-900 font-bold">
                        {basePt.blockRate.toFixed(2)}%
                      </td>

                      {/* Baseline MoM */}
                      <td className="py-2 px-3 text-center font-sans">
                        {basePt.momBlockRateDiffPp === null ? (
                          <span className="text-slate-400 text-[11px]">—</span>
                        ) : basePt.isBlockRateIncreased ? (
                          <span className="inline-flex items-center gap-0.5 text-rose-700 text-[11px] font-bold">
                            <TrendingUp className="h-3 w-3" /> TĂNG +{basePt.momBlockRateDiffPp.toFixed(2)} pp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-emerald-700 text-[11px] font-bold">
                            <TrendingDown className="h-3 w-3" /> GIẢM {basePt.momBlockRateDiffPp.toFixed(2)} pp
                          </span>
                        )}
                      </td>

                      {/* Japan Block Rate */}
                      <td className="py-2 px-3 text-right text-rose-950 font-bold">
                        {jpPt?.blockRate.toFixed(2)}%
                      </td>

                      {/* Japan MoM */}
                      <td className="py-2 px-3 text-center font-sans">
                        {jpPt?.momBlockRateDiffPp === null ? (
                          <span className="text-slate-400 text-[11px]">—</span>
                        ) : jpPt?.isBlockRateIncreased ? (
                          <span className="inline-flex items-center gap-0.5 text-rose-700 text-[11px] font-bold">
                            <TrendingUp className="h-3 w-3" /> TĂNG +{jpPt.momBlockRateDiffPp.toFixed(2)} pp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-emerald-700 text-[11px] font-bold">
                            <TrendingDown className="h-3 w-3" /> GIẢM {jpPt.momBlockRateDiffPp.toFixed(2)} pp
                          </span>
                        )}
                      </td>

                      {/* Difference */}
                      <td
                        className={`py-2 px-3 text-right font-bold ${
                          diffJpVsBase > 0 ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {diffJpVsBase > 0 ? `+${diffJpVsBase.toFixed(2)} pp` : `${diffJpVsBase.toFixed(2)} pp`}
                      </td>

                      {/* Evaluation */}
                      <td className="py-2 px-3 text-center font-sans">
                        {jpPt && jpPt.blockRate <= japanSeries.targetBlockRate10 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            Đạt KPI ≤ 14.45%
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                            Cao hơn mục tiêu (+{(jpPt ? jpPt.blockRate - japanSeries.targetBlockRate10 : 0).toFixed(2)} pp)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

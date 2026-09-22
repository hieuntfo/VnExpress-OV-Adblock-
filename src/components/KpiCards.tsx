import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  Eye,
  CheckCircle2,
  AlertCircle,
  Info,
  Award,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { ExecutiveKpiSummary } from '../types';
import { formatNumber, formatCompactNumber } from '../services/dataService';
import { MetricKey } from './MetricFormulaModal';

interface KpiCardsProps {
  summary: ExecutiveKpiSummary;
  onOpenFormula?: (metric: MetricKey) => void;
  onOpenTechDoc?: () => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  summary,
  onOpenFormula,
  onOpenTechDoc,
}) => {
  const isAttained = summary.kpiGap >= 0;
  const isBlockRateBetter = summary.blockRateChangePp <= 0;

  return (
    <div className="space-y-3">
      {/* Visual Header / Banner for 2 Core Order Tech KPIs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            2 Chỉ số KPI Cốt lõi (AdBlock OV Order Tech 22/09/2026)
          </span>
          <span className="text-[11px] font-medium text-slate-500 hidden md:inline">
            — Baseline T7-T8/2026 chuẩn hóa
          </span>
        </div>
        {onOpenTechDoc && (
          <button
            type="button"
            onClick={onOpenTechDoc}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9f224e] hover:text-[#7f183c] hover:underline cursor-pointer transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Xem Spec KPI & Kế hoạch Quốc gia (Order Tech) →
          </button>
        )}
      </div>

      {/* Grid of KPI Cards - 2 Core KPIs placed FIRST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* ============================================================ */}
        {/* CARD 1: KPI #1 — BLOCK RATE (TỶ LỆ BỊ CHẶN QUẢNG CÁO) */}
        {/* ============================================================ */}
        <div className="bg-gradient-to-b from-rose-50/40 via-white to-white border-2 border-rose-600/30 hover:border-rose-600/50 rounded-xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between group transition-all">
          <div className="absolute top-0 right-0 bg-[#9f224e] text-white text-[9px] font-black px-2 py-0.5 rounded-bl tracking-wider flex items-center gap-1">
            <Award className="h-2.5 w-2.5" />
            KPI #1 CHÍNH THỨC
          </div>

          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold tracking-wide uppercase text-rose-950">
                  Block Rate (%)
                </span>
                <button
                  type="button"
                  onClick={() => onOpenFormula?.('blockRate')}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Bấm để xem công thức tính KPI #1 Block Rate"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mt-0.5">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {summary.blockRate.toFixed(2)}%
              </div>
              <span
                className={`text-xs font-bold inline-flex items-center gap-0.5 ${
                  summary.blockRateReductionPct >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
                title={`Mức giảm so với baseline T7-T8 (${summary.baselineBlockRate.toFixed(2)}%)`}
              >
                {summary.blockRateReductionPct >= 0 ? (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                )}
                {summary.blockRateReductionPct >= 0 ? '-' : '+'}
                {Math.abs(summary.blockRateReductionPct).toFixed(1)}% vs base
              </span>
            </div>

            {/* Target benchmarks comparison */}
            <div className="mt-2 space-y-1 text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Baseline T7-T8:</span>
                <span className="font-semibold text-slate-800">{summary.baselineBlockRate.toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between font-bold text-rose-900">
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-rose-600" />
                  Mục tiêu giảm ≥15%:
                </span>
                <span className="font-mono">≤ {summary.targetBlockRate15.toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Mốc an toàn (-10%):</span>
                <span>≤ {summary.targetBlockRate10.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-rose-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Đánh giá:</span>
            <span
              className={`font-bold inline-flex items-center gap-1 text-[11px] ${
                summary.isBlockRate15Attained
                  ? 'text-emerald-700'
                  : summary.isBlockRate10Attained
                  ? 'text-teal-700'
                  : 'text-rose-700'
              }`}
            >
              {summary.isBlockRate15Attained ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Đạt Target -15%
                </>
              ) : summary.isBlockRate10Attained ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Đạt mốc -10%
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5" />
                  Thiếu {(summary.blockRate - summary.targetBlockRate15).toFixed(2)} pp
                </>
              )}
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CARD 2: KPI #2 — KPI ATTAINMENT (TỶ LỆ ĐẠT TARGET +10%) */}
        {/* ============================================================ */}
        <div className="bg-gradient-to-b from-emerald-50/30 via-white to-white border-2 border-emerald-600/30 hover:border-emerald-600/50 rounded-xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between group transition-all">
          <div className="absolute top-0 right-0 bg-emerald-700 text-white text-[9px] font-black px-2 py-0.5 rounded-bl tracking-wider flex items-center gap-1">
            <Target className="h-2.5 w-2.5" />
            KPI #2 TARGET +10%
          </div>

          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold tracking-wide uppercase text-emerald-950">
                  KPI Attainment
                </span>
                <button
                  type="button"
                  onClick={() => onOpenFormula?.('kpiAttainment')}
                  className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                  title="Bấm để xem công thức tính KPI #2 Attainment"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mt-0.5">
              <div
                className={`text-2xl font-black tracking-tight ${
                  summary.isAttainment10Attained
                    ? 'text-emerald-700'
                    : summary.kpiAttainmentVsBaselineTarget >= 90
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}
              >
                {summary.kpiAttainmentVsBaselineTarget.toFixed(1)}%
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Target ≥ 100%
              </span>
            </div>

            {/* Target benchmarks comparison */}
            <div className="mt-2 space-y-1 text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Baseline Run Ads:</span>
                <span className="font-semibold text-slate-800">{formatCompactNumber(summary.baselineRunAds)}</span>
              </div>
              <div className="flex items-center justify-between font-bold text-emerald-900">
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-emerald-600" />
                  Target (+10%):
                </span>
                <span className="font-mono">≥ {formatCompactNumber(summary.targetRunAds10)}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Thực tế Run Ads:</span>
                <span className="font-bold text-slate-900">{formatCompactNumber(summary.canRunAdsPv)}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-emerald-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Trạng thái:</span>
            <span
              className={`font-bold inline-flex items-center gap-1 text-[11px] ${
                summary.isAttainment10Attained ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {summary.isAttainment10Attained ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Vượt Target +10%
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5" />
                  Thiếu {formatCompactNumber(Math.max(0, summary.targetRunAds10 - summary.canRunAdsPv))}
                </>
              )}
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CARD 3: CAN RUN ADS PV (PVS CHẠY QUẢNG CÁO THỰC TẾ) */}
        {/* ============================================================ */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold tracking-wide uppercase text-slate-600">
                Can Run Ads PV
              </span>
              <button
                type="button"
                onClick={() => onOpenFormula?.('canRunAdsPv')}
                className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                title="Bấm để xem công thức tính Can Run Ads PV"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatCompactNumber(summary.canRunAdsPv)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Tỷ lệ: <span className="font-bold text-slate-900">{summary.canRunAdsRate.toFixed(2)}%</span> tổng PV
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              {formatNumber(summary.canRunAdsPv)} PVs
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">So kỳ trước:</span>
            <span
              className={`inline-flex items-center gap-0.5 font-bold ${
                summary.canRunAdsChangePct >= 0 ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {summary.canRunAdsChangePct >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {summary.canRunAdsChangePct >= 0 ? '+' : ''}
              {summary.canRunAdsChangePct.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CARD 4: BLOCK ADS PV (PVS BỊ CHẶN QUẢNG CÁO) */}
        {/* ============================================================ */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold tracking-wide uppercase text-slate-600">
                Block Ads PV
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onOpenFormula?.('blockAdsPv')}
                  className="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                  title="Bấm để xem công thức tính Block Ads PV"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatCompactNumber(summary.blockAdsPv)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Thất thoát: <span className="font-bold text-rose-700">{summary.blockRate.toFixed(2)}%</span> PV
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              {formatNumber(summary.blockAdsPv)} PVs
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">So kỳ trước:</span>
            <span
              className={`inline-flex items-center gap-0.5 font-bold ${
                summary.blockAdsChangePct <= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {summary.blockAdsChangePct <= 0 ? (
                <TrendingDown className="h-3.5 w-3.5" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5" />
              )}
              {summary.blockAdsChangePct > 0 ? '+' : ''}
              {summary.blockAdsChangePct.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CARD 5: TOTAL PAGEVIEWS (TỔNG LƯỢT XEM TRANG) */}
        {/* ============================================================ */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold tracking-wide uppercase text-slate-600">
                Total Pageviews
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onOpenFormula?.('totalPageviews')}
                  className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Bấm để xem công thức tính Total Pageviews"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
                <Eye className="h-3.5 w-3.5 text-slate-300" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatCompactNumber(summary.totalPageviews)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              {formatNumber(summary.totalPageviews)} PVs
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 truncate" title={summary.comparisonTitle}>
              {summary.comparisonTitle}
            </span>
            <span
              className={`inline-flex items-center gap-0.5 font-bold ${
                summary.totalPvChangePct >= 0 ? 'text-emerald-700' : 'text-slate-600'
              }`}
            >
              {summary.totalPvChangePct >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {summary.totalPvChangePct >= 0 ? '+' : ''}
              {summary.totalPvChangePct.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CARD 6: KPI GAP (THỪA / THIẾU PV RUN ADS) */}
        {/* ============================================================ */}
        <div
          className={`rounded-xl p-4 shadow-xs border transition-all flex flex-col justify-between group ${
            isAttained
              ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
              : 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold tracking-wide uppercase text-slate-700">
                KPI Gap (Thừa / Thiếu)
              </span>
              <button
                type="button"
                onClick={() => onOpenFormula?.('kpiGap')}
                className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-white/60 transition-colors cursor-pointer"
                title="Bấm để xem công thức tính KPI Gap"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>
            <div
              className={`text-2xl font-extrabold tracking-tight ${
                isAttained ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              {summary.kpiGap > 0 ? '+' : ''}
              {formatCompactNumber(summary.kpiGap)}
            </div>
            <div className="text-[11px] font-mono mt-0.5 text-slate-600">
              {formatNumber(Math.abs(summary.kpiGap))} PV
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs font-medium">
            <span className="text-slate-600">Đánh giá:</span>
            <span className={isAttained ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
              {isAttained ? 'Đã bù đắp xong KPI' : 'Cần thu hẹp khoảng cách'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

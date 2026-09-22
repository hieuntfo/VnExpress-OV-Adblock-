import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ExecutiveKpiSummary } from '../types';
import { formatNumber, formatCompactNumber, formatPercent } from '../services/dataService';

interface KpiCardsProps {
  summary: ExecutiveKpiSummary;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ summary }) => {
  const isAttained = summary.kpiGap >= 0;
  const isBlockRateBetter = summary.blockRateChangePp <= 0; // Negative change in block rate is good

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {/* 1. Total Pageviews */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">
              Total Pageviews
            </span>
            <Eye className="h-4 w-4 text-slate-400" />
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

      {/* 2. Can Run Ads PV (CORE KPI) */}
      <div className="bg-white border-2 border-red-600/30 rounded-xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 bg-red-700 text-white text-[9px] font-black px-2 py-0.5 rounded-bl tracking-wider">
          CORE KPI
        </div>
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold tracking-wide uppercase text-red-900">
              Can Run Ads PV
            </span>
          </div>
          <div className="text-2xl font-black text-red-900 tracking-tight">
            {formatCompactNumber(summary.canRunAdsPv)}
          </div>
          <div className="text-[11px] text-slate-600 font-medium mt-0.5">
            Tỷ lệ: <span className="font-bold text-slate-900">{summary.canRunAdsRate.toFixed(2)}%</span> PV
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Mục tiêu: {formatCompactNumber(summary.kpiTarget)}</span>
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

      {/* 3. Block Ads PV (Lower is better) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">
              Block Ads PV
            </span>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatCompactNumber(summary.blockAdsPv)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            {formatNumber(summary.blockAdsPv)} PVs
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Kỳ trước:</span>
          {/* Note: In Block Ads, decreasing is positive (green), increasing is negative (red) */}
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

      {/* 4. Block Rate (%) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">
              Block Rate
            </span>
            <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
              Càng thấp càng tốt
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {summary.blockRate.toFixed(2)}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden flex">
            <div
              className="bg-emerald-600 h-full"
              style={{ width: `${Math.min(100, summary.canRunAdsRate)}%` }}
              title={`Can Run Ads: ${summary.canRunAdsRate.toFixed(1)}%`}
            />
            <div
              className="bg-rose-500 h-full"
              style={{ width: `${Math.min(100, summary.blockRate)}%` }}
              title={`Block Ads: ${summary.blockRate.toFixed(1)}%`}
            />
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Chênh lệch:</span>
          <span
            className={`font-bold inline-flex items-center gap-0.5 ${
              isBlockRateBetter ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {summary.blockRateChangePp > 0 ? '+' : ''}
            {summary.blockRateChangePp.toFixed(2)} pp
          </span>
        </div>
      </div>

      {/* 5. KPI Attainment */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">
              KPI Attainment
            </span>
            <Target className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-extrabold tracking-tight ${
                summary.kpiAttainment >= 100
                  ? 'text-emerald-700'
                  : summary.kpiAttainment >= 80
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}
            >
              {summary.kpiAttainment.toFixed(1)}%
            </span>
          </div>

          {/* Progress bar with 100% threshold */}
          <div className="relative w-full bg-slate-100 rounded-full h-2 mt-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                summary.kpiAttainment >= 100
                  ? 'bg-emerald-600'
                  : summary.kpiAttainment >= 80
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, summary.kpiAttainment)}%` }}
            />
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Trạng thái:</span>
          <span
            className={`font-semibold inline-flex items-center gap-1 ${
              summary.kpiAttainment >= 100 ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {summary.kpiAttainment >= 100 ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" /> Vượt KPI
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5" /> Chưa đạt
              </>
            )}
          </span>
        </div>
      </div>

      {/* 6. KPI Gap */}
      <div
        className={`rounded-xl p-4 shadow-xs border transition-all flex flex-col justify-between ${
          isAttained
            ? 'bg-emerald-50/50 border-emerald-200'
            : 'bg-rose-50/40 border-rose-200'
        }`}
      >
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-700">
              KPI Gap (Thừa / Thiếu)
            </span>
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
            {isAttained ? 'Đã đảm bảo KPI' : 'Cần bù đắp KPI'}
          </span>
        </div>
      </div>
    </div>
  );
};

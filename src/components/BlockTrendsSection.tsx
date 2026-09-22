import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { ShieldAlert, TrendingDown, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { NormalizedFolderRecord } from '../types';
import { formatNumber, formatCompactNumber, formatPercent } from '../services/dataService';

interface BlockTrendsSectionProps {
  folders: NormalizedFolderRecord[];
}

export const BlockTrendsSection: React.FC<BlockTrendsSectionProps> = ({ folders }) => {
  // Aggregate by month (Months 1 to 9)
  const monthlyData = useMemo(() => {
    const monthMap = new Map<
      number,
      {
        month: number;
        pvs: number;
        pvsRunAds: number;
        blockAds: number;
      }
    >();

    folders.forEach((r) => {
      const existing = monthMap.get(r.month) || {
        month: r.month,
        pvs: 0,
        pvsRunAds: 0,
        blockAds: 0,
      };
      existing.pvs += r.pvs;
      existing.pvsRunAds += r.pvsRunAds;
      existing.blockAds += r.blockAds;
      monthMap.set(r.month, existing);
    });

    return Array.from(monthMap.values())
      .sort((a, b) => a.month - b.month)
      .map((item, idx, arr) => {
        const blockRate = item.pvs > 0 ? (item.blockAds / item.pvs) * 100 : 0;
        const runAdsRate = item.pvs > 0 ? (item.pvsRunAds / item.pvs) * 100 : 0;

        // MoM changes
        const prev = idx > 0 ? arr[idx - 1] : null;
        const prevBlockRate = prev && prev.pvs > 0 ? (prev.blockAds / prev.pvs) * 100 : null;
        const blockRateChangePp = prevBlockRate !== null ? blockRate - prevBlockRate : null;

        return {
          month: item.month,
          monthLabel: `Tháng ${item.month}`,
          pvs: item.pvs,
          pvsRunAds: item.pvsRunAds,
          blockAds: item.blockAds,
          blockRate,
          runAdsRate,
          blockRateChangePp,
        };
      });
  }, [folders]);

  // Overall key findings for Block Ads & Can Run Ads
  const latestMonth = monthlyData[monthlyData.length - 1]; // Month 9 (MTD)
  const prevMonth = monthlyData[monthlyData.length - 2]; // Month 8
  const peakBlockMonth = [...monthlyData].sort((a, b) => b.blockAds - a.blockAds)[0];
  const lowestBlockRateMonth = [...monthlyData].sort((a, b) => a.blockRate - b.blockRate)[0];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-700" />
              Diễn biến Xu hướng Block Ads & Can Run Ads qua từng Tháng (T1 - T9/2026)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mục tiêu điều hành cốt lõi: Tăng trưởng lượng Can Run Ads PV và kéo giảm tối đa tỷ lệ Block Rate.
          </p>
        </div>

        {/* Quick trend summary chips */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
            Tháng đỉnh Block: <strong>{peakBlockMonth?.monthLabel}</strong> ({formatCompactNumber(peakBlockMonth?.blockAds)} PV)
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
            Tỷ lệ Block thấp nhất: <strong>{lowestBlockRateMonth?.monthLabel}</strong> ({lowestBlockRateMonth?.blockRate.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Two Responsive Trend Charts Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Block Ads PV & Block Rate % */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                1. Khối lượng Block Ads & Tỷ lệ Block Rate (%)
              </h4>
              <span className="text-[11px] text-slate-500">Mục tiêu: Kéo giảm cả số lượng lẫn tỷ lệ %</span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-mono">
              Tháng 9: {latestMonth?.blockRate.toFixed(2)}%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => formatCompactNumber(val)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 30]}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-lg text-xs font-mono shadow-xl border border-slate-700 space-y-1">
                          <div className="font-bold border-b border-slate-800 pb-1 mb-1 text-slate-200">
                            {d.monthLabel}/2026
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Block Ads PV:</span>
                            <span className="font-bold text-rose-400">{formatNumber(d.blockAds)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Block Rate:</span>
                            <span className="font-bold text-amber-300">{d.blockRate.toFixed(2)}%</span>
                          </div>
                          {d.blockRateChangePp !== null && (
                            <div className="flex justify-between gap-4 pt-1 border-t border-slate-800">
                              <span className="text-slate-400">So với tháng trước:</span>
                              <span
                                className={`font-bold ${
                                  d.blockRateChangePp <= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {d.blockRateChangePp > 0 ? '+' : ''}
                                {d.blockRateChangePp.toFixed(2)} pp
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="blockAds"
                  name="Block Ads PV"
                  fill="#E11D48"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={28}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="blockRate"
                  name="Block Rate (%)"
                  stroke="#D97706"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#D97706' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Can Run Ads PV & Run Ads Rate % */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                2. Can Run Ads PV & Tỷ lệ Cho phép hiển thị Ads (%)
              </h4>
              <span className="text-[11px] text-slate-500">Mục tiêu: Đạt tỷ lệ Run Ads cao nhất có thể</span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
              Tháng 9: {latestMonth?.runAdsRate.toFixed(2)}%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => formatCompactNumber(val)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[70, 100]}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-lg text-xs font-mono shadow-xl border border-slate-700 space-y-1">
                          <div className="font-bold border-b border-slate-800 pb-1 mb-1 text-slate-200">
                            {d.monthLabel}/2026
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Can Run Ads PV:</span>
                            <span className="font-bold text-emerald-400">{formatNumber(d.pvsRunAds)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Run Ads Rate:</span>
                            <span className="font-bold text-blue-300">{d.runAdsRate.toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Tổng PV:</span>
                            <span className="text-white">{formatNumber(d.pvs)}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="pvsRunAds"
                  name="Can Run Ads PV"
                  fill="#059669"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={28}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="runAdsRate"
                  name="Can Run Ads Rate (%)"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#2563EB' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

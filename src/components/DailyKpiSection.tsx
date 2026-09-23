import React, { useState, useMemo } from 'react';
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
  ReferenceLine,
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Maximize2,
  Filter,
} from 'lucide-react';
import { NormalizedDateRecord } from '../types';
import { formatNumber, formatCompactNumber, formatPercent, formatDateVi } from '../services/dataService';

interface DailyKpiSectionProps {
  dates: NormalizedDateRecord[];
  onSelectDay: (record: NormalizedDateRecord) => void;
}

export const DailyKpiSection: React.FC<DailyKpiSectionProps> = ({ dates, onSelectDay }) => {
  // Sorted recorded days with actual pageviews
  const recordedDays = useMemo(() => {
    return dates.filter((d) => d.pageview !== null).sort((a, b) => a.timestamp - b.timestamp);
  }, [dates]);

  const todayRecord = recordedDays.length > 0 ? recordedDays[recordedDays.length - 1] : null;
  const yesterdayRecord = recordedDays.length > 1 ? recordedDays[recordedDays.length - 2] : null;

  const latestMonth = todayRecord ? todayRecord.month : 9;
  const prevMonth = Math.max(1, latestMonth - 1);

  const [timeZoom, setTimeZoom] = useState<'all' | 'last30' | 'last60' | 'latest_m' | 'prev_m'>('all');
  const [showActual, setShowActual] = useState(true);
  const [showTarget, setShowTarget] = useState(true);
  const [showMa7, setShowMa7] = useState(true);

  // Compute 7-day moving average and filter by selected zoom
  const chartData = useMemo(() => {
    // Sort dates ascending
    const sorted = [...dates].sort((a, b) => a.timestamp - b.timestamp);

    // Compute moving average for recorded actual pageviews
    const withMa = sorted.map((item, idx) => {
      let ma7: number | null = null;
      if (item.pageview !== null) {
        let sum = 0;
        let count = 0;
        for (let j = Math.max(0, idx - 6); j <= idx; j++) {
          if (sorted[j].pageview !== null) {
            sum += sorted[j].pageview!;
            count++;
          }
        }
        ma7 = count > 0 ? Math.round(sum / count) : null;
      }

      return {
        ...item,
        dateFormatted: `${item.dayString.slice(8, 10)}/${item.dayString.slice(5, 7)}`,
        ma7,
        attainment:
          item.pageview !== null && item.kpiTarget > 0
            ? (item.pageview / item.kpiTarget) * 100
            : null,
      };
    });

    if (timeZoom === 'latest_m') {
      return withMa.filter((d) => d.month === latestMonth);
    }
    if (timeZoom === 'prev_m') {
      return withMa.filter((d) => d.month === prevMonth);
    }
    if (timeZoom === 'last30') {
      const recorded = withMa.filter((d) => d.pageview !== null);
      const cutoff = recorded.slice(-30);
      return cutoff;
    }
    if (timeZoom === 'last60') {
      const recorded = withMa.filter((d) => d.pageview !== null);
      return recorded.slice(-60);
    }

    return withMa;
  }, [dates, timeZoom, latestMonth, prevMonth]);

  const mtdStats = useMemo(() => {
    const latestMonthDays = recordedDays.filter((d) => d.month === latestMonth);
    const actualCum = latestMonthDays.reduce((acc, d) => acc + (d.pageview || 0), 0);
    const targetCum = latestMonthDays.reduce((acc, d) => acc + d.kpiTarget, 0);
    const gap = actualCum - targetCum;
    const attainment = targetCum > 0 ? (actualCum / targetCum) * 100 : 0;
    const avgDailyActual = latestMonthDays.length > 0 ? actualCum / latestMonthDays.length : 0;
    const daysInMonth = todayRecord ? new Date(todayRecord.year, todayRecord.month, 0).getDate() : 30;
    const projectedMonthTotal = avgDailyActual * daysInMonth;
    const totalMonthKpi = dates
      .filter((d) => d.month === latestMonth)
      .reduce((acc, d) => acc + d.kpiTarget, 0);

    return {
      count: latestMonthDays.length,
      actualCum,
      targetCum,
      gap,
      attainment,
      avgDailyActual,
      projectedMonthTotal,
      totalMonthKpi,
    };
  }, [recordedDays, dates, latestMonth, todayRecord]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Giám sát Daily KPI – Pageviews thực tế vs KPI mục tiêu
            </h2>
            <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
              Khung ngày (Daily grain)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu Pageview thực tế ghi nhận đến hết ngày {todayRecord ? formatDateVi(todayRecord.dayString) : '03/09/2026'} kèm đường mục tiêu dự kiến đến hết tháng {latestMonth}.
          </p>
        </div>

        {/* Chart View Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setTimeZoom('all')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                timeZoom === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả (T1-T{latestMonth})
            </button>
            <button
              type="button"
              onClick={() => setTimeZoom('last60')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                timeZoom === 'last60' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              60 ngày
            </button>
            <button
              type="button"
              onClick={() => setTimeZoom('last30')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                timeZoom === 'last30' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 ngày
            </button>
            <button
              type="button"
              onClick={() => setTimeZoom('latest_m')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                timeZoom === 'latest_m' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tháng {latestMonth}
            </button>
            <button
              type="button"
              onClick={() => setTimeZoom('prev_m')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                timeZoom === 'prev_m' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tháng {prevMonth}
            </button>
          </div>

          {/* Series toggle checkboxes */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={showActual}
                onChange={(e) => setShowActual(e.target.checked)}
                className="rounded border-slate-300 text-red-600 focus:ring-0"
              />
              <span className="font-medium">Thực tế</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={showTarget}
                onChange={(e) => setShowTarget(e.target.checked)}
                className="rounded border-slate-300 text-slate-500 focus:ring-0"
              />
              <span className="font-medium">Target KPI</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={showMa7}
                onChange={(e) => setShowMa7(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-0"
              />
              <span className="font-medium">MA (7D)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Container: Chart + Side Executive Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        {/* Left: Recharts Daily Chart (3 columns) */}
        <div className="lg:col-span-3 p-4 sm:p-5">
          <div className="h-80 sm:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 15, left: -5, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    const row = e.activePayload[0].payload as NormalizedDateRecord;
                    onSelectDay(row);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="dateFormatted"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={20}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => formatCompactNumber(val)}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as NormalizedDateRecord & {
                        attainment: number | null;
                        ma7: number | null;
                      };
                      return (
                        <div className="bg-slate-900 text-white rounded-lg shadow-xl p-3 text-xs border border-slate-700 max-w-xs">
                          <div className="font-bold text-slate-100 border-b border-slate-800 pb-1 mb-2 flex items-center justify-between">
                            <span>Ngày: {data.dayString}</span>
                            <span className="text-[10px] text-slate-400">Click để xem chi tiết</span>
                          </div>
                          <div className="space-y-1.5 font-mono">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-300">Thực tế (Actual):</span>
                              <span className="font-bold text-white">
                                {data.pageview !== null ? formatNumber(data.pageview) : 'Chưa có dữ liệu'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-300">Target (KPI):</span>
                              <span className="font-bold text-amber-300">
                                {formatNumber(data.kpiTarget)}
                              </span>
                            </div>
                            {data.pageview !== null && (
                              <>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-slate-300">Tỷ lệ đạt KPI:</span>
                                  <span
                                    className={`font-bold ${
                                      data.attainment && data.attainment >= 100
                                        ? 'text-emerald-400'
                                        : 'text-rose-400'
                                    }`}
                                  >
                                    {data.attainment ? `${data.attainment.toFixed(1)}%` : '-'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-slate-300">Chênh lệch Gap:</span>
                                  <span
                                    className={`font-bold ${
                                      data.pageview - data.kpiTarget >= 0
                                        ? 'text-emerald-400'
                                        : 'text-rose-400'
                                    }`}
                                  >
                                    {data.pageview - data.kpiTarget >= 0 ? '+' : ''}
                                    {formatNumber(data.pageview - data.kpiTarget)}
                                  </span>
                                </div>
                              </>
                            )}
                            {data.ma7 && (
                              <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
                                <span className="text-blue-300">MA 7 ngày:</span>
                                <span className="text-blue-300">{formatNumber(data.ma7)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  formatter={(value) => (
                    <span className="text-slate-700 font-medium">{value}</span>
                  )}
                />

                {/* Actual Pageviews Bar/Area */}
                {showActual && (
                  <Bar
                    dataKey="pageview"
                    name="Actual Pageview"
                    fill="#B91C1C"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={16}
                  />
                )}

                {/* Daily KPI Target Dashed Line */}
                {showTarget && (
                  <Line
                    type="monotone"
                    dataKey="kpiTarget"
                    name="Daily Target KPI"
                    stroke="#D97706"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                )}

                {/* 7-day Moving Average */}
                {showMa7 && (
                  <Line
                    type="monotone"
                    dataKey="ma7"
                    name="7D Moving Average"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between">
            <span>* Mẹo: Click trực tiếp vào một cột ngày trên biểu đồ để mở bảng phân tích chi tiết ngày đó.</span>
            <span>Các ngày sau {todayRecord ? formatDateVi(todayRecord.dayString) : '03/09/2026'} hiển thị đường Target KPI định hướng tháng {latestMonth}.</span>
          </div>
        </div>

        {/* Right: Executive Quick Stats Panel (1 column) */}
        <div className="p-4 sm:p-5 flex flex-col justify-between bg-slate-50/40">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              Điểm tin chỉ số ngày
            </h3>

            {/* Today Card */}
            {todayRecord && (
              <div
                onClick={() => onSelectDay(todayRecord)}
                className="bg-white border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-900 group-hover:text-red-700 transition-colors">
                    Hôm nay ({formatDateVi(todayRecord.dayString)})
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-slate-900">
                    {formatNumber(todayRecord.pageview)}
                  </span>
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      (todayRecord.pageview || 0) >= todayRecord.kpiTarget
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {todayRecord.kpiTarget > 0
                      ? `${(((todayRecord.pageview || 0) / todayRecord.kpiTarget) * 100).toFixed(1)}%`
                      : '-'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                  <span>Target: {formatNumber(todayRecord.kpiTarget)}</span>
                  <span className="text-rose-600 font-mono">
                    {formatNumber((todayRecord.pageview || 0) - todayRecord.kpiTarget)}
                  </span>
                </div>
              </div>
            )}

            {/* Yesterday Card */}
            {yesterdayRecord && (
              <div
                onClick={() => onSelectDay(yesterdayRecord)}
                className="bg-white border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-900 group-hover:text-red-700 transition-colors">
                    Hôm qua ({formatDateVi(yesterdayRecord.dayString)})
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-slate-900">
                    {formatNumber(yesterdayRecord.pageview)}
                  </span>
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      (yesterdayRecord.pageview || 0) >= yesterdayRecord.kpiTarget
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {yesterdayRecord.kpiTarget > 0
                      ? `${(((yesterdayRecord.pageview || 0) / yesterdayRecord.kpiTarget) * 100).toFixed(1)}%`
                      : '-'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                  <span>Target: {formatNumber(yesterdayRecord.kpiTarget)}</span>
                  <span className="text-rose-600 font-mono">
                    {formatNumber((yesterdayRecord.pageview || 0) - yesterdayRecord.kpiTarget)}
                  </span>
                </div>
              </div>
            )}

            {/* MTD Aggregated Block */}
            <div className="bg-slate-900 text-white rounded-lg p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Tháng {latestMonth} Lũy kế (MTD)</span>
                <span className="text-slate-300 font-mono">{mtdStats.count} ngày ghi nhận</span>
              </div>
              <div className="text-xl font-black text-white">
                {formatNumber(mtdStats.actualCum)} PV
              </div>
              <div className="mt-2 text-xs space-y-1 font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Mục tiêu lũy kế:</span>
                  <span>{formatNumber(mtdStats.targetCum)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Độ hụt (Gap MTD):</span>
                  <span className="text-rose-400">{formatNumber(mtdStats.gap)}</span>
                </div>
                <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Tỷ lệ đạt MTD:</span>
                  <span className="text-amber-300 font-bold">{mtdStats.attainment.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Run-rate estimate note */}
          <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Tốc độ chạy (Run-rate): </span>
            <span>
              Trung bình {mtdStats.count} ngày đầu tháng {latestMonth} đạt {formatCompactNumber(mtdStats.avgDailyActual)} PV/ngày. Nếu giữ tốc độ này, dự báo tháng {latestMonth} đạt khoảng{' '}
              <strong className="text-slate-900">{formatCompactNumber(mtdStats.projectedMonthTotal)} PV</strong>{' '}
              (so với KPI kế hoạch {formatCompactNumber(mtdStats.totalMonthKpi)} PV).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

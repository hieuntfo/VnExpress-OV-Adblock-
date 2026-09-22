import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceDot,
} from 'recharts';
import { TrendingUp, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
import { NormalizedDateRecord } from '../types';
import { formatNumber, formatCompactNumber } from '../services/dataService';

interface CumulativeChartProps {
  dates: NormalizedDateRecord[];
}

export const CumulativeChart: React.FC<CumulativeChartProps> = ({ dates }) => {
  const cumulativeData = useMemo(() => {
    const sorted = [...dates].sort((a, b) => a.timestamp - b.timestamp);
    let cumActual = 0;
    let cumTarget = 0;
    let daysAbove = 0;
    let daysBelow = 0;

    const data = sorted.map((d) => {
      cumTarget += d.kpiTarget;
      if (d.pageview !== null) {
        cumActual += d.pageview;
        if (d.pageview >= d.kpiTarget) {
          daysAbove++;
        } else {
          daysBelow++;
        }
      }

      return {
        dayString: d.dayString,
        dateFormatted: `${d.dayString.slice(8, 10)}/${d.dayString.slice(5, 7)}`,
        month: d.month,
        actualDaily: d.pageview,
        targetDaily: d.kpiTarget,
        cumActual: d.pageview !== null ? cumActual : null,
        cumTarget,
        cumGap: d.pageview !== null ? cumActual - cumTarget : null,
        cumAttainment:
          d.pageview !== null && cumTarget > 0 ? (cumActual / cumTarget) * 100 : null,
      };
    });

    const recordedDays = data.filter((d) => d.cumActual !== null);
    const lastRecorded = recordedDays[recordedDays.length - 1];

    return {
      points: data,
      lastRecorded,
      daysAbove,
      daysBelow,
      totalRecordedDays: recordedDays.length,
    };
  }, [dates]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="h-4 w-4 text-slate-600" />
              Tiến độ Lũy kế Toàn kỳ (Cumulative Performance & Attainment)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Đường lũy kế Pageview thực tế tích lũy so với tổng hạn ngạch KPI qua từng ngày từ tháng 1 đến tháng 9/2026.
          </p>
        </div>

        {/* Milestone badge */}
        {cumulativeData.lastRecorded && (
          <div className="flex items-center gap-3 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono">
            <div>
              <span className="text-slate-500">Lũy kế Thực tế: </span>
              <strong className="text-slate-900">
                {formatCompactNumber(cumulativeData.lastRecorded.cumActual)} PV
              </strong>
            </div>
            <div className="h-3 w-px bg-slate-300" />
            <div>
              <span className="text-slate-500">Lũy kế KPI: </span>
              <strong className="text-slate-900">
                {formatCompactNumber(cumulativeData.lastRecorded.cumTarget)} PV
              </strong>
            </div>
            <div className="h-3 w-px bg-slate-300" />
            <div>
              <span className="text-slate-500">Đạt: </span>
              <strong className="text-amber-700">
                {cumulativeData.lastRecorded.cumAttainment?.toFixed(1)}%
              </strong>
            </div>
          </div>
        )}
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={cumulativeData.points}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCumActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#B91C1C" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#B91C1C" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="dateFormatted"
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => formatCompactNumber(val)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white rounded-lg p-3 text-xs shadow-xl border border-slate-700 font-mono space-y-1">
                      <div className="font-bold border-b border-slate-800 pb-1 mb-1.5 text-slate-200">
                        Ngày: {d.dayString}
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Lũy kế Thực tế:</span>
                        <span className="font-bold text-white">
                          {d.cumActual !== null ? formatNumber(d.cumActual) : 'Chưa ghi nhận'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Lũy kế KPI:</span>
                        <span className="font-bold text-amber-300">{formatNumber(d.cumTarget)}</span>
                      </div>
                      {d.cumGap !== null && (
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Chênh lệch Gap:</span>
                          <span
                            className={`font-bold ${
                              d.cumGap >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {d.cumGap >= 0 ? '+' : ''}
                            {formatNumber(d.cumGap)}
                          </span>
                        </div>
                      )}
                      {d.cumAttainment !== null && (
                        <div className="flex justify-between gap-4 pt-1 border-t border-slate-800">
                          <span className="text-slate-400">Tiến độ đạt KPI:</span>
                          <span className="font-bold text-amber-300">
                            {d.cumAttainment.toFixed(1)}%
                          </span>
                        </div>
                      )}
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

            {/* Target Line */}
            <Line
              type="monotone"
              dataKey="cumTarget"
              name="Lũy kế Target KPI"
              stroke="#D97706"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />

            {/* Actual Cumulative Area */}
            <Area
              type="monotone"
              dataKey="cumActual"
              name="Lũy kế Pageviews Thực tế"
              stroke="#B91C1C"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorCumActual)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer stats: Days Above vs Below KPI */}
      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg text-emerald-900 border border-emerald-100">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold">{cumulativeData.daysAbove} ngày </span>
            <span>vượt hoặc bằng KPI</span>
            <span className="text-emerald-700 text-[11px] block">
              ({((cumulativeData.daysAbove / cumulativeData.totalRecordedDays) * 100).toFixed(1)}% số ngày)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 bg-rose-50 rounded-lg text-rose-900 border border-rose-100">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <div>
            <span className="font-bold">{cumulativeData.daysBelow} ngày </span>
            <span>dưới chỉ tiêu KPI</span>
            <span className="text-rose-700 text-[11px] block">
              ({((cumulativeData.daysBelow / cumulativeData.totalRecordedDays) * 100).toFixed(1)}% số ngày)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-slate-700 border border-slate-200">
          <div>
            <span className="font-bold block text-slate-900">Tổng cộng {cumulativeData.totalRecordedDays} ngày</span>
            <span className="text-slate-500 text-[11px]">Từ 01/01/2026 đến 03/09/2026</span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200">
            {formatCompactNumber(cumulativeData.lastRecorded?.cumActual)} PV
          </span>
        </div>
      </div>
    </div>
  );
};

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
} from 'recharts';
import {
  PieChart,
  Layers,
  Globe2,
  FolderOpen,
  Calendar,
  Database,
  Search,
  Download,
} from 'lucide-react';
import {
  NormalizedFolderRecord,
  NormalizedCountryRecord,
  NormalizedDateRecord,
  MarketPerformanceRow,
  FolderPerformanceRow,
} from '../types';
import { formatNumber, formatCompactNumber } from '../services/dataService';

interface BlockCompositionSectionProps {
  markets: MarketPerformanceRow[];
  folders: FolderPerformanceRow[];
  rawFolders: NormalizedFolderRecord[];
  rawCountries: NormalizedCountryRecord[];
  rawDates: NormalizedDateRecord[];
  selectedMonth: number | 'all';
}

export const BlockCompositionSection: React.FC<BlockCompositionSectionProps> = ({
  markets,
  folders,
  rawFolders,
  rawCountries,
  rawDates,
  selectedMonth,
}) => {
  const [activeTab, setActiveTab] = useState<'pareto' | 'market' | 'folder' | 'month' | 'raw'>('pareto');
  const [rawDatasetChoice, setRawDatasetChoice] = useState<'folder' | 'country' | 'date'>('folder');
  const [rawSearch, setRawSearch] = useState('');
  const [rawPage, setRawPage] = useState(1);

  // Compute Pareto data for top 10 markets
  const paretoData = useMemo(() => {
    const sorted = [...markets].sort((a, b) => b.blockAdsPv - a.blockAdsPv);
    const top10 = sorted.slice(0, 10);
    const totalBlockAll = sorted.reduce((acc, m) => acc + m.blockAdsPv, 0);

    let cum = 0;
    return top10.map((item) => {
      cum += item.blockAdsPv;
      const cumPct = totalBlockAll > 0 ? (cum / totalBlockAll) * 100 : 0;
      return {
        name: item.country,
        blockAdsPv: item.blockAdsPv,
        contribution: item.contributionToTotalBlock,
        cumPct,
      };
    });
  }, [markets]);

  // Monthly breakdown of block ads
  const monthlyBlock = useMemo(() => {
    const map = new Map<number, { month: number; pvs: number; runAds: number; block: number }>();
    rawFolders.forEach((r) => {
      const existing = map.get(r.month) || { month: r.month, pvs: 0, runAds: 0, block: 0 };
      existing.pvs += r.pvs;
      existing.runAds += r.pvsRunAds;
      existing.block += r.blockAds;
      map.set(r.month, existing);
    });

    const totalBlock = Array.from(map.values()).reduce((a, b) => a + b.block, 0);

    return Array.from(map.values())
      .sort((a, b) => a.month - b.month)
      .map((item) => ({
        month: `Tháng ${item.month}`,
        pvs: item.pvs,
        runAds: item.runAds,
        block: item.block,
        blockRate: item.pvs > 0 ? (item.block / item.pvs) * 100 : 0,
        share: totalBlock > 0 ? (item.block / totalBlock) * 100 : 0,
      }));
  }, [rawFolders]);

  // Raw dataset view
  const filteredRaw = useMemo(() => {
    const q = rawSearch.toLowerCase().trim();
    if (rawDatasetChoice === 'folder') {
      return rawFolders.filter((r) => !q || r.folder.toLowerCase().includes(q));
    }
    if (rawDatasetChoice === 'country') {
      return rawCountries.filter((r) => !q || r.country.toLowerCase().includes(q));
    }
    return rawDates.filter((r) => !q || r.dayString.includes(q));
  }, [rawDatasetChoice, rawFolders, rawCountries, rawDates, rawSearch]);

  const rawPageSize = 12;
  const rawTotalPages = Math.ceil(filteredRaw.length / rawPageSize) || 1;
  const rawPaginated = useMemo(() => {
    const start = (rawPage - 1) * rawPageSize;
    return filteredRaw.slice(start, start + rawPageSize);
  }, [filteredRaw, rawPage]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <PieChart className="h-4 w-4 text-red-700" />
              Phân tích Cấu thành Lượng Block Ads (Block Composition & Pareto Analysis)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Bóc tách nguồn phát sinh Block Ads theo Thị trường, Chuyên mục, Diễn biến Tháng và Khám phá Dữ liệu gốc.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('pareto')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'pareto' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pareto 80/20
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('month')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'month' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Theo Tháng
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'raw' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dữ liệu gốc (Explorer)
          </button>
        </div>
      </div>

      {/* Tab 1: Pareto 80/20 Chart */}
      {activeTab === 'pareto' && (
        <div>
          <div className="mb-3 flex items-center justify-between text-xs text-slate-600">
            <span>
              Biểu đồ Pareto thể hiện quy luật 80/20: Thị trường <strong>United States</strong> chiếm hơn 40% toàn bộ lượng Block Ads, kết hợp với Úc, Singapore, Nhật Bản và Đức tạo thành hơn 75% lượng Block của toàn hệ thống OV.
            </span>
            <span className="font-mono text-slate-500 shrink-0 ml-2">Top 10 Markets</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={paretoData} margin={{ top: 10, right: 10, left: -5, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  tickLine={false}
                  angle={-20}
                  textAnchor="end"
                />
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
                  domain={[0, 100]}
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
                            {d.name}
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Block Ads PV:</span>
                            <span className="font-bold text-rose-400">{formatNumber(d.blockAdsPv)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Đóng góp riêng lẻ:</span>
                            <span className="font-bold text-amber-300">{d.contribution.toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between gap-4 pt-1 border-t border-slate-800">
                            <span className="text-slate-400">Đường tích lũy %:</span>
                            <span className="font-bold text-blue-300">{d.cumPct.toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="blockAdsPv"
                  name="Block Ads PV"
                  fill="#E11D48"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumPct"
                  name="Tích lũy % (Cumulative %)"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#2563EB' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: Monthly Breakdown */}
      {activeTab === 'month' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-2.5 px-3">Tháng</th>
                <th className="py-2.5 px-3 text-right">Tổng PVS</th>
                <th className="py-2.5 px-3 text-right">PVS Run Ads</th>
                <th className="py-2.5 px-3 text-right text-rose-900 bg-rose-50/40">Block Ads PV</th>
                <th className="py-2.5 px-3 text-right">Tỷ lệ Block (%)</th>
                <th className="py-2.5 px-3 text-right">Tỷ trọng trong toàn bộ Block 9 tháng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {monthlyBlock.map((m) => (
                <tr key={m.month} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900 font-sans">{m.month}/2026</td>
                  <td className="py-2.5 px-3 text-right text-slate-700">{formatNumber(m.pvs)}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-800 font-bold">
                    {formatNumber(m.runAds)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-700 font-bold bg-rose-50/20">
                    {formatNumber(m.block)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {m.blockRate.toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-700">{m.share.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Raw Data Explorer */}
      {activeTab === 'raw' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Chọn tập dữ liệu:</span>
              <div className="inline-flex bg-slate-100 rounded-lg p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setRawDatasetChoice('folder');
                    setRawPage(1);
                  }}
                  className={`px-2.5 py-1 rounded ${
                    rawDatasetChoice === 'folder'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600'
                  }`}
                >
                  Folder CSV ({rawFolders.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRawDatasetChoice('country');
                    setRawPage(1);
                  }}
                  className={`px-2.5 py-1 rounded ${
                    rawDatasetChoice === 'country'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600'
                  }`}
                >
                  Country CSV ({rawCountries.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRawDatasetChoice('date');
                    setRawPage(1);
                  }}
                  className={`px-2.5 py-1 rounded ${
                    rawDatasetChoice === 'date'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600'
                  }`}
                >
                  Date CSV ({rawDates.length})
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Lọc dữ liệu gốc..."
                value={rawSearch}
                onChange={(e) => {
                  setRawSearch(e.target.value);
                  setRawPage(1);
                }}
                className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none w-48"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase text-[11px]">
                  {rawDatasetChoice === 'folder' && (
                    <>
                      <th className="py-2 px-3">Folder</th>
                      <th className="py-2 px-3 text-center">Month</th>
                      <th className="py-2 px-3 text-right">PVS</th>
                      <th className="py-2 px-3 text-right">PVS run ads</th>
                      <th className="py-2 px-3 text-right">Block Ads</th>
                      <th className="py-2 px-3 text-right">%KPI</th>
                    </>
                  )}
                  {rawDatasetChoice === 'country' && (
                    <>
                      <th className="py-2 px-3">Country</th>
                      <th className="py-2 px-3 text-center">Month</th>
                      <th className="py-2 px-3 text-right">Pvs</th>
                      <th className="py-2 px-3 text-right">Pvs run ads</th>
                      <th className="py-2 px-3 text-right">Block Ads</th>
                    </>
                  )}
                  {rawDatasetChoice === 'date' && (
                    <>
                      <th className="py-2 px-3">Day</th>
                      <th className="py-2 px-3 text-right">KPI Target</th>
                      <th className="py-2 px-3 text-right">Actual Pageview</th>
                      <th className="py-2 px-3 text-center">Month</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {rawPaginated.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {rawDatasetChoice === 'folder' && (
                      <>
                        <td className="py-2 px-3 font-sans font-medium text-slate-900">{item.folder}</td>
                        <td className="py-2 px-3 text-center text-slate-600">{item.month}</td>
                        <td className="py-2 px-3 text-right text-slate-700">{formatNumber(item.pvs)}</td>
                        <td className="py-2 px-3 text-right text-emerald-800 font-bold">{formatNumber(item.pvsRunAds)}</td>
                        <td className="py-2 px-3 text-right text-rose-700 font-bold">{formatNumber(item.blockAds)}</td>
                        <td className="py-2 px-3 text-right text-amber-700 font-bold">{item.kpiPercent.toFixed(1)}%</td>
                      </>
                    )}
                    {rawDatasetChoice === 'country' && (
                      <>
                        <td className="py-2 px-3 font-sans font-medium text-slate-900">{item.country}</td>
                        <td className="py-2 px-3 text-center text-slate-600">{item.month}</td>
                        <td className="py-2 px-3 text-right text-slate-700">{formatNumber(item.pvs)}</td>
                        <td className="py-2 px-3 text-right text-emerald-800 font-bold">{formatNumber(item.pvsRunAds)}</td>
                        <td className="py-2 px-3 text-right text-rose-700 font-bold">{formatNumber(item.blockAds)}</td>
                      </>
                    )}
                    {rawDatasetChoice === 'date' && (
                      <>
                        <td className="py-2 px-3 font-sans font-medium text-slate-900">{item.dayString}</td>
                        <td className="py-2 px-3 text-right text-amber-700 font-bold">{formatNumber(item.kpiTarget)}</td>
                        <td className="py-2 px-3 text-right text-emerald-800 font-bold">
                          {item.pageview !== null ? formatNumber(item.pageview) : 'Chưa có dữ liệu'}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-600">Tháng {item.month}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Raw pagination */}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              Trang {rawPage} / {rawTotalPages} ({filteredRaw.length} dòng)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={rawPage === 1}
                onClick={() => setRawPage((p) => Math.max(1, p - 1))}
                className="px-2 py-0.5 rounded border border-slate-200 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={rawPage === rawTotalPages}
                onClick={() => setRawPage((p) => Math.min(rawTotalPages, p + 1))}
                className="px-2 py-0.5 rounded border border-slate-200 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

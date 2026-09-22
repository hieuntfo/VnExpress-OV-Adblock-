import React, { useState, useMemo } from 'react';
import {
  FolderOpen,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  ExternalLink,
} from 'lucide-react';
import { FolderPerformanceRow } from '../types';
import { formatNumber, formatCompactNumber } from '../services/dataService';

interface FolderTableProps {
  folders: FolderPerformanceRow[];
  onSelectFolder: (folder: string) => void;
  selectedMonth: number | 'all';
}

type SortField =
  | 'folder'
  | 'pvs'
  | 'pvsRunAds'
  | 'blockAdsPv'
  | 'runAdsRate'
  | 'blockRate'
  | 'kpiPercent'
  | 'contributionToBlock';

export const FolderTable: React.FC<FolderTableProps> = ({
  folders,
  onSelectFolder,
  selectedMonth,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('blockAdsPv');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filtered = useMemo(() => {
    return folders.filter((f) =>
      f.folder.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  }, [folders, searchTerm]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      const numA = Number(valA);
      const numB = Number(valB);
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });
  }, [filtered, sortField, sortDirection]);

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'Folder',
      'PVS',
      'PVS Run Ads',
      'Block Ads PV',
      'Run Ads Rate (%)',
      'Block Rate (%)',
      '% KPI',
      'Contribution to Block (%)',
    ];
    const rows = sorted.map((f) => [
      `"${f.folder}"`,
      f.pvs,
      f.pvsRunAds,
      f.blockAdsPv,
      f.runAdsRate.toFixed(2),
      f.blockRate.toFixed(2),
      f.kpiPercent.toFixed(2),
      f.contributionToBlock.toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `VnExpress_OV_Folder_Performance_${selectedMonth === 'all' ? 'All' : `M${selectedMonth}`}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-slate-400" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-red-700" />
    ) : (
      <ArrowDown className="h-3 w-3 text-red-700" />
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5">
      {/* Table Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-slate-700" />
              Hiệu quả theo Chuyên mục Nội dung (Folder Performance)
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {filtered.length} chuyên mục
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Bảng thống kê tỷ trọng phân phối theo chuyên mục nội dung. Sắp xếp mặc định theo lượng Block Ads để ưu tiên cải thiện.
          </p>
        </div>

        {/* Search & Export Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm chuyên mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 w-48 sm:w-56"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
            title="Xuất bảng này ra file CSV"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase text-[11px] tracking-wider select-none">
              <th
                onClick={() => handleSort('folder')}
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Chuyên mục</span>
                  {renderSortIcon('folder')}
                </div>
              </th>
              <th
                onClick={() => handleSort('pvs')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>PVS</span>
                  {renderSortIcon('pvs')}
                </div>
              </th>
              <th
                onClick={() => handleSort('pvsRunAds')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>PVS Run Ads</span>
                  {renderSortIcon('pvsRunAds')}
                </div>
              </th>
              <th
                onClick={() => handleSort('blockAdsPv')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors text-rose-900 bg-rose-50/40"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Block Ads PV</span>
                  {renderSortIcon('blockAdsPv')}
                </div>
              </th>
              <th
                onClick={() => handleSort('runAdsRate')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Run Ads Rate</span>
                  {renderSortIcon('runAdsRate')}
                </div>
              </th>
              <th
                onClick={() => handleSort('blockRate')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Block Rate</span>
                  {renderSortIcon('blockRate')}
                </div>
              </th>
              <th
                onClick={() => handleSort('kpiPercent')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>% KPI</span>
                  {renderSortIcon('kpiPercent')}
                </div>
              </th>
              <th
                onClick={() => handleSort('contributionToBlock')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Tỷ trọng Block</span>
                  {renderSortIcon('contributionToBlock')}
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((row) => (
              <tr
                key={row.folder}
                onClick={() => onSelectFolder(row.folder)}
                className="hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <td className="py-2.5 px-3 font-bold text-slate-900 group-hover:text-red-700 transition-colors">
                  {row.folder}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                  {formatNumber(row.pvs)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                  {formatNumber(row.pvsRunAds)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 bg-rose-50/20">
                  {formatNumber(row.blockAdsPv)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-semibold">
                  {row.runAdsRate.toFixed(2)}%
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  {row.blockRate.toFixed(2)}%
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                  {row.kpiPercent.toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                  {row.contributionToBlock.toFixed(2)}%
                </td>
                <td className="py-2.5 px-3 text-center">
                  <button
                    type="button"
                    className="p-1 rounded text-slate-400 group-hover:text-red-700 transition-colors"
                    title={`Xem biểu đồ 9 tháng của ${row.folder}`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

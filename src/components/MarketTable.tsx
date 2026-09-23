import React, { useState, useMemo } from 'react';
import {
  Globe2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  ExternalLink,
} from 'lucide-react';
import { MarketPerformanceRow } from '../types';
import { formatNumber, formatCompactNumber } from '../services/dataService';

interface MarketTableProps {
  markets: MarketPerformanceRow[];
  onSelectMarket: (country: string) => void;
  selectedMonth: number | 'all';
}

type SortField =
  | 'country'
  | 'totalPv'
  | 'canRunAdsPv'
  | 'blockAdsPv'
  | 'canRunAdsRate'
  | 'blockRate'
  | 'contributionToTotalBlock';

export const MarketTable: React.FC<MarketTableProps> = ({
  markets,
  onSelectMarket,
  selectedMonth,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('blockAdsPv');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filtered = useMemo(() => {
    return markets.filter((m) =>
      m.country.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  }, [markets, searchTerm]);

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

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'Country',
      'Total PV',
      'Can Run Ads PV',
      'Block Ads PV',
      'Can Run Ads Rate (%)',
      'Block Rate (%)',
      'Contribution to Block (%)',
    ];
    const rows = sorted.map((m) => [
      `"${m.country}"`,
      m.totalPv,
      m.canRunAdsPv,
      m.blockAdsPv,
      m.canRunAdsRate.toFixed(2),
      m.blockRate.toFixed(2),
      m.contributionToTotalBlock.toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `VnExpress_OV_Market_Performance_${selectedMonth === 'all' ? 'All' : `M${selectedMonth}`}.csv`
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
              <Globe2 className="h-4 w-4 text-red-700" />
              Hiệu quả theo Thị trường (Market Performance)
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {filtered.length} quốc gia
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Bảng theo dõi tổng quan các thị trường hải ngoại, sắp xếp mặc định theo lượng Block Ads PV cao nhất để ưu tiên xử lý.
          </p>
        </div>

        {/* Search & Export Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm thị trường..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
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
                onClick={() => handleSort('country')}
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Thị trường</span>
                  {renderSortIcon('country')}
                </div>
              </th>
              <th
                onClick={() => handleSort('totalPv')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Total PV</span>
                  {renderSortIcon('totalPv')}
                </div>
              </th>
              <th
                onClick={() => handleSort('canRunAdsPv')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Can Run Ads PV</span>
                  {renderSortIcon('canRunAdsPv')}
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
                onClick={() => handleSort('canRunAdsRate')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Run Ads Rate</span>
                  {renderSortIcon('canRunAdsRate')}
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
                onClick={() => handleSort('contributionToTotalBlock')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Tỷ trọng Block</span>
                  {renderSortIcon('contributionToTotalBlock')}
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length > 0 ? (
              paginated.map((row) => (
                <tr
                  key={row.country}
                  onClick={() => onSelectMarket(row.country)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 px-3 font-bold text-slate-900 group-hover:text-red-700 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">
                        {row.country === 'Australia'
                          ? '🇦🇺'
                          : row.country === 'Japan'
                          ? '🇯🇵'
                          : row.country === 'United States'
                          ? '🇺🇸'
                          : row.country === 'Singapore'
                          ? '🇸🇬'
                          : row.country === 'Canada'
                          ? '🇨🇦'
                          : row.country === 'Germany'
                          ? '🇩🇪'
                          : row.country === 'United Kingdom'
                          ? '🇬🇧'
                          : row.country === 'France'
                          ? '🇫🇷'
                          : '🌐'}
                      </span>
                      <span>{row.country}</span>
                      {(row.country === 'Australia' || row.country === 'Japan') && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Thí điểm
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                    {formatNumber(row.totalPv)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                    {formatNumber(row.canRunAdsPv)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 bg-rose-50/20">
                    {formatNumber(row.blockAdsPv)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-semibold">
                    {row.canRunAdsRate.toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {row.blockRate.toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                    {row.contributionToTotalBlock.toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      className="p-1 rounded text-slate-400 group-hover:text-red-700 transition-colors"
                      title={`Xem biểu đồ 9 tháng của ${row.country}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-400">
                  Không tìm thấy thị trường phù hợp với từ khóa "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Summary */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span>Hiển thị</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 font-medium text-slate-700"
          >
            <option value={10}>10 dòng</option>
            <option value={20}>20 dòng</option>
            <option value={50}>50 dòng</option>
            <option value={100}>100 dòng</option>
          </select>
          <span>trên tổng số {filtered.length} thị trường</span>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1 rounded border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium"
          >
            Trang trước
          </button>
          <span className="font-mono text-slate-700 px-1">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1 rounded border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium"
          >
            Trang sau
          </button>
        </div>
      </div>
    </div>
  );
};

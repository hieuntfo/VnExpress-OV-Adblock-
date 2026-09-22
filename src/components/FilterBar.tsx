import React from 'react';
import {
  Filter,
  Calendar,
  Globe2,
  FolderOpen,
  ArrowLeftRight,
  RotateCcw,
  Info,
} from 'lucide-react';
import { FilterState } from '../types';

interface FilterBarProps {
  filter: FilterState;
  onChangeFilter: (newFilter: FilterState) => void;
  uniqueMarkets: string[];
  uniqueFolders: string[];
  availableMonths: number[];
  grainNotice: string | null;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onChangeFilter,
  uniqueMarkets,
  uniqueFolders,
  availableMonths,
  grainNotice,
}) => {
  const handleMarketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeFilter({ ...filter, market: e.target.value });
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeFilter({ ...filter, folder: e.target.value });
  };

  const handleComparisonChange = (mode: 'DoD' | 'WoW' | 'MoM') => {
    onChangeFilter({ ...filter, comparisonMode: mode });
  };

  const handlePresetChange = (preset: FilterState['dateRangePreset']) => {
    onChangeFilter({
      ...filter,
      timeMode: 'date-range',
      dateRangePreset: preset,
      selectedMonth: preset === 'this_month' ? 9 : preset === 'prev_month' ? 8 : 'all',
    });
  };

  const handleMonthChange = (month: number | 'all') => {
    onChangeFilter({
      ...filter,
      timeMode: 'month',
      selectedMonth: month,
    });
  };

  const handleReset = () => {
    onChangeFilter({
      market: 'all',
      folder: 'all',
      timeMode: 'month',
      dateRangePreset: 'all',
      customStartDate: '',
      customEndDate: '',
      selectedMonth: 'all',
      comparisonMode: 'MoM',
    });
  };

  const isFiltered =
    filter.market !== 'all' ||
    filter.folder !== 'all' ||
    filter.selectedMonth !== 'all' ||
    (filter.timeMode === 'date-range' && filter.dateRangePreset !== 'all');

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Left: Core Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Market Filter */}
            <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
              <Globe2 className="h-3.5 w-3.5 text-slate-500" />
              <label htmlFor="market-select" className="font-semibold text-slate-700">
                Thị trường:
              </label>
              <select
                id="market-select"
                value={filter.market}
                onChange={handleMarketChange}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                <option value="all">Toàn bộ OV (Tất cả)</option>
                {uniqueMarkets.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Folder Filter */}
            <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
              <FolderOpen className="h-3.5 w-3.5 text-slate-500" />
              <label htmlFor="folder-select" className="font-semibold text-slate-700">
                Chuyên mục:
              </label>
              <select
                id="folder-select"
                value={filter.folder}
                onChange={handleFolderChange}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                <option value="all">Tất cả chuyên mục</option>
                {uniqueFolders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Comparison Mode (DoD / WoW / MoM) */}
            <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
              <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
                <ArrowLeftRight className="h-3 w-3" />
                Đối chiếu:
              </span>
              <button
                type="button"
                onClick={() => handleComparisonChange('DoD')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  filter.comparisonMode === 'DoD'
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="So sánh theo ngày (Day-over-Day)"
              >
                DoD
              </button>
              <button
                type="button"
                onClick={() => handleComparisonChange('WoW')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  filter.comparisonMode === 'WoW'
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="So sánh theo tuần (Week-over-Week)"
              >
                WoW
              </button>
              <button
                type="button"
                onClick={() => handleComparisonChange('MoM')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  filter.comparisonMode === 'MoM'
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="So sánh theo tháng (Month-over-Month)"
              >
                MoM
              </button>
            </div>

            {/* Reset Button */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                title="Xóa tất cả bộ lọc đang áp dụng"
              >
                <RotateCcw className="h-3 w-3 text-slate-500" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          {/* Right: Time Selector Pills */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Thời gian:
            </span>

            {/* Daily presets */}
            <button
              type="button"
              onClick={() => handlePresetChange('today')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter.timeMode === 'date-range' && filter.dateRangePreset === 'today'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Hôm nay (03/09)
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('yesterday')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter.timeMode === 'date-range' && filter.dateRangePreset === 'yesterday'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Hôm qua (02/09)
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('this_month')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                (filter.timeMode === 'date-range' && filter.dateRangePreset === 'this_month') ||
                (filter.timeMode === 'month' && filter.selectedMonth === 9)
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tháng 9 (MTD)
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('prev_month')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                (filter.timeMode === 'date-range' && filter.dateRangePreset === 'prev_month') ||
                (filter.timeMode === 'month' && filter.selectedMonth === 8)
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tháng 8
            </button>
            <button
              type="button"
              onClick={() => handleMonthChange('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter.selectedMonth === 'all' && filter.dateRangePreset === 'all'
                  ? 'bg-red-700 text-white font-semibold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Cả kỳ (T1 - T9)
            </button>

            {/* Quick Month Dropdown */}
            <select
              value={filter.timeMode === 'month' ? filter.selectedMonth : 'custom'}
              onChange={(e) =>
                handleMonthChange(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="bg-slate-100 border border-slate-200 rounded-md px-2 py-1 text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Chọn tháng cụ thể...</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  Tháng {m}/2026
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grain Integrity & Non-Interpolation Notification Banner */}
        {grainNotice && (
          <div className="mt-2.5 p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg flex items-start gap-2 text-xs text-blue-900 animate-fadeIn">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Quy tắc bảo toàn dữ liệu (No Interpolation): </span>
              <span>{grainNotice}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

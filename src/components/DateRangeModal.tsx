import React, { useState, useMemo } from 'react';
import {
  CalendarRange,
  Calendar,
  X,
  Check,
  ArrowRight,
  Clock,
  Sparkles,
  Info,
  AlertCircle,
} from 'lucide-react';
import { DateRangePreset } from '../types';
import { formatDateVi, formatNumber } from '../services/dataService';
import { RAW_DATE_CSV } from '../data/rawDateCsv';

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreset: DateRangePreset;
  currentStartDate: string;
  currentEndDate: string;
  onApply: (preset: DateRangePreset, startDate: string, endDate: string) => void;
}

interface PresetOption {
  id: DateRangePreset;
  label: string;
  sublabel: string;
  startDate: string;
  endDate: string;
}

const PRESET_OPTIONS: PresetOption[] = [
  {
    id: 'last7',
    label: '7 ngày gần nhất',
    sublabel: '28/08/2026 - 03/09/2026',
    startDate: '2026-08-28',
    endDate: '2026-09-03',
  },
  {
    id: 'last14',
    label: '14 ngày gần nhất',
    sublabel: '21/08/2026 - 03/09/2026',
    startDate: '2026-08-21',
    endDate: '2026-09-03',
  },
  {
    id: 'last30',
    label: '30 ngày gần nhất',
    sublabel: '05/08/2026 - 03/09/2026',
    startDate: '2026-08-05',
    endDate: '2026-09-03',
  },
  {
    id: 'this_month',
    label: 'Tháng 9/2026 (MTD)',
    sublabel: '01/09/2026 - 03/09/2026',
    startDate: '2026-09-01',
    endDate: '2026-09-03',
  },
  {
    id: 'prev_month',
    label: 'Tháng 8/2026',
    sublabel: '01/08/2026 - 31/08/2026',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
  },
  {
    id: 'q3',
    label: 'Quý 3/2026 (đến nay)',
    sublabel: '01/07/2026 - 03/09/2026',
    startDate: '2026-07-01',
    endDate: '2026-09-03',
  },
  {
    id: 'q2',
    label: 'Quý 2/2026',
    sublabel: '01/04/2026 - 30/06/2026',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
  },
  {
    id: 'q1',
    label: 'Quý 1/2026',
    sublabel: '01/01/2026 - 31/03/2026',
    startDate: '2026-01-01',
    endDate: '2026-03-31',
  },
  {
    id: 'all',
    label: 'Cả kỳ dữ liệu (T1 - T9)',
    sublabel: '01/01/2026 - 03/09/2026',
    startDate: '2026-01-01',
    endDate: '2026-09-03',
  },
];

export const DateRangeModal: React.FC<DateRangeModalProps> = ({
  isOpen,
  onClose,
  currentPreset,
  currentStartDate,
  currentEndDate,
  onApply,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>(currentPreset);
  const [startDate, setStartDate] = useState<string>(currentStartDate || '2026-08-28');
  const [endDate, setEndDate] = useState<string>(currentEndDate || '2026-09-03');

  // Reset local state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedPreset(currentPreset);
      setStartDate(currentStartDate || '2026-08-28');
      setEndDate(currentEndDate || '2026-09-03');
    }
  }, [isOpen, currentPreset, currentStartDate, currentEndDate]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: PresetOption) => {
    setSelectedPreset(preset.id);
    setStartDate(preset.startDate);
    setEndDate(preset.endDate);
  };

  // Handle Custom Input change
  const handleCustomDateChange = (type: 'start' | 'end', val: string) => {
    setSelectedPreset('custom');
    if (type === 'start') {
      setStartDate(val);
    } else {
      setEndDate(val);
    }
  };

  // Validation
  const isValid = useMemo(() => {
    if (!startDate || !endDate) return false;
    return startDate <= endDate;
  }, [startDate, endDate]);

  // Calculate day count
  const dayCount = useMemo(() => {
    if (!startDate || !endDate || startDate > endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  // Check if range exceeds actual data limit (2026-09-03)
  const isFutureIncluded = useMemo(() => {
    return endDate > '2026-09-03';
  }, [endDate]);

  const handleApply = () => {
    if (!isValid) return;
    onApply(selectedPreset, startDate, endDate);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-100 text-red-700 rounded-lg">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Chọn khoảng thời gian phân tích
              </h3>
              <p className="text-xs text-slate-500">
                Dữ liệu thực tế ghi nhận từ 01/01/2026 đến 03/09/2026 (OV Market)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
          {/* Column 1: Quick Presets */}
          <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-slate-200 md:pr-5 pb-4 md:pb-0">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Khoảng thời gian nhanh
            </div>
            <div className="space-y-1.5">
              {PRESET_OPTIONS.map((opt) => {
                const isSelected = selectedPreset === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectPreset(opt)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-red-700 text-white font-medium shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{opt.label}</div>
                      <div
                        className={`text-[11px] ${
                          isSelected ? 'text-red-100' : 'text-slate-500'
                        }`}
                      >
                        {opt.sublabel}
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Custom Range Inputs */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-5">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Tùy chỉnh khoảng ngày
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {/* Start Date */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Từ ngày (Start Date)
                  </label>
                  <input
                    type="date"
                    min="2026-01-01"
                    max="2026-09-30"
                    value={startDate}
                    onChange={(e) => handleCustomDateChange('start', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-600 focus:outline-none ${
                      !isValid ? 'border-red-400 bg-red-50/50' : 'border-slate-300 bg-white'
                    }`}
                  />
                  <div className="text-[10px] text-slate-400 mt-1">
                    Hiển thị: {formatDateVi(startDate) || 'Chưa chọn'}
                  </div>
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Đến ngày (End Date)
                  </label>
                  <input
                    type="date"
                    min="2026-01-01"
                    max="2026-09-30"
                    value={endDate}
                    onChange={(e) => handleCustomDateChange('end', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-600 focus:outline-none ${
                      !isValid ? 'border-red-400 bg-red-50/50' : 'border-slate-300 bg-white'
                    }`}
                  />
                  <div className="text-[10px] text-slate-400 mt-1">
                    Hiển thị: {formatDateVi(endDate) || 'Chưa chọn'}
                  </div>
                </div>
              </div>

              {/* Status & Summary Box */}
              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Khoảng thời gian:</span>
                  <span className="font-semibold text-slate-900">
                    {formatDateVi(startDate)} → {formatDateVi(endDate)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Tổng số ngày:</span>
                  <span className="font-bold text-slate-800">
                    {dayCount > 0 ? `${dayCount} ngày` : 'Không hợp lệ'}
                  </span>
                </div>

                {isFutureIncluded && (
                  <div className="flex items-start gap-1.5 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Khoảng ngày này chứa các ngày sau 03/09/2026. Số Pageview thực tế chỉ có đến 03/09/2026.
                    </span>
                  </div>
                )}

                {!isValid && (
                  <div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-700">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Hint Notice */}
            <div className="text-[11px] text-slate-500 flex items-start gap-1.5 bg-blue-50/50 border border-blue-100 p-2.5 rounded-lg">
              <Info className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Khi chọn khoảng thời gian tùy chỉnh, bảng điều khiển sẽ tính tổng Pageview và KPI trong khoảng ngày tương ứng, so sánh với khoảng thời gian liền kề trước đó.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!isValid}
              onClick={handleApply}
              className={`px-5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                isValid
                  ? 'bg-red-700 hover:bg-red-800 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              <span>Áp dụng khoảng thời gian</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

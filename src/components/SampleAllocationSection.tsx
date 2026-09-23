import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Save,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { SampleAllocationRow } from '../types';
import { formatNumber, formatCompactNumber } from '../services/dataService';

interface SampleAllocationSectionProps {
  rows: SampleAllocationRow[];
  targetAllocations: Record<string, number>;
  onUpdateTargetAllocation: (market: string, targetPct: number | null) => void;
  onSaveAllAllocations: (newAllocations: Record<string, number>) => void;
  onResetAllocations: () => void;
  selectedMonth: number | 'all';
}

export const SampleAllocationSection: React.FC<SampleAllocationSectionProps> = ({
  rows,
  targetAllocations,
  onUpdateTargetAllocation,
  onSaveAllAllocations,
  onResetAllocations,
  selectedMonth,
}) => {
  const [editingAllocations, setEditingAllocations] = useState<Record<string, string>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Top markets (display top 15 for concise management)
  const topRows = rows.slice(0, 15);

  const handleInputChange = (market: string, val: string) => {
    setEditingAllocations((prev) => ({
      ...prev,
      [market]: val,
    }));
  };

  const handleSave = () => {
    const updated: Record<string, number> = { ...targetAllocations };
    Object.entries(editingAllocations).forEach(([market, val]) => {
      const num = parseFloat(val);
      if (!isNaN(num) && num >= 0) {
        updated[market] = num;
      }
    });
    onSaveAllAllocations(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Quick preset: standard recommended OV sample distribution
  const handleLoadPreset = () => {
    const preset: Record<string, number> = {
      'United States': 43.0,
      Australia: 10.0,
      Singapore: 8.5,
      Japan: 7.5,
      Germany: 6.5,
      Canada: 6.0,
      China: 3.5,
      'Hong Kong': 3.0,
      France: 2.5,
      'South Korea': 2.0,
      Czechia: 1.5,
      Taiwan: 1.5,
      Cambodia: 1.2,
      Thailand: 1.2,
      'United Kingdom': 1.1,
    };
    onSaveAllAllocations(preset);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Calculate overall target coverage
  const totalConfiguredTarget = Object.values(targetAllocations).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-700" />
              Kiểm tra Phân bổ Mẫu (Sample Allocation Monitor)
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {selectedMonth === 'all' ? 'Toàn kỳ (T1-T9)' : `Tháng ${selectedMonth}`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            So sánh tỷ trọng phân bổ mẫu thực tế (% Actual PV) so với hạn mức kế hoạch (% Target) theo từng thị trường.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={handleLoadPreset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
            title="Áp dụng cấu hình phân bổ mẫu chuẩn thí điểm OV"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Nạp mẫu chuẩn OV</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-medium shadow-2xs"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{savedSuccess ? 'Đã lưu!' : 'Lưu tỷ trọng'}</span>
          </button>

          <button
            type="button"
            onClick={onResetAllocations}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            title="Đặt lại cài đặt mẫu mặc định"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Header Bar & Methodology Info (i) */}
      <div className="border-b border-slate-200 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <span>Phân bổ mẫu theo 15 Thị trường hải ngoại</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded" title="Phân bổ mẫu thực tế = Lượng PV thị trường / Tổng PV toàn bộ thị trường">
            <Info className="h-3 w-3 text-slate-400" />
            Đối soát chuẩn tỷ trọng tự nhiên
          </span>
        </div>

        <span className="text-[11px] text-slate-500 font-mono">
          Tổng Target đã cấu hình: <strong className="text-slate-900">{totalConfiguredTarget.toFixed(1)}%</strong>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-2.5 px-3">Thị trường</th>
                <th className="py-2.5 px-3 text-right">Lượng PV Thực tế</th>
                <th className="py-2.5 px-3 text-right">% Phân bổ Thực tế</th>
                <th className="py-2.5 px-3 text-right w-36">% Mục tiêu (Target)</th>
                <th className="py-2.5 px-3 text-right">Độ lệch (Variance)</th>
                <th className="py-2.5 px-3 text-center">Trạng thái Mẫu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topRows.map((row) => {
                const currentEditVal =
                  editingAllocations[row.market] !== undefined
                    ? editingAllocations[row.market]
                    : row.targetSamplePct !== null
                    ? String(row.targetSamplePct)
                    : '';

                return (
                  <tr key={row.market} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{row.market}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {formatNumber(row.actualPv)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {row.actualSamplePct.toFixed(2)}%
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={currentEditVal}
                          onChange={(e) => handleInputChange(row.market, e.target.value)}
                          placeholder="Chưa set"
                          className="w-20 text-right text-xs font-mono font-bold bg-white border border-slate-300 rounded px-1.5 py-0.5 focus:border-slate-800 focus:outline-none"
                        />
                        <span className="text-slate-500 font-bold">%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {row.variance !== null ? (
                        <span
                          className={
                            Math.abs(row.variance) <= 2.0
                              ? 'text-emerald-700'
                              : row.variance > 2.0
                              ? 'text-purple-700'
                              : 'text-amber-700'
                          }
                        >
                          {row.variance > 0 ? '+' : ''}
                          {row.variance.toFixed(2)} pp
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.status === 'On Target' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" /> Chuẩn mẫu (On Target)
                        </span>
                      )}
                      {row.status === 'Under Sample' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle className="h-3 w-3" /> Thiếu mẫu (Under)
                        </span>
                      )}
                      {row.status === 'Over Sample' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
                          <AlertTriangle className="h-3 w-3" /> Vượt mẫu (Over)
                        </span>
                      )}
                      {row.status === 'Not Configured' && (
                        <span className="text-[11px] text-slate-600 italic">
                          Chưa thiết lập mục tiêu
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
    </div>
  );
};

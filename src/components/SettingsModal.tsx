import React, { useState } from 'react';
import {
  X,
  Settings,
  Bell,
  AlertTriangle,
  RotateCcw,
  Save,
  Check,
} from 'lucide-react';
import { AlertThresholds } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: AlertThresholds;
  onSaveThresholds: (thresholds: AlertThresholds) => void;
  onResetThresholds: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  thresholds,
  onSaveThresholds,
  onResetThresholds,
}) => {
  const [formData, setFormData] = useState<AlertThresholds>(thresholds);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveThresholds(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <Settings className="h-5 w-5 text-red-700" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Cấu hình Ngưỡng Cảnh báo Sớm
              </h3>
              <p className="text-xs text-slate-500">
                Tự động kích hoạt thông báo điều hành khi các chỉ số vượt ngưỡng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* KPI Warning Threshold */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Ngưỡng Cảnh báo KPI (Warning Threshold)</span>
              <span className="font-mono text-red-700 font-bold">
                {formData.kpiWarningThreshold}%
              </span>
            </label>
            <input
              type="range"
              min="70"
              max="99"
              step="1"
              value={formData.kpiWarningThreshold}
              onChange={(e) =>
                setFormData({ ...formData, kpiWarningThreshold: Number(e.target.value) })
              }
              className="w-full accent-red-600"
            />
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cảnh báo khi tiến độ đạt KPI dưới mức này (Mặc định: 90%)
            </p>
          </div>

          {/* KPI Critical Threshold */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Ngưỡng Nghiêm trọng KPI (Critical Threshold)</span>
              <span className="font-mono text-red-800 font-bold">
                {formData.kpiCriticalThreshold}%
              </span>
            </label>
            <input
              type="range"
              min="50"
              max="89"
              step="1"
              value={formData.kpiCriticalThreshold}
              onChange={(e) =>
                setFormData({ ...formData, kpiCriticalThreshold: Number(e.target.value) })
              }
              className="w-full accent-red-800"
            />
            <p className="text-[11px] text-slate-500 mt-0.5">
              Báo động đỏ khi tiến độ đạt KPI dưới mức này (Mặc định: 80%)
            </p>
          </div>

          {/* Block Rate Surge */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Độ tăng Tỷ lệ Block Ads đột biến (Surge)</span>
              <span className="font-mono text-slate-900 font-bold">
                +{formData.blockRateSurgePp.toFixed(1)} pp
              </span>
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="10.0"
              value={formData.blockRateSurgePp}
              onChange={(e) =>
                setFormData({ ...formData, blockRateSurgePp: Number(e.target.value) })
              }
              className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-0.5">
              Kích hoạt cảnh báo khi tỷ lệ Block Ads tăng vọt trên mức này so với tháng trước
            </p>
          </div>

          {/* Sample Allocation Variance */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Độ lệch Phân bổ Mẫu Thị trường (Sample Variance)</span>
              <span className="font-mono text-slate-900 font-bold">
                &plusmn;{formData.sampleVariancePp.toFixed(1)} pp
              </span>
            </label>
            <input
              type="number"
              step="0.5"
              min="1.0"
              max="15.0"
              value={formData.sampleVariancePp}
              onChange={(e) =>
                setFormData({ ...formData, sampleVariancePp: Number(e.target.value) })
              }
              className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cảnh báo khi tỷ trọng thị trường lệch quá mức so với chỉ tiêu mục tiêu
            </p>
          </div>

          {/* Consecutive Days Drop */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Số ngày giảm liên tiếp (Consecutive Drop Days)</span>
              <span className="font-mono text-slate-900 font-bold">
                {formData.consecutiveDaysDropCount} ngày
              </span>
            </label>
            <input
              type="number"
              step="1"
              min="2"
              max="7"
              value={formData.consecutiveDaysDropCount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  consecutiveDaysDropCount: Number(e.target.value),
                })
              }
              className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-0.5">
              Phát hiện chuỗi ngày liên tiếp hụt KPI (Mặc định: 3 ngày)
            </p>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onResetThresholds();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              <span>Khôi phục mặc định</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
              >
                {savedSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Đã lưu</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Lưu Cấu hình</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

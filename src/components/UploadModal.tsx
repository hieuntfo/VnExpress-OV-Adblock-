import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RotateCcw,
} from 'lucide-react';
import {
  updateFolderDataset,
  updateCountryDataset,
  updateDateDataset,
  resetToDefaultDatasets,
} from '../services/dataService';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataUpdated: () => void;
}

type DatasetType = 'folder' | 'country' | 'date';

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onDataUpdated,
}) => {
  const [selectedType, setSelectedType] = useState<DatasetType>('date');
  const [pastedText, setPastedText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const datasetInfo = {
    folder: {
      title: 'Tập tin Folder (Chuyên mục theo tháng)',
      requiredCols: 'Folder, Month Number, PVS, PVS run ads, %KPI',
      desc: 'Dữ liệu phân tích lưu lượng theo chuyên mục nội dung và tháng.',
    },
    country: {
      title: 'Tập tin Country (Thị trường hải ngoại theo tháng)',
      requiredCols: 'Country, month, Pvs, Pvs run ads',
      desc: 'Dữ liệu phân bổ theo thị trường quốc gia và tháng.',
    },
    date: {
      title: 'Tập tin Date (KPI và Pageview thực tế theo ngày)',
      requiredCols: 'Day, KPI, Pageview',
      desc: 'Dữ liệu ghi nhận tiến độ hàng ngày và mục tiêu KPI.',
    },
  };

  const processCsvText = (csv: string) => {
    try {
      if (!csv || csv.trim().length === 0) {
        setStatusMessage({ type: 'error', text: 'Nội dung CSV không được để trống.' });
        return;
      }

      if (selectedType === 'folder') {
        updateFolderDataset(csv);
        setStatusMessage({
          type: 'success',
          text: 'Đã cập nhật thành công dữ liệu Chuyên mục (Folder).',
        });
      } else if (selectedType === 'country') {
        updateCountryDataset(csv);
        setStatusMessage({
          type: 'success',
          text: 'Đã cập nhật thành công dữ liệu Thị trường (Country).',
        });
      } else if (selectedType === 'date') {
        updateDateDataset(csv);
        setStatusMessage({
          type: 'success',
          text: 'Đã cập nhật thành công dữ liệu Theo dõi ngày (Date KPI).',
        });
      }
      setPastedText('');
      onDataUpdated();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Lỗi khi xử lý file CSV: ${err.message || 'Định dạng không hợp lệ'}`,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processCsvText(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        processCsvText(content);
      };
      reader.readAsText(file);
    }
  };

  const handleReset = () => {
    resetToDefaultDatasets();
    setStatusMessage({
      type: 'success',
      text: 'Đã khôi phục toàn bộ 3 tập dữ liệu gốc ban đầu.',
    });
    onDataUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <Upload className="h-5 w-5 text-red-700" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Cập nhật Dữ liệu CSV Mới
              </h3>
              <p className="text-xs text-slate-500">
                Tải lên hoặc dán dữ liệu CSV để cập nhật thời gian thực vào Dashboard
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Dataset selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Chọn tập dữ liệu cần cập nhật
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(['date', 'country', 'folder'] as DatasetType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSelectedType(type);
                    setStatusMessage(null);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedType === type
                      ? 'border-red-600 bg-red-50/40 ring-1 ring-red-500 text-slate-900'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <FileSpreadsheet
                      className={`h-4 w-4 ${
                        selectedType === type ? 'text-red-700' : 'text-slate-400'
                      }`}
                    />
                    <span>
                      {type === 'date'
                        ? '1. Date KPI'
                        : type === 'country'
                        ? '2. Country (Thị trường)'
                        : '3. Folder (Chuyên mục)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {type === 'date'
                      ? 'Ghi nhận theo ngày (Daily)'
                      : 'Lưu lượng tháng (Monthly)'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Dataset specification box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="font-semibold text-slate-800">
              {datasetInfo[selectedType].title}
            </div>
            <div className="text-slate-600">{datasetInfo[selectedType].desc}</div>
            <div className="font-mono text-[11px] text-slate-700 pt-1 border-t border-slate-200 mt-1">
              <strong>Các cột yêu cầu:</strong> {datasetInfo[selectedType].requiredCols}
            </div>
          </div>

          {/* Drag & Drop File Upload */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              dragActive
                ? 'border-red-500 bg-red-50/30'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
            <div className="text-xs font-semibold text-slate-800">
              Kéo và thả file .CSV vào đây, hoặc{' '}
              <label className="text-red-700 hover:text-red-800 underline cursor-pointer font-bold">
                chọn file từ máy tính
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Chấp nhận định dạng CSV phân tách bằng dấu phẩy (UTF-8)
            </p>
          </div>

          {/* Alternative: Direct Text Paste */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Hoặc dán nội dung CSV trực tiếp:</span>
              <span className="text-[11px] font-normal text-slate-500 font-mono">
                {pastedText ? `${pastedText.split('\n').length} dòng` : 'Trống'}
              </span>
            </label>
            <textarea
              rows={4}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Dán toàn bộ nội dung CSV kèm header vào đây..."
              className="w-full font-mono text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
            {pastedText.trim() && (
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => processCsvText(pastedText)}
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
                >
                  Xử lý và Cập nhật Dữ liệu
                </button>
              </div>
            )}
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

          {/* Reset button */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              <span>Khôi phục về dữ liệu mặc định ban đầu</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

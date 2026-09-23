import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Calendar,
  Globe2,
  FolderTree,
  FileCheck,
  ArrowRight,
} from 'lucide-react';
import {
  analyzeCsvContent,
  updateAllDatasets,
  updateFolderDataset,
  updateCountryDataset,
  updateDateDataset,
  resetToDefaultDatasets,
  DetectedDatasetInfo,
} from '../services/dataService';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataUpdated: () => void;
}

type DatasetType = 'date' | 'country' | 'folder';

interface StagedFile {
  file: File;
  content: string;
  name: string;
  size: number;
  analysis: DetectedDatasetInfo;
}

const DATASET_CONFIG: Record<
  DatasetType,
  {
    title: string;
    subTitle: string;
    icon: React.ReactNode;
    color: string;
    bgBadge: string;
    requiredCols: string[];
    description: string;
    exampleFilename: string;
  }
> = {
  date: {
    title: 'Date KPI (Theo dõi theo ngày)',
    subTitle: 'Pageviews & Mục tiêu KPI hàng ngày',
    icon: <Calendar className="h-4 w-4 text-emerald-600" />,
    color: 'emerald',
    bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    requiredCols: ['Day', 'KPI', 'Pageview'],
    description: 'Bản ghi lưu lượng và KPI từng ngày từ 01/01/2026 đến nay.',
    exampleFilename: 'date.csv, daily_kpi.csv',
  },
  country: {
    title: 'Country (Thị trường Hải ngoại)',
    subTitle: 'Lưu lượng PVS & PVS Run Ads theo từng nước',
    icon: <Globe2 className="h-4 w-4 text-blue-600" />,
    color: 'blue',
    bgBadge: 'bg-blue-50 text-blue-700 border-blue-200',
    requiredCols: ['Country', 'month', 'Pvs', 'Pvs run ads'],
    description: 'Dữ liệu phân bổ theo 10 thị trường trọng điểm (Úc, Mỹ, Nhật,...) theo tháng.',
    exampleFilename: 'country.csv, thi_truong.csv',
  },
  folder: {
    title: 'Folder (Chuyên mục Nội dung)',
    subTitle: 'Lưu lượng PVS & PVS Run Ads theo chuyên mục',
    icon: <FolderTree className="h-4 w-4 text-purple-600" />,
    color: 'purple',
    bgBadge: 'bg-purple-50 text-purple-700 border-purple-200',
    requiredCols: ['Folder', 'Month Number', 'PVS', 'PVS run ads', '%KPI'],
    description: 'Lưu lượng theo các chuyên mục: Thời sự, Kinh doanh, Thể thao, Du lịch,...',
    exampleFilename: 'folder.csv, chuyen_muc.csv',
  },
};

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onDataUpdated,
}) => {
  // Slots for the 3 datasets
  const [stagedFiles, setStagedFiles] = useState<Record<DatasetType, StagedFile | null>>({
    date: null,
    country: null,
    folder: null,
  });

  const [dragActive, setDragActive] = useState(false);
  const [previewType, setPreviewType] = useState<DatasetType | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);

  // Fallback paste mode state
  const [isManualPasteOpen, setIsManualPasteOpen] = useState(false);
  const [pasteTargetType, setPasteTargetType] = useState<DatasetType>('date');
  const [pastedText, setPastedText] = useState('');

  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const singleDateInputRef = useRef<HTMLInputElement>(null);
  const singleCountryInputRef = useRef<HTMLInputElement>(null);
  const singleFolderInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process list of incoming files (can be 1, 2, or 3 files)
  const handleIncomingFiles = async (files: FileList | File[]) => {
    setStatusMessage(null);
    const fileArray = Array.from(files).filter(
      (f) => f.name.toLowerCase().endsWith('.csv') || f.type.includes('csv') || f.type === ''
    );

    if (fileArray.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'Vui lòng chọn các file có định dạng đuôi .csv',
      });
      return;
    }

    const updated = { ...stagedFiles };
    const reports: string[] = [];

    for (const file of fileArray) {
      try {
        const text = await file.text();
        const analysis = analyzeCsvContent(text, file.name);

        let targetSlot: DatasetType = 'date';
        if (analysis.type === 'folder') {
          targetSlot = 'folder';
        } else if (analysis.type === 'country') {
          targetSlot = 'country';
        } else if (analysis.type === 'date') {
          targetSlot = 'date';
        } else {
          // Fallback guess based on empty slots
          if (!updated.folder) targetSlot = 'folder';
          else if (!updated.country) targetSlot = 'country';
          else targetSlot = 'date';
        }

        updated[targetSlot] = {
          file,
          content: text,
          name: file.name,
          size: file.size,
          analysis,
        };

        reports.push(
          `• ${file.name} ➔ Gán vào [${DATASET_CONFIG[targetSlot].title}] (${analysis.totalRows} dòng)`
        );
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: `Lỗi đọc file ${file.name}: ${err.message || 'Không đọc được file'}`,
        });
      }
    }

    setStagedFiles(updated);

    const stagedCount = Object.values(updated).filter(Boolean).length;
    if (stagedCount === 3) {
      setStatusMessage({
        type: 'success',
        text: `Đã nhận diện đủ 3/3 file CSV! Bấm "Cập nhật cả 3 file dữ liệu" để đồng bộ lên Dashboard.`,
      });
    } else {
      setStatusMessage({
        type: 'warning',
        text: `Đã tiếp nhận ${fileArray.length} file .csv (${stagedCount}/3 tập dữ liệu sẵn sàng). Bạn có thể đẩy thêm các file còn thiếu hoặc cập nhật ngay.`,
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleIncomingFiles(e.dataTransfer.files);
    }
  };

  const handleSingleSlotUpload = async (type: DatasetType, file: File) => {
    try {
      const text = await file.text();
      const analysis = analyzeCsvContent(text, file.name);
      setStagedFiles((prev) => ({
        ...prev,
        [type]: {
          file,
          content: text,
          name: file.name,
          size: file.size,
          analysis,
        },
      }));
      setStatusMessage({
        type: 'success',
        text: `Đã nạp file ${file.name} vào [${DATASET_CONFIG[type].title}].`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Lỗi đọc file ${file.name}: ${err.message}`,
      });
    }
  };

  const handleRemoveSlot = (type: DatasetType) => {
    setStagedFiles((prev) => ({ ...prev, [type]: null }));
    if (previewType === type) setPreviewType(null);
  };

  const handleReassignSlot = (fromType: DatasetType, toType: DatasetType) => {
    if (fromType === toType) return;
    const item = stagedFiles[fromType];
    if (!item) return;

    setStagedFiles((prev) => ({
      ...prev,
      [fromType]: prev[toType],
      [toType]: item,
    }));
  };

  const handleApplyAll = () => {
    try {
      const { date, country, folder } = stagedFiles;
      const count = [date, country, folder].filter(Boolean).length;

      if (count === 0) {
        setStatusMessage({
          type: 'error',
          text: 'Chưa có file CSV nào được tải lên để cập nhật.',
        });
        return;
      }

      updateAllDatasets({
        dateCsv: date?.content,
        countryCsv: country?.content,
        folderCsv: folder?.content,
      });

      setStatusMessage({
        type: 'success',
        text: `Cập nhật thành công ${count} tập dữ liệu CSV vào hệ thống! Toàn bộ chỉ số KPI, biểu đồ và bảng phân bổ đã được làm mới.`,
      });

      onDataUpdated();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Lỗi khi lưu dữ liệu: ${err.message || 'Dữ liệu CSV không hợp lệ'}`,
      });
    }
  };

  const handleProcessPastedText = () => {
    if (!pastedText.trim()) {
      setStatusMessage({ type: 'error', text: 'Vui lòng dán nội dung CSV.' });
      return;
    }
    try {
      if (pasteTargetType === 'folder') {
        updateFolderDataset(pastedText);
      } else if (pasteTargetType === 'country') {
        updateCountryDataset(pastedText);
      } else {
        updateDateDataset(pastedText);
      }

      setStatusMessage({
        type: 'success',
        text: `Đã cập nhật thành công dữ liệu ${DATASET_CONFIG[pasteTargetType].title} từ nội dung dán trực tiếp.`,
      });
      setPastedText('');
      onDataUpdated();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Lỗi cập nhật: ${err.message}`,
      });
    }
  };

  const handleResetToDefault = () => {
    resetToDefaultDatasets();
    setStagedFiles({ date: null, country: null, folder: null });
    setStatusMessage({
      type: 'success',
      text: 'Đã khôi phục toàn bộ 3 tập dữ liệu gốc ban đầu của VnExpress OV (Tháng 1 - Tháng 9/2026).',
    });
    onDataUpdated();
  };

  const stagedCount = Object.values(stagedFiles).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  Cập nhật Dữ liệu CSV — Đẩy 3 File Cùng Lúc
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">
                  .CSV Only
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kéo thả hoặc quét chọn đồng thời 3 file .csv (Date KPI, Country, Folder) để hệ thống tự động nhận diện
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

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Main 3-Files Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-red-600 bg-red-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-red-400 bg-slate-50/50 hover:bg-red-50/20'
            }`}
            onClick={() => multiFileInputRef.current?.click()}
          >
            <input
              ref={multiFileInputRef}
              type="file"
              multiple
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleIncomingFiles(e.target.files);
                }
              }}
            />
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-2.5 bg-white shadow-xs border border-slate-200 rounded-full text-red-700">
                <Upload className="h-6 w-6" />
              </div>
              <div className="flex items-center -space-x-1.5">
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-emerald-100 border-2 border-white text-[11px] font-bold text-emerald-800" title="File 1: Date">
                  1
                </span>
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-blue-100 border-2 border-white text-[11px] font-bold text-blue-800" title="File 2: Country">
                  2
                </span>
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-purple-100 border-2 border-white text-[11px] font-bold text-purple-800" title="File 3: Folder">
                  3
                </span>
              </div>
            </div>

            <h4 className="text-sm font-bold text-slate-800">
              Kéo thả cùng lúc 3 file .csv vào đây, hoặc{' '}
              <span className="text-red-700 underline underline-offset-2 hover:text-red-800 font-extrabold">
                bấm để chọn cả 3 file từ máy tính
              </span>
            </h4>
            <p className="text-xs text-slate-500 mt-1.5 max-w-lg mx-auto">
              Hệ thống sẽ <strong>tự động quét Header</strong> trong từng file để phân loại chính xác vào 3 tập:
              <span className="font-semibold text-slate-700"> Date KPI</span>,
              <span className="font-semibold text-slate-700"> Country</span>, và
              <span className="font-semibold text-slate-700"> Folder</span>.
            </p>
          </div>

          {/* 3 Staged Files Slots */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Trạng thái 3 tập dữ liệu CSV
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    stagedCount === 3
                      ? 'bg-emerald-100 text-emerald-800'
                      : stagedCount > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Đã nạp {stagedCount}/3 file
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Định dạng bắt buộc: CSV mã hóa UTF-8
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['date', 'country', 'folder'] as DatasetType[]).map((type) => {
                const config = DATASET_CONFIG[type];
                const staged = stagedFiles[type];

                return (
                  <div
                    key={type}
                    className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all ${
                      staged
                        ? 'border-emerald-300 bg-emerald-50/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Top bar with icon & status */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          {config.icon}
                          <span className="font-bold text-xs text-slate-900">
                            {config.title}
                          </span>
                        </div>
                        {staged ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            Đã nhận
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            Chưa có file
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 leading-tight mb-2.5">
                        {config.subTitle}
                      </p>

                      {/* File Details or Empty Placeholder */}
                      {staged ? (
                        <div className="p-2.5 rounded-lg bg-white border border-emerald-200 text-xs space-y-1 mb-3">
                          <div className="flex items-center justify-between font-semibold text-slate-800">
                            <span className="truncate max-w-[170px]" title={staged.name}>
                              📄 {staged.name}
                            </span>
                            <span className="text-[11px] text-slate-500 shrink-0 font-normal font-mono">
                              {(staged.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-600">
                            <span>Bản ghi: <strong>{staged.analysis.totalRows} dòng</strong></span>
                            {staged.analysis.missingRequiredFields.length > 0 ? (
                              <span className="text-amber-600 font-semibold" title={staged.analysis.missingRequiredFields.join(', ')}>
                                ⚠️ Thiếu {staged.analysis.missingRequiredFields.length} cột
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                                <FileCheck className="h-3 w-3" />
                                Chuẩn cột
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg border border-dashed border-slate-200 bg-white/70 text-[11px] space-y-1 mb-3">
                          <div className="text-slate-500">
                            <strong>Cột cần có:</strong> {config.requiredCols.join(', ')}
                          </div>
                          <div className="text-slate-400 italic">
                            Tên file mẫu: {config.exampleFilename}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions for this specific slot */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      {staged ? (
                        <>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewType(previewType === type ? null : type)
                              }
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                              title="Xem trước vài dòng dữ liệu đầu tiên"
                            >
                              {previewType === type ? (
                                <>
                                  <EyeOff className="h-3 w-3" />
                                  <span>Ẩn</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3 w-3" />
                                  <span>Xem trước</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSlot(type)}
                              className="text-[11px] text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Xóa file khỏi slot này"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Reassign dropdown */}
                          <select
                            value={type}
                            onChange={(e) =>
                              handleReassignSlot(type, e.target.value as DatasetType)
                            }
                            className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 rounded px-1 py-0.5 focus:outline-none"
                            title="Đổi phân loại cho file này"
                          >
                            <option value="date">Gán Date</option>
                            <option value="country">Gán Country</option>
                            <option value="folder">Gán Folder</option>
                          </select>
                        </>
                      ) : (
                        <div className="w-full">
                          <input
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            ref={
                              type === 'date'
                                ? singleDateInputRef
                                : type === 'country'
                                ? singleCountryInputRef
                                : singleFolderInputRef
                            }
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleSingleSlotUpload(type, f);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (type === 'date') singleDateInputRef.current?.click();
                              else if (type === 'country')
                                singleCountryInputRef.current?.click();
                              else singleFolderInputRef.current?.click();
                            }}
                            className="w-full text-center text-[11px] font-semibold text-slate-700 hover:text-red-700 bg-slate-100 hover:bg-red-50 py-1.5 rounded border border-slate-200 transition-colors"
                          >
                            + Chọn riêng file {type.toUpperCase()}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview Panel if active */}
          {previewType && stagedFiles[previewType] && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 animate-in fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-slate-700" />
                  <span className="text-xs font-bold text-slate-900">
                    Xem trước 5 dòng đầu: {stagedFiles[previewType]?.name} (
                    {DATASET_CONFIG[previewType].title})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewType(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Đóng xem trước
                </button>
              </div>

              {/* Detected columns badge list */}
              <div className="text-[11px] text-slate-600 mb-2 flex items-center flex-wrap gap-1">
                <span className="font-semibold text-slate-700">Các cột phát hiện:</span>
                {stagedFiles[previewType]?.analysis.detectedFields.map((field) => (
                  <span
                    key={field}
                    className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-800 font-mono text-[10px]"
                  >
                    {field}
                  </span>
                ))}
              </div>

              {/* Table preview */}
              <div className="overflow-x-auto max-h-48 border border-slate-200 rounded-lg bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-[11px]">
                  <thead className="bg-slate-50">
                    <tr>
                      {stagedFiles[previewType]?.analysis.detectedFields.map((field) => (
                        <th
                          key={field}
                          className="px-2.5 py-1.5 text-left font-bold text-slate-700 uppercase tracking-wider"
                        >
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {stagedFiles[previewType]?.analysis.previewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {stagedFiles[previewType]?.analysis.detectedFields.map((field) => (
                          <td key={field} className="px-2.5 py-1 text-slate-700 whitespace-nowrap">
                            {row[field] ?? '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : statusMessage.type === 'warning'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : statusMessage.type === 'warning' ? (
                <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Alternative: Toggle Manual CSV Paste */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsManualPasteOpen(!isManualPasteOpen)}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>{isManualPasteOpen ? '▲ Ẩn khung' : '▼ Cần dán nội dung văn bản CSV thủ công (Paste mode)?'}</span>
            </button>

            {isManualPasteOpen && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-700">Chọn tập dữ liệu:</label>
                  <select
                    value={pasteTargetType}
                    onChange={(e) => setPasteTargetType(e.target.value as DatasetType)}
                    className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1 focus:ring-1 focus:ring-red-500"
                  >
                    <option value="date">1. Date KPI (Day, KPI, Pageview)</option>
                    <option value="country">2. Country (Country, month, Pvs, Pvs run ads)</option>
                    <option value="folder">3. Folder (Folder, Month Number, PVS, PVS run ads, %KPI)</option>
                  </select>
                </div>

                <textarea
                  rows={3}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Dán nội dung CSV kèm dòng header vào đây..."
                  className="w-full font-mono text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-red-500"
                />

                {pastedText.trim() && (
                  <button
                    type="button"
                    onClick={handleProcessPastedText}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                  >
                    Cập nhật từ văn bản đã dán
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-200/60 transition-colors"
            title="Khôi phục toàn bộ 3 tập dữ liệu gốc ban đầu"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span>Khôi phục dữ liệu gốc VnExpress OV</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleApplyAll}
              disabled={stagedCount === 0}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold text-white shadow-xs transition-all ${
                stagedCount === 3
                  ? 'bg-red-700 hover:bg-red-800 cursor-pointer'
                  : stagedCount > 0
                  ? 'bg-amber-600 hover:bg-amber-700 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <span>
                {stagedCount === 3
                  ? 'Xác nhận & Cập nhật cả 3 file dữ liệu'
                  : stagedCount > 0
                  ? `Cập nhật ${stagedCount} file đã sẵn sàng`
                  : 'Chưa có file nào'}
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

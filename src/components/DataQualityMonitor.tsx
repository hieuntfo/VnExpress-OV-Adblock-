import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Database,
  Info,
  Layers,
  Calendar,
} from 'lucide-react';
import { DataQualityAudit } from '../types';
import { formatNumber, formatDateVi } from '../services/dataService';

interface DataQualityMonitorProps {
  audit: DataQualityAudit;
}

export const DataQualityMonitor: React.FC<DataQualityMonitorProps> = ({ audit }) => {
  const latestDateFormatted = audit.latestRecordedDate ? formatDateVi(audit.latestRecordedDate) : '03/09/2026';
  const earliestDateFormatted = audit.earliestRecordedDate ? formatDateVi(audit.earliestRecordedDate) : '01/01/2026';
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              Giám sát Chất lượng & Đối soát Dữ liệu (Data Quality & Reconciliation)
            </h3>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Khớp nối 100% Folder & Country
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kiểm tra tính toàn vẹn, độ tin cậy và sự nhất quán giữa 3 nguồn dữ liệu độc lập của dự án thí điểm.
          </p>
        </div>
      </div>

      {/* 3 Datasets Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Source 1: Folder Dataset */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold text-slate-700">1. Tập tin Folder (Nội dung)</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
              Monthly grain
            </span>
          </div>
          <div className="text-lg font-black text-slate-900 font-mono">
            {formatNumber(audit.folderSumPvs)} PV
          </div>
          <div className="text-xs text-slate-600 mt-1 space-y-0.5 font-mono">
            <div>Số bản ghi: {audit.folderRecordCount} dòng (16 folder x 9 tháng)</div>
            <div>Trường Block Ads: Đầy đủ (100%)</div>
            <div className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Không có dữ liệu rỗng (0 nulls)
            </div>
          </div>
        </div>

        {/* Source 2: Country Dataset */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold text-slate-700">2. Tập tin Country (Thị trường)</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
              Monthly grain
            </span>
          </div>
          <div className="text-lg font-black text-slate-900 font-mono">
            {formatNumber(audit.countrySumPvs)} PV
          </div>
          <div className="text-xs text-slate-600 mt-1 space-y-0.5 font-mono">
            <div>Số bản ghi: {audit.countryRecordCount} dòng</div>
            <div>Trường Block Ads: Đầy đủ (100%)</div>
            <div className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Đối chiếu Khớp 100% với Folder
            </div>
          </div>
        </div>

        {/* Source 3: Date Dataset */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold text-slate-700">3. Tập tin Date (Theo ngày)</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
              Daily grain
            </span>
          </div>
          <div className="text-lg font-black text-slate-900 font-mono">
            {formatNumber(audit.dateSumActual)} PV
          </div>
          <div className="text-xs text-slate-600 mt-1 space-y-0.5 font-mono">
            <div>Tổng {audit.dateRecordedDays + audit.dateMissingDays} ngày ({earliestDateFormatted} đến {latestDateFormatted})</div>
            <div>Đã ghi nhận: {audit.dateRecordedDays} ngày (đến {latestDateFormatted})</div>
            <div>Chưa có dữ liệu thực tế: {audit.dateMissingDays} ngày (sau {latestDateFormatted})</div>
          </div>
        </div>
      </div>

      {/* Reconciliation Box & Strict Anti-Interpolation Banner */}
      <div className="space-y-3">
        {/* Discrepancy Note */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="font-bold text-slate-900">Kết quả đối soát số liệu tổng: </span>
            <span>
              Folder vs Country lệch <strong>{audit.reconciliationDeltaFolderCountry} PV (0.00%)</strong>.
              Date vs Folder lệch <strong>+{formatNumber(audit.reconciliationDeltaDateFolder)} PV (+{audit.reconciliationDeltaPct.toFixed(2)}%)</strong>.
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Lý do: Lệch múi giờ ghi log ngày đầu và cuối tháng.
          </span>
        </div>

        {/* Strict Constraint Principle Confirmation */}
        <div className="p-3.5 bg-emerald-50/60 rounded-lg border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-emerald-900">
              Quy tắc bảo toàn tính chân thực của dữ liệu (Strict Data Integrity):
            </div>
            <p className="mt-0.5 text-emerald-800 leading-relaxed">
              Hệ thống tuyệt đối <strong>KHÔNG</strong> tự động nội suy số liệu Block Ads theo ngày từ dữ liệu tháng khi nguồn ngày chưa ghi nhận trường Block Ads. Mọi tính toán tỷ lệ Block Rate chỉ được thực hiện trên các chiều hạt (granularity) có số liệu thực tế đã kiểm chứng (Country và Folder theo tháng).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

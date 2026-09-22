import React from 'react';
import {
  Activity,
  FileSpreadsheet,
  Upload,
  Settings,
  RefreshCw,
  Printer,
  Download,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { DataQualityReport } from '../types';

interface NavbarProps {
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  onOpenDataQuality: () => void;
  onResetData: () => void;
  onPrint: () => void;
  onExportCsv?: () => void;
  dataQuality: DataQualityReport;
  lastRefresh: Date;
  dataSourceInfo: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenUpload,
  onOpenSettings,
  onOpenDataQuality,
  onResetData,
  onPrint,
  onExportCsv,
  dataQuality,
  lastRefresh,
  dataSourceInfo,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Brand & Title */}
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-lg bg-red-700 flex items-center justify-center text-white font-black text-xl tracking-tight shadow-xs">
              VnE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  VnExpress OV Adblock Control Tower
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Pilot Active
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Hệ thống Giám sát & Điều hành Thí điểm Adblock Thị trường Hải ngoại (Tháng 1 - Tháng 9/2026)
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Data Quality Status */}
            <button
              onClick={onOpenDataQuality}
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                dataQuality.rulePassed
                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
              }`}
              title="Xem kiểm định chất lượng dữ liệu"
            >
              {dataQuality.rulePassed ? (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              )}
              <span>Kiểm định ({dataQuality.totalRecordsChecked.toLocaleString()} dòng)</span>
            </button>

            {/* Upload button */}
            <button
              onClick={onOpenUpload}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <Upload className="h-3.5 w-3.5 text-slate-500" />
              <span>Cập nhật CSV</span>
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              title="Cấu hình ngưỡng cảnh báo"
            >
              <Settings className="h-3.5 w-3.5 text-slate-500" />
              <span>Ngưỡng cảnh báo</span>
            </button>

            {/* Print button */}
            <button
              onClick={onPrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              title="In hoặc xuất PDF báo cáo"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              <span>In báo cáo</span>
            </button>

            {/* Export CSV button */}
            {onExportCsv && (
              <button
                onClick={onExportCsv}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                title="Tải xuống tệp CSV tổng hợp"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Xuất CSV</span>
              </button>
            )}

            {/* Reset data */}
            <button
              onClick={onResetData}
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Khôi phục tập dữ liệu gốc"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Data source metadata line */}
        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-600 gap-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Nguồn dữ liệu:</span>
            <span>{dataSourceInfo}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Đối soát: 328,974,141 PVs khớp 100% giữa Folder, Country & Date</span>
            <span>Cập nhật lúc: {lastRefresh.toLocaleTimeString('vi-VN')}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

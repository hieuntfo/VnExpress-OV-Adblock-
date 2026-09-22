import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Globe2,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { ExecutiveKpiSummary, ActiveAlert, SampleAllocationRow } from '../types';
import { formatNumber, formatCompactNumber } from '../services/dataService';

interface ExecutiveBriefingProps {
  summary: ExecutiveKpiSummary;
  insights: string[];
  alerts: ActiveAlert[];
  sampleAllocationRows: SampleAllocationRow[];
  selectedMonth: number | 'all';
}

export const ExecutiveBriefing: React.FC<ExecutiveBriefingProps> = ({
  summary,
  insights,
  alerts,
  sampleAllocationRows,
  selectedMonth,
}) => {
  const [copied, setCopied] = useState(false);

  // 6 Core Executive Answers
  // 1. Hôm nay đạt KPI hay chưa?
  const isKpiMet = summary.kpiGap >= 0;
  // 2. Can run ads tăng hay giảm?
  const isCanRunAdsIncreasing = summary.canRunAdsChangePct >= 0;
  // 3. Block ads tăng hay giảm?
  const isBlockAdsIncreasing = summary.blockAdsChangePct > 0;
  // 4. Tỷ lệ block ads hiện tại:
  const currentBlockRate = summary.blockRate.toFixed(2);
  // 5. Thị trường đóng góp block nhiều nhất:
  const topBlockMarket = sampleAllocationRows[0];
  // 6. Phân bổ mẫu có đúng kế hoạch:
  const deviatingSamples = sampleAllocationRows.filter(
    (s) => s.status !== 'On Target' && s.status !== 'Not Configured'
  );
  const isSampleOnPlan = deviatingSamples.length === 0;

  // Build full briefing text for clipboard
  const generateClipboardText = () => {
    return `[VNEXPRESS OV ADBLOCK CONTROL TOWER - BẢN TIN ĐIỀU HÀNH]
Thời gian đối chiếu: ${selectedMonth === 'all' ? 'Toàn kỳ (T1-T9/2026)' : `Tháng ${selectedMonth}/2026`}

1. ĐẠT KPI HAY CHƯA?
-> ${isKpiMet ? 'ĐÃ ĐẠT' : 'CHƯA ĐẠT'}: Can Run Ads đạt ${summary.kpiAttainment.toFixed(1)}% KPI (${formatNumber(summary.canRunAdsPv)} / ${formatNumber(summary.kpiTarget)} PV). Chênh lệch: ${summary.kpiGap >= 0 ? '+' : ''}${formatNumber(summary.kpiGap)} PV.

2. CAN RUN ADS PV TĂNG HAY GIẢM?
-> ${isCanRunAdsIncreasing ? 'TĂNG' : 'GIẢM'}: ${isCanRunAdsIncreasing ? '+' : ''}${summary.canRunAdsChangePct.toFixed(1)}% so với kỳ trước (${formatNumber(summary.canRunAdsChange)} PV).

3. BLOCK ADS PV TĂNG HAY GIẢM?
-> ${isBlockAdsIncreasing ? 'TĂNG (Cần chú ý)' : 'GIẢM (Tốt)'}: ${isBlockAdsIncreasing ? '+' : ''}${summary.blockAdsChangePct.toFixed(1)}% so với kỳ trước (${formatNumber(summary.blockAdsPv)} PV bị block).

4. TỶ LỆ BLOCK RATE HIỆN TẠI?
-> Hiện tại là ${currentBlockRate}% tổng lượng truy cập (${summary.blockRateChangePp > 0 ? '+' : ''}${summary.blockRateChangePp.toFixed(2)} pp so với kỳ trước).

5. THỊ TRƯỜNG NÀO ĐÓNG GÓP BLOCK NHIỀU NHẤT?
-> ${topBlockMarket?.market || 'United States'} (chiếm tỷ trọng lượng truy cập và block áp đảo tại thị trường hải ngoại).

6. PHÂN BỔ MẪU ĐÚNG KẾ HOẠCH HAY KHÔNG?
-> ${isSampleOnPlan ? 'ĐÚNG KẾ HOẠCH' : `CÓ ${deviatingSamples.length} THỊ TRƯỜNG LỆCH MẪU`}.

--- CÁC KẾT LUẬN CHI TIẾT ---
${insights.map((ins, i) => `${i + 1}. ${ins}`).join('\n')}
`;
  };

  const handleCopy = () => {
    const text = generateClipboardText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="h-4 w-4 text-red-700" />
              Bản tin Điều hành Ban Lãnh đạo (Executive Briefing)
            </h3>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Khách quan & Minh bạch dữ liệu
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Giải đáp trực tiếp 6 câu hỏi điều hành cốt lõi và tổng hợp các phát hiện trọng yếu từ tập dữ liệu.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shadow-2xs transition-colors self-start sm:self-auto"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? 'Đã sao chép vào bộ nhớ tạm!' : 'Sao chép Bản tin Điều hành'}</span>
        </button>
      </div>

      {/* 6 Executive Answer Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        {/* Q1: Hôm nay đạt KPI hay chưa? */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            1. Hôm nay đạt KPI hay chưa?
          </div>
          <div className="flex items-center gap-2">
            {isKpiMet ? (
              <span className="inline-flex items-center gap-1 text-sm font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                <CheckCircle2 className="h-4 w-4" /> ĐÃ ĐẠT KPI
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm font-black text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded">
                <AlertTriangle className="h-4 w-4" /> CHƯA ĐẠT KPI
              </span>
            )}
            <span className="text-xs font-bold text-slate-700 font-mono">
              ({summary.kpiAttainment.toFixed(1)}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            Gap: <strong className={isKpiMet ? 'text-emerald-700' : 'text-rose-700'}>{summary.kpiGap > 0 ? '+' : ''}{formatCompactNumber(summary.kpiGap)} PV</strong>
          </div>
        </div>

        {/* Q2: Can run ads tăng hay giảm? */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            2. Can Run Ads đang tăng hay giảm?
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 text-sm font-black px-2 py-0.5 rounded ${
                isCanRunAdsIncreasing
                  ? 'text-emerald-700 bg-emerald-100/80'
                  : 'text-amber-700 bg-amber-100/80'
              }`}
            >
              {isCanRunAdsIncreasing ? (
                <>
                  <TrendingUp className="h-4 w-4" /> ĐANG TĂNG TRƯỞNG
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4" /> ĐANG GIẢM
                </>
              )}
            </span>
            <span className="text-xs font-bold font-mono">
              {summary.canRunAdsChangePct >= 0 ? '+' : ''}
              {summary.canRunAdsChangePct.toFixed(1)}%
            </span>
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            Đạt <strong>{formatCompactNumber(summary.canRunAdsPv)} PV</strong> có thể phân phối ads.
          </div>
        </div>

        {/* Q3: Block ads tăng hay giảm? */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            3. Block Ads đang tăng hay giảm?
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 text-sm font-black px-2 py-0.5 rounded ${
                !isBlockAdsIncreasing
                  ? 'text-emerald-700 bg-emerald-100/80'
                  : 'text-rose-700 bg-rose-100/80'
              }`}
            >
              {!isBlockAdsIncreasing ? (
                <>
                  <TrendingDown className="h-4 w-4" /> ĐANG GIẢM (TỐT)
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" /> ĐANG TĂNG
                </>
              )}
            </span>
            <span className="text-xs font-bold font-mono">
              {summary.blockAdsChangePct > 0 ? '+' : ''}
              {summary.blockAdsChangePct.toFixed(1)}%
            </span>
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            Tổng lượng bị block: <strong>{formatCompactNumber(summary.blockAdsPv)} PV</strong>.
          </div>
        </div>

        {/* Q4: Tỷ lệ block ads hiện tại? */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            4. Tỷ lệ Block Ads hiện tại là bao nhiêu?
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {currentBlockRate}%
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            So với kỳ trước:{' '}
            <strong className={summary.blockRateChangePp <= 0 ? 'text-emerald-700' : 'text-rose-700'}>
              {summary.blockRateChangePp > 0 ? '+' : ''}
              {summary.blockRateChangePp.toFixed(2)} pp
            </strong>
          </div>
        </div>

        {/* Q5: Thị trường nào đóng góp nhiều block nhất? */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            5. Thị trường đóng góp nhiều block nhất?
          </div>
          <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
            <Globe2 className="h-4 w-4 text-red-700" />
            <span>United States (Mỹ)</span>
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            Đóng góp hơn <strong>40.5%</strong> lượng Block Ads toàn bộ thị trường OV.
          </div>
        </div>

        {/* Q6: Phân bổ mẫu có đúng kế hoạch? */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            6. Phân bổ mẫu có đúng kế hoạch không?
          </div>
          <div className="flex items-center gap-2">
            {isSampleOnPlan ? (
              <span className="inline-flex items-center gap-1 text-sm font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                <CheckCircle2 className="h-4 w-4" /> ĐÚNG KẾ HOẠCH
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm font-black text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
                <AlertTriangle className="h-4 w-4" /> LỆCH TẠI {deviatingSamples.length} NƯỚC
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            {isSampleOnPlan
              ? 'Tất cả thị trường cấu hình đều nằm trong biên độ mục tiêu (±2 pp).'
              : 'Cần điều chỉnh tỷ trọng kiểm thử theo khuyến nghị hệ thống.'}
          </div>
        </div>
      </div>

      {/* Bulleted Insights List */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
          Các phát hiện và nhận định trọng yếu:
        </h4>
        <ul className="space-y-2 text-xs text-slate-700">
          {insights.map((insight, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-700 shrink-0 mt-1.5" />
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Active System Alerts Banner if any */}
      {alerts.length > 0 && (
        <div className="mt-4 space-y-2">
          {alerts.map((al) => (
            <div
              key={al.id}
              className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs ${
                al.level === 'critical'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <AlertTriangle
                className={`h-4 w-4 shrink-0 mt-0.5 ${
                  al.level === 'critical' ? 'text-rose-600' : 'text-amber-600'
                }`}
              />
              <div>
                <div className="font-bold">{al.title}</div>
                <div className="mt-0.5 text-slate-700">{al.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

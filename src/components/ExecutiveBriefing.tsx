import React, { useState, useMemo } from 'react';
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
  Info,
  Calculator,
} from 'lucide-react';
import { ExecutiveKpiSummary, ActiveAlert, SampleAllocationRow } from '../types';
import { formatNumber, formatCompactNumber, calculateMarketPerformance, COUNTRY_KPI_SPECS } from '../services/dataService';
import { MetricKey } from './MetricFormulaModal';

interface ExecutiveBriefingProps {
  summary: ExecutiveKpiSummary;
  insights: string[];
  alerts: ActiveAlert[];
  sampleAllocationRows: SampleAllocationRow[];
  selectedMonth: number | 'all';
  activeMarket?: string;
  onSelectMarket?: (market: string) => void;
  onOpenFormula?: (metric: MetricKey) => void;
}

export const ExecutiveBriefing: React.FC<ExecutiveBriefingProps> = ({
  summary,
  insights,
  alerts,
  sampleAllocationRows,
  selectedMonth,
  activeMarket,
  onSelectMarket,
  onOpenFormula,
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

  // 6. Tiến độ Thí điểm Úc & Nhật (Pilot Phase 1)
  const marketRows = useMemo(() => {
    return calculateMarketPerformance(selectedMonth);
  }, [selectedMonth]);

  const auRow = marketRows.find((r) => r.country.toLowerCase() === 'australia');
  const jpRow = marketRows.find((r) => r.country.toLowerCase() === 'japan');

  const auSpec = COUNTRY_KPI_SPECS['Australia'];
  const jpSpec = COUNTRY_KPI_SPECS['Japan'];

  const auBlockRate = auRow ? auRow.blockRate : auSpec?.blockRateBaseline || 15.26;
  const jpBlockRate = jpRow ? jpRow.blockRate : jpSpec?.blockRateBaseline || 16.06;

  const isAuTargetMet = auBlockRate <= (auSpec?.targetBlockRate10 || 13.74);
  const isJpTargetMet = jpBlockRate <= (jpSpec?.targetBlockRate10 || 14.45);

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

6. TIẾN ĐỘ THÍ ĐIỂM (ÚC & NHẬT BẢN):
-> Úc: Block Rate ${auBlockRate.toFixed(2)}% (Mốc chuẩn: ${auSpec?.blockRateBaseline || 15.26}%, Mục tiêu: ${auSpec?.targetBlockRate10 || 13.74}%) | Nhật Bản: Block Rate ${jpBlockRate.toFixed(2)}% (Mốc chuẩn: ${jpSpec?.blockRateBaseline || 16.06}%, Mục tiêu: ${jpSpec?.targetBlockRate10 || 14.45}%).

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
              Bản tin Điều hành (Executive Briefing)
            </h3>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Khách quan & Minh bạch dữ liệu
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Giải đáp trực tiếp 6 câu hỏi điều hành cốt lõi và tổng hợp các phát hiện trọng yếu từ tập dữ liệu.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onOpenFormula && (
            <button
              type="button"
              onClick={() => onOpenFormula('kpiAttainment')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Bấm để xem công thức tính các chỉ số"
            >
              <Calculator className="h-3.5 w-3.5 text-slate-600" />
              <span>Xem công thức chỉ số</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Đã sao chép vào bộ nhớ tạm!' : 'Sao chép Bản tin'}</span>
          </button>
        </div>
      </div>

      {/* 6 Executive Answer Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        {/* Q1: Hôm nay đạt KPI hay chưa? */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between group">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>1. Đạt KPI hay chưa?</span>
            {onOpenFormula && (
              <button
                type="button"
                onClick={() => onOpenFormula('kpiAttainment')}
                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Xem công thức tính KPI Attainment"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            )}
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
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between group">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>2. Can Run Ads đang tăng hay giảm?</span>
            {onOpenFormula && (
              <button
                type="button"
                onClick={() => onOpenFormula('canRunAdsPv')}
                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Xem công thức tính Can Run Ads PV"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            )}
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
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between group">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>3. Block Ads đang tăng hay giảm?</span>
            {onOpenFormula && (
              <button
                type="button"
                onClick={() => onOpenFormula('blockAdsPv')}
                className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                title="Xem công thức tính Block Ads PV"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            )}
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
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between group">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>4. Tỷ lệ Block Ads hiện tại là bao nhiêu?</span>
            {onOpenFormula && (
              <button
                type="button"
                onClick={() => onOpenFormula('blockRate')}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Xem công thức tính Block Rate"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            )}
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

        {/* Q6: Tiến độ Thí điểm Úc & Nhật (Pilot Phase 1) */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>6. Tiến độ thí điểm (Úc &amp; Nhật)?</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
              Pilot Phase 1
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 my-1">
            {/* Úc Card */}
            <button
              type="button"
              onClick={() =>
                onSelectMarket &&
                onSelectMarket(activeMarket?.toLowerCase() === 'australia' ? 'all' : 'Australia')
              }
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                activeMarket?.toLowerCase() === 'australia'
                  ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300 shadow-xs'
                  : 'bg-white hover:bg-blue-50/70 border-slate-200 shadow-2xs'
              }`}
              title="Bấm để lọc chi tiết thị trường Úc"
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <span>🇦🇺</span> Úc
                </span>
                <span
                  className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                    isAuTargetMet
                      ? 'text-emerald-800 bg-emerald-100'
                      : auBlockRate <= (auSpec?.blockRateBaseline || 15.26)
                      ? 'text-blue-800 bg-blue-100'
                      : 'text-amber-800 bg-amber-100'
                  }`}
                >
                  {isAuTargetMet ? '✓ Đạt MT' : auBlockRate <= (auSpec?.blockRateBaseline || 15.26) ? 'Giảm tốt' : 'Theo dõi'}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-black text-slate-900">
                  {auBlockRate.toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  MT: {auSpec?.targetBlockRate10 || 13.74}%
                </span>
              </div>
            </button>

            {/* Nhật Bản Card */}
            <button
              type="button"
              onClick={() =>
                onSelectMarket &&
                onSelectMarket(activeMarket?.toLowerCase() === 'japan' ? 'all' : 'Japan')
              }
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                activeMarket?.toLowerCase() === 'japan'
                  ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300 shadow-xs'
                  : 'bg-white hover:bg-rose-50/70 border-slate-200 shadow-2xs'
              }`}
              title="Bấm để lọc chi tiết thị trường Nhật Bản"
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <span>🇯🇵</span> Nhật
                </span>
                <span
                  className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                    isJpTargetMet
                      ? 'text-emerald-800 bg-emerald-100'
                      : jpBlockRate <= (jpSpec?.blockRateBaseline || 16.06)
                      ? 'text-blue-800 bg-blue-100'
                      : 'text-amber-800 bg-amber-100'
                  }`}
                >
                  {isJpTargetMet ? '✓ Đạt MT' : jpBlockRate <= (jpSpec?.blockRateBaseline || 16.06) ? 'Giảm tốt' : 'Theo dõi'}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-black text-slate-900">
                  {jpBlockRate.toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  MT: {jpSpec?.targetBlockRate10 || 14.45}%
                </span>
              </div>
            </button>
          </div>

          <div className="text-[11px] text-slate-600 mt-0.5 flex items-center justify-between">
            <span>Mục tiêu giảm Block Rate 10% – 15%.</span>
            <span className="text-[10px] text-slate-400 font-semibold italic">* Bấm để lọc nhanh</span>
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

import React, { useState } from 'react';
import {
  X,
  Info,
  Calculator,
  Target,
  ShieldAlert,
  Eye,
  TrendingUp,
  TrendingDown,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ExecutiveKpiSummary } from '../types';
import { formatNumber, formatCompactNumber } from '../services/dataService';

export type MetricKey =
  | 'totalPageviews'
  | 'canRunAdsPv'
  | 'blockAdsPv'
  | 'blockRate'
  | 'kpiAttainment'
  | 'kpiGap';

interface MetricFormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMetric?: MetricKey;
  summary: ExecutiveKpiSummary;
}

interface MetricDefinition {
  key: MetricKey;
  title: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  shortDesc: string;
  formulaDisplay: string;
  formulaExplanation: string[];
  currentCalculation: {
    formulaWithNumbers: string;
    result: string;
    breakdown: { label: string; value: string; note: string }[];
  };
  businessImpact: string;
  actionRule: string;
}

export const MetricFormulaModal: React.FC<MetricFormulaModalProps> = ({
  isOpen,
  onClose,
  initialMetric = 'kpiAttainment',
  summary,
}) => {
  const [selectedKey, setSelectedKey] = useState<MetricKey>(initialMetric);

  // Sync selectedKey when initialMetric changes
  React.useEffect(() => {
    if (initialMetric) {
      setSelectedKey(initialMetric);
    }
  }, [initialMetric]);

  if (!isOpen) return null;

  // Build metrics with live numbers from current summary
  const metrics: Record<MetricKey, MetricDefinition> = {
    kpiAttainment: {
      key: 'kpiAttainment',
      title: 'KPI Attainment (Tỷ lệ đạt KPI)',
      badge: 'Chỉ số đo lường hiệu quả',
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
      icon: <Target className="h-5 w-5 text-red-600" />,
      shortDesc: 'Đo lường mức độ hoàn thành chỉ tiêu Pageview có thể chạy quảng cáo (Can Run Ads) so với kế hoạch được giao.',
      formulaDisplay: `KPI Attainment (%) = [ Pageview Can Run Ads thực tế ÷ Mục tiêu KPI Target ] × 100%`,
      formulaExplanation: [
        'Pageview Can Run Ads: Số lượt xem trang thực tế KHÔNG bị phần mềm chặn quảng cáo (Adblock) can thiệp.',
        'Mục tiêu KPI Target: Tổng hạn ngạch Pageview được giao trong kỳ quan sát (tính bằng tổng cột KPI theo ngày trong Date CSV).',
        'Lưu ý quan trọng: Hệ thống không lấy Tổng Pageview thô chia cho KPI, mà lấy Can Run Ads PV chia cho KPI để phản ánh đúng năng lực tạo doanh thu quảng cáo.',
      ],
      currentCalculation: {
        formulaWithNumbers: `[ ${formatNumber(summary.canRunAdsPv)} ÷ ${formatNumber(summary.kpiTarget)} ] × 100% = ${summary.kpiAttainment.toFixed(2)}%`,
        result: `${summary.kpiAttainment.toFixed(1)}% (${summary.kpiAttainment >= 100 ? 'Vượt chỉ tiêu' : 'Chưa đạt chỉ tiêu'})`,
        breakdown: [
          {
            label: 'Can Run Ads PV thực tế',
            value: `${formatCompactNumber(summary.canRunAdsPv)} (${formatNumber(summary.canRunAdsPv)} PV)`,
            note: 'Lấy từ dữ liệu Folder/Country thực tế trong kỳ',
          },
          {
            label: 'Mục tiêu KPI Target',
            value: `${formatCompactNumber(summary.kpiTarget)} (${formatNumber(summary.kpiTarget)} PV)`,
            note: 'Tổng định mức giao theo từng ngày từ Date CSV',
          },
          {
            label: 'Tỷ lệ đạt được',
            value: `${summary.kpiAttainment.toFixed(2)}%`,
            note: summary.kpiAttainment >= 100 ? 'Đạt tiêu chuẩn điều hành' : 'Dưới ngưỡng an toàn, cần giải pháp bù đắp',
          },
        ],
      },
      businessImpact:
        'Chỉ số sinh tồn của chiến dịch thí điểm. Nếu KPI Attainment < 90%, doanh thu quảng cáo hải ngoại đang bị ảnh hưởng nghiêm trọng bởi Adblock hoặc hụt lưu lượng.',
      actionRule:
        'Khi tỷ lệ < 90%: Rà soát ngay tỷ lệ Block Rate theo từng Chuyên mục & Thị trường trọng điểm để triển khai kịch bản chống chặn (Anti-Adblock) hoặc điều chỉnh ngân sách.',
    },

    kpiGap: {
      key: 'kpiGap',
      title: 'KPI Gap (Chênh lệch Thừa / Thiếu KPI)',
      badge: 'Khối lượng chênh lệch',
      badgeColor: summary.kpiGap >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <Calculator className="h-5 w-5 text-indigo-600" />,
      shortDesc: 'Đo lường số lượng Pageview cụ thể thừa hoặc thiếu so với mục tiêu KPI đã cam kết.',
      formulaDisplay: `KPI Gap (PV) = Pageview Can Run Ads thực tế - Mục tiêu KPI Target`,
      formulaExplanation: [
        'Dấu (+) Dương: Hoàn thành vượt mức, dư thừa Pageview quảng cáo để dự phòng hoặc bù đắp các kỳ thấp điểm.',
        'Dấu (-) Âm: Thiếu hụt Pageview quảng cáo, phản ánh khối lượng lưu lượng cần phải bù đắp ngay.',
      ],
      currentCalculation: {
        formulaWithNumbers: `${formatNumber(summary.canRunAdsPv)} - ${formatNumber(summary.kpiTarget)} = ${summary.kpiGap > 0 ? '+' : ''}${formatNumber(summary.kpiGap)} PV`,
        result: `${summary.kpiGap > 0 ? '+' : ''}${formatCompactNumber(summary.kpiGap)} PV`,
        breakdown: [
          {
            label: 'Can Run Ads PV thực tế',
            value: `${formatNumber(summary.canRunAdsPv)} PV`,
            note: 'Thực tế đạt được',
          },
          {
            label: 'Mục tiêu KPI Target',
            value: `${formatNumber(summary.kpiTarget)} PV`,
            note: 'Mức chuẩn yêu cầu',
          },
          {
            label: 'Khoảng cách chênh lệch',
            value: `${summary.kpiGap > 0 ? '+' : ''}${formatNumber(summary.kpiGap)} PV`,
            note: summary.kpiGap >= 0 ? 'Thặng dư an toàn' : 'Thiếu hụt cần bù đắp',
          },
        ],
      },
      businessImpact:
        'Cung cấp con số tuyệt đối chính xác cho phòng Kinh doanh & Lập kế hoạch để tính toán cơ cấu doanh thu bù đắp.',
      actionRule:
        summary.kpiGap < 0
          ? `Cần thu hồi tối thiểu ${formatCompactNumber(Math.abs(summary.kpiGap))} PV từ lượng bị Block Ads hoặc kích cầu thêm traffic hải ngoại.`
          : 'Duy trì chiến lược hiện tại, tiếp tục theo dõi biến động các tuần tiếp theo.',
    },

    canRunAdsPv: {
      key: 'canRunAdsPv',
      title: 'Can Run Ads PV (Pageview khả dụng quảng cáo)',
      badge: 'North Star Metric',
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
      icon: <Eye className="h-5 w-5 text-red-600" />,
      shortDesc: 'Tổng số lượt xem trang thực tế mà hệ thống quảng cáo phân phối thành công tới bạn đọc (không bị Adblock chặn).',
      formulaDisplay: `Can Run Ads PV = Total Pageviews - Block Ads PV (hoặc = Total Pageviews × [1 - Block Rate])`,
      formulaExplanation: [
        'Là thước đo giá trị cốt lõi mang lại doanh thu trực tiếp cho báo.',
        'Được tổng hợp từ các bảng ghi nhận chi tiết theo từng chuyên mục và thị trường.',
      ],
      currentCalculation: {
        formulaWithNumbers: `${formatNumber(summary.totalPageviews)} - ${formatNumber(summary.blockAdsPv)} = ${formatNumber(summary.canRunAdsPv)} PV`,
        result: `${formatCompactNumber(summary.canRunAdsPv)} (${summary.canRunAdsRate.toFixed(2)}% tổng PV)`,
        breakdown: [
          {
            label: 'Tổng lượt truy cập (Total Pageviews)',
            value: `${formatNumber(summary.totalPageviews)} PV`,
            note: '100% lưu lượng truy cập',
          },
          {
            label: 'Lượng bị chặn (Block Ads PV)',
            value: `-${formatNumber(summary.blockAdsPv)} PV`,
            note: `Tương đương ${summary.blockRate.toFixed(2)}% bị mất`,
          },
          {
            label: 'Lưu lượng chạy được Ads',
            value: `${formatNumber(summary.canRunAdsPv)} PV`,
            note: `Tương đương ${summary.canRunAdsRate.toFixed(2)}%`,
          },
        ],
      },
      businessImpact:
        'Mỗi 1 triệu Can Run Ads PV tăng thêm trực tiếp cải thiện doanh thu CPM/CPC của báo.',
      actionRule:
        'Tối ưu hóa các chuyên mục có tỷ lệ Can Run Ads cao như Trang chủ, Thế giới, Thể thao để đẩy mạnh lượng hiển thị.',
    },

    blockAdsPv: {
      key: 'blockAdsPv',
      title: 'Block Ads PV (Pageview bị chặn bởi Adblock)',
      badge: 'Tổn thất lưu lượng',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <ShieldAlert className="h-5 w-5 text-amber-600" />,
      shortDesc: 'Số lượt xem trang bị các tiện ích Adblock (như uBlock Origin, AdGuard, Brave, Adblock Plus) chặn không cho hiển thị quảng cáo.',
      formulaDisplay: `Block Ads PV = Total Pageviews - Can Run Ads PV`,
      formulaExplanation: [
        'Đại diện cho phần doanh thu tiềm năng bị mất đi do bạn đọc sử dụng công cụ chặn quảng cáo.',
        'Quy tắc bất biến dữ liệu: Luôn luôn có Block Ads PV + Can Run Ads PV = Total Pageviews.',
      ],
      currentCalculation: {
        formulaWithNumbers: `${formatNumber(summary.totalPageviews)} - ${formatNumber(summary.canRunAdsPv)} = ${formatNumber(summary.blockAdsPv)} PV`,
        result: `${formatCompactNumber(summary.blockAdsPv)} PV (${summary.blockRate.toFixed(2)}% tổng PV)`,
        breakdown: [
          {
            label: 'Tổng lượt xem (Total Pageviews)',
            value: `${formatNumber(summary.totalPageviews)} PV`,
            note: 'Tổng số lần đọc bài',
          },
          {
            label: 'Lượt xem chạy được Ads',
            value: `${formatNumber(summary.canRunAdsPv)} PV`,
            note: 'Phần người dùng không chặn Ads',
          },
          {
            label: 'Lượt xem bị chặn Ads',
            value: `${formatNumber(summary.blockAdsPv)} PV`,
            note: 'Tổn thất cần thu hồi qua chiến dịch',
          },
        ],
      },
      businessImpact:
        'Lượng thất thoát này có thể được thu hồi một phần (10% - 25%) thông qua thông điệp kêu gọi bạn đọc tắt Adblock (Whitelisting prompt) hoặc giải pháp chạy quảng cáo qua máy chủ (Server-side Ads).',
      actionRule:
        'Khi Block Ads PV tăng bất thường, rà soát lại thị trường phát sinh (chủ yếu là Mỹ, Úc, Đức, Nhật) để có đối sách thích ứng.',
    },

    blockRate: {
      key: 'blockRate',
      title: 'Block Rate (Tỷ lệ bị chặn quảng cáo)',
      badge: 'Chỉ số tỷ lệ',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      icon: <Percent className="h-5 w-5 text-slate-700" />,
      shortDesc: 'Tỷ lệ phần trăm tổng số lượt xem trang bị chặn không thể hiển thị quảng cáo.',
      formulaDisplay: `Block Rate (%) = [ Block Ads PV ÷ Total Pageviews ] × 100%`,
      formulaExplanation: [
        'Càng thấp càng tốt (Lower is better).',
        'Tổng của Block Rate (%) + Can Run Ads Rate (%) luôn bằng chính xác 100.00%.',
      ],
      currentCalculation: {
        formulaWithNumbers: `[ ${formatNumber(summary.blockAdsPv)} ÷ ${formatNumber(summary.totalPageviews)} ] × 100% = ${summary.blockRate.toFixed(2)}%`,
        result: `${summary.blockRate.toFixed(2)}% (${summary.blockRateChangePp <= 0 ? 'Cải thiện ' : 'Gia tăng '}${Math.abs(summary.blockRateChangePp).toFixed(2)} pp)`,
        breakdown: [
          {
            label: 'Block Ads PV',
            value: `${formatNumber(summary.blockAdsPv)} PV`,
            note: 'Tử số',
          },
          {
            label: 'Total Pageviews',
            value: `${formatNumber(summary.totalPageviews)} PV`,
            note: 'Mẫu số',
          },
          {
            label: 'Tỷ lệ Block Rate',
            value: `${summary.blockRate.toFixed(2)}%`,
            note: `Còn lại ${summary.canRunAdsRate.toFixed(2)}% là Can Run Ads`,
          },
        ],
      },
      businessImpact:
        'Cho biết mức độ phản ứng hoặc thói quen công nghệ của bạn đọc tại các thị trường hải ngoại.',
      actionRule:
        'Nếu Block Rate tăng trên +2.0 pp so với kỳ trước, hệ thống sẽ kích hoạt Cảnh báo Điều hành (Surge Alert) để đội ngũ kỹ thuật rà soát.',
    },

    totalPageviews: {
      key: 'totalPageviews',
      title: 'Total Pageviews (Tổng lượng truy cập)',
      badge: 'Quy mô lưu lượng',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <Layers className="h-5 w-5 text-blue-600" />,
      shortDesc: 'Tổng số lượt hiển thị trang ghi nhận được trong kỳ theo bộ lọc thị trường và chuyên mục.',
      formulaDisplay: `Total Pageviews = Can Run Ads PV + Block Ads PV = ∑ (PVS theo từng chuyên mục hoặc quốc gia)`,
      formulaExplanation: [
        'Quy mô tổng thể của toàn bộ lưu lượng hải ngoại (OV).',
        'Đối soát toàn vẹn 100% giữa Folder CSV, Country CSV và Date CSV.',
      ],
      currentCalculation: {
        formulaWithNumbers: `${formatNumber(summary.canRunAdsPv)} + ${formatNumber(summary.blockAdsPv)} = ${formatNumber(summary.totalPageviews)} PV`,
        result: `${formatCompactNumber(summary.totalPageviews)} (${formatNumber(summary.totalPageviews)} PVs)`,
        breakdown: [
          {
            label: 'Lượng chạy được Ads',
            value: `${formatNumber(summary.canRunAdsPv)} PV`,
            note: `${summary.canRunAdsRate.toFixed(2)}%`,
          },
          {
            label: 'Lượng bị Adblock chặn',
            value: `${formatNumber(summary.blockAdsPv)} PV`,
            note: `${summary.blockRate.toFixed(2)}%`,
          },
          {
            label: 'Tổng số Pageview',
            value: `${formatNumber(summary.totalPageviews)} PV`,
            note: '100% toàn bộ lưu lượng',
          },
        ],
      },
      businessImpact:
        'Xác lập quy mô thị trường để tính toán tỷ lệ thâm nhập và tiềm năng mở rộng doanh thu.',
      actionRule:
        'Kết hợp xem xét biến động lưu lượng (Total PV Change) với biến động Block Rate để xác định nguyên nhân sụt giảm KPI là do mất traffic hay do tăng tỷ lệ block.',
    },
  };

  const activeMetric = metrics[selectedKey];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600/30 text-red-400 border border-red-500/30">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Công thức & Phương pháp Tính toán Chỉ số
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Giải thích trực quan cách tính toán và đối chiếu số liệu theo bộ lọc đang chọn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation for All 6 Metrics */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center gap-2 overflow-x-auto">
          {(Object.keys(metrics) as MetricKey[]).map((key) => {
            const m = metrics[key];
            const isActive = selectedKey === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedKey(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                {m.title.split('(')[0].trim()}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Title & Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200">
                {activeMetric.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{activeMetric.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{activeMetric.shortDesc}</p>
              </div>
            </div>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${activeMetric.badgeColor}`}
            >
              {activeMetric.badge}
            </span>
          </div>

          {/* 1. Mathematical Formula Box */}
          <div className="bg-slate-50 rounded-xl p-4.5 border border-slate-200/90">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide mb-2.5">
              <Calculator className="h-4 w-4 text-slate-500" />
              Công thức toán học tổng quát
            </div>
            <div className="bg-white p-3.5 rounded-lg border border-slate-300 font-mono text-sm md:text-base font-bold text-slate-900 overflow-x-auto shadow-xs">
              {activeMetric.formulaDisplay}
            </div>

            {/* Explanation notes */}
            <div className="mt-3.5 space-y-1.5">
              {activeMetric.formulaExplanation.map((note, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="text-red-600 font-bold">•</span>
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Live Calculation with Current Filter Values */}
          <div className="bg-amber-50/40 rounded-xl p-4.5 border border-amber-200/80">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wide">
                <Info className="h-4 w-4 text-amber-600" />
                Thay số thực tế theo bộ lọc đang xem
              </div>
              <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                Thời gian: {summary.comparisonTitle || 'Kỳ đang chọn'}
              </span>
            </div>

            {/* Live Formula Computation */}
            <div className="bg-white p-3.5 rounded-lg border border-amber-300 font-mono text-xs md:text-sm font-bold text-slate-900 overflow-x-auto shadow-xs mb-3">
              {activeMetric.currentCalculation.formulaWithNumbers}
            </div>

            {/* Parameter Breakdown Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-3.5 py-2 bg-slate-100 text-[11px] font-bold text-slate-600 uppercase grid grid-cols-12 gap-2">
                <span className="col-span-4">Tham số</span>
                <span className="col-span-4 text-right">Giá trị thực tế</span>
                <span className="col-span-4 text-right">Ý nghĩa đối soát</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {activeMetric.currentCalculation.breakdown.map((item, idx) => (
                  <div key={idx} className="px-3.5 py-2.5 grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-4 font-semibold text-slate-800">{item.label}</span>
                    <span className="col-span-4 text-right font-mono font-bold text-slate-900">
                      {item.value}
                    </span>
                    <span className="col-span-4 text-right text-slate-500 text-[11px]">
                      {item.note}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Business Meaning & Action Rule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Ý nghĩa kinh doanh & điều hành
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeMetric.businessImpact}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Hành động khuyến nghị khi lệch chuẩn
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeMetric.actionRule}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Dữ liệu được chuẩn hóa và đối chiếu từ 3 tệp nội bộ: Folder CSV, Country CSV, Date CSV.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

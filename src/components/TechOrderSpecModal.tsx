import React, { useState } from 'react';
import {
  X,
  Target,
  ShieldAlert,
  Globe2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
  Zap,
  Info,
  Clock,
  Ban,
  FileCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { COUNTRY_KPI_SPECS, CountryKpiSpec, formatNumber, formatCompactNumber } from '../services/dataService';

interface TechOrderSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCountry?: (countryName: string) => void;
}

export const TechOrderSpecModal: React.FC<TechOrderSpecModalProps> = ({
  isOpen,
  onClose,
  onSelectCountry,
}) => {
  const [activeTab, setActiveTab] = useState<'kpis' | 'phases' | 'targets' | 'escalation'>('kpis');

  if (!isOpen) return null;

  const countryList = Object.values(COUNTRY_KPI_SPECS);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-[#9f224e] to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Target className="h-5 w-5 text-red-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Info KPI — AdBlock OV VnExpress (Order Tech 22/09/2026)
                </h2>
                <span className="text-[10px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  Chính thức
                </span>
              </div>
              <p className="text-xs text-red-100/90 font-medium">
                Tài liệu đặc tả nghiệp vụ, 2 KPI cốt lõi, Lộ trình quốc gia & Ngưỡng an toàn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('kpis')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'kpis'
                ? 'bg-white text-slate-900 border-[#9f224e]'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Target className="h-3.5 w-3.5 text-[#9f224e]" />
            1. Hai KPI Cốt lõi & Công thức
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('phases')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'phases'
                ? 'bg-white text-slate-900 border-[#9f224e]'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Globe2 className="h-3.5 w-3.5 text-blue-600" />
            2. Thứ tự triển khai 3 Giai đoạn
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('targets')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'targets'
                ? 'bg-white text-slate-900 border-[#9f224e]'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-emerald-600" />
            3. Bảng KPI Target theo Quốc gia
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('escalation')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'escalation'
                ? 'bg-white text-slate-900 border-[#9f224e]'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
            4. Cơ chế 4 bước & Guardrails
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          {/* TAB 1: KPIS */}
          {activeTab === 'kpis' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Định hướng nguyên tắc: </span>
                  T7-T8/2026 là 2 tháng ổn định nhất trước pilot — được quy định làm{' '}
                  <span className="font-bold underline">Baseline chính thức</span> cho mọi KPI.
                  (Lưu ý: T3-T4 Block Rate tăng bất thường 19-21% do IVT cleanup nên bị loại trừ).
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* KPI 1 Box */}
                <div className="border-2 border-rose-300 rounded-xl p-4 bg-gradient-to-br from-rose-50/50 to-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-rose-900 bg-rose-100 px-2 py-0.5 rounded">
                      KPI #1 CHÍNH THỨC
                    </span>
                    <span className="text-xs font-bold text-rose-700">Mục tiêu giảm ≥15%</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Block Rate (Tỷ lệ bị chặn quảng cáo)
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Đo lường tỷ lệ thất thoát lượt xem trang do người dùng bật Adblock.
                  </p>

                  <div className="mt-3 p-2.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs">
                    Block_Rate (%) = [ Block_Ads_PV ÷ Total_Pageviews ] × 100
                    <br />
                    = [ (PVS_tổng − PVS_run_ads) ÷ PVS_tổng ] × 100
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between border-b border-rose-100 pb-1">
                      <span className="text-slate-500">Toàn OV Baseline (T7-T8):</span>
                      <span className="font-bold text-slate-800">14,80%</span>
                    </div>
                    <div className="flex justify-between border-b border-rose-100 pb-1 text-rose-900 font-bold">
                      <span>Target giảm tối thiểu 15%:</span>
                      <span>≤ 12,58%</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Mốc an toàn (giảm 10%):</span>
                      <span>≤ 13,32%</span>
                    </div>
                  </div>
                </div>

                {/* KPI 2 Box */}
                <div className="border-2 border-emerald-300 rounded-xl p-4 bg-gradient-to-br from-emerald-50/50 to-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                      KPI #2 CHÍNH THỨC
                    </span>
                    <span className="text-xs font-bold text-emerald-700">Target +10%</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    KPI Attainment (Tỷ lệ đạt KPI)
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Đo lường mức độ hoàn thành sản lượng PVS chạy quảng cáo so với mục tiêu tăng trưởng.
                  </p>

                  <div className="mt-3 p-2.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs">
                    KPI_Attainment (%) = [ PVS_run_ads_thực_tế ÷ KPI_Target ] × 100
                    <br />
                    KPI_Target = PVS_run_ads_T7-T8_avg × (1 + 0.10)
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between border-b border-emerald-100 pb-1">
                      <span className="text-slate-500">Toàn OV Baseline (T7-T8):</span>
                      <span className="font-bold text-slate-800">31.184.996 PV/tháng</span>
                    </div>
                    <div className="flex justify-between border-b border-emerald-100 pb-1 text-emerald-900 font-bold">
                      <span>Target tăng +10%:</span>
                      <span>≥ 34.303.496 PV/tháng</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Target tăng +15%:</span>
                      <span>≥ 35.862.745 PV/tháng</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI 3: GA4 NCR */}
              <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black uppercase text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                    KPI #3 — GA4 REAL-TIME
                  </span>
                  <span className="text-xs font-semibold text-blue-700">Target T1: ≥8% | T3: ≥12%</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  NCR — Net Conversion Rate (Tỷ lệ chuyển đổi gỡ bỏ Adblock)
                </h4>
                <div className="mt-2 p-2 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs">
                  NCR (%) = Result_TatThanhCong ÷ (Result_TatThanhCong + Result_VanGiuAdblock) × 100
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Cảnh báo: Nếu NCR &lt; 5% sau 3 ngày pilot → Cần review ngay giao diện Tutorial Modal.
                </p>
              </div>

              {/* Correlation note */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-900">Mối liên hệ giữa các chỉ số:</span>
                <p>
                  Khi Block Rate giảm 1 điểm % → PVS run ads tăng tương ứng:
                </p>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5 ml-1">
                  <li>
                    <span className="font-semibold text-slate-800">Australia:</span> Tăng ~32.272 PVS run ads/tháng khi Block Rate giảm 1%.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-800">Japan:</span> Tăng ~22.074 PVS run ads/tháng khi Block Rate giảm 1%.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: PHASES */}
          {activeTab === 'phases' && (
            <div className="space-y-4">
              {/* Phase 1 */}
              <div className="border-2 border-emerald-300 rounded-xl p-4 bg-emerald-50/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-600 text-white">
                    <Zap className="h-3.5 w-3.5" />
                    Giai đoạn 1 — Bật ngay sau khi fix detection bug
                  </span>
                  <span className="text-xs font-bold text-emerald-800">2 Quốc gia thí điểm</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div className="p-3 bg-white rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="text-lg">🇦🇺</span> Australia — Ưu tiên #1
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-700">Std: 0,58</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      PVS/tháng: 3.186K | Block Rate T7-T8: 15,26% | 0 complaint. Volume lớn nhất nhóm khả thi, timezone UTC+10 thuận tiện.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="text-lg">🇯🇵</span> Japan — Ưu tiên #2
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-700">Std: 1,08</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      PVS/tháng: 2.178K | Block Rate T7-T8: 16,06% | Chạy song song với Úc. Cần monitor gap T5-T9.
                    </p>
                  </div>
                </div>
              </div>

              {/* Phase 2 */}
              <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
                    <Clock className="h-3.5 w-3.5" />
                    Giai đoạn 2 — Sau khi GĐ1 ổn định ≥2 tuần
                  </span>
                  <span className="text-xs font-medium text-slate-500">Monitor 48h trước khi bật nước tiếp theo</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-3 text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-800">🇭🇰 Hong Kong</div>
                    <div className="text-slate-500">1.308K PVS</div>
                    <div className="text-rose-700 font-semibold">Base: 15,87%</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-800">🇫🇷 France</div>
                    <div className="text-slate-500">892K PVS</div>
                    <div className="text-rose-700 font-semibold">Base: 17,67%</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-800">🇨🇿 Czechia</div>
                    <div className="text-slate-500">473K PVS</div>
                    <div className="text-rose-700 font-semibold">Base: 19,60%</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-800">🇬🇧 UK</div>
                    <div className="text-slate-500">463K PVS</div>
                    <div className="text-emerald-700 font-semibold">Std 0,32 (nhất)</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-800">🇰🇷 South Korea</div>
                    <div className="text-slate-500">684K PVS</div>
                    <div className="text-slate-600 font-semibold">Base: 10,92%</div>
                  </div>
                </div>
              </div>

              {/* Phase 3 */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-700 text-white">
                    Giai đoạn 3 — Sau 1 tháng data từ Giai đoạn 1+2
                  </span>
                  <span className="text-xs font-medium text-amber-700">Yêu cầu nghiêm ngặt</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-800">🇩🇪 Germany</div>
                    <div className="text-rose-600 font-semibold">Fix Safari/Vivaldi bug trước</div>
                    <p className="text-slate-500 mt-0.5">4 complaints ngày 08-09/09</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-800">🇨🇦 Canada & 🇸🇪 Sweden</div>
                    <div className="text-slate-700">Bật sau Germany ổn định</div>
                    <p className="text-slate-500 mt-0.5">Thụy Điển volume nhỏ (210K)</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-amber-200 bg-amber-50/40">
                    <div className="font-bold text-amber-900">🇺🇸 United States (Sau cùng)</div>
                    <div className="text-amber-800 font-semibold">&gt;18M PVS/tháng — rủi ro cao nhất</div>
                    <p className="text-slate-600 mt-0.5">Chỉ bật khi đã có ≥1 tháng data G1+G2</p>
                  </div>
                </div>
              </div>

              {/* Exclusion Box */}
              <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl text-xs flex items-center gap-2 text-rose-900">
                <Ban className="h-4 w-4 text-rose-600 shrink-0" />
                <span>
                  <span className="font-bold">Ràng buộc loại trừ:</span> Không áp dụng cho Singapore, Malaysia, Philippines (đang triển khai Taboola). Không áp dụng cho eVnExpress và Ngôi Sao OV trong giai đoạn này.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: TARGETS TABLE */}
          {activeTab === 'targets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Tiêu chí: Đảm bảo thay đổi <span className="font-bold text-slate-800">ít nhất 10-15%</span> so với baseline T7-T8.
                </span>
                <span className="text-[11px] text-slate-400">Bấm nút để lọc nhanh dashboard</span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-700">
                    <tr>
                      <th className="px-3 py-2.5 text-left">Quốc gia</th>
                      <th className="px-3 py-2.5 text-right">Giai đoạn</th>
                      <th className="px-3 py-2.5 text-right">Block Rate Base</th>
                      <th className="px-3 py-2.5 text-right text-rose-900">Target -15%</th>
                      <th className="px-3 py-2.5 text-right">Target -10%</th>
                      <th className="px-3 py-2.5 text-right">Run Ads Base</th>
                      <th className="px-3 py-2.5 text-right text-emerald-900">Target +10%</th>
                      <th className="px-3 py-2.5 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {/* All OV row */}
                    <tr className="bg-slate-50/80 font-bold">
                      <td className="px-3 py-2 text-slate-900">Toàn OV VnExpress</td>
                      <td className="px-3 py-2 text-right">
                        <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded text-[10px]">
                          All
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">14,80%</td>
                      <td className="px-3 py-2 text-right font-mono text-rose-800">≤ 12,58%</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-600">≤ 13,32%</td>
                      <td className="px-3 py-2 text-right font-mono">31.18M</td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-800">≥ 34.30M</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectCountry?.('all');
                            onClose();
                          }}
                          className="px-2 py-1 rounded text-[11px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 cursor-pointer"
                        >
                          Xem tất cả
                        </button>
                      </td>
                    </tr>
                    {countryList.map((c) => (
                      <tr key={c.country} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2 text-slate-900 font-semibold">
                          {c.flag} {c.country}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              c.phase === 1
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.phase === 2
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            GĐ {c.phase}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-700">
                          {c.blockRateBaseline.toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-rose-800">
                          ≤ {c.targetBlockRate15.toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-500">
                          ≤ {c.targetBlockRate10.toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-700">
                          {formatCompactNumber(c.runAdsBaselineMonthly)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-emerald-800">
                          ≥ {formatCompactNumber(c.targetRunAds10)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectCountry?.(c.country);
                              onClose();
                            }}
                            className="px-2 py-1 rounded text-[11px] font-bold bg-red-50 text-[#9f224e] hover:bg-red-100 transition-colors cursor-pointer"
                          >
                            Lọc nước này
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ESCALATION & GUARDRAILS */}
          {activeTab === 'escalation' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">
                Cơ chế 4 bước leo thang (Escalation Model):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-700">
                      1
                    </span>
                    Bước 1 — Banner thông báo
                  </div>
                  <p className="text-slate-600 mt-1">
                    Top page, nền #FFFBED, có nút ×. Copy: "Bạn đang dùng trình chặn quảng cáo. VnExpress duy trì miễn phí nhờ quảng cáo — hãy hỗ trợ chúng tôi bằng cách Bỏ chặn."
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-700">
                      2
                    </span>
                    Bước 2 — Toast khuyến nghị
                  </div>
                  <p className="text-slate-600 mt-1">
                    Chip nhỏ bottom-right, persistent, click → mở Tutorial Modal hướng dẫn 4 bước tắt adblock.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-700">
                      3
                    </span>
                    Bước 3 — Modal gây khó
                  </div>
                  <p className="text-slate-600 mt-1">
                    Overlay fullscreen, 2 CTA. <span className="font-semibold text-rose-700">Không trigger</span> khi Mobile + Google organic referrer (đảm bảo SEO guardrail).
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-700">
                      4
                    </span>
                    Bước 4 — Hard Gate
                  </div>
                  <p className="text-slate-600 mt-1">
                    Giới hạn 2 bài/ngày, bài thứ 3 chặn hoàn toàn. Reset 00:00 giờ địa phương user (IP geolocation). Áp dụng cả user đăng nhập MyVnE.
                  </p>
                </div>
              </div>

              {/* Alert Thresholds and Safety Guardrails */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-700" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    Các Ngưỡng Cảnh báo & Ngưỡng An toàn (Alert Thresholds & Guardrails):
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Ngưỡng 1 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Info className="h-3.5 w-3.5 text-blue-600" />
                        1. Ngưỡng Cảnh báo Block Rate
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                        KPI #1
                      </span>
                    </div>
                    <p className="text-slate-600">
                      • <strong>Baseline:</strong> 14.80% (TB T7-T8/2026).<br />
                      • <strong>Ngưỡng cảnh báo đỏ:</strong> Nếu Block Rate &gt; 14.80% (không giảm được).<br />
                      • <strong>Mốc an toàn:</strong> Giảm ≥ 10% (Block Rate ≤ 13.32%).<br />
                      • <strong>Mục tiêu chính thức:</strong> Giảm ≥ 15% (Block Rate ≤ 12.58%).
                    </p>
                  </div>

                  {/* Ngưỡng 2 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Info className="h-3.5 w-3.5 text-blue-600" />
                        2. Ngưỡng Cảnh báo Attainment (+10%)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        KPI #2
                      </span>
                    </div>
                    <p className="text-slate-600">
                      • <strong>Baseline Run Ads:</strong> 31.18 tr PV/tháng.<br />
                      • <strong>Target (+10%):</strong> ≥ 34.30 tr PV/tháng.<br />
                      • <strong>Ngưỡng cảnh báo vàng:</strong> Khi tiến độ đạt &lt; 90% target.<br />
                      • <strong>Ngưỡng cảnh báo đỏ:</strong> Khi tiến độ đạt &lt; 80% target.
                    </p>
                  </div>

                  {/* Ngưỡng 3 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Info className="h-3.5 w-3.5 text-amber-600" />
                        3. Ngưỡng Chuyển đổi NCR &lt; 5%
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                        Hành vi User
                      </span>
                    </div>
                    <p className="text-slate-600">
                      • <strong>Cảnh báo khẩn cấp:</strong> Nếu sau 3 ngày pilot tại bất kỳ thị trường nào mà tỷ lệ NCR (Net Conversion Rate - tỷ lệ người dùng gỡ adblock thành công) &lt; 5%.<br />
                      • <strong>Hành động:</strong> Lập tức tối ưu lại nội dung và hình ảnh của Tutorial Modal.
                    </p>
                  </div>

                  {/* Ngưỡng 4 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Info className="h-3.5 w-3.5 text-purple-600" />
                        4. Ngưỡng An toàn SEO & Trải nghiệm
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                        SEO Guardrail
                      </span>
                    </div>
                    <p className="text-slate-600">
                      • <strong>Quy tắc cứng:</strong> Tuyệt đối không kích hoạt Modal chặn toàn màn hình (Bước 3) khi độc giả truy cập từ Thiết bị di động (Mobile) có nguồn từ Google Organic Search.<br />
                      • <strong>Mục đích:</strong> Tránh rủi ro bị Google phạt trải nghiệm trang và tụt thứ hạng SEO.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bug note */}
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1 text-rose-950">
                <div className="font-bold flex items-center gap-1.5 text-rose-900">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  Nguyên nhân pilot bị tạm hạ ngày đầu (08-09/09/2026):
                </div>
                <p>
                  Bug detection cache không clear sau khi user reload trên Safari 17+ và Vivaldi (macOS) dẫn đến false positive.
                  Bắt buộc phải fix xong bug này trước khi bật lại Giai đoạn 1 (Úc, Nhật) và Giai đoạn 3 (Đức, Canada).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>VnExpress Adblock Control Tower · 2026</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

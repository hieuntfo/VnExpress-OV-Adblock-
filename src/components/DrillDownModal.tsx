import React, { useMemo } from 'react';
import {
  X,
  Calendar,
  Globe2,
  FolderOpen,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  NormalizedDateRecord,
  NormalizedCountryRecord,
  NormalizedFolderRecord,
} from '../types';
import { formatNumber, formatCompactNumber } from '../services/dataService';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export type ModalType =
  | { type: 'day'; data: NormalizedDateRecord }
  | { type: 'market'; country: string }
  | { type: 'folder'; folder: string }
  | null;

interface DrillDownModalProps {
  modalState: ModalType;
  onClose: () => void;
  allCountries: NormalizedCountryRecord[];
  allFolders: NormalizedFolderRecord[];
  allDates: NormalizedDateRecord[];
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({
  modalState,
  onClose,
  allCountries,
  allFolders,
  allDates,
}) => {
  if (!modalState) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            {modalState.type === 'day' && <Calendar className="h-5 w-5 text-red-700" />}
            {modalState.type === 'market' && <Globe2 className="h-5 w-5 text-red-700" />}
            {modalState.type === 'folder' && <FolderOpen className="h-5 w-5 text-red-700" />}
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {modalState.type === 'day' && `Chi tiết Ngày: ${modalState.data.dayString}`}
                {modalState.type === 'market' && `Lịch sử 9 tháng: ${modalState.country}`}
                {modalState.type === 'folder' && `Lịch sử 9 tháng Chuyên mục: ${modalState.folder}`}
              </h3>
              <span className="text-xs text-slate-500">
                Phân tích sâu chiều dữ liệu (Drill-down Analytics)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Case 1: Day Drill-down */}
          {modalState.type === 'day' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500">Pageview Thực tế</div>
                  <div className="text-xl font-black text-slate-900 mt-1 font-mono">
                    {modalState.data.pageview !== null
                      ? formatNumber(modalState.data.pageview)
                      : 'Chưa có dữ liệu'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Dữ liệu ghi nhận từ hệ thống OV</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500">Mục tiêu Target KPI</div>
                  <div className="text-xl font-black text-amber-700 mt-1 font-mono">
                    {formatNumber(modalState.data.kpiTarget)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Hạn mức kế hoạch ngày</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500">Tỷ lệ Đạt & Gap</div>
                  <div className="text-xl font-black mt-1 font-mono">
                    {modalState.data.pageview !== null ? (
                      <span
                        className={
                          modalState.data.pageview >= modalState.data.kpiTarget
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }
                      >
                        {(
                          (modalState.data.pageview / modalState.data.kpiTarget) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    ) : (
                      '-'
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                    {modalState.data.pageview !== null ? (
                      <span>
                        Gap:{' '}
                        {modalState.data.pageview - modalState.data.kpiTarget >= 0 ? '+' : ''}
                        {formatNumber(modalState.data.pageview - modalState.data.kpiTarget)} PV
                      </span>
                    ) : (
                      'Chưa có dữ liệu'
                    )}
                  </div>
                </div>
              </div>

              {/* Data Grain Notice */}
              <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Lưu ý về tính toán Block Ads theo ngày:</strong>
                  <p className="mt-0.5 leading-relaxed text-amber-800">
                    Theo quy tắc bảo toàn dữ liệu, tập tin `date.csv` của VnExpress hiện chỉ ghi nhận trường `Pageview` thực tế và `KPI Target`, chưa có cột log `Block Ads` riêng lẻ theo ngày. Số liệu Block Ads được phân tích chính xác tuyệt đối theo chiều hạt Tháng tại bảng Folder và Market.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Case 2: Market 9-month History */}
          {modalState.type === 'market' && (
            <MarketHistoryView country={modalState.country} allCountries={allCountries} />
          )}

          {/* Case 3: Folder 9-month History */}
          {modalState.type === 'folder' && (
            <FolderHistoryView folder={modalState.folder} allFolders={allFolders} />
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-component: Market 9-month History
const MarketHistoryView: React.FC<{
  country: string;
  allCountries: NormalizedCountryRecord[];
}> = ({ country, allCountries }) => {
  const history = useMemo(() => {
    return allCountries
      .filter((c) => c.country.toLowerCase() === country.toLowerCase())
      .sort((a, b) => a.month - b.month)
      .map((r) => ({
        month: `T${r.month}`,
        pvs: r.pvs,
        pvsRunAds: r.pvsRunAds,
        blockAds: r.blockAds,
        blockRate: r.pvs > 0 ? (r.blockAds / r.pvs) * 100 : 0,
        runAdsRate: r.pvs > 0 ? (r.pvsRunAds / r.pvs) * 100 : 0,
      }));
  }, [country, allCountries]);

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="h-60 w-full border border-slate-200 rounded-lg p-3 bg-slate-50/50">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={history} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => formatCompactNumber(val)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 40]}
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-2.5 rounded text-xs font-mono">
                      <div className="font-bold border-b border-slate-800 pb-1 mb-1">
                        Tháng {d.month}
                      </div>
                      <div>Total PV: {formatNumber(d.pvs)}</div>
                      <div className="text-emerald-400">Run Ads: {formatNumber(d.pvsRunAds)}</div>
                      <div className="text-rose-400">Block Ads: {formatNumber(d.blockAds)}</div>
                      <div className="text-amber-300">Block Rate: {d.blockRate.toFixed(2)}%</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar yAxisId="left" dataKey="pvsRunAds" name="Run Ads PV" fill="#059669" maxBarSize={20} />
            <Bar yAxisId="left" dataKey="blockAds" name="Block Ads PV" fill="#E11D48" maxBarSize={20} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="blockRate"
              name="Block Rate (%)"
              stroke="#D97706"
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <th className="py-2 px-3">Tháng</th>
              <th className="py-2 px-3 text-right">Tổng PV</th>
              <th className="py-2 px-3 text-right text-emerald-800">Can Run Ads PV</th>
              <th className="py-2 px-3 text-right text-rose-800">Block Ads PV</th>
              <th className="py-2 px-3 text-right">Tỷ lệ Block</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {history.map((row) => (
              <tr key={row.month} className="hover:bg-slate-50">
                <td className="py-2 px-3 font-sans font-medium text-slate-900">{row.month}/2026</td>
                <td className="py-2 px-3 text-right text-slate-700">{formatNumber(row.pvs)}</td>
                <td className="py-2 px-3 text-right text-emerald-800 font-bold">
                  {formatNumber(row.pvsRunAds)}
                </td>
                <td className="py-2 px-3 text-right text-rose-700 font-bold">
                  {formatNumber(row.blockAds)}
                </td>
                <td className="py-2 px-3 text-right font-bold text-slate-900">
                  {row.blockRate.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Sub-component: Folder 9-month History
const FolderHistoryView: React.FC<{
  folder: string;
  allFolders: NormalizedFolderRecord[];
}> = ({ folder, allFolders }) => {
  const history = useMemo(() => {
    return allFolders
      .filter((f) => f.folder.toLowerCase() === folder.toLowerCase())
      .sort((a, b) => a.month - b.month)
      .map((r) => ({
        month: `T${r.month}`,
        pvs: r.pvs,
        pvsRunAds: r.pvsRunAds,
        blockAds: r.blockAds,
        blockRate: r.pvs > 0 ? (r.blockAds / r.pvs) * 100 : 0,
        runAdsRate: r.pvs > 0 ? (r.pvsRunAds / r.pvs) * 100 : 0,
      }));
  }, [folder, allFolders]);

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="h-60 w-full border border-slate-200 rounded-lg p-3 bg-slate-50/50">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={history} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => formatCompactNumber(val)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 40]}
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-2.5 rounded text-xs font-mono">
                      <div className="font-bold border-b border-slate-800 pb-1 mb-1">
                        Tháng {d.month}
                      </div>
                      <div>Total PV: {formatNumber(d.pvs)}</div>
                      <div className="text-emerald-400">Run Ads: {formatNumber(d.pvsRunAds)}</div>
                      <div className="text-rose-400">Block Ads: {formatNumber(d.blockAds)}</div>
                      <div className="text-amber-300">Block Rate: {d.blockRate.toFixed(2)}%</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar yAxisId="left" dataKey="pvsRunAds" name="Run Ads PV" fill="#059669" maxBarSize={20} />
            <Bar yAxisId="left" dataKey="blockAds" name="Block Ads PV" fill="#E11D48" maxBarSize={20} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="blockRate"
              name="Block Rate (%)"
              stroke="#D97706"
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <th className="py-2 px-3">Tháng</th>
              <th className="py-2 px-3 text-right">Tổng PVS</th>
              <th className="py-2 px-3 text-right text-emerald-800">PVS Run Ads</th>
              <th className="py-2 px-3 text-right text-rose-800">Block Ads PV</th>
              <th className="py-2 px-3 text-right">Tỷ lệ Block</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {history.map((row) => (
              <tr key={row.month} className="hover:bg-slate-50">
                <td className="py-2 px-3 font-sans font-medium text-slate-900">{row.month}/2026</td>
                <td className="py-2 px-3 text-right text-slate-700">{formatNumber(row.pvs)}</td>
                <td className="py-2 px-3 text-right text-emerald-800 font-bold">
                  {formatNumber(row.pvsRunAds)}
                </td>
                <td className="py-2 px-3 text-right text-rose-700 font-bold">
                  {formatNumber(row.blockAds)}
                </td>
                <td className="py-2 px-3 text-right font-bold text-slate-900">
                  {row.blockRate.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

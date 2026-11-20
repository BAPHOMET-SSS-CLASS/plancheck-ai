import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Search, Trash2 } from 'lucide-react';
import type { InspectionHistoryItem } from '../types/inspection';

interface HistoryViewProps {
  history: InspectionHistoryItem[];
  onSelectHistoryItem: (item: InspectionHistoryItem) => void;
  onClearHistory: () => void;
  onGoToWorkspace: () => void;
}

export function HistoryView({
  history,
  onSelectHistoryItem,
  onClearHistory,
  onGoToWorkspace,
}: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'NEEDS_REVISION'>('ALL');

  const filtered = useMemo(() => {
    return history.filter((item) => {
      const matchesStatus = statusFilter === 'ALL' || item.result.verdict === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.fileName.toLowerCase().includes(q) ||
        item.result.generalInfo.projectName.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [history, searchQuery, statusFilter]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">ประวัติการตรวจสอบแบบแปลน</h2>
          <p className="text-xs text-slate-500 mt-1">
            บันทึกรายงานการตรวจสอบล่าสุดในเครื่องของคุณเพื่อย้อนดูหรือเปรียบเทียบผลการตรวจ
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-slate-200 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ล้างประวัติทั้งหมด</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อไฟล์หรือชื่อโครงการ..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {(
            [
              { id: 'ALL', label: 'ทั้งหมด' },
              { id: 'PASS', label: 'ผ่านเกณฑ์' },
              { id: 'NEEDS_REVISION', label: 'ต้องแก้ไข' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-xl bg-white p-12 text-center">
          <h3 className="text-sm font-semibold text-slate-900">ยังไม่มีประวัติการตรวจแบบแปลน</h3>
          <p className="text-xs text-slate-500 mt-1.5">
            เมื่อคุณทำการตรวจสอบแบบแปลนในหน้าห้องตรวจแบบ ระบบจะบันทึกรายการไว้ที่นี่โดยอัตโนมัติ
          </p>
          <button
            type="button"
            onClick={onGoToWorkspace}
            className="mt-4 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
          >
            ไปที่ห้องตรวจแบบ
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-slate-200 rounded-xl bg-white p-10 text-center text-xs text-slate-500">
          ไม่พบรายการที่ตรงกับคำค้นหาหรือตัวกรองที่เลือก
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                <th className="py-3 px-4">แบบแปลน / ชื่อโครงการ</th>
                <th className="py-3 px-4 w-32">มาตราส่วน</th>
                <th className="py-3 px-4 w-36 text-right">จุดที่พบปัญหา</th>
                <th className="py-3 px-4 w-36">สถานะ</th>
                <th className="py-3 px-4 w-44 text-right">เวลาที่ตรวจ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filtered.map((item) => {
                const isPass = item.result.verdict === 'PASS';
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectHistoryItem(item)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.fileName}</div>
                      <div className="text-slate-500 mt-0.5">
                        {item.result.generalInfo.projectName} · {item.result.generalInfo.drawingType}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                      {item.result.generalInfo.scale}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {item.result.defectsAndMissing.length} รายการ
                    </td>
                    <td className="py-3 px-4">
                      {isPass ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{item.result.verdictLabel}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-medium text-red-700">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{item.result.verdictLabel}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                      {new Date(item.timestamp).toLocaleString('th-TH', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

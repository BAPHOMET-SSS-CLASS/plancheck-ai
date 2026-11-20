import { RotateCcw } from 'lucide-react';
import { DEFAULT_STANDARD_RULES, RULE_PRESETS } from '../data/defaultRules';

interface RulesEditorProps {
  rules: string;
  onChangeRules: (newRules: string) => void;
  compact?: boolean;
}

export function RulesEditor({ rules, onChangeRules, compact = false }: RulesEditorProps) {
  const ruleLineCount = rules
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean).length;

  return (
    <div className={compact ? 'space-y-4' : 'max-w-4xl mx-auto space-y-6'}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            เกณฑ์มาตรฐานที่ถูกต้อง (AI Memory)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดกฎเกณฑ์ของบริษัทหรือกฎหมายควบคุมอาคาร ระบบจะบันทึกอัตโนมัติและใช้เป็นฐานตรวจแบบแปลนทุกครั้ง
          </p>
        </div>

        <button
          type="button"
          onClick={() => onChangeRules(DEFAULT_STANDARD_RULES)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>คืนค่ามาตรฐานเริ่มต้น</span>
        </button>
      </div>

      {/* Preset Selector */}
      <div>
        <div className="text-xs font-medium text-slate-700 mb-2">ชุดเกณฑ์มาตรฐานสำเร็จรูป</div>
        <div className={`grid gap-2.5 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
          {RULE_PRESETS.map((preset) => {
            const isSelected = rules.trim() === preset.rules.trim();
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChangeRules(preset.rules)}
                className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-blue-700 bg-blue-50/40'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-900">{preset.name}</span>
                  {isSelected && (
                    <span className="text-[11px] font-medium text-blue-700 whitespace-nowrap shrink-0">
                      ใช้งานอยู่
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{preset.discipline}</div>
                {!compact && (
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{preset.description}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Editable AI Memory Textarea */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="standard-rules-input" className="text-xs font-medium text-slate-700">
            รายการเกณฑ์ที่ AI ใช้ตรวจสอบ
          </label>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {ruleLineCount} ข้อกำหนด
          </span>
        </div>
        <textarea
          id="standard-rules-input"
          value={rules}
          onChange={(e) => onChangeRules(e.target.value)}
          rows={compact ? 8 : 11}
          placeholder="ระบุเกณฑ์มาตรฐานที่ต้องตรวจสอบในแบบแปลน เช่น 1. ต้องมี Title Block มุมขวาล่าง..."
          className="w-full px-4 py-3 text-sm leading-relaxed text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-y"
        />
        <p className="text-xs text-slate-500 mt-2">
          คำแนะนำ: ระบุตัวเลขมาตรฐาน (เช่น ความกว้างทางเดิน 1.20 ม.) และชื่อสัญลักษณ์หรือช่องลงนามที่ต้องการให้ครบถ้วนเพื่อให้ AI ตรวจสอบได้แม่นยำยิ่งขึ้น
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  HelpCircle,
  Printer,
  XCircle,
} from 'lucide-react';
import type { BlueprintDocument, InspectionResult } from '../types/inspection';

interface InspectionReportProps {
  document: BlueprintDocument | null;
  result: InspectionResult | null;
  isInspecting: boolean;
  error: string | null;
  onRetryInspect: () => void;
}

function buildMarkdownReport(doc: BlueprintDocument | null, result: InspectionResult): string {
  const lines: string[] = [];
  lines.push(`# รายงานผลการตรวจสอบแบบแปลนอาคารและโครงสร้าง`);
  if (doc) {
    lines.push(
      `ไฟล์: ${doc.fileName}${doc.fileType === 'pdf' ? ` (หน้า ${doc.pageNumber}/${doc.totalPages})` : ''}`
    );
  }
  lines.push(`สรุปสถานะ: ${result.verdictLabel} (${result.verdict})`);
  lines.push('');
  lines.push(`## 1. ข้อมูลทั่วไปในแบบ`);
  lines.push(`- ชื่อโครงการ: ${result.generalInfo.projectName}`);
  lines.push(`- ประเภทแบบ: ${result.generalInfo.drawingType}`);
  lines.push(`- มาตราส่วน: ${result.generalInfo.scale}`);
  lines.push(`- หมายเลขแผ่น: ${result.generalInfo.sheetNumber}`);
  lines.push(`- วันที่และช่องลงนาม: ${result.generalInfo.dateAndSignOff}`);
  lines.push('');
  lines.push(`## 2. รายการที่ผ่านเกณฑ์`);
  if (result.passedItems.length === 0) {
    lines.push('- ไม่พบรายการที่ผ่านเกณฑ์');
  } else {
    result.passedItems.forEach((item) => lines.push(`- ${item}`));
  }
  lines.push('');
  lines.push(`## 3. จุดที่ผิดพลาด / ข้อมูลที่ขาดหาย`);
  if (result.defectsAndMissing.length === 0) {
    lines.push('- ไม่พบจุดผิดพลาดหรือข้อมูลที่ขาดหาย');
  } else {
    result.defectsAndMissing.forEach((d) =>
      lines.push(`- [${d.severity}] ${d.title} (${d.location}): ${d.description}`)
    );
  }
  lines.push('');
  lines.push(`## 4. คำแนะนำสำหรับแก้ไข`);
  if (result.recommendations.length === 0) {
    lines.push('- ไม่มีข้อเสนอแนะเพิ่มเติม');
  } else {
    result.recommendations.forEach((rec, i) => lines.push(`${i + 1}. ${rec}`));
  }
  return lines.join('\n');
}

export function InspectionReport({
  document,
  result,
  isInspecting,
  error,
  onRetryInspect,
}: InspectionReportProps) {
  const [copied, setCopied] = useState(false);

  if (isInspecting) {
    return (
      <div className="space-y-5 py-2" aria-busy="true">
        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <div className="text-sm font-medium text-slate-900">
            กำลังอ่านแบบแปลนและเทียบกับเกณฑ์มาตรฐาน...
          </div>
          <p className="text-xs text-slate-500 mt-1">
            AI กำลังตรวจสอบ Title Block, แนวเส้นกริด, ระยะกำกับ, สัญลักษณ์ประตู/ทางหนีไฟ และช่องลงนาม
          </p>
        </div>
        <div className="space-y-3 animate-pulse">
          <div className="h-20 bg-slate-100 rounded-lg" />
          <div className="h-36 bg-slate-100 rounded-lg" />
          <div className="h-28 bg-slate-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 border border-red-200 bg-red-50/70 rounded-lg space-y-3">
        <div className="flex items-start gap-2.5 text-red-800">
          <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold">ไม่สามารถตรวจสอบแบบแปลนได้</h3>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">{error}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetryInspect}
          className="px-3.5 py-2 text-xs font-medium text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors cursor-pointer"
        >
          ลองตรวจสอบอีกครั้ง
        </button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="py-12 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <h3 className="text-sm font-semibold text-slate-900">ยังไม่มีผลการตรวจสอบ</h3>
        <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
          {document
            ? 'ตรวจสอบหรือปรับปรุงเกณฑ์มาตรฐานให้เรียบร้อย แล้วกดปุ่ม "เริ่มตรวจแบบแปลน" ด้านบนเพื่อวิเคราะห์แบบแปลนนี้'
            : 'อัปโหลดแบบแปลนหรือเลือกแบบแปลนตัวอย่างทางด้านซ้าย จากนั้นกด "เริ่มตรวจแบบแปลน"'}
        </p>
        {document && (
          <button
            type="button"
            onClick={onRetryInspect}
            className="mt-4 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
          >
            เริ่มตรวจแบบแปลนทันที
          </button>
        )}
      </div>
    );
  }

  const isPass = result.verdict === 'PASS';
  const markdown = buildMarkdownReport(document, result);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked in restricted iframe
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    const baseName = document?.fileName.replace(/\.[^.]+$/, '') || 'blueprint';
    link.download = `inspection-${baseName}.md`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Verdict Summary Banner */}
      <div
        className={`p-4 rounded-lg border flex flex-wrap items-start justify-between gap-4 ${
          isPass
            ? 'bg-emerald-50/60 border-emerald-200'
            : 'bg-red-50/60 border-red-200'
        }`}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {isPass ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className={isPass ? 'text-emerald-800' : 'text-red-800'}>
                สรุปสถานะ: {result.verdictLabel}
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">{result.summary}</p>
          </div>
        </div>

        <div className="no-print flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออก .md</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
            title="พิมพ์รายงาน"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1. General Plan Info */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2.5">1. ข้อมูลทั่วไปในแบบ</h3>
        <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 bg-white">
          <div className="grid grid-cols-3 px-4 py-2.5 text-xs">
            <span className="text-slate-500">ชื่อโครงการ</span>
            <span className="col-span-2 font-medium text-slate-900">
              {result.generalInfo.projectName}
            </span>
          </div>
          <div className="grid grid-cols-3 px-4 py-2.5 text-xs">
            <span className="text-slate-500">ประเภทแบบ</span>
            <span className="col-span-2 font-medium text-slate-900">
              {result.generalInfo.drawingType}
            </span>
          </div>
          <div className="grid grid-cols-3 px-4 py-2.5 text-xs">
            <span className="text-slate-500">มาตราส่วน</span>
            <span className="col-span-2 font-mono tabular-nums font-medium text-slate-900">
              {result.generalInfo.scale}
            </span>
          </div>
          <div className="grid grid-cols-3 px-4 py-2.5 text-xs">
            <span className="text-slate-500">หมายเลขแผ่น</span>
            <span className="col-span-2 font-mono tabular-nums font-medium text-slate-900">
              {result.generalInfo.sheetNumber}
            </span>
          </div>
          <div className="grid grid-cols-3 px-4 py-2.5 text-xs">
            <span className="text-slate-500">วันที่ / ช่องลงนาม</span>
            <span className="col-span-2 font-medium text-slate-900">
              {result.generalInfo.dateAndSignOff}
            </span>
          </div>
        </div>
      </div>

      {/* Rule-by-rule Checklist Table */}
      {result.ruleChecks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-2.5">
            ผลการประเมินตามเกณฑ์มาตรฐาน
          </h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-2.5 px-3.5 w-10 text-right tabular-nums">#</th>
                  <th className="py-2.5 px-3.5">เกณฑ์และรายละเอียดที่พบ</th>
                  <th className="py-2.5 px-3.5 w-28 text-right">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {result.ruleChecks.map((rc, index) => (
                  <tr key={`${rc.ruleTitle}-${index}`} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3.5 text-right font-mono tabular-nums text-slate-400 align-top">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3.5 align-top">
                      <div className="font-medium text-slate-900">{rc.ruleTitle}</div>
                      <div className="text-slate-600 mt-1 leading-relaxed">{rc.detail}</div>
                    </td>
                    <td className="py-3 px-3.5 text-right align-top whitespace-nowrap">
                      {rc.status === 'PASS' && (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ผ่าน</span>
                        </span>
                      )}
                      {rc.status === 'FAIL' && (
                        <span className="inline-flex items-center gap-1 font-medium text-red-700">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>ไม่ผ่าน</span>
                        </span>
                      )}
                      {rc.status === 'UNCLEAR' && (
                        <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>ไม่ชัดเจน</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Passed Items */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2.5">2. รายการที่ผ่านเกณฑ์</h3>
        {result.passedItems.length > 0 ? (
          <ul className="border border-slate-200 rounded-lg divide-y divide-slate-200 bg-white">
            {result.passedItems.map((item, idx) => (
              <li key={idx} className="px-4 py-2.5 text-xs text-slate-700 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">ไม่พบรายการที่ผ่านเกณฑ์ในรอบการตรวจนี้</p>
        )}
      </div>

      {/* 3. Defects and Missing Information */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2.5">
          3. จุดที่ผิดพลาด / ข้อมูลที่ขาดหาย
        </h3>
        {result.defectsAndMissing.length > 0 ? (
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 bg-white">
            {result.defectsAndMissing.map((defect, idx) => {
              const severityText =
                defect.severity === 'HIGH'
                  ? 'สำคัญมาก'
                  : defect.severity === 'MEDIUM'
                    ? 'ปานกลาง'
                    : 'ทั่วไป';
              const severityClass =
                defect.severity === 'HIGH'
                  ? 'text-red-700'
                  : defect.severity === 'MEDIUM'
                    ? 'text-amber-700'
                    : 'text-slate-600';

              return (
                <div key={idx} className="px-4 py-3 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900">{defect.title}</span>
                    <span className={`font-medium shrink-0 ${severityClass}`}>
                      ระดับ: {severityText}
                    </span>
                  </div>
                  <div className="text-slate-500 font-mono">ตำแหน่ง: {defect.location}</div>
                  <p className="text-slate-700 leading-relaxed pt-0.5">{defect.description}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-3 text-xs text-emerald-800 bg-emerald-50/50 border border-emerald-200 rounded-lg">
            ไม่พบข้อบกพร่องหรือข้อมูลที่ขาดหายตามเกณฑ์ที่กำหนด
          </div>
        )}
      </div>

      {/* 4. Recommendations */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2.5">4. คำแนะนำสำหรับแก้ไข</h3>
        {result.recommendations.length > 0 ? (
          <ol className="border border-slate-200 rounded-lg divide-y divide-slate-200 bg-white">
            {result.recommendations.map((rec, idx) => (
              <li key={idx} className="px-4 py-2.5 text-xs text-slate-700 flex items-start gap-2.5">
                <span className="font-mono tabular-nums font-semibold text-slate-500 shrink-0">
                  {idx + 1}.
                </span>
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-slate-500">ไม่มีข้อเสนอแนะเพิ่มเติม</p>
        )}
      </div>
    </div>
  );
}

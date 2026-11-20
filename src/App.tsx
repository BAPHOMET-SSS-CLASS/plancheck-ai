import { useCallback, useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { TopBar, type ActiveTab } from './components/TopBar';
import { BlueprintViewer } from './components/BlueprintViewer';
import { RulesEditor } from './components/RulesEditor';
import { InspectionReport } from './components/InspectionReport';
import { HistoryView } from './components/HistoryView';
import { DEFAULT_STANDARD_RULES } from './data/defaultRules';
import type {
  BlueprintDocument,
  InspectionHistoryItem,
  InspectionResult,
} from './types/inspection';
import { renderPdfPageToImage } from './utils/pdfRenderer';
import {
  generateSampleBlueprint,
  SAMPLE_BLUEPRINTS,
  type SampleBlueprintSpec,
} from './utils/sampleBlueprints';

const STORAGE_RULES_KEY = 'plancheck_standard_rules_v1';
const STORAGE_HISTORY_KEY = 'plancheck_inspection_history_v1';

function readImageDimensions(
  dataUrl: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('ไม่สามารถอ่านขนาดของรูปภาพได้'));
    img.src = dataUrl;
  });
}

async function createThumbnailDataUrl(sourceDataUrl: string): Promise<string> {
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = sourceDataUrl;
    });
    const maxW = 360;
    const scale = Math.min(1, maxW / img.naturalWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.72);
  } catch {
    return '';
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('workspace');
  const [rightPanelMode, setRightPanelMode] = useState<'report' | 'rules'>('rules');

  const [standardRules, setStandardRules] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_RULES_KEY);
      return saved && saved.trim() ? saved : DEFAULT_STANDARD_RULES;
    } catch {
      return DEFAULT_STANDARD_RULES;
    }
  });

  const [history, setHistory] = useState<InspectionHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HISTORY_KEY);
      return saved ? (JSON.parse(saved) as InspectionHistoryItem[]) : [];
    } catch {
      return [];
    }
  });

  const [documentState, setDocumentState] = useState<BlueprintDocument | null>(null);
  const [isRenderingPdf, setIsRenderingPdf] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<InspectionResult | null>(null);
  const [inspectionError, setInspectionError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RULES_KEY, standardRules);
    } catch {
      // Ignore storage quota errors
    }
  }, [standardRules]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history.slice(0, 15)));
    } catch {
      // Ignore storage quota errors
    }
  }, [history]);

  const handleFileSelected = useCallback(async (file: File) => {
    setUploadError(null);
    setInspectionResult(null);
    setInspectionError(null);

    const lowerName = file.name.toLowerCase();
    const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
    const isImage =
      file.type === 'image/png' ||
      file.type === 'image/jpeg' ||
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg');

    if (!isPdf && !isImage) {
      setUploadError('รองรับเฉพาะไฟล์ PNG, JPG, JPEG หรือ PDF เท่านั้น');
      return;
    }

    if (isPdf) {
      setIsRenderingPdf(true);
      try {
        const rendered = await renderPdfPageToImage(file, 1, 2.0);
        setDocumentState({
          id: crypto.randomUUID(),
          fileName: file.name,
          fileType: 'pdf',
          fileSizeBytes: file.size,
          imageDataUrl: rendered.imageDataUrl,
          mimeType: 'image/png',
          width: rendered.width,
          height: rendered.height,
          pageNumber: rendered.pageNumber,
          totalPages: rendered.totalPages,
          pdfFile: file,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'ไม่สามารถอ่านไฟล์ PDF นี้ได้';
        setUploadError(msg);
      } finally {
        setIsRenderingPdf(false);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const dims = await readImageDimensions(dataUrl);
        setDocumentState({
          id: crypto.randomUUID(),
          fileName: file.name,
          fileType: 'image',
          fileSizeBytes: file.size,
          imageDataUrl: dataUrl,
          mimeType: file.type || 'image/png',
          width: dims.width,
          height: dims.height,
          pageNumber: 1,
          totalPages: 1,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'ไม่สามารถเปิดไฟล์รูปภาพนี้ได้';
        setUploadError(msg);
      }
    };
    reader.onerror = () => setUploadError('เกิดข้อผิดพลาดระหว่างอ่านไฟล์รูปภาพ');
    reader.readAsDataURL(file);
  }, []);

  const handleChangePdfPage = useCallback(
    async (newPage: number) => {
      if (!documentState?.pdfFile) return;
      setIsRenderingPdf(true);
      setInspectionResult(null);
      setInspectionError(null);
      try {
        const rendered = await renderPdfPageToImage(documentState.pdfFile, newPage, 2.0);
        setDocumentState((prev) =>
          prev
            ? {
                ...prev,
                imageDataUrl: rendered.imageDataUrl,
                width: rendered.width,
                height: rendered.height,
                pageNumber: rendered.pageNumber,
                totalPages: rendered.totalPages,
              }
            : null
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'ไม่สามารถเปลี่ยนหน้า PDF ได้';
        setUploadError(msg);
      } finally {
        setIsRenderingPdf(false);
      }
    },
    [documentState]
  );

  const handleLoadSample = useCallback((sampleId: SampleBlueprintSpec['id']) => {
    const spec = SAMPLE_BLUEPRINTS.find((s) => s.id === sampleId);
    if (!spec) return;
    setUploadError(null);
    setInspectionResult(null);
    setInspectionError(null);

    const { imageDataUrl, width, height } = generateSampleBlueprint(sampleId);
    setDocumentState({
      id: crypto.randomUUID(),
      fileName: spec.fileName,
      fileType: 'image',
      fileSizeBytes: Math.round((imageDataUrl.length * 3) / 4),
      imageDataUrl,
      mimeType: 'image/png',
      width,
      height,
      pageNumber: 1,
      totalPages: 1,
    });
  }, []);

  const handleRunInspection = useCallback(async () => {
    if (!documentState) {
      fileInputRef.current?.click();
      return;
    }

    setRightPanelMode('report');
    setIsInspecting(true);
    setInspectionError(null);

    try {
      const response = await fetch('/api/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: documentState.imageDataUrl,
          mimeType: documentState.mimeType,
          standardRules,
          fileName: documentState.fileName,
          pageNumber: documentState.pageNumber,
          totalPages: documentState.totalPages,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'การตรวจสอบแบบแปลนล้มเหลว');
      }

      const result = data as InspectionResult;
      setInspectionResult(result);

      const thumbnailDataUrl = await createThumbnailDataUrl(documentState.imageDataUrl);
      const historyItem: InspectionHistoryItem = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        fileName: documentState.fileName,
        pageNumber: documentState.pageNumber,
        totalPages: documentState.totalPages,
        rulesSnapshot: standardRules,
        result,
        thumbnailDataUrl,
      };
      setHistory((prev) => [historyItem, ...prev].slice(0, 15));
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดระหว่างเชื่อมต่อระบบตรวจสอบ';
      setInspectionError(msg);
    } finally {
      setIsInspecting(false);
    }
  }, [documentState, standardRules]);

  const handleSelectHistoryItem = useCallback((item: InspectionHistoryItem) => {
    setInspectionResult(item.result);
    setInspectionError(null);
    if (item.thumbnailDataUrl) {
      setDocumentState({
        id: item.id,
        fileName: item.fileName,
        fileType: item.totalPages > 1 ? 'pdf' : 'image',
        fileSizeBytes: 0,
        imageDataUrl: item.thumbnailDataUrl,
        mimeType: 'image/jpeg',
        width: 360,
        height: 254,
        pageNumber: item.pageNumber,
        totalPages: item.totalPages,
      });
    }
    setRightPanelMode('report');
    setActiveTab('workspace');
  }, []);

  const activeRuleCount = standardRules
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        document={documentState}
        isInspecting={isInspecting}
        onTriggerInspect={handleRunInspection}
        onTriggerUpload={() => fileInputRef.current?.click()}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6">
        {activeTab === 'workspace' && (
          <div className="space-y-5">
            <div className="no-print flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  ระบบ AI ตรวจสอบแบบแปลนอาคารและโครงสร้างอัตโนมัติ
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  วิเคราะห์แบบแปลนเทียบกับเกณฑ์มาตรฐานที่บันทึกไว้ ตรวจสอบ Title Block ระยะกริด สัญลักษณ์ และช่องลงนาม
                </p>
              </div>
              <div className="text-xs text-slate-500 font-mono tabular-nums">
                เกณฑ์ที่ใช้งานอยู่: {activeRuleCount} ข้อกำหนด
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Column: Blueprint Viewport */}
              <div className="no-print lg:col-span-7 flex flex-col">
                <BlueprintViewer
                  document={documentState}
                  isRenderingPdf={isRenderingPdf}
                  uploadError={uploadError}
                  fileInputRef={fileInputRef}
                  onFileSelected={handleFileSelected}
                  onChangePdfPage={handleChangePdfPage}
                  onLoadSample={handleLoadSample}
                  onClearDocument={() => {
                    setDocumentState(null);
                    setInspectionResult(null);
                    setInspectionError(null);
                    setUploadError(null);
                  }}
                />
              </div>

              {/* Right Column: Rules (AI Memory) & Inspection Report */}
              <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
                {/* Panel Segmented Control Header */}
                <div className="no-print px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-3 bg-white">
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setRightPanelMode('report')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        rightPanelMode === 'report'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ผลการตรวจสอบ
                    </button>
                    <button
                      type="button"
                      onClick={() => setRightPanelMode('rules')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        rightPanelMode === 'rules'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      เกณฑ์มาตรฐาน ({activeRuleCount})
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={!documentState || isInspecting || isRenderingPdf}
                    onClick={handleRunInspection}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isInspecting ? 'กำลังตรวจ...' : 'เริ่มตรวจแบบแปลน'}</span>
                  </button>
                </div>

                {/* Panel Body */}
                <div className="p-5 flex-1 overflow-y-auto max-h-[700px]">
                  {rightPanelMode === 'report' ? (
                    <InspectionReport
                      document={documentState}
                      result={inspectionResult}
                      isInspecting={isInspecting}
                      error={inspectionError}
                      onRetryInspect={handleRunInspection}
                    />
                  ) : (
                    <div className="space-y-4">
                      <RulesEditor
                        rules={standardRules}
                        onChangeRules={setStandardRules}
                        compact
                      />
                      {documentState && (
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3">
                          <span className="text-xs text-slate-500">
                            พร้อมตรวจไฟล์: {documentState.fileName}
                          </span>
                          <button
                            type="button"
                            disabled={isInspecting}
                            onClick={handleRunInspection}
                            className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            เริ่มให้ AI ตรวจแบบแปลน
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <RulesEditor rules={standardRules} onChangeRules={setStandardRules} />
          </div>
        )}

        {activeTab === 'history' && (
          <HistoryView
            history={history}
            onSelectHistoryItem={handleSelectHistoryItem}
            onClearHistory={() => setHistory([])}
            onGoToWorkspace={() => setActiveTab('workspace')}
          />
        )}
      </main>
    </div>
  );
}

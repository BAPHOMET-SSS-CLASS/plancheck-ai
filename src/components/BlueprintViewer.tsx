import React, { useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileUp,
  Maximize2,
  RotateCcw,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { BlueprintDocument } from '../types/inspection';
import { SAMPLE_BLUEPRINTS, type SampleBlueprintSpec } from '../utils/sampleBlueprints';

interface BlueprintViewerProps {
  document: BlueprintDocument | null;
  isRenderingPdf: boolean;
  uploadError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelected: (file: File) => void;
  onChangePdfPage: (newPage: number) => void;
  onLoadSample: (sampleId: SampleBlueprintSpec['id']) => void;
  onClearDocument: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function BlueprintViewer({
  document,
  isRenderingPdf,
  uploadError,
  fileInputRef,
  onFileSelected,
  onChangePdfPage,
  onLoadSample,
  onClearDocument,
}: BlueprintViewerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragOriginRef = useRef({ x: 0, y: 0 });

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      onFileSelected(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      onFileSelected(file);
    }
    e.target.value = '';
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    dragOriginRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - dragOriginRef.current.x,
      y: e.clientY - dragOriginRef.current.y,
    });
  };

  const handlePointerUp = () => {
    setIsPanning(false);
  };

  return (
    <section className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden h-full min-h-[580px]">
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
        onChange={handleInputChange}
        className="hidden"
        aria-label="อัปโหลดไฟล์แบบแปลน PNG, JPG หรือ PDF"
      />

      {/* Viewer Header Bar */}
      <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">แบบแปลนที่ส่งตรวจ</h2>
          {document ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 tabular-nums truncate">
              <span className="truncate max-w-[220px] font-medium text-slate-700">
                {document.fileName}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">
                {document.width}×{document.height} px
              </span>
              {document.fileSizeBytes > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{formatBytes(document.fileSizeBytes)}</span>
                </>
              )}
              {document.fileType === 'pdf' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    หน้า {document.pageNumber} / {document.totalPages}
                  </span>
                </>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-0.5">
              รองรับไฟล์ PNG, JPG, JPEG และ PDF แบบหลายหน้า
            </p>
          )}
        </div>

        {document && (
          <div className="flex items-center gap-2 shrink-0">
            {document.fileType === 'pdf' && document.totalPages > 1 && (
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden mr-1">
                <button
                  type="button"
                  disabled={document.pageNumber <= 1 || isRenderingPdf}
                  onClick={() => onChangePdfPage(document.pageNumber - 1)}
                  className="p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  aria-label="หน้าก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2.5 text-xs font-mono tabular-nums text-slate-700 border-x border-slate-200">
                  {document.pageNumber}/{document.totalPages}
                </span>
                <button
                  type="button"
                  disabled={document.pageNumber >= document.totalPages || isRenderingPdf}
                  onClick={() => onChangePdfPage(document.pageNumber + 1)}
                  className="p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  aria-label="หน้าถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                className="p-1.5 text-slate-600 hover:bg-slate-50 cursor-pointer"
                aria-label="ย่อขนาด"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono tabular-nums text-slate-700 border-x border-slate-200 min-w-[52px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                className="p-1.5 text-slate-600 hover:bg-slate-50 cursor-pointer"
                aria-label="ขยายขนาด"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={resetView}
                className="p-1.5 text-slate-600 hover:bg-slate-50 border-l border-slate-200 cursor-pointer"
                aria-label="รีเซ็ตมุมมอง"
                title="ปรับพอดีหน้าจอ"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              เปลี่ยนไฟล์
            </button>

            <button
              type="button"
              onClick={() => {
                resetView();
                onClearDocument();
              }}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="ล้างแบบแปลน"
              title="ล้างแบบแปลน"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Drafting Viewport */}
      {document ? (
        <div
          className={`relative flex-1 drafting-grid overflow-hidden select-none flex items-center justify-center p-4 ${
            zoom > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {isRenderingPdf ? (
            <div className="bg-white border border-slate-200 rounded-lg px-6 py-4 text-sm text-slate-700">
              กำลังแปลงหน้าเอกสาร PDF เป็นภาพความละเอียดสูง...
            </div>
          ) : (
            <img
              src={document.imageDataUrl}
              alt={`แบบแปลน ${document.fileName}`}
              referrerPolicy="no-referrer"
              draggable={false}
              style={{
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                transition: isPanning ? 'none' : 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="max-w-full max-h-[640px] object-contain bg-white border border-slate-300 shadow-sm"
            />
          )}

          {isDragging && (
            <div className="absolute inset-0 bg-blue-700/10 border-2 border-dashed border-blue-700 flex items-center justify-center pointer-events-none">
              <div className="bg-white px-5 py-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-900">
                วางไฟล์เพื่อเปลี่ยนแบบแปลนที่ต้องการตรวจ
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`flex-1 drafting-grid p-8 flex flex-col items-center justify-center text-center transition-colors ${
            isDragging ? 'bg-blue-50/70' : ''
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8">
            <div className="w-12 h-12 mx-auto rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-4">
              <Upload className="w-5 h-5" />
            </div>

            <h3 className="text-base font-semibold text-slate-900">
              อัปโหลดไฟล์แบบแปลนอาคารหรือโครงสร้าง
            </h3>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
              ลากไฟล์มาวางที่นี่ หรือเลือกไฟล์จากเครื่องของคุณ รองรับ PNG, JPG และ PDF (ดึงภาพความละเอียดสูงทุกหน้าอัตโนมัติ)
            </p>

            {uploadError && (
              <div className="mt-4 px-3.5 py-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg text-left">
                {uploadError}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
            >
              <FileUp className="w-4 h-4" />
              <span>เลือกไฟล์แบบแปลน</span>
            </button>

            <div className="mt-6 pt-5 border-t border-slate-200 text-left">
              <p className="text-xs font-medium text-slate-500 mb-3">
                หรือทดลองด้วยแบบแปลนตัวอย่าง:
              </p>
              <div className="space-y-2">
                {SAMPLE_BLUEPRINTS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => {
                      resetView();
                      onLoadSample(sample.id);
                    }}
                    className="w-full text-left px-3.5 py-2.5 border border-slate-200 hover:border-blue-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-slate-900">{sample.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{sample.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface RenderedPdfPage {
  imageDataUrl: string;
  width: number;
  height: number;
  pageNumber: number;
  totalPages: number;
}

export async function renderPdfPageToImage(
  file: File,
  pageNumber = 1,
  scale = 2.0
): Promise<RenderedPdfPage> {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;

  const totalPages = pdf.numPages;
  const safePage = Math.min(Math.max(1, pageNumber), totalPages);
  const page = await pdf.getPage(safePage);

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('ไม่สามารถสร้าง Canvas สำหรับแสดงผลไฟล์ PDF ได้');
  }

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    viewport,
    canvas,
  }).promise;

  const imageDataUrl = canvas.toDataURL('image/png');
  return {
    imageDataUrl,
    width: canvas.width,
    height: canvas.height,
    pageNumber: safePage,
    totalPages,
  };
}

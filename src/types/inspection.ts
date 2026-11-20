export type RuleStatus = 'PASS' | 'FAIL' | 'UNCLEAR';
export type DefectSeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type OverallVerdict = 'PASS' | 'NEEDS_REVISION';

export interface GeneralPlanInfo {
  projectName: string;
  scale: string;
  drawingType: string;
  sheetNumber: string;
  dateAndSignOff: string;
}

export interface RuleCheckItem {
  ruleTitle: string;
  status: RuleStatus;
  detail: string;
}

export interface DefectItem {
  title: string;
  location: string;
  severity: DefectSeverity;
  description: string;
}

export interface InspectionResult {
  generalInfo: GeneralPlanInfo;
  verdict: OverallVerdict;
  verdictLabel: string;
  summary: string;
  ruleChecks: RuleCheckItem[];
  passedItems: string[];
  defectsAndMissing: DefectItem[];
  recommendations: string[];
}

export interface BlueprintDocument {
  id: string;
  fileName: string;
  fileType: 'image' | 'pdf';
  fileSizeBytes: number;
  imageDataUrl: string;
  mimeType: string;
  width: number;
  height: number;
  pageNumber: number;
  totalPages: number;
  pdfFile?: File;
}

export interface InspectionHistoryItem {
  id: string;
  timestamp: string;
  fileName: string;
  pageNumber: number;
  totalPages: number;
  rulesSnapshot: string;
  result: InspectionResult;
  thumbnailDataUrl: string;
}

export interface RulePreset {
  id: string;
  name: string;
  discipline: string;
  description: string;
  rules: string;
}

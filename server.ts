import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

interface InspectRequestBody {
  imageBase64?: string;
  mimeType?: string;
  standardRules?: string;
  fileName?: string;
  pageNumber?: number;
  totalPages?: number;
}

function createAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/inspect', async (req, res) => {
    try {
      const body = req.body as InspectRequestBody;
      const { imageBase64, mimeType, standardRules, fileName, pageNumber, totalPages } = body;

      if (!imageBase64 || !mimeType) {
        res.status(400).json({ error: 'กรุณาอัปโหลดภาพหรือไฟล์แบบแปลนก่อนเริ่มตรวจสอบ' });
        return;
      }

      const rulesText = (standardRules ?? '').trim();
      if (!rulesText) {
        res.status(400).json({ error: 'กรุณากำหนดเกณฑ์มาตรฐานที่ถูกต้องก่อนเริ่มตรวจสอบ' });
        return;
      }

      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      const pageContext =
        pageNumber && totalPages
          ? `ไฟล์ที่ส่งตรวจ: ${fileName || 'แบบแปลน'} (หน้าที่ ${pageNumber} จาก ${totalPages} หน้า)`
          : `ไฟล์ที่ส่งตรวจ: ${fileName || 'แบบแปลน'}`;

      const ai = createAiClient();

      const prompt = `คุณคือวิศวกรโยธาและสถาปนิกผู้เชี่ยวชาญในการตรวจแบบแปลนอาคารและโครงสร้าง
จงตรวจสอบภาพแบบแปลนนี้ โดยเทียบกับ 'เกณฑ์มาตรฐานที่ถูกต้อง' ด้านล่างนี้อย่างละเอียดและซื่อสัตย์ต่อสิ่งที่มองเห็นจริงในภาพเท่านั้น (ห้ามคาดเดาสิ่งที่ไม่มีในภาพ):

${pageContext}

เกณฑ์มาตรฐานที่ถูกต้อง:
${rulesText}

โปรดวิเคราะห์และส่งผลลัพธ์เป็นภาษาไทยที่ชัดเจน ตรงประเด็น และเป็นมืออาชีพ:
1. ข้อมูลทั่วไปในแบบ: อ่านชื่อโครงการ มาตราส่วน ประเภทแบบ หมายเลขแผ่น และชื่อผู้ออกแบบ/วันที่จากภาพ (หากไม่พบให้ระบุชัดเจนว่า "ไม่พบในแบบ")
2. ประเมินทีละข้อตามเกณฑ์มาตรฐานที่กำหนด (ruleChecks): ระบุสถานะ PASS (ผ่าน), FAIL (ไม่ผ่าน/ขาดหาย), หรือ UNCLEAR (ไม่ชัดเจน/อ่านไม่ออก) พร้อมรายละเอียดอ้างอิงจากภาพ
3. รายการที่ผ่านเกณฑ์ (passedItems)
4. จุดที่ผิดพลาดหรือข้อมูลที่ขาดหาย (defectsAndMissing): ระบุตำแหน่งในแบบ ระดับความสำคัญ (HIGH/MEDIUM/LOW) และคำอธิบาย
5. คำแนะนำสำหรับแก้ไข (recommendations): แนวทางแก้ไขที่เป็นรูปธรรมสำหรับวิศวกร/สถาปนิก
6. สรุปสถานะ: PASS (ผ่าน) หรือ NEEDS_REVISION (ต้องแก้ไข)`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          systemInstruction:
            'คุณคือระบบตรวจสอบแบบแปลนวิศวกรรมและสถาปัตยกรรมระดับมืออาชีพ รายงานเฉพาะข้อเท็จจริงที่อ่านได้จากแบบแปลนเท่านั้น ตอบกลับเป็น JSON ที่ถูกต้องตามสคีมาที่กำหนด',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              generalInfo: {
                type: Type.OBJECT,
                properties: {
                  projectName: { type: Type.STRING, description: 'ชื่อโครงการที่อ่านได้จากแบบ หรือ "ไม่พบในแบบ"' },
                  scale: { type: Type.STRING, description: 'มาตราส่วน เช่น 1:100 หรือ "ไม่ระบุ"' },
                  drawingType: { type: Type.STRING, description: 'ประเภทแบบ เช่น แบบแปลนพื้นชั้น 1, แบบโครงสร้างคาน-เสา' },
                  sheetNumber: { type: Type.STRING, description: 'หมายเลขแผ่นแบบ เช่น A-01, S-02 หรือ "ไม่ระบุ"' },
                  dateAndSignOff: { type: Type.STRING, description: 'วันที่และสถานะช่องลงนามวิศวกร/สถาปนิก' },
                },
                required: ['projectName', 'scale', 'drawingType', 'sheetNumber', 'dateAndSignOff'],
              },
              verdict: {
                type: Type.STRING,
                description: 'MUST be exactly "PASS" or "NEEDS_REVISION"',
              },
              verdictLabel: {
                type: Type.STRING,
                description: 'สรุปสถานะภาษาไทย เช่น "ผ่านเกณฑ์" หรือ "ต้องแก้ไข"',
              },
              summary: {
                type: Type.STRING,
                description: 'สรุปภาพรวมผลการตรวจสอบแบบแปลน 1-2 ประโยค',
              },
              ruleChecks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    ruleTitle: { type: Type.STRING, description: 'ชื่อหรือหัวข้อของเกณฑ์มาตรฐาน' },
                    status: { type: Type.STRING, description: 'MUST be "PASS", "FAIL", or "UNCLEAR"' },
                    detail: { type: Type.STRING, description: 'สิ่งที่พบในแบบแปลนเทียบกับเกณฑ์ข้อนี้' },
                  },
                  required: ['ruleTitle', 'status', 'detail'],
                },
              },
              passedItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'รายการส่วนที่ครบถ้วนและถูกต้องตามเกณฑ์',
              },
              defectsAndMissing: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: 'หัวข้อจุดที่ผิดพลาดหรือขาดหาย' },
                    location: { type: Type.STRING, description: 'ตำแหน่งในแบบ เช่น มุมขวาล่าง, Grid B-C, ทางเดินกลาง' },
                    severity: { type: Type.STRING, description: 'MUST be "HIGH", "MEDIUM", or "LOW"' },
                    description: { type: Type.STRING, description: 'คำอธิบายรายละเอียดข้อบกพร่อง' },
                  },
                  required: ['title', 'location', 'severity', 'description'],
                },
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'คำแนะนำเชิงปฏิบัติสำหรับการแก้ไขแบบแปลน',
              },
            },
            required: [
              'generalInfo',
              'verdict',
              'verdictLabel',
              'summary',
              'ruleChecks',
              'passedItems',
              'defectsAndMissing',
              'recommendations',
            ],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'ไม่ได้รับผลลัพธ์จากระบบวิเคราะห์ AI กรุณาลองใหม่อีกครั้ง' });
        return;
      }

      const parsed = JSON.parse(rawText);
      res.json(parsed);
    } catch (error: unknown) {
      const errObj = error as { status?: number; message?: string };
      console.error('Blueprint inspection error:', errObj?.message || error);

      const message = errObj?.message || 'เกิดข้อผิดพลาดระหว่างการตรวจสอบแบบแปลน';
      if (message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED')) {
        res.status(401).json({
          error: 'API Key ไม่ถูกต้องหรือยังไม่ได้ตั้งค่า กรุณาตรวจสอบ GEMINI_API_KEY ใน Settings > Secrets',
        });
        return;
      }
      if (message.includes('RESOURCE_EXHAUSTED') || errObj?.status === 429) {
        res.status(429).json({
          error: 'โควตาการใช้งาน API เต็มชั่วคราว กรุณารอสักครู่แล้วลองใหม่อีกครั้ง',
        });
        return;
      }
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PlanCheck server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

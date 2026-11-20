export interface SampleBlueprintSpec {
  id: 'arch-complete' | 'struct-incomplete';
  label: string;
  subtitle: string;
  fileName: string;
}

export const SAMPLE_BLUEPRINTS: SampleBlueprintSpec[] = [
  {
    id: 'arch-complete',
    label: 'ตัวอย่างแบบแปลนพื้นชั้น 1 (ครบถ้วน)',
    subtitle: 'มี Title Block, Grid Line, ระยะทางเดิน 1.50 ม., ทางหนีไฟ และช่องลงนาม',
    fileName: 'sample-arch-floor-plan-A01.png',
  },
  {
    id: 'struct-incomplete',
    label: 'ตัวอย่างแบบแปลนโครงสร้าง (พบจุดขาดหาย)',
    subtitle: 'ขาดตัวเลขระยะช่วงเสา Grid B–C, ไม่มีวันที่ และขาดช่องลงนามวิศวกร',
    fileName: 'sample-structural-framing-S02.png',
  },
];

function drawDimensionLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label: string
) {
  ctx.save();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const isHorizontal = Math.abs(y2 - y1) < 2;
  const tick = 8;
  ctx.beginPath();
  if (isHorizontal) {
    ctx.moveTo(x1, y1 - tick);
    ctx.lineTo(x1, y1 + tick);
    ctx.moveTo(x2, y2 - tick);
    ctx.lineTo(x2, y2 + tick);
  } else {
    ctx.moveTo(x1 - tick, y1);
    ctx.lineTo(x1 + tick, y1);
    ctx.moveTo(x2 - tick, y2);
    ctx.lineTo(x2 + tick, y2);
  }
  ctx.stroke();

  if (label) {
    ctx.fillStyle = '#0f172a';
    ctx.font = '600 18px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(mx - 38, my - 12, 76, 24);
    ctx.fillStyle = '#0f172a';
    ctx.fillText(label, mx, my);
  }
  ctx.restore();
}

function drawGridBubble(ctx: CanvasRenderingContext2D, x: number, y: number, label: string) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 18px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y + 1);
  ctx.restore();
}

function drawDoorSwing(
  ctx: CanvasRenderingContext2D,
  hingeX: number,
  hingeY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  label: string
) {
  ctx.save();
  ctx.strokeStyle = '#1d4ed8';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(hingeX, hingeY, radius, startAngle, endAngle);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(hingeX, hingeY);
  ctx.lineTo(hingeX + Math.cos(endAngle) * radius, hingeY + Math.sin(endAngle) * radius);
  ctx.stroke();

  ctx.fillStyle = '#1d4ed8';
  ctx.font = '600 14px "IBM Plex Mono", monospace';
  ctx.fillText(label, hingeX + 8, hingeY - 10);
  ctx.restore();
}

export function generateSampleBlueprint(specId: SampleBlueprintSpec['id']): {
  imageDataUrl: string;
  width: number;
  height: number;
} {
  const width = 1600;
  const height = 1130;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Cannot initialize canvas context');
  }

  // Drafting sheet background & outer border
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, width - 56, height - 56);
  ctx.lineWidth = 1;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  const gridX = [220, 520, 820, 1120];
  const gridY = [180, 440, 720, 940];
  const colLabels = ['A', 'B', 'C', 'D'];
  const rowLabels = ['1', '2', '3', '4'];

  // Grid dashed lines
  ctx.save();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.setLineDash([10, 6]);
  gridX.forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, 120);
    ctx.lineTo(x, 990);
    ctx.stroke();
  });
  gridY.forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(150, y);
    ctx.lineTo(1180, y);
    ctx.stroke();
  });
  ctx.restore();

  gridX.forEach((x, idx) => drawGridBubble(ctx, x, 100, colLabels[idx]));
  gridY.forEach((y, idx) => drawGridBubble(ctx, 130, y, rowLabels[idx]));

  if (specId === 'arch-complete') {
    // Dimension lines for all spans
    drawDimensionLine(ctx, gridX[0], 145, gridX[1], 145, '4.00 m');
    drawDimensionLine(ctx, gridX[1], 145, gridX[2], 145, '4.00 m');
    drawDimensionLine(ctx, gridX[2], 145, gridX[3], 145, '4.00 m');
    drawDimensionLine(ctx, 175, gridY[0], 175, gridY[1], '3.50 m');
    drawDimensionLine(ctx, 175, gridY[1], 175, gridY[2], '4.00 m');
    drawDimensionLine(ctx, 175, gridY[2], 175, gridY[3], '3.00 m');

    // Outer & inner architectural walls
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 8;
    ctx.strokeRect(gridX[0], gridY[0], gridX[3] - gridX[0], gridY[3] - gridY[0]);

    // Interior partitions leaving 1.50m corridor between Y=440..560
    ctx.lineWidth = 5;
    ctx.beginPath();
    // Office 1 & 2 top partition
    ctx.moveTo(gridX[1], gridY[0]);
    ctx.lineTo(gridX[1], gridY[1]);
    ctx.moveTo(gridX[2], gridY[0]);
    ctx.lineTo(gridX[2], gridY[1]);
    // Corridor top wall with door gaps
    ctx.moveTo(gridX[0], gridY[1]);
    ctx.lineTo(310, gridY[1]);
    ctx.moveTo(390, gridY[1]);
    ctx.lineTo(610, gridY[1]);
    ctx.moveTo(690, gridY[1]);
    ctx.lineTo(910, gridY[1]);
    ctx.moveTo(990, gridY[1]);
    ctx.lineTo(gridX[3], gridY[1]);
    // Corridor bottom wall (corridor width 1.50 m = 120 px)
    const corrBottom = gridY[1] + 120;
    ctx.moveTo(gridX[0], corrBottom);
    ctx.lineTo(420, corrBottom);
    ctx.moveTo(510, corrBottom);
    ctx.lineTo(860, corrBottom);
    ctx.moveTo(950, corrBottom);
    ctx.lineTo(gridX[3], corrBottom);
    // Lower room divider
    ctx.moveTo(gridX[2], corrBottom);
    ctx.lineTo(gridX[2], gridY[3]);
    ctx.stroke();

    // Columns
    ctx.fillStyle = '#0f172a';
    gridX.forEach((x) => {
      gridY.forEach((y) => {
        ctx.fillRect(x - 10, y - 10, 20, 20);
      });
    });

    // Corridor width callout
    drawDimensionLine(ctx, 260, gridY[1], 260, corrBottom, '1.50 m');

    // Doors & Windows
    drawDoorSwing(ctx, 310, gridY[1], 70, 0, Math.PI / 2, 'D1');
    drawDoorSwing(ctx, 610, gridY[1], 70, 0, Math.PI / 2, 'D1');
    drawDoorSwing(ctx, 910, gridY[1], 70, 0, Math.PI / 2, 'D1');
    drawDoorSwing(ctx, 420, corrBottom, 80, -Math.PI / 2, 0, 'D2');

    // Window symbols on top & bottom walls
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    [320, 620, 920].forEach((wx) => {
      ctx.fillRect(wx, gridY[0] - 5, 100, 10);
      ctx.strokeRect(wx, gridY[0] - 5, 100, 10);
      ctx.fillStyle = '#0284c7';
      ctx.font = '600 14px "IBM Plex Mono", monospace';
      ctx.fillText('W1', wx + 40, gridY[0] - 14);
      ctx.fillStyle = '#ffffff';
    });
    ctx.restore();

    // Fire Exit Sign & Staircase in bottom right room
    ctx.save();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.strokeRect(930 + i * 22, 660, 22, 140);
    }
    ctx.fillStyle = '#dc2626';
    ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('EXIT / ทางหนีไฟ', 950, 635);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(880, 500);
    ctx.lineTo(1080, 500);
    ctx.lineTo(1060, 488);
    ctx.moveTo(1080, 500);
    ctx.lineTo(1060, 512);
    ctx.stroke();
    ctx.restore();

    // Room labels
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 20px "Noto Sans Thai", sans-serif';
    ctx.fillText('ห้องประชุม 1 (3.50 x 4.00 ม.)', 250, 310);
    ctx.fillText('ห้องทำงาน 2 (3.50 x 4.00 ม.)', 550, 310);
    ctx.fillText('ห้องผู้จัดการ (3.50 x 4.00 ม.)', 850, 310);
    ctx.fillText('โถงทางเดินกลาง (กว้าง 1.50 ม.)', 470, 506);
    ctx.fillText('โถงรับรองและพื้นที่อเนกประสงค์', 380, 760);
    ctx.fillText('โถงบันไดหนีไฟ', 910, 840);

    // Complete Title Block + Sign-Off bottom right
    const tbX = 1190;
    const tbY = 690;
    const tbW = 354;
    const tbH = 384;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(tbX, tbY, tbW, tbH);

    const rows = [70, 68, 60, 60, 63, 63];
    let curY = tbY;
    rows.forEach((rh, idx) => {
      if (idx < rows.length - 1) {
        curY += rh;
        ctx.beginPath();
        ctx.moveTo(tbX, curY);
        ctx.lineTo(tbX + tbW, curY);
        ctx.stroke();
      }
    });

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 18px "Noto Sans Thai", sans-serif';
    ctx.fillText('โครงการ: อาคารสำนักงาน 3 ชั้น (สยามเทค)', tbX + 14, tbY + 40);
    ctx.font = '600 16px "Noto Sans Thai", sans-serif';
    ctx.fillText('แบบ: แปลนพื้นชั้นที่ 1 (Ground Floor Plan)', tbX + 14, tbY + 110);
    ctx.fillText('มาตราส่วน: 1 : 100   แผ่นที่: A-01', tbX + 14, tbY + 174);
    ctx.fillText('วันที่: 15 พฤศจิกายน 2569', tbX + 14, tbY + 234);
    ctx.font = '500 15px "Noto Sans Thai", sans-serif';
    ctx.fillText('สถาปนิกผู้ออกแบบ: นายสมชาย ใจดี (ส-สถ. 4821)', tbX + 14, tbY + 296);
    ctx.fillText('ลงนาม: [ลงนามรับรองแล้ว]', tbX + 14, tbY + 322);
    ctx.fillText('วิศวกรโครงสร้าง: นางสาววิไล รักษ์ไทย (สย. 9104)', tbX + 14, tbY + 358);
    ctx.fillText('ลงนาม: [ลงนามรับรองแล้ว]', tbX + 14, tbY + 378);
  } else {
    // Structural Framing Plan with intentional missing defects
    drawDimensionLine(ctx, gridX[0], 145, gridX[1], 145, '4.50 m');
    // Intentionally OMIT dimension between gridX[1] and gridX[2]!
    drawDimensionLine(ctx, gridX[2], 145, gridX[3], 145, '4.50 m');

    drawDimensionLine(ctx, 175, gridY[0], 175, gridY[1], '4.00 m');
    drawDimensionLine(ctx, 175, gridY[1], 175, gridY[2], '4.00 m');
    // Intentionally OMIT dimension between gridY[2] and gridY[3]!

    // Structural Beams
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 6;
    gridY.forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(gridX[0], y);
      ctx.lineTo(gridX[3], y);
      ctx.stroke();
    });
    gridX.forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, gridY[0]);
      ctx.lineTo(x, gridY[3]);
      ctx.stroke();
    });

    // Columns
    ctx.fillStyle = '#0f172a';
    gridX.forEach((x, xi) => {
      gridY.forEach((y, yi) => {
        ctx.fillRect(x - 14, y - 14, 28, 28);
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 14px "IBM Plex Mono", monospace';
        ctx.fillText(`C${(xi + yi) % 2 === 0 ? '1' : '2'}`, x + 18, y - 16);
      });
    });

    // Beam labels (missing B labels on middle bay intentionally)
    ctx.fillStyle = '#1e3a8a';
    ctx.font = '700 16px "IBM Plex Mono", monospace';
    ctx.fillText('B1 (0.25x0.50)', 310, gridY[0] - 14);
    ctx.fillText('B1 (0.25x0.50)', 910, gridY[0] - 14);
    ctx.fillText('B2 (0.20x0.45)', 310, gridY[1] - 14);
    ctx.fillText('B2 (0.20x0.45)', 910, gridY[2] - 14);

    // Slab notes
    ctx.fillStyle = '#334155';
    ctx.font = '600 18px "IBM Plex Mono", monospace';
    ctx.fillText('S1 (t = 0.15 m)', 310, 310);
    ctx.fillText('S1 (t = 0.15 m)', 610, 310);
    ctx.fillText('S1 (t = 0.15 m)', 910, 580);

    // Incomplete Title Block (missing date, missing engineer & architect signature block)
    const tbX = 1190;
    const tbY = 820;
    const tbW = 354;
    const tbH = 254;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(tbX, tbY, tbW, tbH);

    ctx.beginPath();
    ctx.moveTo(tbX, tbY + 75);
    ctx.lineTo(tbX + tbW, tbY + 75);
    ctx.moveTo(tbX, tbY + 150);
    ctx.lineTo(tbX + tbW, tbY + 150);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 18px "Noto Sans Thai", sans-serif';
    ctx.fillText('โครงการ: อาคารพักอาศัย 2 ชั้น (ร่างที่ 1)', tbX + 14, tbY + 44);
    ctx.font = '600 16px "Noto Sans Thai", sans-serif';
    ctx.fillText('แบบ: โครงสร้างคาน-เสา ชั้นที่ 2', tbX + 14, tbY + 118);
    ctx.fillText('มาตราส่วน: 1 : 100   แผ่นที่: S-02', tbX + 14, tbY + 195);
    ctx.fillStyle = '#64748b';
    ctx.font = '500 14px "Noto Sans Thai", sans-serif';
    ctx.fillText('วันที่: [เว้นว่าง]  |  ผู้ลงนาม: [ยังไม่มี]', tbX + 14, tbY + 230);
  }

  return {
    imageDataUrl: canvas.toDataURL('image/png'),
    width,
    height,
  };
}

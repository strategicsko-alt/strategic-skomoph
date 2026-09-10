const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

// Read S3 data
const dataPath = path.join(__dirname, '../scratch/s3_full_data.json');
const s3Data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 10 x 5.625 inches
pres.author = 'สำนักงานสาธารณสุขจังหวัดสระแก้ว';
pres.company = 'สสจ.สระแก้ว (Strategic SKO)';
pres.title = 'แผนยุทธศาสตร์สุขภาพ 5 ปี - ประเด็นยุทธศาสตร์ที่ 3';

// Color Palette
const THEME = {
  primary: 'C53302',      // Deep Rust / Orange (S3 official color)
  primaryDark: '9A2500',  // Dark rust
  primaryLight: 'FFF7ED', // Very light warm orange
  primaryBorder: 'FDBA74',
  dark: '0F172A',         // Slate 900
  darkText: '1E293B',     // Slate 800
  mutedText: '475569',    // Slate 600
  lightText: '64748B',    // Slate 500
  bgLight: 'F8FAFC',      // Slate 50
  cardBg: 'FFFFFF',
  cardBorder: 'E2E8F0',   // Slate 200
  success: '16A34A',      // Green 600
  successBg: 'F0FDF4',
  blue: '0284C7',         // Blue 600
  blueBg: 'F0F9FF',
  purple: '7C3AED',
  purpleBg: 'FAF5FF'
};

const FONT_TH = 'TH Sarabun New, Sarabun, Arial';
const TOTAL_SLIDES = 19;

// Helper: Format target value with % symbol
function formatTargetVal(val) {
  if (!val || val.toString().trim() === '' || val.toString().trim() === '-') return '-';
  let s = val.toString().trim();
  // Remove any leading zero-width spaces or Thai marks if needed
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, '');
  if (s.endsWith('%')) return s;
  // If numeric (including decimals), append %
  if (/^[\d\.]+$/.test(s)) {
    return s + '%';
  }
  return s;
}

// Helper: Standard Header on content slides
function addHeader(slide, title, category, slideNum) {
  // Top category badge
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.6, y: 0.35, w: 3.4, h: 0.32,
    fill: { color: THEME.primaryLight },
    line: { color: THEME.primaryBorder, width: 1 },
    rectRadius: 0.08
  });
  slide.addText(category || 'ประเด็นยุทธศาสตร์ที่ 3 | สสจ.สระแก้ว', {
    x: 0.6, y: 0.35, w: 3.4, h: 0.32,
    fontSize: 10, bold: true, color: THEME.primary, fontFace: FONT_TH, align: 'center', valign: 'middle'
  });

  // Slide Main Title
  slide.addText(title, {
    x: 0.6, y: 0.72, w: 8.8, h: 0.55,
    fontSize: 17.5, bold: true, color: THEME.dark, fontFace: FONT_TH, valign: 'middle'
  });

  // Top decorative bar
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 10, h: 0.08,
    fill: { color: THEME.primary }
  });

  // Footer text & slide number
  slide.addText('แผนยุทธศาสตร์สุขภาพ 5 ปี (พ.ศ. 2570 - 2574) สำนักงานสาธารณสุขจังหวัดสระแก้ว', {
    x: 0.6, y: 5.3, w: 7.5, h: 0.25,
    fontSize: 9, color: THEME.lightText, fontFace: FONT_TH
  });
  slide.addText(`${slideNum} / ${TOTAL_SLIDES}`, {
    x: 8.6, y: 5.3, w: 0.8, h: 0.25,
    fontSize: 9, color: THEME.lightText, fontFace: FONT_TH, align: 'right'
  });
}

// Helper: Standard 5-Year Target Table Component (Always with % values)
function add5YearTargetTable(slide, x, y, w, targets) {
  const years = ['2570', '2571', '2572', '2573', '2574'];
  const colW = w / 5;
  const tableData = [
    years.map(yVal => ({
      text: yVal,
      options: {
        fontSize: 8,
        bold: true,
        align: 'center',
        valign: 'middle',
        fill: { color: THEME.primaryLight },
        color: THEME.primary
      }
    })),
    targets.map(tVal => ({
      text: formatTargetVal(tVal),
      options: {
        fontSize: 9.5,
        bold: true,
        align: 'center',
        valign: 'middle',
        fill: { color: 'FFFFFF' },
        color: THEME.darkText
      }
    }))
  ];

  slide.addTable(tableData, {
    x: x,
    y: y,
    w: w,
    h: 0.52,
    colW: [colW, colW, colW, colW, colW],
    rowH: [0.22, 0.30],
    border: { pt: 0.5, color: THEME.cardBorder }
  });
}

// Helper: Standard Strategy Slide 2 Component (Initiative Activities + How to 5 Tiers Concise)
function addStrategyHowToSlide(slide, stratCode, stratName, initiatives, tiersData, slideNum) {
  slide.background = { color: THEME.bgLight };
  addHeader(
    slide,
    `กิจกรรมริเริ่มและแนวทางขับเคลื่อน ${stratCode} รายระดับ`,
    `กลยุทธ์ ${stratCode} | กิจกรรมริเริ่ม & How-to`,
    slideNum
  );

  // SECTION 1: กิจกรรมริเริ่มภาพรวม (Initiative Activities)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.6, y: 1.25, w: 8.8, h: 1.15,
    fill: { color: THEME.cardBg },
    line: { color: THEME.primaryBorder, width: 1 },
    rectRadius: 0.08
  });

  // Top banner of Section 1
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.75, y: 1.35, w: 2.6, h: 0.26,
    fill: { color: THEME.primaryLight },
    line: { color: THEME.primaryBorder, width: 0.6 },
    rectRadius: 0.05
  });
  slide.addText('🚀 กิจกรรมริเริ่มภาพรวม (Initiative Activities)', {
    x: 0.75, y: 1.35, w: 2.6, h: 0.26,
    fontSize: 9, bold: true, color: THEME.primary, fontFace: FONT_TH, align: 'center', valign: 'middle'
  });

  slide.addText(initiatives.join('\n'), {
    x: 0.75, y: 1.65, w: 8.5, h: 0.7,
    fontSize: 8.5, color: THEME.darkText, fontFace: FONT_TH, lineSpacingMultiple: 1.15
  });

  // SECTION 2: แนวทางขับเคลื่อน How to 5 ระดับ (สรุปสั้นกระชับ สื่อสารเข้าใจง่าย)
  slide.addText('🌐 แนวทางขับเคลื่อนรายระดับ (How to 5 ระดับ) - สรุปบทบาทปฏิบัติการสำคัญ', {
    x: 0.6, y: 2.45, w: 8.8, h: 0.25,
    fontSize: 10, bold: true, color: THEME.primary, fontFace: FONT_TH
  });

  tiersData.forEach((tier, idx) => {
    const rowY = 2.73 + idx * 0.48;
    // Row card
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.6, y: rowY, w: 8.8, h: 0.44,
      fill: { color: THEME.cardBg },
      line: { color: THEME.cardBorder, width: 0.8 },
      rectRadius: 0.06
    });

    // Left role pill
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.72, y: rowY + 0.06, w: 1.7, h: 0.32,
      fill: { color: tier.bg || THEME.bgLight },
      line: { color: tier.color || THEME.primary, width: 1 },
      rectRadius: 0.05
    });
    slide.addText(tier.role, {
      x: 0.72, y: rowY + 0.06, w: 1.7, h: 0.32,
      fontSize: 9, bold: true, color: tier.color || THEME.primary, fontFace: FONT_TH, align: 'center', valign: 'middle'
    });

    // Right concise duty
    slide.addText(tier.duty, {
      x: 2.55, y: rowY + 0.04, w: 6.75, h: 0.36,
      fontSize: 8.5, color: THEME.darkText, fontFace: FONT_TH, valign: 'middle'
    });
  });
}


// Helper: Standard Action Plan Slide Component (Q1 - Q4 Roadmap)
function addActionPlanSlide(slide, stratCode, stratName, subTitle, quartersData, slideNum) {
  slide.background = { color: THEME.bgLight };
  addHeader(
    slide,
    `แผนปฏิบัติการ 1 ปี (1-Year Action Plan: Q1 - Q4 Roadmap)`,
    `กลยุทธ์ ${stratCode} | แผนปฏิบัติการ 1 ปี`,
    slideNum
  );

  slide.addText(subTitle, {
    x: 0.6, y: 1.3, w: 8.8, h: 0.32,
    fontSize: 10.5, color: THEME.mutedText, fontFace: FONT_TH
  });

  const colW = 2.15;
  const gap = 0.08;
  quartersData.forEach((q, idx) => {
    const qx = 0.6 + idx * (colW + gap);
    // Outer card
    slide.addShape(pres.ShapeType.roundRect, {
      x: qx, y: 1.68, w: colW, h: 3.48,
      fill: { color: THEME.cardBg },
      line: { color: THEME.cardBorder, width: 1 },
      rectRadius: 0.08
    });

    // Quarter header
    slide.addShape(pres.ShapeType.roundRect, {
      x: qx, y: 1.68, w: colW, h: 0.44,
      fill: { color: q.color || THEME.primary },
      rectRadius: 0.08
    });
    slide.addText(q.q, {
      x: qx, y: 1.68, w: colW, h: 0.44,
      fontSize: 10, bold: true, color: 'FFFFFF', fontFace: FONT_TH, align: 'center', valign: 'middle'
    });

    // Milestones inside quarter
    const mCount = q.milestones.length;
    const availH = 2.94;
    const eachH = availH / Math.max(mCount, 1);

    q.milestones.forEach((m, mi) => {
      const my = 2.16 + mi * eachH;
      slide.addShape(pres.ShapeType.roundRect, {
        x: qx + 0.07, y: my + 0.04, w: colW - 0.14, h: eachH - 0.08,
        fill: { color: THEME.bgLight },
        line: { color: THEME.cardBorder, width: 0.6 },
        rectRadius: 0.05
      });

      // Target pill at top
      slide.addShape(pres.ShapeType.roundRect, {
        x: qx + 0.12, y: my + 0.08, w: colW - 0.24, h: 0.24,
        fill: { color: THEME.primaryLight },
        line: { color: THEME.primaryBorder, width: 0.5 },
        rectRadius: 0.04
      });
      slide.addText(m.target, {
        x: qx + 0.12, y: my + 0.08, w: colW - 0.24, h: 0.24,
        fontSize: 8, bold: true, color: THEME.primary, fontFace: FONT_TH, align: 'center', valign: 'middle'
      });

      if (mCount > 2) {
        slide.addText(m.label, {
          x: qx + 0.12, y: my + 0.34, w: colW - 0.24, h: 0.22,
          fontSize: 8, bold: true, color: THEME.dark, fontFace: FONT_TH
        });
        slide.addText(m.desc, {
          x: qx + 0.12, y: my + 0.54, w: colW - 0.24, h: eachH - 0.60,
          fontSize: 7.2, color: THEME.mutedText, fontFace: FONT_TH, lineSpacingMultiple: 1.02
        });
      } else {
        slide.addText(m.label, {
          x: qx + 0.12, y: my + 0.36, w: colW - 0.24, h: 0.28,
          fontSize: 8.5, bold: true, color: THEME.dark, fontFace: FONT_TH
        });
        slide.addText(m.desc, {
          x: qx + 0.12, y: my + 0.66, w: colW - 0.24, h: eachH - 0.72,
          fontSize: 7.5, color: THEME.mutedText, fontFace: FONT_TH, lineSpacingMultiple: 1.05
        });
      }
    });
  });
}

// ==========================================
// SLIDE 1: COVER SLIDE (หน้าปก)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: '0F172A' };

  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 0.8, w: 4.8, h: 0.38,
    fill: { color: '1E293B' },
    line: { color: THEME.primary, width: 1.5 },
    rectRadius: 0.1
  });
  slide.addText('แผนยุทธศาสตร์สุขภาพ 5 ปี (พ.ศ. 2570 – 2574)', {
    x: 0.8, y: 0.8, w: 4.8, h: 0.38,
    fontSize: 12, bold: true, color: 'FFFFFF', fontFace: FONT_TH, align: 'center', valign: 'middle'
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 1.4, w: 2.0, h: 0.45,
    fill: { color: THEME.primary },
    rectRadius: 0.08
  });
  slide.addText('ประเด็นยุทธศาสตร์ที่ 3', {
    x: 0.8, y: 1.4, w: 2.0, h: 0.45,
    fontSize: 13, bold: true, color: 'FFFFFF', fontFace: FONT_TH, align: 'center', valign: 'middle'
  });

  // Exact Name from Database
  slide.addText(s3Data.issue.name, {
    x: 0.8, y: 2.0, w: 8.4, h: 1.4,
    fontSize: 25, bold: true, color: 'FFFFFF', fontFace: FONT_TH, lineSpacingMultiple: 1.15
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 3.55, w: 8.4, h: 0.04,
    fill: { color: THEME.primary }
  });

  // 4 Exact Strategies Badges on Cover
  const coverStrats = [
    { code: 'ST3.1', title: 'พัฒนากำลังคน\nสมรรถนะสูง' },
    { code: 'ST3.2', title: 'การเงินการคลัง\nยั่งยืน' },
    { code: 'ST2.3', title: 'บริหารจัดการ\nทรัพยากร' },
    { code: 'ST3.4', title: 'สุขภาพดิจิทัล\nและนวัตกรรมองค์กร' }
  ];
  coverStrats.forEach((cs, i) => {
    const px = 0.8 + i * 2.15;
    slide.addShape(pres.ShapeType.roundRect, {
      x: px, y: 3.75, w: 2.05, h: 0.75,
      fill: { color: '1E293B' },
      line: { color: '334155', width: 1 },
      rectRadius: 0.08
    });
    slide.addText(`[${cs.code}]`, {
      x: px, y: 3.82, w: 2.05, h: 0.25,
      fontSize: 10, bold: true, color: 'FDBA74', fontFace: FONT_TH, align: 'center'
    });
    slide.addText(cs.title, {
      x: px, y: 4.07, w: 2.05, h: 0.38,
      fontSize: 9, color: '94A3B8', fontFace: FONT_TH, align: 'center', lineSpacingMultiple: 1.05
    });
  });

  slide.addText('สำนักงานสาธารณสุขจังหวัดสระแก้ว\nการประชุมนำเสนอและขับเคลื่อนแผนยุทธศาสตร์สุขภาพจังหวัดสระแก้ว', {
    x: 0.8, y: 4.8, w: 8.4, h: 0.55,
    fontSize: 11, color: 'CBD5E1', fontFace: FONT_TH
  });

  slide.addNotes('สไลด์ที่ 1: หน้าปกการนำเสนอแผนยุทธศาสตร์ที่ 3 สสจ.สระแก้ว (ชื่อตรงตามฐานข้อมูลจริง)');
}

// ==========================================
// SLIDE 2: STRATEGIC SCOPE (ขอบเขตและเจตนารมณ์)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: THEME.bgLight };
  addHeader(slide, 'บทบาท ขอบเขต และเจตนารมณ์ของประเด็นยุทธศาสตร์ที่ 3', '1. ภาพรวมและบริบท', 2);

  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.6, y: 1.4, w: 4.3, h: 3.7,
    fill: { color: THEME.cardBg },
    line: { color: THEME.cardBorder, width: 1 },
    rectRadius: 0.12
  });
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.85, y: 1.6, w: 3.8, h: 0.4,
    fill: { color: THEME.primaryLight },
    rectRadius: 0.06
  });
  slide.addText('🎯 เจตนารมณ์เชิงยุทธศาสตร์ (จากฐานข้อมูลจริง)', {
    x: 0.85, y: 1.6, w: 3.8, h: 0.4,
    fontSize: 11.5, bold: true, color: THEME.primary, fontFace: FONT_TH, align: 'center', valign: 'middle'
  });
  slide.addText(s3Data.issue.description, {
    x: 0.85, y: 2.15, w: 3.8, h: 2.75,
    fontSize: 11.5, color: THEME.darkText, fontFace: FONT_TH, lineSpacingMultiple: 1.25
  });

  // Right 4 Strategies (Exact names from DB)
  s3Data.strategies.forEach((st, idx) => {
    const py = 1.4 + idx * 0.95;
    slide.addShape(pres.ShapeType.roundRect, {
      x: 5.1, y: py, w: 4.3, h: 0.85,
      fill: { color: THEME.cardBg },
      line: { color: THEME.cardBorder, width: 1 },
      rectRadius: 0.08
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 5.1, y: py, w: 0.12, h: 0.85,
      fill: { color: idx === 0 ? THEME.blue : idx === 1 ? THEME.success : idx === 2 ? THEME.purple : THEME.primary }
    });
    slide.addText(`กลยุทธ์ [${st.auto_id}]`, {
      x: 5.35, y: py + 0.08, w: 3.9, h: 0.26,
      fontSize: 10, bold: true, color: THEME.primary, fontFace: FONT_TH
    });
    slide.addText(st.name, {
      x: 5.35, y: py + 0.34, w: 3.9, h: 0.46,
      fontSize: 9.5, color: THEME.darkText, fontFace: FONT_TH, lineSpacingMultiple: 1.05
    });
  });

  slide.addNotes('สไลด์ที่ 2: ภาพรวมและขอบเขตของประเด็นยุทธศาสตร์ที่ 3 และ 4 กลยุทธ์ตามฐานข้อมูลจริง');
}

// ==========================================
// SLIDE 3: OUTCOME INDICATORS (พร้อมตารางเป้าหมาย 5 ปี มี % ครบถ้วน)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: THEME.bgLight };
  addHeader(slide, 'ตัวชี้วัดผลลัพธ์ระดับยุทธศาสตร์ (Outcome Indicators - S3)', '2. ตัวชี้วัดระดับยุทธศาสตร์', 3);

  slide.addText('เกณฑ์วัดความสำเร็จสูงสุดของประเด็นยุทธศาสตร์ที่ 3 พร้อมเป้าหมาย 5 ปี (พ.ศ. 2570 - 2574)', {
    x: 0.6, y: 1.3, w: 8.8, h: 0.35,
    fontSize: 11, color: THEME.mutedText, fontFace: FONT_TH
  });

  s3Data.outcome_indicators.forEach((ind, i) => {
    const cx = 0.6 + i * 2.95;
    slide.addShape(pres.ShapeType.roundRect, {
      x: cx, y: 1.75, w: 2.85, h: 3.35,
      fill: { color: THEME.cardBg },
      line: { color: THEME.cardBorder, width: 1 },
      rectRadius: 0.12
    });

    slide.addShape(pres.ShapeType.rect, {
      x: cx, y: 1.75, w: 2.85, h: 0.08,
      fill: { color: i === 0 ? THEME.primary : i === 1 ? THEME.blue : THEME.success }
    });

    // Code Badge
    slide.addShape(pres.ShapeType.roundRect, {
      x: cx + 0.15, y: 1.95, w: 1.0, h: 0.3,
      fill: { color: THEME.bgLight },
      line: { color: THEME.primary, width: 1 },
      rectRadius: 0.06
    });
    slide.addText(ind.auto_id, {
      x: cx + 0.15, y: 1.95, w: 1.0, h: 0.3,
      fontSize: 10, bold: true, color: THEME.primary, fontFace: FONT_TH, align: 'center', valign: 'middle'
    });

    // Exact Title
    slide.addText(ind.name, {
      x: cx + 0.15, y: 2.32, w: 2.55, h: 0.75,
      fontSize: 11, bold: true, color: THEME.dark, fontFace: FONT_TH, lineSpacingMultiple: 1.1
    });

    // 5-Year Target Table Component (Always with % symbol)
    slide.addText('เป้าหมาย 5 ปี (พ.ศ. 2570 - 2574):', {
      x: cx + 0.15, y: 3.15, w: 2.55, h: 0.22,
      fontSize: 8.5, bold: true, color: THEME.mutedText, fontFace: FONT_TH
    });
    add5YearTargetTable(slide, cx + 0.15, 3.4, 2.55, [
      ind.target_2570, ind.target_2571, ind.target_2572, ind.target_2573, ind.target_2574
    ]);

    // Target summary highlight
    slide.addShape(pres.ShapeType.roundRect, {
      x: cx + 0.15, y: 4.1, w: 2.55, h: 0.45,
      fill: { color: THEME.primaryLight },
      line: { color: THEME.primaryBorder, width: 0.6 },
      rectRadius: 0.06
    });
    slide.addText(`เป้าหมายสูงสุด (ปี 2574): ${formatTargetVal(ind.target_2574)}`, {
      x: cx + 0.15, y: 4.1, w: 2.55, h: 0.45,
      fontSize: 9.5, bold: true, color: THEME.primary, fontFace: FONT_TH, align: 'center', valign: 'middle'
    });

    // Group Pill
    slide.addText(`📌 ${ind.responsible_group || 'สสจ.สระแก้ว'}`, {
      x: cx + 0.15, y: 4.7, w: 2.55, h: 0.28,
      fontSize: 8.5, color: THEME.lightText, fontFace: FONT_TH, align: 'center'
    });
  });

  slide.addNotes('สไลด์ที่ 3: ตัวชี้วัดผลลัพธ์ระดับยุทธศาสตร์ พร้อมเป้าหมาย 5 ปี มีเครื่องหมาย % ครบถ้วน');
}

// ==========================================
// SLIDE 4: ARCHITECTURE MAP (ข้อความเต็ม ไม่ตัด ไม่ใช้ ...)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: THEME.bgLight };
  addHeader(slide, 'แผนผังเชื่อมโยงยุทธศาสตร์ (Strategic Architecture Map)', '3. โครงสร้างยุทธศาสตร์', 4);

  // Top Issue Box with Exact Name
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.6, y: 1.30, w: 8.8, h: 0.58,
    fill: { color: THEME.primary },
    rectRadius: 0.08
  });
  slide.addText(`ประเด็นยุทธศาสตร์ที่ 3 (S3): ${s3Data.issue.name}`, {
    x: 0.75, y: 1.30, w: 8.5, h: 0.58,
    fontSize: 12, bold: true, color: 'FFFFFF', fontFace: FONT_TH, align: 'center', valign: 'middle'
  });

  // 4 Strategies Columns: Full text without ANY truncation or slice
  s3Data.strategies.forEach((st, idx) => {
    const sx = 0.6 + idx * 2.25;

    // Strategy header card
    slide.addShape(pres.ShapeType.roundRect, {
      x: sx, y: 2.0, w: 2.15, h: 0.82,
      fill: { color: THEME.cardBg },
      line: { color: THEME.primary, width: 1.5 },
      rectRadius: 0.08
    });
    slide.addText(`[${st.auto_id}]`, {
      x: sx, y: 2.04, w: 2.15, h: 0.20,
      fontSize: 9.5, bold: true, color: THEME.primary, fontFace: FONT_TH, align: 'center'
    });
    slide.addText(st.name, {
      x: sx + 0.08, y: 2.24, w: 2.0, h: 0.54,
      fontSize: 8, bold: true, color: THEME.dark, fontFace: FONT_TH, align: 'center', lineSpacingMultiple: 1.05
    });

    // Objectives container
    slide.addShape(pres.ShapeType.roundRect, {
      x: sx, y: 2.92, w: 2.15, h: 2.22,
      fill: { color: THEME.cardBg },
      line: { color: THEME.cardBorder, width: 1 },
      rectRadius: 0.08
    });

    // List every objective in FULL text (No slice, no '...')
    let objY = 2.98;
    st.objectives.forEach(o => {
      // Calculate dynamic height based on text length
      const textLen = o.name.length;
      const boxH = textLen > 60 ? 0.65 : textLen > 30 ? 0.52 : 0.40;
      slide.addText(`• [${o.auto_id}] ${o.name}`, {
        x: sx + 0.08, y: objY, w: 2.0, h: boxH,
        fontSize: 7.5, color: THEME.darkText, fontFace: FONT_TH, lineSpacingMultiple: 1.05
      });
      objY += boxH + 0.04;
    });

    // Summary badge at bottom
    const totalKRs = st.objectives.reduce((acc, o) => acc + o.key_results.length, 0);
    slide.addShape(pres.ShapeType.roundRect, {
      x: sx + 0.12, y: 4.85, w: 1.91, h: 0.24,
      fill: { color: THEME.bgLight },
      rectRadius: 0.05
    });
    slide.addText(`📊 ${st.objectives.length} เป้าประสงค์ | ${totalKRs} KR`, {
      x: sx + 0.12, y: 4.85, w: 1.91, h: 0.24,
      fontSize: 7.5, bold: true, color: THEME.primary, fontFace: FONT_TH, align: 'center', valign: 'middle'
    });
  });

  slide.addNotes('สไลด์ที่ 4: ผังเชื่อมโยงยุทธศาสตร์ แสดงข้อความเต็มครบถ้วนทุกเป้าประสงค์ ไม่มีการตัดทอน');
}

// =========================================================================
// STRATEGY 1: ST3.1 (สไลด์ 5 และ 6)
// =========================================================================
const s1 = s3Data.strategies[0]; // ST3.1

// SLIDE 5: ST3.1 Objectives & Key Results with 5-Year Targets (% added)
{
  const slide = pres.addSlide();
  slide.background = { color: THEME.bgLight };
  addHeader(
    slide,
    `กลยุทธ์ ${s1.auto_id}: ${s1.name}`,
    `กลยุทธ์ที่ 1 (${s1.auto_id}) | โครงสร้างและตัวชี้วัด`,
    5
  );

  slide.addText('เป้าประสงค์และตัวชี้วัด (Objectives & Key Results) พร้อมค่าเป้าหมาย 5 ปี (พ.ศ. 2570 - 2574)', {
    x: 0.6, y: 1.3, w: 8.8, h: 0.3,
    fontSize: 10.5, color: THEME.mutedText, fontFace: FONT_TH
  });

  // 3 Objectives Cards
  s1.objectives.forEach((obj, idx) => {
    const ox = 0.6 + idx * 2.95;
    const kr = obj.key_results[0];

    slide.addShape(pres.ShapeType.roundRect, {
      x: ox, y: 1.65, w: 2.85, h: 3.45,
      fill: { color: THEME.cardBg },
      line: { color: THEME.cardBorder, width: 1 },
      rectRadius: 0.1
    });

    // Objective ID Pill
    slide.addShape(pres.ShapeType.roundRect, {
      x: ox + 0.15, y: 1.8, w: 1.1, h: 0.28,
      fill: { color: THEME.primaryLight },
      line: { color: THEME.primaryBorder, width: 0.8 },
      rectRadius: 0.05
    });
    slide.addText(obj.auto_id, {
      x: ox + 0.15, y: 1.8, w: 1.1, h: 0.28,
      fontSize: 9.5, bold: true, color: THEME.primary, fontFace: FONT_TH, align: 'center', valign: 'middle'
    });

    // Objective Exact Name
    slide.addText(obj.name, {
      x: ox + 0.15, y: 2.12, w: 2.55, h: 0.65,
      fontSize: 10, bold: true, color: THEME.dark, fontFace: FONT_TH, lineSpacingMultiple: 1.1
    });

    // KR Box
    slide.addShape(pres.ShapeType.roundRect, {
      x: ox + 0.15, y: 2.82, w: 2.55, h: 0.72,
      fill: { color: THEME.bgLight },
      line: { color: THEME.cardBorder, width: 0.6 },
      rectRadius: 0.06
    });
    slide.addText(`[${kr.auto_id}]`, {
      x: ox + 0.22, y: 2.86, w: 2.4, h: 0.2,
      fontSize: 8.5, bold: true, color: THEME.primary, fontFace: FONT_TH
    });
    slide.addText(kr.name, {
      x: ox + 0.22, y: 3.05, w: 2.4, h: 0.45,
      fontSize: 8, color: THEME.darkText, fontFace: FONT_TH, lineSpacingMultiple: 1.05
    });

    // 5-Year Target Table (With % symbol)
    slide.addText('เป้าหมาย 5 ปี (พ.ศ. 2570 - 2574):', {
      x: ox + 0.15, y: 3.65, w: 2.55, h: 0.2,
      fontSize: 8.5, bold: true, color: THEME.mutedText, fontFace: FONT_TH
    });
    add5YearTargetTable(slide, ox + 0.15, 3.88, 2.55, [
      kr.target_2570, kr.target_2571, kr.target_2572, kr.target_2573, kr.target_2574
    ]);

    slide.addText(`📌 ${kr.responsible_group || 'กลุ่มงานพัฒนาทรัพยากรบุคคล'}`, {
      x: ox + 0.15, y: 4.65, w: 2.55, h: 0.25,
      fontSize: 8, color: THEME.lightText, fontFace: FONT_TH, align: 'center'
    });
  });

  slide.addNotes('สไลด์ที่ 5: กลยุทธ์ ST3.1 พัฒนากำลังคนให้มีสมรรถนะสูง มีความสุขในการทำงาน และคงอยู่อย่างภาคภูมิใจ (ระบุ % ครบถ้วน)');
}

// SLIDE 6: ST3.1 Initiative Activities + How-to 5 Tiers Concise
{
  const slide = pres.addSlide();
  const initiativesST31 = [
    '• 🌟 ส่งเสริมสุขภาวะองค์กร (Happy Workplace): ประเมินดัชนีความสุขประจำปี และจัดกิจกรรมยกย่องเชิดชูเกียรติสร้างขวัญกำลังใจ',
    '• 🤖 พัฒนาสมรรถนะด้วย AI: ส่งเสริมการประยุกต์ใช้ AI ในงานประจำ/บริการ งานวิชาการนวัตกรรม และงานสนับสนุน (Back Office)',
    '• 📈 มาตรการคงอยู่ในระบบ: ขับเคลื่อนการลดภาระงาน เพิ่มสวัสดิการ และสนับสนุนเส้นทางความก้าวหน้าในสายวิชาชีพ (Career Path)'
  ];
  const tiersST31 = [
    { role: '🏛️ สสจ.สระแก้ว', duty: 'สำรวจดัชนีความสุขปีละ 1 ครั้ง, จัดกิจกรรมสร้างสุขภาวะบุคลากร, อบรม AI งานวิชาการ, วางแผน Career Path การคงอยู่', color: THEME.primary, bg: THEME.primaryLight },
    { role: '🏥 โรงพยาบาล (รพ.)', duty: 'จัดทำแผน Happy Workplace, จัดตั้งพี่เลี้ยงวิจัย R2R, จัดเวทีวิชาการคัดเลือกนวัตกรรม, ยกย่องเชิดชูเกียรติคนดีคนเก่ง', color: THEME.blue, bg: THEME.blueBg },
    { role: '🏢 สสอ. (อำเภอ)', duty: 'สำรวจและดูแลขวัญกำลังใจระดับอำเภอ, ส่งเสริมบุคลากรเข้าร่วมอบรม AI, จัดเวทีวิชาการระดับอำเภอคัดเลือกผลงานขยายผล', color: THEME.purple, bg: THEME.purpleBg },
    { role: '🩺 รพ.สต.', duty: 'ร่วมสำรวจความสุขและกำหนดกิจกรรมสร้างสุข, นำปัญหาจริงในพื้นที่มาเป็นโจทย์วิจัย R2R และนวัตกรรม, แลกเปลี่ยนเรียนรู้', color: THEME.success, bg: THEME.successBg },
    { role: '🤝 ภาคีเครือข่าย', duty: 'สนับสนุนกิจกรรมสร้างสุขและขวัญกำลังใจ, สนับสนุนงบประมาณและวิทยากรพัฒนางานวิชาการร่วมกับ อปท. และมหาวิทยาลัย', color: THEME.dark, bg: THEME.bgLight }
  ];
  addStrategyHowToSlide(slide, s1.auto_id, s1.name, initiativesST31, tiersST31, 6);
  slide.addNotes('สไลด์ที่ 6: กิจกรรมริเริ่มภาพรวม และแนวทางขับเคลื่อน How to 5 ระดับ (สรุปกระชับ)');
}

// SLIDE 7: ST3.1 1-Year Action Plan (Q1 - Q4 Roadmap)
{
  const slide = pres.addSlide();
  const quartersST31 = [
    {
      q: 'Q1: วางรากฐาน & วิจัย',
      color: THEME.blue,
      milestones: [
        { label: '[KR3.1.2.1] กิจกรรมสร้างความสุข', target: 'เป้าหมาย: 100%', desc: 'จัดกิจกรรมสร้างความสุข ขวัญกำลังใจ สุขภาพกายใจ และสถานที่ทำงานน่าอยู่' },
        { label: '[KR3.1.1.1] จัดทำการวิจัยและนวัตกรรม', target: 'เป้าหมาย: 100%', desc: 'หน่วยบริการย่อยทุกหน่วยกำหนดโจทย์และเริ่มจัดทำงานวิจัย R2R/นวัตกรรม' }
      ]
    },
    {
      q: 'Q2: กิจกรรม & เวทีวิชาการ',
      color: THEME.purple,
      milestones: [
        { label: '[KR3.1.2.1] สร้างความสัมพันธ์บุคลากร', target: 'เป้าหมาย: 100%', desc: 'จัดกิจกรรมสร้างความสัมพันธ์ สานสัมพันธ์สหวิชาชีพและขวัญกำลังใจต่อเนื่อง' },
        { label: '[KR3.1.1.1] เตรียมนำเสนอผลงาน', target: 'เป้าหมาย: 100%', desc: 'หน่วยบริการเตรียมนำเสนอผลงาน และแม่ข่ายสนับสนุนจัดเวทีประกวดวิชาการ' }
      ]
    },
    {
      q: 'Q3: สำรวจความสุข & ติดตาม',
      color: THEME.primary,
      milestones: [
        { label: '[KR3.1.2.1] สำรวจดัชนีความสุขประจำปี', target: 'เป้าหมาย: 100%', desc: 'สำรวจ Happy Workplace ปีละ 1 ครั้ง และจัดทำแผนส่งเสริมตามผลประเมิน' },
        { label: '[KR3.1.1.1] รายงานความก้าวหน้า', target: 'เป้าหมาย: 85%', desc: 'ร้อยละของหน่วยบริการรายงานความก้าวหน้าส่งผลงานวิชาการ/นวัตกรรม' }
      ]
    },
    {
      q: 'Q4: ประเมินความสุข & เผยแพร่',
      color: THEME.success,
      milestones: [
        { label: '[KR3.1.2.1] ดัชนีความสุของค์กร', target: 'เป้าหมาย: 70%', desc: 'ดัชนีความสุขขององค์กรผ่านเกณฑ์มาตรฐาน และยกย่องเชิดชูเกียรติคนดีคนเก่ง' },
        { label: '[KR3.1.1.1] เผยแพร่ผลงานวิชาการ', target: 'เป้าหมาย: 85%', desc: 'หน่วยบริการมีผลงานวิชาการ/นวัตกรรมนำเสนอเผยแพร่ระดับอำเภอขึ้นไป' },
        { label: '[KR3.1.3.1] อัตราสูญเสียบุคลากร', target: 'เป้าหมาย: <= 9%', desc: 'ควบคุมอัตราการสูญเสียบุคลากรด้านสุขภาพให้อยู่ในเกณฑ์ และหนุน Career Path' }
      ]
    }
  ];
  addActionPlanSlide(slide, s1.auto_id, s1.name, 'การขับเคลื่อนเป้าหมาย KR3.1.2.1 (ความสุของค์กร), KR3.1.1.1 (ผลงานวิชาการ/นวัตกรรม) และ KR3.1.3.1 (การคงอยู่ในระบบ)', quartersST31, 7);
  slide.addNotes('สไลด์ที่ 7: แผนปฏิบัติการ 1 ปี กลยุทธ์ ST3.1 (Q1 - Q4 Roadmap)');
}


// =========================================================================
// STRATEGY 2: ST3.2 (สไลด์ 7 และ 8)
// =========================================================================
const s2 = s3Data.strategies[1]; // ST3.2

// SLIDE 7: ST3.2 Objectives & Key Results with 5-Year Targets (% added)
{
  const slide = pres.addSlide();
  slide.background = { color: THEME.bgLight };
  addHeader(
    slide,
    `กลยุทธ์ ${s2.auto_id}: ${s2.name}`,
    `กลยุทธ์ที่ 2 (${s2.auto_id}) | โครงสร้างและตัวชี้วัด`,
    8
  );

  slide.addText(`เป้าประสงค์ [${s2.objectives[0].auto_id}]: ${s2.objectives[0].name}`, {
    x: 0.6, y: 1.3, w: 8.8, h: 0.35,
    fontSize: 10.5, bold: true, color: THEME.primary, fontFace: FONT_TH
  });

  // 3 KR Cards under O3.2.1
  s2.objectives[0].key_results.forEach((kr, idx) => {
    const kx = 0.6 + idx * 2.95;

    slide.addShape(pres.ShapeType.roundRect, {
      x: kx, y: 1.65, w: 2.85, h: 3.45,
      fill: { color: THEME.cardBg },
      line: { color: THEME.cardBorder, width: 1 },
      rectRadius: 0.1
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: kx + 0.15, y: 1.8, w: 1.1, h: 0.28,
      fill: { color: THEME.primaryLight },
      line: { color: THEME.primaryBorder, width: 0.8 },
      rectRadius: 0.05
    });
    slide.addText(kr.auto_id, {
      x: kx + 0.15, y: 1.8, w: 1.1, h: 0.28,
      fontSize: 9.5, bold: true, color: THEME.primary, fontFace: FONT_TH, align: 'center', valign: 'middle'
    });

    slide.addText(kr.name, {
      x: kx + 0.15, y: 2.15, w: 2.55, h: 0.8,
      fontSize: 10, bold: true, color: THEME.dark, fontFace: FONT_TH, lineSpacingMultiple: 1.1
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: kx + 0.15, y: 3.0, w: 2.55, h: 0.55,
      fill: { color: THEME.bgLight },
      line: { color: THEME.cardBorder, width: 0.6 },
      rectRadius: 0.06
    });
    const focusText = idx === 0 ? '• ขยายบริการใหม่และเพิ่มรายได้สิทธิบัตรทอง/ประกันสังคม\n• พัฒนาระบบบันทึกรหัสโรคและการเบิกจ่ายชดเชย (Claim Audit)'
      : idx === 1 ? '• ควบคุมศูนย์ต้นทุน (Cost Center) ยาและเวชภัณฑ์\n• จัดซื้อร่วมระดับจังหวัดเพื่อสร้างอำนาจต่อรองราคา'
      : '• ยกระดับการบริหารต้นทุนต่อหน่วยบริการ (Unit Cost)\n• ควบคุมวันนอนและประสิทธิภาพการจัดสรรเตียงผู้ป่วย';
    slide.addText(focusText, {
      x: kx + 0.2, y: 3.05, w: 2.45, h: 0.45,
      fontSize: 8, color: THEME.darkText, fontFace: FONT_TH, lineSpacingMultiple: 1.05
    });

    // 5-Year Target Table (With % symbol)
    slide.addText('เป้าหมาย 5 ปี (พ.ศ. 2570 - 2574):', {
      x: kx + 0.15, y: 3.65, w: 2.55, h: 0.2,
      fontSize: 8.5, bold: true, color: THEME.mutedText, fontFace: FONT_TH
    });
    add5YearTargetTable(slide, kx + 0.15, 3.88, 2.55, [
      kr.target_2570, kr.target_2571, kr.target_2572, kr.target_2573, kr.target_2574
    ]);

    slide.addText(`📌 ${kr.responsible_group || 'กลุ่มงานประกันสุขภาพ'}`, {
      x: kx + 0.15, y: 4.65, w: 2.55, h: 0.25,
      fontSize: 8, color: THEME.lightText, fontFace: FONT_TH, align: 'center'
    });
  });

  slide.addNotes('สไลด์ที่ 8: กลยุทธ์ ST3.2 การเงินการคลังยั่งยืน (ระบุ % ครบถ้วน)');
}

// SLIDE 8: ST3.2 Initiative Activities + How-to 5 Tiers Concise
{
  const slide = pres.addSlide();
  const initiativesST32 = [
    '• 💰 เพิ่มประสิทธิภาพจัดเก็บรายได้: พัฒนาระบบเรียกเก็บทุกสิทธิ ตรวจสอบสิทธิ บันทึกบริการ Coding และระบบ Claim Audit',
    '• 📉 บริหารต้นทุนและคุมรายจ่าย: ควบคุมศูนย์ต้นทุน (Cost Center) ยา เวชภัณฑ์ และสาธารณูปโภค พร้อมระบบจัดซื้อร่วมระดับจังหวัด',
    '• 🚨 ระบบเตือนภัยและระดมทุน: จัดทำ Dashboard เฝ้าระวังวิกฤตการเงิน (ระดับ 1-7) และบูรณาการงบ อปท./กองทุนสุขภาพตำบล (กปท.)'
  ];
  const tiersST32 = [
    { role: '🏛️ สสจ.สระแก้ว', duty: 'จัดทำ Dashboard ติดตามการเงินและวิกฤติ, พัฒนาศักยภาพ Coding/Claim Audit, กำกับควบคุมค่าใช้จ่ายจังหวัด', color: THEME.primary, bg: THEME.primaryLight },
    { role: '🏥 โรงพยาบาล (รพ.)', duty: 'จัดทำ Planfin ตามจริง, จัดเก็บรายได้ทุกสิทธิ, ควบคุมศูนย์ต้นทุนยาและเวชภัณฑ์, เฝ้าระวังวิกฤติตามเกณฑ์', color: THEME.blue, bg: THEME.blueBg },
    { role: '🏢 สสอ. (อำเภอ)', duty: 'กำกับติดตามบริหารรายได้-ค่าใช้จ่ายปฐมภูมิ, ตรวจสอบคุณภาพข้อมูลเบิกจ่าย, ประสานแก้ไขปัญหา รพ.สต. ร่วมกับ รพ.', color: THEME.purple, bg: THEME.purpleBg },
    { role: '🩺 รพ.สต.', duty: 'บันทึกข้อมูลบริการให้ถูกต้องครบถ้วนเพื่อเบิกจ่าย, ตรวจสอบสิทธิ 100%, แก้ไขรายการติด C, ควบคุมยาและเวชภัณฑ์', color: THEME.success, bg: THEME.successBg },
    { role: '🤝 ภาคีเครือข่าย', duty: 'สนับสนุนงบประมาณพัฒนาระบบบริการจาก อปท., กองทุนหลักประกันสุขภาพตำบล (กปท.) และแหล่งทุนภายนอก', color: THEME.dark, bg: THEME.bgLight }
  ];
  addStrategyHowToSlide(slide, s2.auto_id, s2.name, initiativesST32, tiersST32, 9);
  slide.addNotes('สไลด์ที่ 9: กิจกรรมริเริ่มภาพรวม และแนวทางขับเคลื่อน How to 5 ระดับ (สรุปกระชับ)');
}

// SLIDE 10: ST3.2 1-Year Action Plan (Q1 - Q4 Roadmap)
{
  const slide = pres.addSlide();
  const quartersST32 = [
    {
      q: 'Q1: กำกับรายได้ & คุมต้นทุน',
      color: THEME.blue,
      milestones: [
        { label: '[KR3.2.1.1] ติดตามรายได้สะสม Q1', target: 'เป้าหมาย: 5%', desc: 'เปรียบเทียบรายได้สะสมปี 2570 กับช่วงเดียวกันปี 2569 (ไม่รวมงบเสื่อม/แรง)' },
        { label: '[KR3.2.1.2] คุมรายจ่ายตามเกณฑ์', target: 'เป้าหมาย: 30%', desc: 'โรงพยาบาลร้อยละ 30 ควบคุมรายจ่ายไม่สูงกว่ารายได้ตามเกณฑ์ Planfin' },
        { label: '[KR3.2.1.3] ประเมิน TPS Score Q1', target: 'เป้าหมาย: 60%', desc: 'โรงพยาบาลร้อยละ 60 ผ่านเกณฑ์ประเมินสถานะการเงิน TPS ระดับ A, B' }
      ]
    },
    {
      q: 'Q2: เร่งรัดเบิกจ่าย & ตรวจ Audit',
      color: THEME.purple,
      milestones: [
        { label: '[KR3.2.1.1] ติดตามรายได้ & Audit', target: 'เป้าหมาย: 5%', desc: 'เร่งรัดเรียกเก็บทุกสิทธิ ตรวจสอบสิทธิ บันทึกบริการ และประเมิน Claim Audit' },
        { label: '[KR3.2.1.2] คุม Cost Center ยา', target: 'เป้าหมาย: 30%', desc: 'ควบคุมศูนย์ต้นทุนยา เวชภัณฑ์ และบริหารจัดซื้อร่วมระดับจังหวัด' },
        { label: '[KR3.2.1.3] เฝ้าระวังวิกฤตการเงิน', target: 'เป้าหมาย: 60%', desc: 'โรงพยาบาลร้อยละ 60 รักษาสถานะ TPS score ระดับ A, B ต่อเนื่อง' }
      ]
    },
    {
      q: 'Q3: ทบทวนแผนงบประมาณ',
      color: THEME.primary,
      milestones: [
        { label: '[KR3.2.1.1] ติดตามรายได้สะสม Q3', target: 'เป้าหมาย: 5%', desc: 'วิเคราะห์รายรับบริการใหม่ และประสานระดมทุนจาก อปท./กองทุน กปท.' },
        { label: '[KR3.2.1.2] ปรับแผนรายจ่ายจริง', target: 'เป้าหมาย: 30%', desc: 'ปรับแผนรายจ่ายให้สอดคล้องกับรายรับจริง ป้องกันภาวะขาดทุนสุทธิ' },
        { label: '[KR3.2.1.3] ควบคุมความเสี่ยง TPS', target: 'เป้าหมาย: 60%', desc: 'โรงพยาบาลผ่านเกณฑ์ TPS ระดับ A, B และไม่มีแห่งใดตกเกณฑ์ระดับ 3-7' }
      ]
    },
    {
      q: 'Q4: สรุปผลการเงิน & เสถียรภาพ',
      color: THEME.success,
      milestones: [
        { label: '[KR3.2.1.1] สรุปรายได้สะสมทั้งปี', target: 'เป้าหมาย: 5%', desc: 'รายได้สะสมหน่วยบริการเพิ่มขึ้นอย่างน้อย 5% เมื่อเทียบกับฐานปี 2569' },
        { label: '[KR3.2.1.2] สรุปการคุมรายจ่าย', target: 'เป้าหมาย: 30%', desc: 'โรงพยาบาลร้อยละ 30 ควบคุมค่าใช้จ่ายไม่สูงกว่ารายได้อย่างมีประสิทธิภาพ' },
        { label: '[KR3.2.1.3] สรุปผล TPS Score ทั้งปี', target: 'เป้าหมาย: 60%', desc: 'โรงพยาบาลร้อยละ 60 บรรลุเกณฑ์ TPS score ระดับ A, B ครบตามเป้าหมาย' }
      ]
    }
  ];
  addActionPlanSlide(slide, s2.auto_id, s2.name, 'การขับเคลื่อนเป้าหมาย KR3.2.1.1 (เพิ่มรายได้), KR3.2.1.2 (คุมรายจ่าย) และ KR3.2.1.3 (TPS score ระดับ A, B)', quartersST32, 10);
  slide.addNotes('สไลด์ที่ 10: แผนปฏิบัติการ 1 ปี กลยุทธ์ ST3.2 (Q1 - Q4 Roadmap)');
}


// =========================================================================
// STRATEGY 3: ST2.3 (สไลด์ 9 และ 10) - EXACT CODE & NAME FROM DB
// =========================================================================
const s3 = s3Data.strategies[2]; // ST2.3

// SLIDE 9: ST2.3 Objectives & Key Results with 5-Year Targets (% added)
{
  const slide = pres.addSlide();
  slide.background = { color: THEME.bgLight };
  addHeader(
    slide,
    `กลยุทธ์ ${s3.auto_id}: ${s3.name}`,
    `กลยุทธ์ที่ 3 (${s3.auto_id}) | โครงสร้างและตัวชี้วัด`,
    11
  );

  slide.addText('เป้าประสงค์และตัวชี้วัด (Objectives & Key Results) พร้อมค่าเป้าหมาย 5 ปี (พ.ศ. 2570 - 2574)', {
    x: 0.6, y: 1.3, w: 8.8, h: 0.3,
    fontSize: 10.5, color: THEME.mutedText, fontFace: FONT_TH
  });

  // 2 Objectives Cards
  s3.objectives.forEach((obj, idx) => {
    const ox = 0.6 + idx * 4.55;
    const kr = obj.key_results[0];

    slide.addShape(pres.ShapeType.roundRect, {
      x: ox, y: 1.65, w: 4.25, h: 3.45,
      fill: { color: THEME.cardBg },
      line: { color: THEME.cardBorder, width: 1 },
      rectRadius: 0.1
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: ox + 0.2, y: 1.8, w: 1.2, h: 0.28,
      fill: { color: THEME.primaryLight },
      line: { color: THEME.primaryBorder, width: 0.8 },
      rectRadius: 0.05
    });
    slide.addText(obj.auto_id, {
      x: ox + 0.2, y: 1.8, w: 1.2, h: 0.28,
      fontSize: 9.5, bold: true, color: THEME.primary, fontFace: FONT_TH, align: 'center', valign: 'middle'
    });

    slide.addText(obj.name, {
      x: ox + 0.2, y: 2.15, w: 3.85, h: 0.55,
      fontSize: 10.5, bold: true, color: THEME.dark, fontFace: FONT_TH, lineSpacingMultiple: 1.1
    });

    // KR Box
    slide.addShape(pres.ShapeType.roundRect, {
      x: ox + 0.2, y: 2.75, w: 3.85, h: 0.75,
      fill: { color: THEME.bgLight },
      line: { color: THEME.cardBorder, width: 0.6 },
      rectRadius: 0.06
    });
    slide.addText(`[${kr.auto_id}]`, {
      x: ox + 0.3, y: 2.8, w: 3.65, h: 0.2,
      fontSize: 9, bold: true, color: THEME.primary, fontFace: FONT_TH
    });
    slide.addText(kr.name, {
      x: ox + 0.3, y: 3.02, w: 3.65, h: 0.42,
      fontSize: 8.5, color: THEME.darkText, fontFace: FONT_TH, lineSpacingMultiple: 1.05
    });

    // 5-Year Target Table (With % symbol)
    slide.addText('เป้าหมาย 5 ปี (พ.ศ. 2570 - 2574):', {
      x: ox + 0.2, y: 3.65, w: 3.85, h: 0.2,
      fontSize: 8.5, bold: true, color: THEME.mutedText, fontFace: FONT_TH
    });
    add5YearTargetTable(slide, ox + 0.2, 3.88, 3.85, [
      kr.target_2570, kr.target_2571, kr.target_2572, kr.target_2573, kr.target_2574
    ]);

    slide.addText(`📌 ${kr.responsible_group || 'กลุ่มงานบริหารทั่วไป'}`, {
      x: ox + 0.2, y: 4.65, w: 3.85, h: 0.25,
      fontSize: 8.5, color: THEME.lightText, fontFace: FONT_TH, align: 'center'
    });
  });

  slide.addNotes('สไลด์ที่ 11: กลยุทธ์ ST2.3 ยกระดับการบริหารจัดการทรัพยากรให้มีประสิทธิภาพสูงสุด และบูรณาการคลังข้อมูลทรัพยากร (ระบุ % ครบถ้วน)');
}

// SLIDE 10: ST2.3 Initiative Activities + How-to 5 Tiers Concise
{
  const slide = pres.addSlide();
  const initiativesST23 = [
    '• 📦 อบรมและบันทึกระบบ PLAN D: อบรมให้ความรู้เจ้าหน้าที่ในการบันทึกข้อมูลสินทรัพย์ในระบบ PLAN D สำหรับ รพ., สสอ. และ รพ.สต. ทุกแห่ง',
    '• 🔄 เชื่อมโยงคลังข้อมูลกลาง: กำหนดวิธีการและพัฒนาระบบ PLAN D เพื่อเชื่อมฐานข้อมูลสินทรัพย์ทุกหน่วยงานเข้าสู่คลังกลางระดับจังหวัด',
    '• 📋 ตรวจสอบและนิเทศพัสดุ: นิเทศติดตามตรวจสอบระบบบัญชีสินทรัพย์และหลักการบริหารพัสดุ รพท./รพช./สสอ. และ รพ.สต. ทุกแห่ง'
  ];
  const tiersST23 = [
    { role: '🏛️ สสจ.สระแก้ว', duty: 'จัดอบรมบันทึกสินทรัพย์ในระบบ PLAN D แก่ทุกแห่ง, จัดทำระบบเชื่อมฐานข้อมูลคลังกลาง, นิเทศระบบพัสดุระดับจังหวัด', color: THEME.primary, bg: THEME.primaryLight },
    { role: '🏥 โรงพยาบาล (รพ.)', duty: 'บันทึกสินทรัพย์ในระบบ Plan-d ให้ครบถ้วนเป็นปัจจุบัน, นิเทศระบบบัญชีสินทรัพย์และพัสดุ รพ.สต. ร่วมกับ สสอ.', color: THEME.blue, bg: THEME.blueBg },
    { role: '🏢 สสอ. (อำเภอ)', duty: 'บันทึกข้อมูลสินทรัพย์ใน Plan-d ถูกต้อง, ร่วมกับ รพ. นิเทศติดตามระบบบัญชีสินทรัพย์และพัสดุ รพ.สต. ทุกแห่ง', color: THEME.purple, bg: THEME.purpleBg },
    { role: '🩺 รพ.สต.', duty: 'บันทึกข้อมูลสินทรัพย์ในระบบ Plan-d ให้ครบถ้วน ถูกต้อง และจัดทำบัญชีคุมสินทรัพย์ให้เป็นปัจจุบันตามระเบียบ', color: THEME.success, bg: THEME.successBg },
    { role: '🤝 ภาคีเครือข่าย', duty: 'สนับสนุนทุกเครือข่ายในการบริหารสินทรัพย์และหมุนเวียนใช้ประโยชน์เครื่องมืออุปกรณ์เพื่อประชาชนในพื้นที่', color: THEME.dark, bg: THEME.bgLight }
  ];
  addStrategyHowToSlide(slide, s3.auto_id, s3.name, initiativesST23, tiersST23, 12);
  slide.addNotes('สไลด์ที่ 12: กิจกรรมริเริ่มภาพรวม และแนวทางขับเคลื่อน How to 5 ระดับ (สรุปกระชับ)');
}

// SLIDE 13: ST2.3 1-Year Action Plan (Q1 - Q4 Roadmap)
{
  const slide = pres.addSlide();
  const quartersST23 = [
    {
      q: 'Q1: ระบบ PLAN-D & ฐานข้อมูล',
      color: THEME.blue,
      milestones: [
        { label: '[KR3.3.1.1] เตรียมพร้อมระบบ PLAN-D', target: 'เป้าหมาย: 90%', desc: 'หน่วยบริการเตรียมความพร้อมจัดทำฐานข้อมูลสินทรัพย์ในระบบ PLAN-D' },
        { label: '[KR3.3.2.1] ฐานข้อมูลสินทรัพย์ถูกต้อง', target: 'เป้าหมาย: 90%', desc: 'รพ. และหน่วยบริการจัดเตรียมฐานข้อมูลสินทรัพย์ถูกต้องเป็นปัจจุบันทุกประเภท' }
      ]
    },
    {
      q: 'Q2: บันทึกข้อมูล & นิเทศพัสดุ',
      color: THEME.purple,
      milestones: [
        { label: '[KR3.3.1.1] บันทึก PLAN-D ต่อเนื่อง', target: 'เป้าหมาย: 90%', desc: 'บันทึกข้อมูลสินทรัพย์ ครุภัณฑ์การแพทย์ในระบบ PLAN-D ครอบคลุมทุกแห่ง' },
        { label: '[KR3.3.2.1] นิเทศระบบสินทรัพย์และพัสดุ', target: 'เป้าหมาย: 90%', desc: 'ทีมจังหวัดและ รพ. นิเทศติดตามระบบบัญชีสินทรัพย์และพัสดุ รพ.สต. ทุกอำเภอ' }
      ]
    },
    {
      q: 'Q3: เชื่อมโยงคลังข้อมูลกลาง',
      color: THEME.primary,
      milestones: [
        { label: '[KR3.3.1.1] เชื่อมคลังกลาง & หมุนเวียน', target: 'เป้าหมาย: 90%', desc: 'เชื่อมโยงฐานข้อมูลเข้าสู่คลังกลาง และเริ่มกลไกหมุนเวียนทรัพยากรระหว่างหน่วยงาน' },
        { label: '[KR3.3.2.1] เกณฑ์บริหารสินทรัพย์', target: 'เป้าหมาย: 90%', desc: 'โรงพยาบาลและหน่วยบริการผ่านเกณฑ์การบริหารจัดการสินทรัพย์ทุกประเภท' }
      ]
    },
    {
      q: 'Q4: สรุปผลคลังกลาง & คุ้มค่า',
      color: THEME.success,
      milestones: [
        { label: '[KR3.3.1.1] คลังกลางสมบูรณ์ 100%', target: 'เป้าหมาย: 90%', desc: 'ระบบคลังกลางเปิดใช้งานเต็มรูปแบบ และประเมินผลสัมฤทธิ์การใช้ทรัพยากรร่วมกัน' },
        { label: '[KR3.3.2.1] สรุปผลเกณฑ์สินทรัพย์', target: 'เป้าหมาย: 90%', desc: 'โรงพยาบาลและหน่วยบริการผ่านเกณฑ์บริหารสินทรัพย์ทุกประเภทครบตามเป้า' }
      ]
    }
  ];
  addActionPlanSlide(slide, s3.auto_id, s3.name, 'การขับเคลื่อนเป้าหมาย KR3.3.1.1 (เชื่อมโยงคลังข้อมูลกลาง) และ KR3.3.2.1 (บริหารสินทรัพย์ทุกประเภท)', quartersST23, 13);
  slide.addNotes('สไลด์ที่ 13: แผนปฏิบัติการ 1 ปี กลยุทธ์ ST2.3 (Q1 - Q4 Roadmap)');
}


// =========================================================================
// STRATEGY 4: ST3.4 (สไลด์ 11 และ 12) - NO KPI DICT!
// =========================================================================
const s4 = s3Data.strategies[3]; // ST3.4

// SLIDE 11: ST3.4 Objectives & Key Results with 5-Year Targets (% added)
{
  const slide = pres.addSlide();
  slide.background = { color: THEME.bgLight };
  addHeader(
    slide,
    `กลยุทธ์ ${s4.auto_id}: ${s4.name}`,
    `กลยุทธ์ที่ 4 (${s4.auto_id}) | โครงสร้างและตัวชี้วัด`,
    14
  );

  slide.addText('เป้าประสงค์และตัวชี้วัด (Objectives & Key Results) พร้อมค่าเป้าหมาย 5 ปี (พ.ศ. 2570 - 2574)', {
    x: 0.6, y: 1.3, w: 8.8, h: 0.3,
    fontSize: 10.5, color: THEME.mutedText, fontFace: FONT_TH
  });

  const obj = s4.objectives[0];
  const kr = obj.key_results[0];

  // Left Card: Objective & KR with 5-Year Target Table (% added)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.6, y: 1.65, w: 4.25, h: 3.45,
    fill: { color: THEME.cardBg },
    line: { color: THEME.cardBorder, width: 1 },
    rectRadius: 0.1
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 1.8, w: 1.2, h: 0.28,
    fill: { color: THEME.primaryLight },
    line: { color: THEME.primaryBorder, width: 0.8 },
    rectRadius: 0.05
  });
  slide.addText(obj.auto_id, {
    x: 0.8, y: 1.8, w: 1.2, h: 0.28,
    fontSize: 9.5, bold: true, color: THEME.primary, fontFace: FONT_TH, align: 'center', valign: 'middle'
  });

  slide.addText(obj.name, {
    x: 0.8, y: 2.15, w: 3.85, h: 0.55,
    fontSize: 10, bold: true, color: THEME.dark, fontFace: FONT_TH, lineSpacingMultiple: 1.1
  });

  // KR Box
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 2.75, w: 3.85, h: 0.75,
    fill: { color: THEME.bgLight },
    line: { color: THEME.cardBorder, width: 0.6 },
    rectRadius: 0.06
  });
  slide.addText(`[${kr.auto_id}]`, {
    x: 0.9, y: 2.8, w: 3.65, h: 0.2,
    fontSize: 9, bold: true, color: THEME.primary, fontFace: FONT_TH
  });
  slide.addText(kr.name, {
    x: 0.9, y: 3.02, w: 3.65, h: 0.42,
    fontSize: 8.5, color: THEME.darkText, fontFace: FONT_TH, lineSpacingMultiple: 1.05
  });

  // 5-Year Target Table Component (With % symbol)
  slide.addText('เป้าหมาย 5 ปี (พ.ศ. 2570 - 2574):', {
    x: 0.8, y: 3.65, w: 3.85, h: 0.2,
    fontSize: 8.5, bold: true, color: THEME.mutedText, fontFace: FONT_TH
  });
  add5YearTargetTable(slide, 0.8, 3.88, 3.85, [
    kr.target_2570, kr.target_2571, kr.target_2572, kr.target_2573, kr.target_2574
  ]);

  slide.addText(`📌 ${kr.responsible_group || 'กลุ่มงานสุขภาพดิจิทัล'}`, {
    x: 0.8, y: 4.65, w: 3.85, h: 0.25,
    fontSize: 8.5, color: THEME.lightText, fontFace: FONT_TH, align: 'center'
  });

  // Right Card: Strategic Focus (No KPI Dict)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 5.15, y: 1.65, w: 4.25, h: 3.45,
    fill: { color: THEME.cardBg },
    line: { color: THEME.cardBorder, width: 1 },
    rectRadius: 0.1
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: 5.35, y: 1.8, w: 2.8, h: 0.28,
    fill: { color: THEME.primaryLight },
    line: { color: THEME.primaryBorder, width: 0.8 },
    rectRadius: 0.05
  });
  slide.addText('จุดเน้นสำคัญในการขับเคลื่อน (Strategic Focus)', {
    x: 5.35, y: 1.8, w: 2.8, h: 0.28,
    fontSize: 9.5, bold: true, color: THEME.primary, fontFace: FONT_TH, align: 'center', valign: 'middle'
  });

  const focusPoints = [
    { title: '1. มุ่งเน้นนวัตกรรมที่ใช้งานได้จริง (Usable Innovation)', desc: 'ไม่ใช่แค่ผลงานกระดาษ แต่ต้องวัดผลลัพธ์ลดเวลาทำงาน หรือลดขั้นตอนซ้ำซ้อนได้อย่างเป็นรูปธรรม' },
    { title: '2. สนับสนุนเครื่องมือและ AI License ที่ถูกระเบียบ', desc: 'จังหวัดวางแนวทางระเบียบเบิกจ่ายเพื่อให้หน่วยงานจัดซื้อ Subscription AI ได้อย่างถูกต้อง ปลอดภัย' },
    { title: '3. สร้าง Citizen Developer และ Super User ประจำแผนก', desc: 'อบรมเข้มข้นให้บุคลากรสายคลินิกและสหวิชาชีพสามารถสร้าง Workflow Automation ของตนเองได้' },
    { title: '4. ยกระดับสู่ รพ.สต.อัจฉริยะ (Smart Health Center)', desc: 'ลดภาระงานรวบรวมไฟล์ Excel ในพื้นที่ และใช้เครื่องมือดิจิทัลกลางร่วมกันทั้งจังหวัด' }
  ];

  let fy = 2.25;
  focusPoints.forEach(fp => {
    slide.addText(`• ${fp.title}`, {
      x: 5.35, y: fy, w: 3.85, h: 0.22,
      fontSize: 9, bold: true, color: THEME.dark, fontFace: FONT_TH
    });
    slide.addText(fp.desc, {
      x: 5.5, y: fy + 0.2, w: 3.7, h: 0.38,
      fontSize: 8.5, color: THEME.mutedText, fontFace: FONT_TH, lineSpacingMultiple: 1.05
    });
    fy += 0.62;
  });

  slide.addNotes('สไลด์ที่ 14: กลยุทธ์ ST3.4 ยกระดับสู่ระบบสุขภาพดิจิทัลและนวัตกรรมองค์กร พร้อมเป้าหมาย 5 ปี (ระบุ % ครบถ้วน)');
}

// SLIDE 12: ST3.4 Initiative Activities + How-to 5 Tiers Concise
{
  const slide = pres.addSlide();
  const initiativesST34 = [
    '• 🧭 Digital Framework & Task Force: กำหนดกรอบนวัตกรรมดิจิทัล และตั้งทีม AI Task Force ลงพื้นที่ Coaching วิเคราะห์ Pain point',
    '• 🛠️ อบรมเชิงปฏิบัติการเครื่องมือจริง: เน้น Low-code/No-code, Workflow Automation และ AI Prompt Engineering ลดภาระงานโดยตรง',
    '• 📜 ปลดล็อกระเบียบ AI & เวทีประกวด: วางระเบียบจัดซื้อ AI License/Subscription ถูกต้อง และจัดประกวดนวัตกรรมดิจิทัลขยายผล'
  ];
  const tiersST34 = [
    { role: '🏛️ สสจ.สระแก้ว', duty: 'ประกาศนโยบาย Data Architecture/DPIA, ตั้ง AI Task Force พี่เลี้ยง Coaching, วางระเบียบ AI License, จัดเวทีประกวด', color: THEME.primary, bg: THEME.primaryLight },
    { role: '🏥 โรงพยาบาล (รพ.)', duty: 'ตั้งโจทย์ลดเวลารอคอย/ลดเอกสารพยาบาล, สร้าง Super User / Citizen Developer ใน รพ., จัดสรรเงินบำรุงหนุน AI', color: THEME.blue, bg: THEME.blueBg },
    { role: '🏢 สสอ. (อำเภอ)', duty: 'Data Automation ลดส่งไฟล์ Excel, เป็นพี่เลี้ยงช่วย รพ.สต. นำเทคโนโลยีไปใช้, ส่งผลงานนวัตกรรมประกวด', color: THEME.purple, bg: THEME.purpleBg },
    { role: '🩺 รพ.สต.', duty: 'ยึดเป้าหมาย "รพ.สต.อัจฉริยะ", สะท้อน Pain point จริงให้ทีมพี่เลี้ยงร่วมแก้, ใช้เครื่องมือกลางที่จังหวัดจัดเตรียมให้', color: THEME.success, bg: THEME.successBg },
    { role: '🤝 ภาคีเครือข่าย', duty: 'สถาบันการศึกษาในพื้นที่ส่งอาจารย์/นักศึกษาไอทีมาร่วมเป็น Co-mentor, อสม. ใช้ Smart Line OA คัดกรองข้อมูล', color: THEME.dark, bg: THEME.bgLight }
  ];
  addStrategyHowToSlide(slide, s4.auto_id, s4.name, initiativesST34, tiersST34, 15);
  slide.addNotes('สไลด์ที่ 15: กิจกรรมริเริ่มภาพรวม และแนวทางขับเคลื่อน How to 5 ระดับ (สรุปกระชับ)');
}




// SLIDE 16: ST3.4 1-Year Action Plan (Q1 - Q4 Roadmap)
{
  const slide = pres.addSlide();
  const quartersST34 = [
    {
      q: 'Q1: วางรากฐาน Task Force',
      color: THEME.blue,
      milestones: [
        { label: '[KR3.4.1.1] AI & Digital Task Force', target: 'เป้าหมาย: 100%', desc: 'แต่งตั้งคณะทำงานระดับหน่วยงานทุกแห่ง เพื่อวิเคราะห์ Pain point หน้างาน' },
        { label: '[KR3.4.1.1] สนับสนุน AI License', target: 'เป้าหมาย: 100%', desc: 'กลุ่มงานใน สสจ. ใช้งาน AI ที่สนับสนุนจากหน่วยงาน ช่วยงานประจำและบริการ' }
      ]
    },
    {
      q: 'Q2: อบรมพัฒนา & แพลตฟอร์มกลาง',
      color: THEME.purple,
      milestones: [
        { label: '[KR3.4.1.1] Workshop สหวิชาชีพ & IT', target: 'เป้าหมาย: >= 1 ครั้ง', desc: 'อบรมเชิงปฏิบัติการ Low-code, Workflow Automation และ Prompt AI' },
        { label: '[KR3.4.1.1] เว็บแอปรายงานความก้าวหน้า', target: 'เป้าหมาย: 1 ระบบ', desc: 'เปิดใช้งานระบบเว็บแอปรวบรวมความก้าวหน้านวัตกรรมและคลัง Prompt AI จังหวัด' }
      ]
    },
    {
      q: 'Q3: ขยายผลใช้งานจริง & Coaching',
      color: THEME.primary,
      milestones: [
        { label: '[KR3.4.1.1] รายงานผลงานนวัตกรรม', target: 'เป้าหมาย: 30%', desc: 'หน่วยงานร้อยละ 30 รายงานผลงานนวัตกรรมดิจิทัล/AI ที่นำไปใช้งานได้จริง' },
        { label: '[KR3.4.1.1] On-site Coaching รายอำเภอ', target: 'เป้าหมาย: ทุกอำเภอ', desc: 'ทีมพี่เลี้ยง AI Task Force ลงพื้นที่สนับสนุนและช่วยแก้ปัญหาหน้างานจริง' }
      ]
    },
    {
      q: 'Q4: ประเมินผล & ประกวดนวัตกรรม',
      color: THEME.success,
      milestones: [
        { label: '[KR3.4.1.1] ส่งประกวดระดับจังหวัด', target: 'เป้าหมาย: 30%', desc: 'หน่วยงานส่งผลงานนวัตกรรมดิจิทัลเข้าร่วมประกวดเวทีวิชาการระดับจังหวัด' },
        { label: '[KR3.4.1.1] ถอดบทเรียน Best Practice', target: 'เป้าหมาย: 1 เล่ม', desc: 'จัดทำคู่มือนวัตกรรม Best Practice เผยแพร่และขยายผลทั่วทั้งจังหวัด' }
      ]
    }
  ];
  addActionPlanSlide(slide, s4.auto_id, s4.name, 'การขับเคลื่อนเป้าหมาย KR3.4.1.1 (นวัตกรรมดิจิทัลและปัญญาประดิษฐ์ AI สู่การปฏิบัติการจริง 4 ไตรมาส)', quartersST34, 16);
  slide.addNotes('สไลด์ที่ 16: แผนปฏิบัติการ 1 ปี กลยุทธ์ ST3.4 (Q1 - Q4 Roadmap)');
}

// ==========================================
// SLIDE 14: 3 FLAGSHIP PROJECTS (โครงการสำคัญตามชื่อจริงจากฐานข้อมูล)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: THEME.bgLight };
  addHeader(slide, 'โครงการสำคัญภายใต้ประเด็นยุทธศาสตร์ที่ 3 (Flagship Projects)', '4. แผนงานโครงการสำคัญ', 17);

  const projects = [
    {
      num: 'โครงการที่ 1',
      title: s3Data.projects[0].name,
      group: s3Data.projects[0].responsible_group,
      color: THEME.primary,
      desc: s3Data.projects[0].description || 'มุ่งเน้นการวางมาตรฐานโครงสร้างพื้นฐานด้านข้อมูลระดับจังหวัด พัฒนาระบบเชื่อมโยงข้อมูลสุขภาพ Data Automation และยกระดับหน่วยบริการสู่ รพ.สต.อัจฉริยะ'
    },
    {
      num: 'โครงการที่ 2',
      title: s3Data.projects[1].name,
      group: s3Data.projects[1].responsible_group,
      color: THEME.purple,
      desc: 'มุ่งเน้นการพัฒนาระบบคลังข้อมูลกลางสินทรัพย์ ครุภัณฑ์การแพทย์ การสร้างกลไกหมุนเวียนทรัพยากรระหว่างโรงพยาบาล และการผลักดันการจัดซื้อร่วมระดับจังหวัดเพื่อความคุ้มค่าสูงสุด'
    },
    {
      num: 'โครงการที่ 3',
      title: s3Data.projects[2].name,
      group: s3Data.projects[2].responsible_group,
      color: THEME.blue,
      desc: s3Data.projects[2].description || 'ส่งเสริมการประยุกต์ใช้ AI เพื่อเพิ่มประสิทธิภาพงานประจำ บริการ วิชาการ นวัตกรรม และงานสนับสนุน พัฒนาศักยภาพบุคลากรให้ใช้ AI อย่างปลอดภัยและเกิดประโยชน์สูงสุด'
    }
  ];

  projects.forEach((proj, i) => {
    const px = 0.6 + i * 2.95;
    slide.addShape(pres.ShapeType.roundRect, {
      x: px, y: 1.4, w: 2.85, h: 3.7,
      fill: { color: THEME.cardBg },
      line: { color: THEME.cardBorder, width: 1 },
      rectRadius: 0.1
    });

    slide.addShape(pres.ShapeType.rect, {
      x: px, y: 1.4, w: 2.85, h: 0.08,
      fill: { color: proj.color }
    });

    slide.addText(proj.num, {
      x: px + 0.18, y: 1.58, w: 2.49, h: 0.22,
      fontSize: 9.5, bold: true, color: proj.color, fontFace: FONT_TH
    });
    slide.addText(proj.title, {
      x: px + 0.18, y: 1.82, w: 2.49, h: 0.85,
      fontSize: 10.5, bold: true, color: THEME.dark, fontFace: FONT_TH, lineSpacingMultiple: 1.1
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: px + 0.18, y: 2.72, w: 2.49, h: 0.3,
      fill: { color: THEME.bgLight },
      rectRadius: 0.06
    });
    slide.addText(`📌 ${proj.group}`, {
      x: px + 0.18, y: 2.72, w: 2.49, h: 0.3,
      fontSize: 8.5, bold: true, color: THEME.darkText, fontFace: FONT_TH, align: 'center', valign: 'middle'
    });

    slide.addText('รายละเอียดและขอบเขต:', {
      x: px + 0.18, y: 3.1, w: 2.49, h: 0.22,
      fontSize: 9, bold: true, color: THEME.darkText, fontFace: FONT_TH
    });
    slide.addText(proj.desc, {
      x: px + 0.18, y: 3.35, w: 2.49, h: 1.6,
      fontSize: 8.5, color: THEME.mutedText, fontFace: FONT_TH, lineSpacingMultiple: 1.15
    });
  });

  slide.addNotes('สไลด์ที่ 17: โครงการสำคัญ 3 โครงการ (ใช้ชื่อเต็มตรงตามฐานข้อมูลจริง)');
}

// ==========================================
// SLIDE 15: KEY SUCCESS FACTORS & MONITORING (ปัจจัยความสำเร็จและการกำกับติดตาม)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: THEME.bgLight };
  addHeader(slide, 'ปัจจัยแห่งความสำเร็จและการกำกับติดตาม (Key Success Factors & Governance)', '5. การขับเคลื่อนสู่ความสำเร็จ', 18);

  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.6, y: 1.4, w: 4.25, h: 3.7,
    fill: { color: THEME.cardBg },
    line: { color: THEME.cardBorder, width: 1 },
    rectRadius: 0.1
  });
  slide.addShape(pres.ShapeType.rect, {
    x: 0.6, y: 1.4, w: 4.25, h: 0.08,
    fill: { color: THEME.primary }
  });
  slide.addText('🔑 4 ปัจจัยแห่งความสำเร็จ (Key Success Factors)', {
    x: 0.8, y: 1.6, w: 3.85, h: 0.35,
    fontSize: 12, bold: true, color: THEME.primary, fontFace: FONT_TH
  });

  const factors = [
    { title: '1. ภาวะผู้นำและการเปิดรับ (Leadership & Mindset)', desc: 'ผู้บริหารทุกระดับสนับสนุนทรัพยากร และเปิดใจรับการนำ AI มาปรับปรุงกระบวนการ' },
    { title: '2. การทำงานแบบ Agile & Cross-functional', desc: 'ผสานทีม IT, บุคลากรคลินิก และงานบริหาร ให้ร่วมกันออกแบบ Workflow หน้างาน' },
    { title: '3. ความปลอดภัยและธรรมาภิบาลข้อมูล (Data Governance)', desc: 'ปฏิบัติตามมาตรฐาน PDPA/DPIA สร้างความมั่นใจในการใช้งานเทคโนโลยีดิจิทัล' },
    { title: '4. ระบบสนับสนุนที่ไร้รอยต่อ (Seamless Support)', desc: 'จัดหา License ที่ถูกต้อง มีทีม On-site Coaching คอยช่วยเหลือเชิงเทคนิคอย่างใกล้ชิด' }
  ];

  let fy = 2.05;
  factors.forEach(f => {
    slide.addText(f.title, {
      x: 0.8, y: fy, w: 3.85, h: 0.22,
      fontSize: 9.5, bold: true, color: THEME.dark, fontFace: FONT_TH
    });
    slide.addText(f.desc, {
      x: 0.8, y: fy + 0.2, w: 3.85, h: 0.45,
      fontSize: 9, color: THEME.mutedText, fontFace: FONT_TH, lineSpacingMultiple: 1.1
    });
    fy += 0.68;
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: 5.15, y: 1.4, w: 4.25, h: 3.7,
    fill: { color: THEME.cardBg },
    line: { color: THEME.cardBorder, width: 1 },
    rectRadius: 0.1
  });
  slide.addShape(pres.ShapeType.rect, {
    x: 5.15, y: 1.4, w: 4.25, h: 0.08,
    fill: { color: THEME.blue }
  });
  slide.addText('📊 กลไกการกำกับติดตามผ่าน Strategic SKO Platform', {
    x: 5.35, y: 1.6, w: 3.85, h: 0.35,
    fontSize: 12, bold: true, color: THEME.blue, fontFace: FONT_TH
  });

  const monitorPoints = [
    { label: 'Real-time KPI Dashboard', desc: 'ติดตามผลการดำเนินงานรายไตรมาส เปรียบเทียบผลงานระดับจังหวัดและรายอำเภอ 9 อำเภอทันที' },
    { label: 'Early Warning Traffic Lights (สัญญาณไฟเตือนภัย)', desc: '🟢 เขียว (ผ่านเกณฑ์) | 🟡 เหลือง (เฝ้าระวัง) | 🔴 แดง (ต่ำกว่าเกณฑ์) เพื่อเข้าช่วยเหลือได้ทันท่วงที' },
    { label: 'เป้าหมายและเกณฑ์ประเมินมาตรฐาน', desc: 'มีค่าเป้าหมายรายไตรมาสและเป้าหมาย 5 ปี ชัดเจนเป็นมาตรฐานเดียวกันทั้งจังหวัด' },
    { label: 'การประชุมกำกับติดตามรายไตรมาส', desc: 'นำข้อมูลจากระบบเข้าสู่ที่ประชุม กวป. และเวทีตรวจราชการเพื่อขับเคลื่อนแผนงานต่อเนื่อง' }
  ];

  let my2 = 2.05;
  monitorPoints.forEach(m => {
    slide.addText(`• ${m.label}`, {
      x: 5.35, y: my2, w: 3.85, h: 0.22,
      fontSize: 9.5, bold: true, color: THEME.dark, fontFace: FONT_TH
    });
    slide.addText(m.desc, {
      x: 5.5, y: my2 + 0.2, w: 3.7, h: 0.45,
      fontSize: 9, color: THEME.mutedText, fontFace: FONT_TH, lineSpacingMultiple: 1.1
    });
    my2 += 0.68;
  });

  slide.addNotes('สไลด์ที่ 18: ปัจจัยความสำเร็จและการกำกับติดตามผ่าน Strategic SKO Platform');
}

// ==========================================
// SLIDE 16: CLOSING & Q&A (สไลด์ปิดท้าย / อภิปราย)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: '0F172A' };

  slide.addShape(pres.ShapeType.roundRect, {
    x: 3.2, y: 1.2, w: 3.6, h: 0.4,
    fill: { color: '1E293B' },
    line: { color: THEME.primary, width: 1.5 },
    rectRadius: 0.1
  });
  slide.addText('ประเด็นยุทธศาสตร์ที่ 3 | สสจ.สระแก้ว', {
    x: 3.2, y: 1.2, w: 3.6, h: 0.4,
    fontSize: 12, bold: true, color: 'FFFFFF', fontFace: FONT_TH, align: 'center', valign: 'middle'
  });

  slide.addText('บทสรุปและการร่วมอภิปราย\n(Q&A and Strategic Discussion)', {
    x: 1.0, y: 1.85, w: 8.0, h: 1.1,
    fontSize: 28, bold: true, color: 'FFFFFF', fontFace: FONT_TH, align: 'center'
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.5, y: 3.15, w: 7.0, h: 1.0,
    fill: { color: '1E293B' },
    line: { color: THEME.primary, width: 1 },
    rectRadius: 0.1
  });
  slide.addText('“ก้าวสู่การเป็นองค์กรอัจฉริยะ (Smart Organization) ที่บุคลากรมีความสุข\nทรัพยากรถูกใช้อย่างคุ้มค่า และการเงินการคลังมีความมั่นคงยั่งยืน”', {
    x: 1.6, y: 3.25, w: 6.8, h: 0.8,
    fontSize: 13, bold: true, color: 'FDBA74', fontFace: FONT_TH, align: 'center', lineSpacingMultiple: 1.2
  });

  slide.addText('ขอขอบคุณคณะผู้บริหารและผู้เข้าร่วมประชุมทุกท่าน\nสำนักงานสาธารณสุขจังหวัดสระแก้ว', {
    x: 1.0, y: 4.4, w: 8.0, h: 0.6,
    fontSize: 12, color: '94A3B8', fontFace: FONT_TH, align: 'center', lineSpacingMultiple: 1.15
  });

  slide.addNotes('สไลด์ที่ 19: สไลด์ปิดท้ายและการอภิปราย (Q&A)');
}

// Output path
const outputPath = path.join(__dirname, '../S3_Strategy_Presentation_SaKaeo.pptx');
pres.writeFile({ fileName: outputPath })
  .then(() => {
    console.log('✅ Generated successfully: ' + outputPath);
    const stats = fs.statSync(outputPath);
    console.log(`📦 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`📑 Total Slides: ${TOTAL_SLIDES}`);
  })
  .catch(err => {
    console.error('❌ Error generating presentation:', err);
    process.exit(1);
  });

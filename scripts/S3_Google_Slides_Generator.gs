/**
 * =========================================================================================
 * GOOGLE APPS SCRIPT: สร้างสไลด์นำเสนอประเด็นยุทธศาสตร์ที่ 3 สสจ.สระแก้ว บน GOOGLE SLIDES
 * =========================================================================================
 * จุดเด่นของเวอร์ชันนี้:
 * 1. ใช้ Pattern สไลด์โครงสร้างเดียวกันในทุกกลยุทธ์ (3 สไลด์ต่อกลยุทธ์ = 12 สไลด์กลยุทธ์):
 *    - สไลด์ A: เป้าประสงค์และตัวชี้วัด (Objectives & Key Results 5-Year Targets)
 *    - สไลด์ B: กิจกรรมริเริ่มภาพรวม (Initiatives) + แนวทางขับเคลื่อนรายระดับ (How to 5 ระดับ)
 *    - สไลด์ C: แผนปฏิบัติการ 1 ปี (1-Year Action Plan: Q1 - Q4 Roadmap) ครบถ้วนทุก Key Result!
 * 2. ข้อความสไลด์ที่ 4 (Architecture Map) แสดงเต็ม 100% ไม่ตัดทอน
 * 3. เติมสัญลักษณ์ % ต่อท้ายค่าเป้าหมาย 5 ปีทุกตัวชี้วัด
 * 4. รวมทั้งหมด 19 สไลด์สมบูรณ์ ครอบคลุมทั้งระบบ
 *
 * วิธีใช้งาน:
 * 1. ไปที่ https://slides.new เพื่อเปิด Google Slides เปล่าใหม่ 1 ไฟล์
 * 2. ไปที่เมนู "ส่วนขยาย" (Extensions) > "Apps Script"
 * 3. วางโค้ดทั้งหมดนี้ลงในไฟล์ Code.gs แล้วกด "บันทึก" (Ctrl+S หรือ Cmd+S)
 * 4. เลือกฟังก์ชัน "createS3Presentation" แล้วกดปุ่ม "เรียกใช้" (Run)
 * 5. กดยอมรับสิทธิ์การเข้าถึง (Authorize) ในครั้งแรก
 * 6. สไลด์ทั้ง 19 สไลด์จะถูกสร้างลงใน Google Slides อัตโนมัติทันที พร้อมแชร์และแก้ไขร่วมกันได้!
 */

function createS3Presentation() {
  const presentation = SlidesApp.getActivePresentation();
  
  // ชุดสีหลัก
  const COLOR_PRIMARY = '#C53302';      // สีส้มอิฐ/แดงสนิม ประจำ S3
  const COLOR_PRIMARY_LIGHT = '#FFF7ED';// สีส้มอ่อนมาก
  const COLOR_PRIMARY_BORDER = '#FDBA74';
  const COLOR_DARK = '#0F172A';         // Slate 900
  const COLOR_DARK_TEXT = '#1E293B';    // Slate 800
  const COLOR_MUTED = '#475569';        // Slate 600
  const COLOR_LIGHT_TEXT = '#64748B';   // Slate 500
  const COLOR_BG_LIGHT = '#F8FAFC';     // Slate 50
  const COLOR_CARD_BG = '#FFFFFF';
  const COLOR_CARD_BORDER = '#E2E8F0';  // Slate 200
  const COLOR_BLUE = '#0284C7';
  const COLOR_BLUE_BG = '#F0F9FF';
  const COLOR_SUCCESS = '#16A34A';
  const COLOR_SUCCESS_BG = '#F0FDF4';
  const COLOR_PURPLE = '#7C3AED';
  const COLOR_PURPLE_BG = '#FAF5FF';

  const existingSlides = presentation.getSlides();
  const TOTAL_SLIDES = 19;

  // Helper เติม % ให้กับค่าเป้าหมาย
  function formatVal(v) {
    if (v === null || v === undefined || v === '' || v === '-') return '-';
    const s = String(v).trim();
    if (s.endsWith('%') || s.endsWith('เท่า') || s.endsWith('แห่ง') || s.endsWith('คน')) return s;
    return `${s}%`;
  }
  
  // Helper: Header มาตรฐาน
  function setupHeader(slide, title, category, slideNum) {
    slide.getBackground().setSolidFill(COLOR_BG_LIGHT);

    const topBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, 720, 6);
    topBar.getFill().setSolidFill(COLOR_PRIMARY);
    topBar.getBorder().setTransparent();

    const badge = slide.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 40, 18, 260, 22);
    badge.getFill().setSolidFill(COLOR_PRIMARY_LIGHT);
    badge.getBorder().getLineFill().setSolidFill(COLOR_PRIMARY_BORDER);
    badge.getBorder().setWeight(1);
    const badgeText = badge.getText();
    badgeText.setText(category || 'ประเด็นยุทธศาสตร์ที่ 3 | สสจ.สระแก้ว');
    badgeText.getTextStyle().setFontSize(9).setBold(true).setForegroundColor(COLOR_PRIMARY);

    const titleBox = slide.insertTextBox(title, 40, 44, 640, 32);
    titleBox.getText().getTextStyle().setFontSize(15).setBold(true).setForegroundColor(COLOR_DARK);

    const footer = slide.insertTextBox('แผนยุทธศาสตร์สุขภาพ 5 ปี (พ.ศ. 2570 - 2574) สำนักงานสาธารณสุขจังหวัดสระแก้ว', 40, 382, 560, 18);
    footer.getText().getTextStyle().setFontSize(8.5).setForegroundColor(COLOR_LIGHT_TEXT);

    const numBox = slide.insertTextBox(`${slideNum} / ${TOTAL_SLIDES}`, 620, 382, 60, 18);
    numBox.getText().getTextStyle().setFontSize(8.5).setForegroundColor(COLOR_LIGHT_TEXT);
  }

  // Helper: ตารางเป้าหมาย 5 ปี (พร้อม %)
  function addTargetTable(slide, x, y, w, targets) {
    const table = slide.insertTable(2, 5, x, y, w, 38);
    const years = ['2570', '2571', '2572', '2573', '2574'];
    for (let c = 0; c < 5; c++) {
      const cell1 = table.getCell(0, c);
      cell1.getFill().setSolidFill(COLOR_PRIMARY_LIGHT);
      cell1.getText().setText(years[c]);
      cell1.getText().getTextStyle().setFontSize(7.5).setBold(true).setForegroundColor(COLOR_PRIMARY);

      const cell2 = table.getCell(1, c);
      cell2.getFill().setSolidFill('#FFFFFF');
      cell2.getText().setText(formatVal(targets[c]));
      cell2.getText().getTextStyle().setFontSize(8.5).setBold(true).setForegroundColor(COLOR_DARK_TEXT);
    }
  }

  // Helper: Slide กิจกรรมริเริ่มภาพรวม + How to 5 ระดับ Pattern มาตรฐาน
  function addInitiativeAndHowToSlide(slide, code, name, initiatives, tiers, slideNum) {
    setupHeader(slide, `กิจกรรมริเริ่มและแนวทางขับเคลื่อน ${code} รายระดับ`, `กลยุทธ์ ${code} | กิจกรรมริเริ่ม & How-to`, slideNum);
    
    // SECTION 1: กิจกรรมริเริ่มภาพรวม (Initiative Activities)
    const initBox = slide.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 40, 78, 640, 80);
    initBox.getFill().setSolidFill(COLOR_CARD_BG);
    initBox.getBorder().getLineFill().setSolidFill(COLOR_PRIMARY_BORDER);

    const initBadge = slide.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 50, 84, 210, 20);
    initBadge.getFill().setSolidFill(COLOR_PRIMARY_LIGHT);
    initBadge.getBorder().getLineFill().setSolidFill(COLOR_PRIMARY_BORDER);
    initBadge.getText().setText('🚀 กิจกรรมริเริ่มภาพรวม (Initiatives)');
    initBadge.getText().getTextStyle().setFontSize(8.5).setBold(true).setForegroundColor(COLOR_PRIMARY);

    const initText = slide.insertTextBox(initiatives.join('\n'), 50, 106, 620, 48);
    initText.getText().getTextStyle().setFontSize(8).setForegroundColor(COLOR_DARK_TEXT);

    // SECTION 2: แนวทางขับเคลื่อน How to 5 ระดับ (สรุปสั้นกระชับ สื่อสารเข้าใจง่าย)
    const howToTitle = slide.insertTextBox('🌐 แนวทางขับเคลื่อนรายระดับ (How to 5 ระดับ) - สรุปบทบาทปฏิบัติการสำคัญ', 40, 162, 640, 20);
    howToTitle.getText().getTextStyle().setFontSize(9.5).setBold(true).setForegroundColor(COLOR_PRIMARY);

    tiers.forEach((t, idx) => {
      const ty = 186 + idx * 38;
      const row = slide.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 40, ty, 640, 34);
      row.getFill().setSolidFill(COLOR_CARD_BG);
      row.getBorder().getLineFill().setSolidFill(COLOR_CARD_BORDER);

      const rBadge = slide.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 48, ty + 5, 130, 24);
      rBadge.getFill().setSolidFill(t.bg || COLOR_PRIMARY_LIGHT);
      rBadge.getBorder().getLineFill().setSolidFill(t.color || COLOR_PRIMARY);
      rBadge.getText().setText(t.r);
      rBadge.getText().getTextStyle().setFontSize(8.5).setBold(true).setForegroundColor(t.color || COLOR_PRIMARY);

      const dBox = slide.insertTextBox(t.d, 185, ty + 3, 485, 28);
      dBox.getText().getTextStyle().setFontSize(8).setForegroundColor(COLOR_DARK_TEXT);
    });
  }

  // Helper: Slide แผนปฏิบัติการ 1 ปี (Q1 - Q4 Roadmap) Pattern มาตรฐาน
  function addActionPlanSlide(slide, code, name, subTitle, quarters, slideNum) {
    setupHeader(slide, 'แผนปฏิบัติการ 1 ปี (1-Year Action Plan: Q1 - Q4 Roadmap)', `กลยุทธ์ ${code} | แผนปฏิบัติการ 1 ปี`, slideNum);

    const subBox = slide.insertTextBox(subTitle, 40, 74, 640, 22);
    subBox.getText().getTextStyle().setFontSize(8.5).setForegroundColor(COLOR_MUTED);

    quarters.forEach((q, idx) => {
      const qx = 40 + idx * 165;
      const qCard = slide.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, qx, 98, 150, 275);
      qCard.getFill().setSolidFill(COLOR_CARD_BG);
      qCard.getBorder().getLineFill().setSolidFill(COLOR_CARD_BORDER);

      // Quarter Header
      const qHeader = slide.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, qx, 98, 150, 26);
      qHeader.getFill().setSolidFill(q.color || COLOR_PRIMARY);
      qHeader.getText().setText(q.q);
      qHeader.getText().getTextStyle().setFontSize(8.5).setBold(true).setForegroundColor('#FFFFFF');

      const mCount = q.milestones.length;
      const availH = 240;
      const eachH = availH / Math.max(mCount, 1);

      q.milestones.forEach((m, mi) => {
        const my = 128 + mi * eachH;
        const mBox = slide.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, qx + 4, my, 142, eachH - 5);
        mBox.getFill().setSolidFill(COLOR_BG_LIGHT);
        mBox.getBorder().getLineFill().setSolidFill(COLOR_CARD_BORDER);

        const mBadge = slide.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, qx + 7, my + 3, 136, 17);
        mBadge.getFill().setSolidFill(COLOR_PRIMARY_LIGHT);
        mBadge.getBorder().getLineFill().setSolidFill(COLOR_PRIMARY_BORDER);
        mBadge.getText().setText(m.target);
        mBadge.getText().getTextStyle().setFontSize(7.5).setBold(true).setForegroundColor(COLOR_PRIMARY);

        const mText = slide.insertTextBox(`${m.label}\n${m.desc}`, qx + 6, my + 22, 138, eachH - 26);
        mText.getText().getTextStyle().setFontSize(7).setForegroundColor(COLOR_DARK_TEXT);
      });
    });
  }

  // ==========================================
  // SLIDE 1: หน้าปก (Cover)
  // ==========================================
  const s1 = presentation.appendSlide();
  s1.getBackground().setSolidFill(COLOR_DARK);

  const s1Badge = s1.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 50, 45, 320, 28);
  s1Badge.getFill().setSolidFill('#1E293B');
  s1Badge.getBorder().getLineFill().setSolidFill(COLOR_PRIMARY);
  s1Badge.getText().setText('แผนยุทธศาสตร์สุขภาพ 5 ปี (พ.ศ. 2570 – 2574)');
  s1Badge.getText().getTextStyle().setFontSize(11).setBold(true).setForegroundColor('#FFFFFF');

  const s1S3 = s1.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 50, 85, 140, 30);
  s1S3.getFill().setSolidFill(COLOR_PRIMARY);
  s1S3.getText().setText('ประเด็นยุทธศาสตร์ที่ 3');
  s1S3.getText().getTextStyle().setFontSize(11).setBold(true).setForegroundColor('#FFFFFF');

  const s1Title = s1.insertTextBox('ยกระดับสู่องค์กรอัจฉริยะ พัฒนากำลังคน\nและบริหารจัดการทรัพยากรและการเงินการคลังอย่างยั่งยืน', 50, 125, 620, 95);
  s1Title.getText().getTextStyle().setFontSize(22).setBold(true).setForegroundColor('#FFFFFF');

  const s1Divider = s1.insertShape(SlidesApp.ShapeType.RECTANGLE, 50, 230, 620, 3);
  s1Divider.getFill().setSolidFill(COLOR_PRIMARY);

  const coverStrats = [
    { c: 'ST3.1', t: 'พัฒนากำลังคน\nสมรรถนะสูง' },
    { c: 'ST3.2', t: 'การเงินการคลัง\nยั่งยืน' },
    { c: 'ST2.3', t: 'บริหารจัดการ\nทรัพยากร' },
    { c: 'ST3.4', t: 'สุขภาพดิจิทัล\nและนวัตกรรมองค์กร' }
  ];
  coverStrats.forEach((cs, idx) => {
    const px = 50 + idx * 160;
    const box = s1.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, px, 245, 145, 65);
    box.getFill().setSolidFill('#1E293B');
    box.getBorder().getLineFill().setSolidFill('#334155');
    box.getText().setText(`[${cs.c}]\n${cs.t}`);
    box.getText().getTextStyle().setFontSize(9.5).setForegroundColor('#CBD5E1');
  });

  const s1Foot = s1.insertTextBox('สำนักงานสาธารณสุขจังหวัดสระแก้ว | การประชุมนำเสนอและขับเคลื่อนแผนยุทธศาสตร์สุขภาพจังหวัดสระแก้ว', 50, 345, 620, 30);
  s1Foot.getText().getTextStyle().setFontSize(10.5).setForegroundColor('#94A3B8');

  // ==========================================
  // SLIDE 2: ขอบเขตและเจตนารมณ์
  // ==========================================
  const s2 = presentation.appendSlide();
  setupHeader(s2, 'บทบาท ขอบเขต และเจตนารมณ์ของประเด็นยุทธศาสตร์ที่ 3', '1. ภาพรวมและบริบท', 2);

  const s2Left = s2.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 40, 85, 310, 285);
  s2Left.getFill().setSolidFill(COLOR_CARD_BG);
  s2Left.getBorder().getLineFill().setSolidFill(COLOR_CARD_BORDER);
  s2Left.getText().setText('🎯 เจตนารมณ์เชิงยุทธศาสตร์ (จากฐานข้อมูลจริง)\n\nมุ่งเน้นการพลิกโฉมการทำงานด้วยเทคโนโลยีดิจิทัลและระบบปัญญาประดิษฐ์ เพื่อก้าวสู่การเป็นองค์กรสมรรถนะสูง (Smart Organization)\n\nขอบเขตครอบคลุมการพัฒนาโครงสร้างพื้นฐานด้านข้อมูล การยกระดับขีดความสามารถของบุคลากรให้พร้อมรับมือกับโลกยุคดิจิทัล ควบคู่ไปกับการบริหารจัดการงบประมาณ ระบบการเงินการคลัง และทรัพยากรสาธารณสุขให้มีประสิทธิภาพ โปร่งใส คุ้มค่า และเกิดเสถียรภาพในระยะยาว');
  s2Left.getText().getTextStyle().setFontSize(9.5).setForegroundColor(COLOR_DARK_TEXT);

  const exactStrats = [
    { c: 'ST3.1', n: 'พัฒนากำลังคนให้มีสมรรถนะสูง มีความสุขในการทำงาน และคงอยู่อย่างภาคภูมิใจ' },
    { c: 'ST3.2', n: 'ยกระดับศักยภาพในการเพิ่มรายได้ ลดรายจ่าย พัฒนาบริการใหม่ และระดมทรัพยากรจากแหล่งทุนภายนอก' },
    { c: 'ST2.3', n: 'ยกระดับการบริหารจัดการทรัพยากรให้มีประสิทธิภาพสูงสุด และบูรณาการคลังข้อมูลทรัพยากร' },
    { c: 'ST3.4', n: 'ยกระดับสู่ระบบสุขภาพดิจิทัลและนวัตกรรมองค์กร' }
  ];
  exactStrats.forEach((st, idx) => {
    const py = 85 + idx * 72;
    const box = s2.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 370, py, 310, 64);
    box.getFill().setSolidFill(COLOR_CARD_BG);
    box.getBorder().getLineFill().setSolidFill(COLOR_CARD_BORDER);
    box.getText().setText(`[${st.c}]\n${st.n}`);
    box.getText().getTextStyle().setFontSize(9).setForegroundColor(COLOR_DARK_TEXT);
  });

  // ==========================================
  // SLIDE 3: Outcome Indicators (มี % ครบถ้วน)
  // ==========================================
  const s3 = presentation.appendSlide();
  setupHeader(s3, 'ตัวชี้วัดผลลัพธ์ระดับยุทธศาสตร์ (Outcome Indicators - S3)', '2. ตัวชี้วัดระดับยุทธศาสตร์', 3);

  const outcomes = [
    { c: 'IND3.1', n: 'ร้อยละของระยะเวลาที่ลดลง\nในกระบวนการทำงานหลัก', g: 'กลุ่มงานสุขภาพดิจิทัล', tg: ['-', '-', '-', '-', '50%'], h: '50%' },
    { c: 'IND3.2', n: 'ร้อยละของมูลค่าต้นทุนการดำเนินงาน\n(วัสดุสิ้นเปลือง/เดินทาง) ที่ลดลง', g: 'กลุ่มงานบริหารทั่วไป', tg: ['-', '-', '-', '-', '50%'], h: '50%' },
    { c: 'IND4.3', n: 'ร้อยละของโรงพยาบาลไม่ประสบ\nภาวะวิกฤติทางการเงินระดับ 3-7', g: 'กลุ่มงานประกันสุขภาพ', tg: ['-', '-', '-', '-', '100%'], h: '100%' }
  ];
  outcomes.forEach((ind, idx) => {
    const cx = 40 + idx * 220;
    const card = s3.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, cx, 85, 205, 285);
    card.getFill().setSolidFill(COLOR_CARD_BG);
    card.getBorder().getLineFill().setSolidFill(COLOR_CARD_BORDER);
    card.getText().setText(`[${ind.c}]\n${ind.n}\n\n📌 ผู้รับผิดชอบ: ${ind.g}\n\nเป้าหมาย 5 ปี (2570-2574):\n\n\n\n🎯 เป้าหมายปี 2574: ${ind.h}`);
    card.getText().getTextStyle().setFontSize(9).setForegroundColor(COLOR_DARK_TEXT);
    addTargetTable(s3, cx + 5, 230, 195, ind.tg);
  });

  // ==========================================
  // SLIDE 4: Architecture Map (ข้อความเต็ม 100% ไม่ตัดคำ ไม่ใช้ ...)
  // ==========================================
  const s4 = presentation.appendSlide();
  setupHeader(s4, 'แผนผังเชื่อมโยงยุทธศาสตร์ (Strategic Architecture Map)', '3. โครงสร้างยุทธศาสตร์', 4);

  const topMap = s4.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 40, 80, 640, 32);
  topMap.getFill().setSolidFill(COLOR_PRIMARY);
  topMap.getText().setText('ประเด็นยุทธศาสตร์ที่ 3 (S3): ยกระดับสู่องค์กรอัจฉริยะ พัฒนากำลังคน และบริหารจัดการทรัพยากรและการเงินการคลังอย่างยั่งยืน');
  topMap.getText().getTextStyle().setFontSize(9.5).setBold(true).setForegroundColor('#FFFFFF');

  const archData = [
    {
      c: 'ST3.1', n: 'พัฒนากำลังคนให้มีสมรรถนะสูง มีความสุขในการทำงาน และคงอยู่อย่างภาคภูมิใจ',
      objs: [
        '🎯 O3.1.2: บุคลากรมีความสุขในการทำงาน (Happy Workplace)',
        '🎯 O3.1.1: บุคลากรได้รับการพัฒนาสมรรถนะ (Human Capital)',
        '🎯 O3.1.3: อัตราการคงอยู่ในระบบสาธารณสุขอย่างยั่งยืน'
      ]
    },
    {
      c: 'ST3.2', n: 'ยกระดับศักยภาพในการเพิ่มรายได้ ลดรายจ่าย พัฒนาบริการใหม่ และระดมทรัพยากรจากภายนอก',
      objs: [
        '🎯 O3.2.1: หน่วยบริการมีเสถียรภาพทางการเงิน และบริหารต้นทุนมีประสิทธิภาพ'
      ]
    },
    {
      c: 'ST2.3', n: 'ยกระดับการบริหารจัดการทรัพยากรให้มีประสิทธิภาพสูงสุด และบูรณาการคลังข้อมูลทรัพยากร',
      objs: [
        '🎯 O3.3.1: บริหารสินทรัพย์และทรัพยากรสุขภาพอย่างบูรณาการและคุ้มค่า',
        '🎯 O3.3.2: หน่วยบริการมีประสิทธิภาพด้านการบริหารสินทรัพย์ทุกประเภท'
      ]
    },
    {
      c: 'ST3.4', n: 'ยกระดับสู่ระบบสุขภาพดิจิทัลและนวัตกรรมองค์กร',
      objs: [
        '🎯 O3.4.1: ประยุกต์ใช้เทคโนโลยีดิจิทัลและ AI ลดภาระงาน เพิ่มประสิทธิภาพ'
      ]
    }
  ];

  archData.forEach((st, idx) => {
    const sx = 40 + idx * 165;
    const scard = s4.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, sx, 118, 150, 75);
    scard.getFill().setSolidFill(COLOR_CARD_BG);
    scard.getBorder().getLineFill().setSolidFill(COLOR_PRIMARY);
    scard.getBorder().setWeight(1.5);
    scard.getText().setText(`[${st.c}]\n${st.n}`);
    scard.getText().getTextStyle().setFontSize(7.5).setBold(true).setForegroundColor(COLOR_DARK_TEXT);

    const ocard = s4.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, sx, 200, 150, 170);
    ocard.getFill().setSolidFill(COLOR_CARD_BG);
    ocard.getBorder().getLineFill().setSolidFill(COLOR_CARD_BORDER);
    ocard.getText().setText(st.objs.join('\n\n'));
    ocard.getText().getTextStyle().setFontSize(7.5).setForegroundColor(COLOR_DARK_TEXT);
  });

  // =========================================================================
  // STRATEGY 1: ST3.1 (สไลด์ 5, 6, 7)
  // =========================================================================
  // SLIDE 5: ST3.1 Objectives & KRs (5-Year Targets with %)
  const s5 = presentation.appendSlide();
  setupHeader(s5, 'กลยุทธ์ ST3.1: พัฒนากำลังคนให้มีสมรรถนะสูง มีความสุขในการทำงาน และคงอยู่อย่างภาคภูมิใจ', 'กลยุทธ์ที่ 1 (ST3.1) | โครงสร้างและตัวชี้วัด', 5);

  const krs31 = [
    { o: 'O3.1.2 บุคลากรมีความสุขในการทำงาน', k: 'KR3.1.2.1 ดัชนีความสุขขององค์กร ผ่านเกณฑ์มาตรฐาน', g: 'กลุ่มงานพัฒนาทรัพยากรบุคคล', tg: ['70%', '75%', '80%', '85%', '90%'] },
    { o: 'O3.1.1 บุคลากรพัฒนาสมรรถนะทุนมนุษย์', k: 'KR3.1.1.1 ร้อยละหน่วยบริการมีผลงานวิชาการ/นวัตกรรม', g: 'กลุ่มงานพัฒนาทรัพยากรบุคคล', tg: ['85%', '85%', '85%', '85%', '85%'] },
    { o: 'O3.1.3 อัตราการคงอยู่ในระบบยั่งยืน', k: 'KR3.1.3.1 อัตราการสูญเสียบุคลากรด้านสุขภาพ', g: 'กลุ่มงานบริหารทรัพยากรบุคคล', tg: ['9%', '8.5%', '8%', '7.5%', '7%'] }
  ];
  krs31.forEach((item, idx) => {
    const ox = 40 + idx * 220;
    const card = s5.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, ox, 85, 205, 285);
    card.getFill().setSolidFill(COLOR_CARD_BG);
    card.getBorder().getLineFill().setSolidFill(COLOR_CARD_BORDER);
    card.getText().setText(`🎯 ${item.o}\n\n📊 ${item.k}\n\n📌 ${item.g}\n\nเป้าหมาย 5 ปี (2570-2574):`);
    card.getText().getTextStyle().setFontSize(8.5).setForegroundColor(COLOR_DARK_TEXT);
    addTargetTable(s5, ox + 5, 250, 195, item.tg);
  });

  // SLIDE 6: ST3.1 Initiatives & How-to 5 Tiers Concise
  const s6 = presentation.appendSlide();
  const init31 = [
    '• 🌟 ส่งเสริมสุขภาวะองค์กร (Happy Workplace): ประเมินดัชนีความสุขประจำปี และจัดกิจกรรมยกย่องเชิดชูเกียรติสร้างขวัญกำลังใจ',
    '• 🤖 พัฒนาสมรรถนะด้วย AI: ส่งเสริมการประยุกต์ใช้ AI ในงานประจำ/บริการ งานวิชาการนวัตกรรม และงานสนับสนุน (Back Office)',
    '• 📈 มาตรการคงอยู่ในระบบ: ขับเคลื่อนการลดภาระงาน เพิ่มสวัสดิการ และสนับสนุนเส้นทางความก้าวหน้าในสายวิชาชีพ (Career Path)'
  ];
  const tiers31 = [
    { r: '🏛️ สสจ.สระแก้ว', d: 'สำรวจดัชนีความสุขปีละ 1 ครั้ง, จัดกิจกรรมสร้างสุขภาวะบุคลากร, อบรม AI งานวิชาการ, วางแผนการคงอยู่', color: COLOR_PRIMARY, bg: COLOR_PRIMARY_LIGHT },
    { r: '🏥 โรงพยาบาล (รพ.)', d: 'สำรวจดัชนีความสุขและจัดทำแผนสร้างสุข, ส่งเสริมงานวิจัย R2R และพี่เลี้ยงวิชาการ, จัดกิจกรรมยกย่องคนดีคนเก่ง', color: COLOR_BLUE, bg: COLOR_BLUE_BG },
    { r: '🏢 สสอ. (อำเภอ)', d: 'สำรวจความสุขและขวัญกำลังใจระดับอำเภอ, ส่งเสริมเข้าร่วมอบรมและพัฒนาผลงานวิชาการ, จัดเวทีวิชาการอำเภอ', color: COLOR_PURPLE, bg: COLOR_PURPLE_BG },
    { r: '🩺 รพ.สต.', d: 'ร่วมสำรวจความสุขและกำหนดกิจกรรมสร้างสุข, นำปัญหาจริงในชุมชนมาเป็นโจทย์พัฒนางานวิชาการ, แลกเปลี่ยนเรียนรู้', color: COLOR_SUCCESS, bg: COLOR_SUCCESS_BG },
    { r: '🤝 ภาคีเครือข่าย', d: 'ร่วมสนับสนุนกิจกรรมสร้างสุขและขวัญกำลังใจ, สนับสนุนทรัพยากรและองค์ความรู้พัฒนางานวิชาการร่วมกับ อปท.', color: COLOR_DARK, bg: COLOR_BG_LIGHT }
  ];
  addInitiativeAndHowToSlide(s6, 'ST3.1', exactStrats[0].n, init31, tiers31, 6);

  // SLIDE 7: ST3.1 1-Year Action Plan (Q1 - Q4 Roadmap)
  const s7 = presentation.appendSlide();
  const quartersST31 = [
    {
      q: 'Q1: วางรากฐาน & วิจัย',
      color: COLOR_BLUE,
      milestones: [
        { label: '[KR3.1.2.1] กิจกรรมสร้างความสุข', target: 'เป้าหมาย: 100%', desc: 'จัดกิจกรรมส่งเสริมสุขภาพกายใจ สร้างขวัญกำลังใจ และสถานที่ทำงานน่าอยู่' },
        { label: '[KR3.1.1.1] จัดทำการวิจัยและนวัตกรรม', target: 'เป้าหมาย: 100%', desc: 'หน่วยบริการย่อยทุกหน่วยกำหนดโจทย์และเริ่มจัดทำงานวิจัย R2R/นวัตกรรม' }
      ]
    },
    {
      q: 'Q2: กิจกรรม & เวทีวิชาการ',
      color: COLOR_PURPLE,
      milestones: [
        { label: '[KR3.1.2.1] สร้างความสัมพันธ์บุคลากร', target: 'เป้าหมาย: 100%', desc: 'จัดกิจกรรมสร้างความสัมพันธ์ สานสัมพันธ์สหวิชาชีพและขวัญกำลังใจต่อเนื่อง' },
        { label: '[KR3.1.1.1] เตรียมนำเสนอผลงาน', target: 'เป้าหมาย: 100%', desc: 'หน่วยบริการเตรียมนำเสนอผลงาน และแม่ข่ายสนับสนุนจัดเวทีประกวดวิชาการ' }
      ]
    },
    {
      q: 'Q3: สำรวจความสุข & ติดตาม',
      color: COLOR_PRIMARY,
      milestones: [
        { label: '[KR3.1.2.1] สำรวจดัชนีความสุขประจำปี', target: 'เป้าหมาย: 100%', desc: 'สำรวจ Happy Workplace ปีละ 1 ครั้ง และจัดทำแผนส่งเสริมตามผลประเมิน' },
        { label: '[KR3.1.1.1] รายงานความก้าวหน้า', target: 'เป้าหมาย: 85%', desc: 'ร้อยละของหน่วยบริการรายงานความก้าวหน้าส่งผลงานวิชาการ/นวัตกรรม' }
      ]
    },
    {
      q: 'Q4: ประเมินความสุข & เผยแพร่',
      color: COLOR_SUCCESS,
      milestones: [
        { label: '[KR3.1.2.1] ดัชนีความสุของค์กร', target: 'เป้าหมาย: 70%', desc: 'ดัชนีความสุขขององค์กรผ่านเกณฑ์มาตรฐาน และยกย่องเชิดชูเกียรติคนดีคนเก่ง' },
        { label: '[KR3.1.1.1] เผยแพร่ผลงานวิชาการ', target: 'เป้าหมาย: 85%', desc: 'หน่วยบริการมีผลงานวิชาการ/นวัตกรรมนำเสนอเผยแพร่ระดับอำเภอขึ้นไป' },
        { label: '[KR3.1.3.1] อัตราสูญเสียบุคลากร', target: 'เป้าหมาย: <= 9%', desc: 'ควบคุมอัตราการสูญเสียบุคลากรด้านสุขภาพให้อยู่ในเกณฑ์ และหนุน Career Path' }
      ]
    }
  ];
  addActionPlanSlide(s7, 'ST3.1', exactStrats[0].n, 'การขับเคลื่อนเป้าหมาย KR3.1.2.1 (ความสุของค์กร), KR3.1.1.1 (ผลงานวิชาการ/นวัตกรรม) และ KR3.1.3.1 (การคงอยู่ในระบบ)', quartersST31, 7);

  // =========================================================================
  // STRATEGY 2: ST3.2 (สไลด์ 8, 9, 10)
  // =========================================================================
  // SLIDE 8: ST3.2 Objectives & KRs (5-Year Targets with %)
  const s8 = presentation.appendSlide();
  setupHeader(s8, 'กลยุทธ์ ST3.2: ยกระดับศักยภาพในการเพิ่มรายได้ ลดรายจ่าย พัฒนาบริการใหม่ และระดมทรัพยากรจากแหล่งทุนภายนอก', 'กลยุทธ์ที่ 2 (ST3.2) | โครงสร้างและตัวชี้วัด', 8);

  const krs32 = [
    { o: 'O3.2.1 เสถียรภาพการเงินการคลัง', k: 'KR3.2.1.1 อัตราการเพิ่มขึ้นของรายได้หน่วยบริการ', g: 'กลุ่มงานประกันสุขภาพ', tg: ['5%', '6%', '7%', '8%', '10%'] },
    { o: 'O3.2.1 เสถียรภาพการเงินการคลัง', k: 'KR3.2.1.2 ร้อยละ รพ. ควบคุมค่าใช้จ่ายไม่สูงกว่ารายได้', g: 'กลุ่มงานประกันสุขภาพ', tg: ['30%', '30%', '30%', '30%', '30%'] },
    { o: 'O3.2.1 เสถียรภาพการเงินการคลัง', k: 'KR3.2.1.3 ร้อยละ รพ. ผ่านเกณฑ์ TPS score ระดับ A, B', g: 'กลุ่มงานประกันสุขภาพ', tg: ['60%', '70%', '80%', '80%', '80%'] }
  ];
  krs32.forEach((item, idx) => {
    const ox = 40 + idx * 220;
    const card = s8.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, ox, 85, 205, 285);
    card.getFill().setSolidFill(COLOR_CARD_BG);
    card.getBorder().getLineFill().setSolidFill(COLOR_CARD_BORDER);
    card.getText().setText(`🎯 ${item.o}\n\n📊 ${item.k}\n\n📌 ${item.g}\n\nเป้าหมาย 5 ปี (2570-2574):`);
    card.getText().getTextStyle().setFontSize(8.5).setForegroundColor(COLOR_DARK_TEXT);
    addTargetTable(s8, ox + 5, 250, 195, item.tg);
  });

  // SLIDE 9: ST3.2 Initiatives & How-to 5 Tiers Concise
  const s9 = presentation.appendSlide();
  const init32 = [
    '• 💰 เพิ่มประสิทธิภาพจัดเก็บรายได้: พัฒนาระบบเรียกเก็บทุกสิทธิ ตรวจสอบสิทธิ บันทึกบริการ Coding และระบบ Claim Audit',
    '• 📉 บริหารต้นทุนและคุมรายจ่าย: ควบคุมศูนย์ต้นทุน (Cost Center) ยา เวชภัณฑ์ และสาธารณูปโภค พร้อมระบบจัดซื้อร่วมระดับจังหวัด',
    '• 🚨 ระบบเตือนภัยและระดมทุน: จัดทำ Dashboard เฝ้าระวังวิกฤตการเงิน (ระดับ 1-7) และบูรณาการงบ อปท./กองทุนสุขภาพตำบล (กปท.)'
  ];
  const tiers32 = [
    { r: '🏛️ สสจ.สระแก้ว', d: 'จัดทำ Dashboard ติดตามการเงินและวิกฤติ, พัฒนาศักยภาพ Coding/Claim Audit, กำกับควบคุมค่าใช้จ่ายจังหวัด', color: COLOR_PRIMARY, bg: COLOR_PRIMARY_LIGHT },
    { r: '🏥 โรงพยาบาล (รพ.)', d: 'จัดทำ Planfin ตามจริง, จัดเก็บรายได้ทุกสิทธิ, ควบคุมศูนย์ต้นทุนยาและเวชภัณฑ์, เฝ้าระวังวิกฤติตามเกณฑ์', color: COLOR_BLUE, bg: COLOR_BLUE_BG },
    { r: '🏢 สสอ. (อำเภอ)', d: 'กำกับติดตามบริหารรายได้-ค่าใช้จ่ายปฐมภูมิ, ตรวจสอบคุณภาพข้อมูลเบิกจ่าย, ประสานแก้ไขปัญหา รพ.สต. ร่วมกับ รพ.', color: COLOR_PURPLE, bg: COLOR_PURPLE_BG },
    { r: '🩺 รพ.สต.', d: 'บันทึกข้อมูลบริการให้ถูกต้องครบถ้วนเพื่อเบิกจ่าย, ตรวจสอบสิทธิ 100%, แก้ไขรายการติด C, ควบคุมยาและเวชภัณฑ์', color: COLOR_SUCCESS, bg: COLOR_SUCCESS_BG },
    { r: '🤝 ภาคีเครือข่าย', d: 'สนับสนุนงบประมาณพัฒนาระบบบริการจาก อปท., กองทุนหลักประกันสุขภาพตำบล (กปท.) และแหล่งทุนภายนอก', color: COLOR_DARK, bg: COLOR_BG_LIGHT }
  ];
  addInitiativeAndHowToSlide(s9, 'ST3.2', exactStrats[1].n, init32, tiers32, 9);

  // SLIDE 10: ST3.2 1-Year Action Plan (Q1 - Q4 Roadmap)
  const s10 = presentation.appendSlide();
  const quartersST32 = [
    {
      q: 'Q1: กำกับรายได้ & คุมต้นทุน',
      color: COLOR_BLUE,
      milestones: [
        { label: '[KR3.2.1.1] ติดตามรายได้สะสม Q1', target: 'เป้าหมาย: 5%', desc: 'เปรียบเทียบรายได้สะสมปี 2570 กับช่วงเดียวกันปี 2569 (ไม่รวมงบเสื่อม/แรง)' },
        { label: '[KR3.2.1.2] คุมรายจ่ายตามเกณฑ์', target: 'เป้าหมาย: 30%', desc: 'โรงพยาบาลร้อยละ 30 ควบคุมรายจ่ายไม่สูงกว่ารายได้ตามเกณฑ์ Planfin' },
        { label: '[KR3.2.1.3] ประเมิน TPS Score Q1', target: 'เป้าหมาย: 60%', desc: 'โรงพยาบาลร้อยละ 60 ผ่านเกณฑ์ประเมินสถานะการเงิน TPS ระดับ A, B' }
      ]
    },
    {
      q: 'Q2: เร่งรัดเบิกจ่าย & ตรวจ Audit',
      color: COLOR_PURPLE,
      milestones: [
        { label: '[KR3.2.1.1] ติดตามรายได้ & Audit', target: 'เป้าหมาย: 5%', desc: 'เร่งรัดเรียกเก็บทุกสิทธิ ตรวจสอบสิทธิ บันทึกบริการ และประเมิน Claim Audit' },
        { label: '[KR3.2.1.2] คุม Cost Center ยา', target: 'เป้าหมาย: 30%', desc: 'ควบคุมศูนย์ต้นทุนยา เวชภัณฑ์ และบริหารจัดซื้อร่วมระดับจังหวัด' },
        { label: '[KR3.2.1.3] เฝ้าระวังวิกฤตการเงิน', target: 'เป้าหมาย: 60%', desc: 'โรงพยาบาลร้อยละ 60 รักษาสถานะ TPS score ระดับ A, B ต่อเนื่อง' }
      ]
    },
    {
      q: 'Q3: ทบทวนแผนงบประมาณ',
      color: COLOR_PRIMARY,
      milestones: [
        { label: '[KR3.2.1.1] ติดตามรายได้สะสม Q3', target: 'เป้าหมาย: 5%', desc: 'วิเคราะห์รายรับบริการใหม่ และประสานระดมทุนจาก อปท./กองทุน กปท.' },
        { label: '[KR3.2.1.2] ปรับแผนรายจ่ายจริง', target: 'เป้าหมาย: 30%', desc: 'ปรับแผนรายจ่ายให้สอดคล้องกับรายรับจริง ป้องกันภาวะขาดทุนสุทธิ' },
        { label: '[KR3.2.1.3] ควบคุมความเสี่ยง TPS', target: 'เป้าหมาย: 60%', desc: 'โรงพยาบาลผ่านเกณฑ์ TPS ระดับ A, B และไม่มีแห่งใดตกเกณฑ์ระดับ 3-7' }
      ]
    },
    {
      q: 'Q4: สรุปผลการเงิน & เสถียรภาพ',
      color: COLOR_SUCCESS,
      milestones: [
        { label: '[KR3.2.1.1] สรุปรายได้สะสมทั้งปี', target: 'เป้าหมาย: 5%', desc: 'รายได้สะสมหน่วยบริการเพิ่มขึ้นอย่างน้อย 5% เมื่อเทียบกับฐานปี 2569' },
        { label: '[KR3.2.1.2] สรุปการคุมรายจ่าย', target: 'เป้าหมาย: 30%', desc: 'โรงพยาบาลร้อยละ 30 ควบคุมค่าใช้จ่ายไม่สูงกว่ารายได้อย่างมีประสิทธิภาพ' },
        { label: '[KR3.2.1.3] สรุปผล TPS Score ทั้งปี', target: 'เป้าหมาย: 60%', desc: 'โรงพยาบาลร้อยละ 60 บรรลุเกณฑ์ TPS score ระดับ A, B ครบตามเป้าหมาย' }
      ]
    }
  ];
  addActionPlanSlide(s10, 'ST3.2', exactStrats[1].n, 'การขับเคลื่อนเป้าหมาย KR3.2.1.1 (เพิ่มรายได้), KR3.2.1.2 (คุมรายจ่าย) และ KR3.2.1.3 (TPS score ระดับ A, B)', quartersST32, 10);

  // =========================================================================
  // STRATEGY 3: ST2.3 (สไลด์ 11, 12, 13) - EXACT CODE ST2.3
  // =========================================================================
  // SLIDE 11: ST2.3 Objectives & KRs (5-Year Targets with %)
  const s11 = presentation.appendSlide();
  setupHeader(s11, 'กลยุทธ์ ST2.3: ยกระดับการบริหารจัดการทรัพยากรให้มีประสิทธิภาพสูงสุด และบูรณาการคลังข้อมูลทรัพยากร', 'กลยุทธ์ที่ 3 (ST2.3) | โครงสร้างและตัวชี้วัด', 11);

  const krs23 = [
    { o: 'O3.3.1 บริหารสินทรัพย์และทรัพยากรสุขภาพบูรณาการ', k: 'KR3.3.1.1 เชื่อมโยงฐานข้อมูลเข้าคลังข้อมูลกลางและหมุนเวียนทรัพยากร', g: 'กลุ่มงานบริหารทั่วไป', tg: ['90%', '90%', '100%', '100%', '100%'] },
    { o: 'O3.3.2 ประสิทธิภาพด้านบริหารสินทรัพย์ทุกประเภท', k: 'KR3.3.2.1 โรงพยาบาลและหน่วยบริการผ่านเกณฑ์บริหารสินทรัพย์ทุกประเภท', g: 'กลุ่มงานบริหารทั่วไป', tg: ['90%', '95%', '100%', '100%', '100%'] }
  ];
  krs23.forEach((item, idx) => {
    const ox = 40 + idx * 330;
    const card = s11.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, ox, 85, 310, 285);
    card.getFill().setSolidFill(COLOR_CARD_BG);
    card.getBorder().getLineFill().setSolidFill(COLOR_CARD_BORDER);
    card.getText().setText(`🎯 [เป้าประสงค์]\n${item.o}\n\n📊 [ตัวชี้วัด]\n${item.k}\n\n📌 ผู้รับผิดชอบ: ${item.g}\n\nเป้าหมาย 5 ปี (2570-2574):`);
    card.getText().getTextStyle().setFontSize(9).setForegroundColor(COLOR_DARK_TEXT);
    addTargetTable(s11, ox + 15, 250, 280, item.tg);
  });

  // SLIDE 12: ST2.3 Initiatives & How-to 5 Tiers Concise
  const s12 = presentation.appendSlide();
  const init23 = [
    '• 📦 อบรมและบันทึกระบบ PLAN D: อบรมให้ความรู้เจ้าหน้าที่ในการบันทึกข้อมูลสินทรัพย์ในระบบ PLAN D สำหรับ รพ., สสอ. และ รพ.สต. ทุกแห่ง',
    '• 🔄 เชื่อมโยงคลังข้อมูลกลาง: กำหนดวิธีการและพัฒนาระบบ PLAN D เพื่อเชื่อมฐานข้อมูลสินทรัพย์ทุกหน่วยงานเข้าสู่คลังกลางระดับจังหวัด',
    '• 📋 ตรวจสอบและนิเทศพัสดุ: นิเทศติดตามตรวจสอบระบบบัญชีสินทรัพย์และหลักการบริหารพัสดุ รพท./รพช./สสอ. และ รพ.สต. ทุกแห่ง'
  ];
  const tiers23 = [
    { r: '🏛️ สสจ.สระแก้ว', d: 'จัดอบรมบันทึกสินทรัพย์ในระบบ PLAN D แก่ทุกแห่ง, จัดทำระบบเชื่อมฐานข้อมูลคลังกลาง, นิเทศระบบพัสดุระดับจังหวัด', color: COLOR_PRIMARY, bg: COLOR_PRIMARY_LIGHT },
    { r: '🏥 โรงพยาบาล (รพ.)', d: 'บันทึกสินทรัพย์ในระบบ Plan-d ให้ครบถ้วนเป็นปัจจุบัน, นิเทศระบบบัญชีสินทรัพย์และพัสดุ รพ.สต. ร่วมกับ สสอ.', color: COLOR_BLUE, bg: COLOR_BLUE_BG },
    { r: '🏢 สสอ. (อำเภอ)', d: 'บันทึกข้อมูลสินทรัพย์ใน Plan-d ถูกต้อง, ร่วมกับ รพ. นิเทศติดตามระบบบัญชีสินทรัพย์และพัสดุ รพ.สต. ทุกแห่ง', color: COLOR_PURPLE, bg: COLOR_PURPLE_BG },
    { r: '🩺 รพ.สต.', d: 'บันทึกข้อมูลสินทรัพย์ในระบบ Plan-d ให้ครบถ้วน ถูกต้อง และจัดทำบัญชีคุมสินทรัพย์ให้เป็นปัจจุบันตามระเบียบ', color: COLOR_SUCCESS, bg: COLOR_SUCCESS_BG },
    { r: '🤝 ภาคีเครือข่าย', d: 'สนับสนุนทุกเครือข่ายในการบริหารสินทรัพย์และหมุนเวียนใช้ประโยชน์เครื่องมืออุปกรณ์เพื่อประชาชนในพื้นที่', color: COLOR_DARK, bg: COLOR_BG_LIGHT }
  ];
  addInitiativeAndHowToSlide(s12, 'ST2.3', exactStrats[2].n, init23, tiers23, 12);

  // SLIDE 13: ST2.3 1-Year Action Plan (Q1 - Q4 Roadmap)
  const s13 = presentation.appendSlide();
  const quartersST23 = [
    {
      q: 'Q1: ระบบ PLAN-D & ฐานข้อมูล',
      color: COLOR_BLUE,
      milestones: [
        { label: '[KR3.3.1.1] เตรียมพร้อมระบบ PLAN-D', target: 'เป้าหมาย: 90%', desc: 'หน่วยบริการเตรียมความพร้อมจัดทำฐานข้อมูลสินทรัพย์ในระบบ PLAN-D' },
        { label: '[KR3.3.2.1] ฐานข้อมูลสินทรัพย์ถูกต้อง', target: 'เป้าหมาย: 90%', desc: 'รพ. และหน่วยบริการจัดเตรียมฐานข้อมูลสินทรัพย์ถูกต้องเป็นปัจจุบันทุกประเภท' }
      ]
    },
    {
      q: 'Q2: บันทึกข้อมูล & นิเทศพัสดุ',
      color: COLOR_PURPLE,
      milestones: [
        { label: '[KR3.3.1.1] บันทึก PLAN-D ต่อเนื่อง', target: 'เป้าหมาย: 90%', desc: 'บันทึกข้อมูลสินทรัพย์ ครุภัณฑ์การแพทย์ในระบบ PLAN-D ครอบคลุมทุกแห่ง' },
        { label: '[KR3.3.2.1] นิเทศระบบสินทรัพย์และพัสดุ', target: 'เป้าหมาย: 90%', desc: 'ทีมจังหวัดและ รพ. นิเทศติดตามระบบบัญชีสินทรัพย์และพัสดุ รพ.สต. ทุกอำเภอ' }
      ]
    },
    {
      q: 'Q3: เชื่อมโยงคลังข้อมูลกลาง',
      color: COLOR_PRIMARY,
      milestones: [
        { label: '[KR3.3.1.1] เชื่อมคลังกลาง & หมุนเวียน', target: 'เป้าหมาย: 90%', desc: 'เชื่อมโยงฐานข้อมูลเข้าสู่คลังกลาง และเริ่มกลไกหมุนเวียนทรัพยากรระหว่างหน่วยงาน' },
        { label: '[KR3.3.2.1] เกณฑ์บริหารสินทรัพย์', target: 'เป้าหมาย: 90%', desc: 'โรงพยาบาลและหน่วยบริการผ่านเกณฑ์การบริหารจัดการสินทรัพย์ทุกประเภท' }
      ]
    },
    {
      q: 'Q4: สรุปผลคลังกลาง & คุ้มค่า',
      color: COLOR_SUCCESS,
      milestones: [
        { label: '[KR3.3.1.1] คลังกลางสมบูรณ์ 100%', target: 'เป้าหมาย: 90%', desc: 'ระบบคลังกลางเปิดใช้งานเต็มรูปแบบ และประเมินผลสัมฤทธิ์การใช้ทรัพยากรร่วมกัน' },
        { label: '[KR3.3.2.1] สรุปผลเกณฑ์สินทรัพย์', target: 'เป้าหมาย: 90%', desc: 'โรงพยาบาลและหน่วยบริการผ่านเกณฑ์บริหารสินทรัพย์ทุกประเภทครบตามเป้า' }
      ]
    }
  ];
  addActionPlanSlide(s13, 'ST2.3', exactStrats[2].n, 'การขับเคลื่อนเป้าหมาย KR3.3.1.1 (เชื่อมโยงคลังข้อมูลกลาง) และ KR3.3.2.1 (บริหารสินทรัพย์ทุกประเภท)', quartersST23, 13);

  // =========================================================================
  // STRATEGY 4: ST3.4 (สไลด์ 14, 15, 16) - NO KPI DICT!
  // =========================================================================
  // SLIDE 14: ST3.4 Objectives & KRs (5-Year Targets with %)
  const s14 = presentation.appendSlide();
  setupHeader(s14, 'กลยุทธ์ ST3.4: ยกระดับสู่ระบบสุขภาพดิจิทัลและนวัตกรรมองค์กร', 'กลยุทธ์ที่ 4 (ST3.4) | โครงสร้างและตัวชี้วัด', 14);

  const card14L = s14.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 40, 85, 310, 285);
  card14L.getFill().setSolidFill(COLOR_CARD_BG);
  card14L.getBorder().getLineFill().setSolidFill(COLOR_CARD_BORDER);
  card14L.getText().setText('🎯 [เป้าประสงค์ O3.4.1]\nประยุกต์ใช้เทคโนโลยีดิจิทัลและปัญญาประดิษฐ์ (AI) อย่างเต็มรูปแบบ เพื่อลดภาระงาน เพิ่มประสิทธิภาพการบริหารจัดการ และยกระดับคุณภาพชีวิตในการทำงานของบุคลากรทุกระดับ\n\n📊 [ตัวชี้วัด KR3.4.1.1]\nหน่วยงาน มีผลงานนวัตกรรมดิจิทัลหรือ AI ที่นำไปใช้งานได้จริง และสามารถลดระยะเวลา/ภาระงานได้ประจักษ์\n\n📌 ผู้รับผิดชอบ: กลุ่มงานสุขภาพดิจิทัล\n\nเป้าหมาย 5 ปี (2570-2574):');
  card14L.getText().getTextStyle().setFontSize(9).setForegroundColor(COLOR_DARK_TEXT);
  addTargetTable(s14, 55, 250, 280, ['30%', '40%', '50%', '60%', '80%']);

  const card14R = s14.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 370, 85, 310, 285);
  card14R.getFill().setSolidFill(COLOR_CARD_BG);
  card14R.getBorder().getLineFill().setSolidFill(COLOR_CARD_BORDER);
  card14R.getText().setText('จุดเน้นสำคัญในการขับเคลื่อน (Strategic Focus)\n\n• มุ่งเน้นนวัตกรรมที่ใช้งานได้จริง (Usable Innovation) วัดผลลดชั่วโมงทำงานได้จริง\n\n• จังหวัดวางระเบียบรองรับการจัดซื้อ AI License/Subscription ให้หน่วยบริการถูกต้อง ปลอดภัย\n\n• สร้าง Citizen Developer และ Super User ประจำแผนกเพื่อสร้าง Workflow Automation\n\n• ยกระดับสู่ "รพ.สต.อัจฉริยะ" ลดภาระงานเอกสารและการรวบรวมไฟล์ Excel ในพื้นที่');
  card14R.getText().getTextStyle().setFontSize(9).setForegroundColor(COLOR_DARK_TEXT);

  // SLIDE 15: ST3.4 Initiatives & How-to 5 Tiers Concise
  const s15 = presentation.appendSlide();
  const init34 = [
    '• 🧭 Digital Framework & Task Force: กำหนดกรอบนวัตกรรมดิจิทัล และตั้งทีม AI Task Force ลงพื้นที่ Coaching วิเคราะห์ Pain point',
    '• 🛠️ อบรมเชิงปฏิบัติการเครื่องมือจริง: เน้น Low-code/No-code, Workflow Automation และ AI Prompt Engineering ลดภาระงานโดยตรง',
    '• 📜 ปลดล็อกระเบียบ AI & เวทีประกวด: วางระเบียบจัดซื้อ AI License/Subscription ถูกต้อง และจัดประกวดนวัตกรรมดิจิทัลขยายผล'
  ];
  const tiers34 = [
    { r: '🏛️ สสจ.สระแก้ว', d: 'ประกาศนโยบาย Data Architecture/DPIA, ตั้ง AI Task Force พี่เลี้ยง Coaching, วางระเบียบ AI License, จัดเวทีประกวด', color: COLOR_PRIMARY, bg: COLOR_PRIMARY_LIGHT },
    { r: '🏥 โรงพยาบาล (รพ.)', d: 'ตั้งโจทย์ลดเวลารอคอย/ลดเอกสารพยาบาล, สร้าง Super User / Citizen Developer ใน รพ., จัดสรรเงินบำรุงหนุน AI', color: COLOR_BLUE, bg: COLOR_BLUE_BG },
    { r: '🏢 สสอ. (อำเภอ)', d: 'Data Automation ลดส่งไฟล์ Excel, เป็นพี่เลี้ยงช่วย รพ.สต. นำเทคโนโลยีไปใช้, ส่งผลงานนวัตกรรมประกวด', color: COLOR_PURPLE, bg: COLOR_PURPLE_BG },
    { r: '🩺 รพ.สต.', d: 'ยึดเป้าหมาย "รพ.สต.อัจฉริยะ", สะท้อน Pain point จริงให้ทีมพี่เลี้ยงร่วมแก้, ใช้เครื่องมือกลางที่จังหวัดจัดเตรียมให้', color: COLOR_SUCCESS, bg: COLOR_SUCCESS_BG },
    { r: '🤝 ภาคีเครือข่าย', d: 'สถาบันการศึกษาในพื้นที่ส่งอาจารย์/นักศึกษาไอทีมาร่วมเป็น Co-mentor, อสม. ใช้ Smart Line OA คัดกรองข้อมูล', color: COLOR_DARK, bg: COLOR_BG_LIGHT }
  ];
  addInitiativeAndHowToSlide(s15, 'ST3.4', exactStrats[3].n, init34, tiers34, 15);

  // SLIDE 16: ST3.4 1-Year Action Plan (Q1 - Q4 Roadmap)
  const s16 = presentation.appendSlide();
  const quartersST34 = [
    {
      q: 'Q1: วางรากฐาน Task Force',
      color: COLOR_BLUE,
      milestones: [
        { label: '[KR3.4.1.1] AI & Digital Task Force', target: 'เป้าหมาย: 100%', desc: 'แต่งตั้งคณะทำงานระดับหน่วยงานทุกแห่ง เพื่อวิเคราะห์ Pain point หน้างาน' },
        { label: '[KR3.4.1.1] สนับสนุน AI License', target: 'เป้าหมาย: 100%', desc: 'กลุ่มงานใน สสจ. ใช้งาน AI ที่สนับสนุนจากหน่วยงาน ช่วยงานประจำและบริการ' }
      ]
    },
    {
      q: 'Q2: อบรมพัฒนา & แพลตฟอร์มกลาง',
      color: COLOR_PURPLE,
      milestones: [
        { label: '[KR3.4.1.1] Workshop สหวิชาชีพ & IT', target: 'เป้าหมาย: >= 1 ครั้ง', desc: 'อบรมเชิงปฏิบัติการ Low-code, Workflow Automation และ Prompt AI' },
        { label: '[KR3.4.1.1] เว็บแอปรายงานความก้าวหน้า', target: 'เป้าหมาย: 1 ระบบ', desc: 'เปิดใช้งานระบบเว็บแอปรวบรวมความก้าวหน้านวัตกรรมและคลัง Prompt AI จังหวัด' }
      ]
    },
    {
      q: 'Q3: ขยายผลใช้งานจริง & Coaching',
      color: COLOR_PRIMARY,
      milestones: [
        { label: '[KR3.4.1.1] รายงานผลงานนวัตกรรม', target: 'เป้าหมาย: 30%', desc: 'หน่วยงานร้อยละ 30 รายงานผลงานนวัตกรรมดิจิทัล/AI ที่นำไปใช้งานได้จริง' },
        { label: '[KR3.4.1.1] On-site Coaching รายอำเภอ', target: 'เป้าหมาย: ทุกอำเภอ', desc: 'ทีมพี่เลี้ยง AI Task Force ลงพื้นที่สนับสนุนและช่วยแก้ปัญหาหน้างานจริง' }
      ]
    },
    {
      q: 'Q4: ประเมินผล & ประกวดนวัตกรรม',
      color: COLOR_SUCCESS,
      milestones: [
        { label: '[KR3.4.1.1] ส่งประกวดระดับจังหวัด', target: 'เป้าหมาย: 30%', desc: 'หน่วยงานส่งผลงานนวัตกรรมดิจิทัลเข้าร่วมประกวดเวทีวิชาการระดับจังหวัด' },
        { label: '[KR3.4.1.1] ถอดบทเรียน Best Practice', target: 'เป้าหมาย: 1 เล่ม', desc: 'จัดทำคู่มือนวัตกรรม Best Practice เผยแพร่และขยายผลทั่วทั้งจังหวัด' }
      ]
    }
  ];
  addActionPlanSlide(s16, 'ST3.4', exactStrats[3].n, 'การขับเคลื่อนเป้าหมาย KR3.4.1.1 (นวัตกรรมดิจิทัลและปัญญาประดิษฐ์ AI สู่การปฏิบัติการจริง 4 ไตรมาส)', quartersST34, 16);

  // ==========================================
  // SLIDE 17: 3 Flagship Projects (Exact names from DB)
  // ==========================================
  const s17 = presentation.appendSlide();
  setupHeader(s17, 'โครงการสำคัญภายใต้ประเด็นยุทธศาสตร์ที่ 3 (Flagship Projects)', '4. แผนงานโครงการสำคัญ', 17);

  const exactProjects = [
    { n: 'โครงการยกระดับระบบสุขภาพดิจิทัล จังหวัดสระแก้ว', g: 'กลุ่มงานสุขภาพดิจิทัล', d: 'วางมาตรฐานโครงสร้างพื้นฐานข้อมูล (Data Infrastructure), เชื่อมโยงข้อมูลสุขภาพ Data Automation และยกระดับสู่ รพ.สต.อัจฉริยะ' },
    { n: 'โครงการยกระดับการบริหารจัดการองค์กร ด้านทรัพยากรให้มีประสิทธิภาพสุงสุด', g: 'กลุ่มงานบริหารทั่วไป', d: 'พัฒนาระบบคลังข้อมูลกลางสินทรัพย์ ครุภัณฑ์การแพทย์ กลไกหมุนเวียนทรัพยากรระหว่างโรงพยาบาล และจัดซื้อร่วมระดับจังหวัด' },
    { n: 'โครงการการประยุกต์ใช้ปัญญาประดิษฐ์ (AI) เพื่อพัฒนางานสาธารณสุข การพัฒนางานประจำและบริการ พัฒนางานวิชาการและนวัตกรรม และงานสนับสนุน (Back Office)', g: 'กลุ่มงานพัฒนาทรัพยากรบุคคล', d: 'พัฒนาบุคลากรให้ใช้ AI อย่างปลอดภัยและเกิดประโยชน์ต่อการปฏิบัติงาน ทั้งงานบริการ งานวิชาการ และงาน Back Office' }
  ];
  exactProjects.forEach((pj, idx) => {
    const px = 40 + idx * 220;
    const pcard = s17.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, px, 85, 205, 285);
    pcard.getFill().setSolidFill(COLOR_CARD_BG);
    pcard.getBorder().getLineFill().setSolidFill(COLOR_CARD_BORDER);
    pcard.getText().setText(`📌 โครงการที่ ${idx+1}\n\n${pj.n}\n\nผู้รับผิดชอบ: ${pj.g}\n\nรายละเอียด:\n${pj.d}`);
    pcard.getText().getTextStyle().setFontSize(9).setForegroundColor(COLOR_DARK_TEXT);
  });

  // ==========================================
  // SLIDE 18: Key Success Factors & Monitoring
  // ==========================================
  const s18 = presentation.appendSlide();
  setupHeader(s18, 'ปัจจัยแห่งความสำเร็จและการกำกับติดตาม (Key Success Factors & Governance)', '5. การขับเคลื่อนสู่ความสำเร็จ', 18);

  const s18Left = s18.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 40, 85, 310, 285);
  s18Left.getFill().setSolidFill(COLOR_CARD_BG);
  s18Left.getBorder().getLineFill().setSolidFill(COLOR_CARD_BORDER);
  s18Left.getText().setText('🔑 4 ปัจจัยแห่งความสำเร็จ (Key Success Factors)\n\n1. Leadership & Mindset: ผู้บริหารสนับสนุนทรัพยากร และเปิดใจรับเทคโนโลยี AI\n\n2. Agile & Cross-functional: ไอที สหวิชาชีพ และงานบริหาร ร่วมออกแบบ Workflow\n\n3. Data Governance: คุ้มครองข้อมูลส่วนบุคคลและมาตรฐานความปลอดภัยไซเบอร์ (PDPA)\n\n4. Seamless Support: มีระเบียบ License ชัดเจน และมีพี่เลี้ยง Coaching ต่อเนื่อง');
  s18Left.getText().getTextStyle().setFontSize(9.5).setForegroundColor(COLOR_DARK_TEXT);

  const s18Right = s18.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 370, 85, 310, 285);
  s18Right.getFill().setSolidFill(COLOR_CARD_BG);
  s18Right.getBorder().getLineFill().setSolidFill(COLOR_CARD_BORDER);
  s18Right.getText().setText('📊 กลไกการกำกับติดตามผ่าน Strategic SKO Platform\n\n• Real-time Dashboard: ติดตามผลงานรายไตรมาส เปรียบเทียบผลงาน 9 อำเภอทันที\n\n• Traffic Lights Alert: 🟢 ผ่านเกณฑ์ | 🟡 เฝ้าระวัง | 🔴 ตกเกณฑ์ ช่วยเหลือได้ทันเวลา\n\n• เป้าหมายมาตรฐาน 5 ปี: มีเกณฑ์เป้าหมายชัดเจนครบถ้วนทั้งจังหวัด\n\n• Governance Meeting: นำข้อมูลเข้าที่ประชุม กวป. และเวทีตรวจราชการต่อเนื่อง');
  s18Right.getText().getTextStyle().setFontSize(9.5).setForegroundColor(COLOR_DARK_TEXT);

  // ==========================================
  // SLIDE 19: Closing & Q&A
  // ==========================================
  const s19 = presentation.appendSlide();
  s19.getBackground().setSolidFill(COLOR_DARK);

  const s19Badge = s19.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 240, 60, 240, 28);
  s19Badge.getFill().setSolidFill('#1E293B');
  s19Badge.getBorder().getLineFill().setSolidFill(COLOR_PRIMARY);
  s19Badge.getText().setText('ประเด็นยุทธศาสตร์ที่ 3 | สสจ.สระแก้ว');
  s19Badge.getText().getTextStyle().setFontSize(11).setBold(true).setForegroundColor('#FFFFFF');

  const s19Title = s19.insertTextBox('บทสรุปและการร่วมอภิปราย\n(Q&A and Strategic Discussion)', 60, 110, 600, 80);
  s19Title.getText().getTextStyle().setFontSize(24).setBold(true).setForegroundColor('#FFFFFF');

  const s19Box = s19.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, 80, 210, 560, 70);
  s19Box.getFill().setSolidFill('#1E293B');
  s19Box.getBorder().getLineFill().setSolidFill(COLOR_PRIMARY);
  s19Box.getText().setText('“ก้าวสู่การเป็นองค์กรอัจฉริยะ (Smart Organization) ที่บุคลากรมีความสุข\nทรัพยากรถูกใช้อย่างคุ้มค่า และการเงินการคลังมีความมั่นคงยั่งยืน”');
  s19Box.getText().getTextStyle().setFontSize(12).setForegroundColor('#FDBA74');

  const s19Foot = s19.insertTextBox('ขอขอบคุณคณะผู้บริหารและผู้เข้าร่วมประชุมทุกท่าน\nสำนักงานสาธารณสุขจังหวัดสระแก้ว', 60, 310, 600, 45);
  s19Foot.getText().getTextStyle().setFontSize(12).setForegroundColor('#94A3B8');

  // ลบสไลด์เริ่มต้นเปล่าออก
  if (existingSlides.length > 0) {
    existingSlides[0].remove();
  }

  Logger.log('สร้างสไลด์ยุทธศาสตร์ที่ 3 สำเร็จเรียบร้อยครบ 19 สไลด์!');
}

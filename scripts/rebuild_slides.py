import re

# Read current generate_s3_slides.js
with open("scripts/generate_s3_slides.js", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update TOTAL_SLIDES to 19
code = code.replace("const TOTAL_SLIDES = 16;", "const TOTAL_SLIDES = 19;")

# 2. Define addActionPlanSlide helper function if not already present
helper_code = '''
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
'''

# Insert helper before "// SLIDE 1: COVER SLIDE"
if "function addActionPlanSlide" not in code:
    code = code.replace("// ==========================================\n// SLIDE 1: COVER SLIDE", helper_code + "\n// ==========================================\n// SLIDE 1: COVER SLIDE")

# 3. Add Slide 7: ST3.1 Action Plan
st31_ap = '''
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
'''

# 4. Add Slide 10: ST3.2 Action Plan
st32_ap = '''
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
'''

# 5. Add Slide 13: ST2.3 Action Plan
st23_ap = '''
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
'''

# Insert st31_ap after slide 6
code = code.replace(
    "  slide.addNotes('สไลด์ที่ 6: กิจกรรมริเริ่มภาพรวม และแนวทางขับเคลื่อน How to 5 ระดับ (สรุปกระชับ)');\n}",
    "  slide.addNotes('สไลด์ที่ 6: กิจกรรมริเริ่มภาพรวม และแนวทางขับเคลื่อน How to 5 ระดับ (สรุปกระชับ)');\n}\n" + st31_ap
)

# Update ST3.2 slide numbers: Slide 7 -> 8, Slide 8 -> 9
# In ST3.2 slide header call:
code = code.replace("`กลยุทธ์ที่ 2 (${s2.auto_id}) | โครงสร้างและตัวชี้วัด`,\n    7", "`กลยุทธ์ที่ 2 (${s2.auto_id}) | โครงสร้างและตัวชี้วัด`,\n    8")
code = code.replace("slide.addNotes('สไลด์ที่ 7: กลยุทธ์ ST3.2", "slide.addNotes('สไลด์ที่ 8: กลยุทธ์ ST3.2")
code = code.replace("addStrategyHowToSlide(slide, s2.auto_id, s2.name, initiativesST32, tiersST32, 8);", "addStrategyHowToSlide(slide, s2.auto_id, s2.name, initiativesST32, tiersST32, 9);")
code = code.replace("slide.addNotes('สไลด์ที่ 8: กิจกรรมริเริ่มภาพรวม", "slide.addNotes('สไลด์ที่ 9: กิจกรรมริเริ่มภาพรวม")

# Insert st32_ap after slide 9
code = code.replace(
    "slide.addNotes('สไลด์ที่ 9: กิจกรรมริเริ่มภาพรวม และแนวทางขับเคลื่อน How to 5 ระดับ (สรุปกระชับ)');\n}",
    "slide.addNotes('สไลด์ที่ 9: กิจกรรมริเริ่มภาพรวม และแนวทางขับเคลื่อน How to 5 ระดับ (สรุปกระชับ)');\n}\n" + st32_ap
)

# Update ST2.3 slide numbers: Slide 9 -> 11, Slide 10 -> 12
code = code.replace("`กลยุทธ์ที่ 3 (${s3.auto_id}) | โครงสร้างและตัวชี้วัด`,\n    9", "`กลยุทธ์ที่ 3 (${s3.auto_id}) | โครงสร้างและตัวชี้วัด`,\n    11")
code = code.replace("slide.addNotes('สไลด์ที่ 9: กลยุทธ์ ST2.3", "slide.addNotes('สไลด์ที่ 11: กลยุทธ์ ST2.3")
code = code.replace("addStrategyHowToSlide(slide, s3.auto_id, s3.name, initiativesST23, tiersST23, 10);", "addStrategyHowToSlide(slide, s3.auto_id, s3.name, initiativesST23, tiersST23, 12);")
code = code.replace("slide.addNotes('สไลด์ที่ 10: กิจกรรมริเริ่มภาพรวม", "slide.addNotes('สไลด์ที่ 12: กิจกรรมริเริ่มภาพรวม")

# Insert st23_ap after slide 12
code = code.replace(
    "slide.addNotes('สไลด์ที่ 12: กิจกรรมริเริ่มภาพรวม และแนวทางขับเคลื่อน How to 5 ระดับ (สรุปกระชับ)');\n}",
    "slide.addNotes('สไลด์ที่ 12: กิจกรรมริเริ่มภาพรวม และแนวทางขับเคลื่อน How to 5 ระดับ (สรุปกระชับ)');\n}\n" + st23_ap
)

# Update ST3.4 slide numbers: Slide 11 -> 14, Slide 12 -> 15, Slide 13 -> 16
code = code.replace("`กลยุทธ์ที่ 4 (${s4.auto_id}) | โครงสร้างและตัวชี้วัด`,\n    11", "`กลยุทธ์ที่ 4 (${s4.auto_id}) | โครงสร้างและตัวชี้วัด`,\n    14")
code = code.replace("slide.addNotes('สไลด์ที่ 11: กลยุทธ์ ST3.4", "slide.addNotes('สไลด์ที่ 14: กลยุทธ์ ST3.4")
code = code.replace("addStrategyHowToSlide(slide, s4.auto_id, s4.name, initiativesST34, tiersST34, 12);", "addStrategyHowToSlide(slide, s4.auto_id, s4.name, initiativesST34, tiersST34, 15);")
code = code.replace("slide.addNotes('สไลด์ที่ 12: กิจกรรมริเริ่มภาพรวม", "slide.addNotes('สไลด์ที่ 15: กิจกรรมริเริ่มภาพรวม")

# Replace Slide 13 Action Plan with addActionPlanSlide for ST3.4 (Slide 16)
st34_ap_call = '''
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
'''

# Find old Slide 13 block and replace it
old_slide13_pattern = re.compile(r'// =+\s*// SLIDE 13: ACTION PLAN Q1-Q4.*?slide\.addNotes\(\'สไลด์ที่ 13: แผนปฏิบัติการ 1 ปี \(Action Plan Q1 - Q4 Roadmap\)\'\);\s*}', re.DOTALL)
if old_slide13_pattern.search(code):
    code = old_slide13_pattern.sub(st34_ap_call.strip(), code)
else:
    print("WARNING: Old slide 13 pattern not matched directly, checking...")

# Update remaining slides:
# Slide 14 -> 17 (Flagship Projects)
code = code.replace("addHeader(slide, 'โครงการสำคัญภายใต้ประเด็นยุทธศาสตร์ที่ 3 (Flagship Projects)', '4. แผนงานโครงการสำคัญ', 14);", "addHeader(slide, 'โครงการสำคัญภายใต้ประเด็นยุทธศาสตร์ที่ 3 (Flagship Projects)', '4. แผนงานโครงการสำคัญ', 17);")
code = code.replace("slide.addNotes('สไลด์ที่ 14: โครงการสำคัญ", "slide.addNotes('สไลด์ที่ 17: โครงการสำคัญ")

# Slide 15 -> 18 (Governance)
code = code.replace("addHeader(slide, 'ปัจจัยแห่งความสำเร็จและการกำกับติดตาม (Key Success Factors & Governance)', '5. การขับเคลื่อนสู่ความสำเร็จ', 15);", "addHeader(slide, 'ปัจจัยแห่งความสำเร็จและการกำกับติดตาม (Key Success Factors & Governance)', '5. การขับเคลื่อนสู่ความสำเร็จ', 18);")
code = code.replace("slide.addNotes('สไลด์ที่ 15: ปัจจัยความสำเร็จ", "slide.addNotes('สไลด์ที่ 18: ปัจจัยความสำเร็จ")

# Slide 16 -> 19 (Q&A)
code = code.replace("16 / ${TOTAL_SLIDES}", "19 / ${TOTAL_SLIDES}")
code = code.replace("slide.addNotes('สไลด์ที่ 16: บทสรุป", "slide.addNotes('สไลด์ที่ 19: บทสรุป")

with open("scripts/generate_s3_slides.js", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated generate_s3_slides.js successfully!")

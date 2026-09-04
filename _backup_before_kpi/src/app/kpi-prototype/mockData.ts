export const WORK_GROUPS = [
  "คุ้มครองผู้บริโภคและเภสัชสาธารณสุข",
  "บริหารทรัพยากรบุคคล",
  "กลุ่มกฎหมาย",
  "พัฒนายุทธศาสตร์สาธารณสุข",
  "สุขภาพดิจิทัล",
  "คุ้มครองผู้บริโภค",
  "พัฒนาคุณภาพและรูปแบบบริการ",
  "ควบคุมโรคติดต่อ",
  "ประกันสุขภาพ",
  "ส่งเสริมสุขภาพ",
  "ทันตสาธารณสุข",
  "บริหารทั่วไป",
  "อนามัยสิ่งแวดล้อมและอาชีวอนามัย",
  "ควบคุมโรคไม่ติดต่อ",
  "ปฐมภูมิและเครือข่ายสุขภาพ",
  "การแพทย์แผนไทยและการแพทย์ทางเลือก"
];

export const DISTRICTS = [
  "เมืองสระแก้ว", "คลองหาด", "ตาพระยา", "วังน้ำเย็น", 
  "วัฒนานคร", "อรัญประเทศ", "เขาฉกรรจ์", "โคกสูง", "วังสมบูรณ์"
];

export const MOCK_KPIS = [
  {
    id: "kpi-001",
    name: "อัตราส่วนการตายมารดาต่อการเกิดมีชีพแสนคน",
    tags: ["ตัวชี้วัดกระทรวงสาธารณสุขปี 2570"],
    responsible_group: "ส่งเสริมสุขภาพ",
    measurement_level: "district", 
    formula: "อัตราต่อแสน",
    calculation_formula: "(A / B) * 100000",
    calculation_type: "numeric",
    data_items: [
      { id: "A", label: "จำนวนมารดาตาย (คน)", type: "numerator" },
      { id: "B", label: "จำนวนเด็กเกิดมีชีพ (คน)", type: "denominator" }
    ],
    target: "ไม่เกิน 14",
    target_val: 14,
    target_warning_val: 20, 
    target_operator: "<=",
    frequency: "รายไตรมาส",
    status: "success",
    provincial_result: 12.5,
    district_results: [
      { name: "เมืองสระแก้ว", result: 0 },
      { name: "คลองหาด", result: 15 },
      { name: "ตาพระยา", result: 0 },
      { name: "วังน้ำเย็น", result: 0 },
      { name: "วัฒนานคร", result: 0 },
      { name: "อรัญประเทศ", result: 25 }, 
      { name: "เขาฉกรรจ์", result: 0 },
      { name: "โคกสูง", result: 0 },
      { name: "วังสมบูรณ์", result: 0 },
    ]
  },
  {
    id: "kpi-005",
    name: "อัตราความสำเร็จการรักษาผู้ป่วยวัณโรค (Custom Formula)",
    tags: ["ตัวชี้วัดตรวจราชการฯ ปี 2570"],
    responsible_group: "ควบคุมโรคติดต่อ",
    measurement_level: "district", 
    formula: "กำหนดสูตรเอง (Custom)",
    calculation_formula: "(C / (A - B)) * 100",
    calculation_type: "numeric",
    data_items: [
      { id: "A", label: "ผู้ป่วยวัณโรคทั้งหมด (คน)", type: "numerator" },
      { id: "B", label: "ผู้ป่วยที่ย้ายออก/เสียชีวิตจากสาเหตุอื่น (คน)", type: "denominator" },
      { id: "C", label: "ผู้ป่วยที่รักษาหายขาด (คน)", type: "numerator" }
    ],
    target: "มากกว่า 85",
    target_val: 85,
    target_warning_val: 80,
    target_operator: ">=",
    frequency: "รายไตรมาส",
    status: "success",
    provincial_result: 88.5,
    district_results: [
      { name: "เมืองสระแก้ว", result: 90 },
      { name: "คลองหาด", result: 82 }, // เหลือง
      { name: "ตาพระยา", result: 86 },
      { name: "วังน้ำเย็น", result: 75 }, // แดง
      { name: "วัฒนานคร", result: 95 },
      { name: "อรัญประเทศ", result: 81 }, // เหลือง
      { name: "เขาฉกรรจ์", result: 88 },
      { name: "โคกสูง", result: 100 },
      { name: "วังสมบูรณ์", result: 92 },
    ]
  },
  {
    id: "kpi-002",
    name: "สัดส่วนแพทย์ต่อประชากร (1 : 10,000)",
    tags: ["ยุทธศาสตร์สุขภาพ สระแก้ว (5 ปี)"],
    responsible_group: "บริหารทรัพยากรบุคคล",
    measurement_level: "province", 
    formula: "อัตราส่วน 1 : N",
    calculation_formula: "1 : (B / A)",
    calculation_type: "numeric",
    data_items: [
      { id: "A", label: "จำนวนแพทย์ (คน)", type: "numerator" },
      { id: "B", label: "จำนวนประชากร (คน)", type: "denominator" }
    ],
    target: "1 : 10000",
    target_val: 10000,
    target_warning_val: 12000,
    target_operator: "<=",
    frequency: "รายปี",
    status: "warning",
    provincial_result: "1 : 12,500", 
    district_results: []
  },
  {
    id: "kpi-003",
    name: "จัดทำแผนพัฒนาระบบบริการสุขภาพระดับจังหวัด (Service Plan) ปี 2570 แล้วเสร็จ",
    tags: ["ยุทธศาสตร์สุขภาพ สระแก้ว (รายไตรมาส 2570)"],
    responsible_group: "พัฒนายุทธศาสตร์สาธารณสุข",
    measurement_level: "province",
    formula: "เชิงกระบวนการ (Process)",
    calculation_formula: "",
    calculation_type: "process_status",
    data_items: [],
    target: "สำเร็จตามแผน",
    target_val: null,
    target_warning_val: null,
    target_operator: "process",
    frequency: "รายไตรมาส",
    status: "pending",
    provincial_result: "อยู่ระหว่างรวบรวมข้อมูลจาก คปสอ.",
    district_results: []
  }
];

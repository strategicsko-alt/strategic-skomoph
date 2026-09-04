import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { kpiName } = await request.json();

    if (!kpiName) {
      return NextResponse.json({ error: 'KPI name is required' }, { status: 400 });
    }

    const prompt = `
      คุณคือผู้เชี่ยวชาญด้านการวางแผนกลยุทธ์และการวัดผล (Strategic Management & KPI) ในบริบทของระบบสาธารณสุขไทย
      จงสร้างข้อมูล KPI Dictionary (พจนานุกรมตัวชี้วัด) สำหรับเป้าหมาย (Key Result) ที่มีชื่อว่า: "${kpiName}"
      
      ให้ตอบกลับมาเป็น JSON format ตามโครงสร้างนี้เท่านั้น (ห้ามมีข้อความอื่นเจือปน):
      {
        "definition": "นิยามเชิงปฏิบัติการ (Definition) แบบกระชับและเข้าใจง่าย",
        "numerator": "ตัวตั้ง (Numerator) - เช่น จำนวนคนที่... หรือ สูตร",
        "denominator": "ตัวหาร (Denominator) - ถ้าเป็นร้อยละ ให้ใส่ตัวหาร หรือใส่ - ถ้าไม่มีตัวหาร",
        "inclusion_criteria": "เกณฑ์นับเข้า (Inclusion Criteria)",
        "exclusion_criteria": "เกณฑ์นับออก (Exclusion Criteria)",
        "data_source": "แหล่งข้อมูล (Data Source) - ระบบหรือเอกสารที่ใช้เก็บข้อมูล",
        "data_collection_method": "วิธีดึงข้อมูลหรือจัดเก็บข้อมูล",
        "frequency": "ความถี่การวัด (เช่น รายเดือน, รายไตรมาส, ประเมินปีละ 1 ครั้ง)",
        "cutoff_date": "วันตัดข้อมูล (เช่น ทุกวันที่ 5 ของเดือนถัดไป, สิ้นปีงบประมาณ)",
        "rationale": "เหตุผลประกอบที่ต้องวัดตัวชี้วัดนี้",
        "risk_warning": "ข้อควรระวัง / ความเสี่ยง ในการเก็บข้อมูลตัวนี้",
        "prerequisite": "สิ่งที่ต้องเตรียมหรือทำก่อนจึงจะสามารถวัดผลได้"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      return NextResponse.json(result);
    } else {
      throw new Error("No response text from Gemini");
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: 'Failed to generate KPI dictionary', details: error.message }, { status: 500 });
  }
}

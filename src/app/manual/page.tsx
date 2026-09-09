"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, BookOpen, MapPin, ShieldCheck, Target, Activity, 
  Sparkles, BarChart2, Download, Printer, Database, Settings, 
  HelpCircle, Search, Layers, RefreshCw, AlertTriangle, ArrowRight, 
  Calendar, FileText, Lock, Sliders, X, Eye
} from 'lucide-react';

interface ManualSection {
  id: string;
  number: string;
  title: string;
  category: 'general' | 'user' | 'admin' | 'kpi' | 'faq';
  icon: any;
  summary: string;
  keywords: string[];
  content: React.ReactNode;
}

export default function ManualPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSectionId, setActiveSectionId] = useState<string>('section-1');

  const categories = [
    { id: 'all', label: 'ทั้งหมด (All Topics)' },
    { id: 'general', label: 'ภาพรวมและการดูแผน (Viewer)' },
    { id: 'user', label: 'สำหรับผู้ใช้งาน (User Guide)' },
    { id: 'kpi', label: 'ตัวชี้วัดและสูตร (KPI & Formulas)' },
    { id: 'admin', label: 'สำหรับผู้ดูแลระบบ (Admin Guide)' },
    { id: 'faq', label: 'คำถามที่พบบ่อย (FAQ & Fixes)' },
  ];

  const sections: ManualSection[] = useMemo(() => [
    {
      id: 'section-1',
      number: '1',
      title: 'ภาพรวมระบบและขอบเขตพื้นที่ (System Overview & Scope)',
      category: 'general',
      icon: MapPin,
      summary: 'การเชื่อมโยงแผนยุทธศาสตร์ 5 ปี แผนปฏิบัติการ 1 ปี และการเลือกดูข้อมูลรายอำเภอ',
      keywords: ['ภาพรวม', 'อำเภอ', 'สระแก้ว', 'ขอบเขต', 'viewer', 'editor', '2570', '5 ปี', 'สสจ'],
      content: (
        <div>
          <p>
            ระบบ <strong>Strategic SKO</strong> ออกแบบขึ้นเพื่อเป็นศูนย์กลางการบริหารจัดการและกำกับติดตาม 
            <strong> แผนยุทธศาสตร์สุขภาพ 5 ปี (พ.ศ. 2570 – 2574)</strong> และ <strong>แผนปฏิบัติการ 1 ปี (Action Plan รายไตรมาส)</strong> 
            ของสำนักงานสาธารณสุขจังหวัดสระแก้ว และเครือข่ายบริการสุขภาพระดับอำเภอทั้ง 9 อำเภอ
          </p>

          <div className="grid-2-cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div className="feature-box">
              <h4 style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Eye size={18} /> โหมดสาธารณะ (Viewer)
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                เข้าถึงได้ทุกคนโดยไม่ต้องเข้าสู่ระบบ เพื่อดูภาพรวมยุทธศาสตร์ วิสัยทัศน์ สถิติ โมเดลบ้านยุทธศาสตร์ 
                และความก้าวหน้าของตัวชี้วัด (KPIs) ทั้งในภาพรวมจังหวัด หรือเลือกดูเฉพาะของแต่ละอำเภอได้ทันที
              </p>
            </div>
            <div className="feature-box">
              <h4 style={{ color: '#0284c7', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Lock size={18} /> โหมดจัดการข้อมูล (Editor Portal)
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                สำหรับเจ้าหน้าที่ผู้รับผิดชอบระดับจังหวัดและอำเภอ โดยต้องลงทะเบียนและได้รับการอนุมัติสิทธิ์ 
                ใช้สำหรับบันทึก/แก้ไขแผนยุทธศาสตร์ พจนานุกรมตัวชี้วัด ผลงานรายไตรมาส และรายงานผล
              </p>
            </div>
          </div>

          <div className="info-box" style={{ marginTop: '1.25rem' }}>
            <h4 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <MapPin size={18} /> การเลือกดูข้อมูลระดับอำเภอ (9 อำเภอในสระแก้ว)
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              ที่แถบหัวเว็บด้านบนขวา (Header) จะมีเมนู Dropdown ให้เลือกพื้นที่: 
              <strong> ภาพรวมจังหวัดสระแก้ว</strong> หรือเลือกเฉพาะอำเภอ ได้แก่ 
              <em> เมืองสระแก้ว, คลองหาด, ตาพระยา, วังน้ำเย็น, วัฒนานคร, อรัญประเทศ, เขาฉกรรจ์, โคกสูง และ วังสมบูรณ์</em> 
              เมื่อเปลี่ยนอำเภอ ข้อมูลวิสัยทัศน์ SWOT แผนงาน และตัวชี้วัดจะเปลี่ยนตามพื้นที่ที่เลือกทันที
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'section-2',
      number: '2',
      title: 'การเข้าใช้งาน การสมัคร และระบบสิทธิ์ (Account & Roles)',
      category: 'user',
      icon: ShieldCheck,
      summary: 'ขั้นตอนการสมัครสมาชิก การรออนุมัติสิทธิ์ และการแบ่งระดับสิทธิ์ 4 บทบาท',
      keywords: ['สิทธิ์', 'สมัคร', 'อนุมัติ', 'role', 'login', 'register', 'admin', 'super admin', 'pending'],
      content: (
        <div>
          <p>
            เจ้าหน้าที่สามารถเข้าสู่ระบบจัดการได้ที่ปุ่ม <strong>&ldquo;เข้าสู่ระบบจัดการข้อมูล&rdquo;</strong> (มุมขวาบนของหน้าแรก) 
            หรือไปที่เส้นทาง <Link href="/editor/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>/editor/login</Link>
          </p>

          <h4 style={{ fontWeight: 700, color: 'var(--foreground)', marginTop: '1rem', marginBottom: '0.5rem' }}>
            ขั้นตอนการเริ่มต้นใช้งานสำหรับผู้ใช้ใหม่:
          </h4>
          <ol style={{ paddingLeft: '1.25rem', lineHeight: '1.8' }}>
            <li>ไปที่หน้า <Link href="/editor/register" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>ลงทะเบียนผู้ใช้งานใหม่ (/editor/register)</Link></li>
            <li>กรอกชื่อ-นามสกุล, อีเมล, รหัสผ่าน, เลือกอำเภอที่ท่านสังกัด และกลุ่มงานที่รับผิดชอบ</li>
            <li>กดปุ่มยืนยันการลงทะเบียน ระบบจะสร้างบัญชีและส่งท่านไปยังหน้า <strong>&ldquo;รอการอนุมัติ&rdquo; (/editor/pending-approval)</strong></li>
            <li>แจ้งผู้ดูแลระบบ (Admin) ในพื้นที่ของท่านเพื่อทำการอนุมัติสิทธิ์ จึงจะสามารถล็อกอินเข้าทำงานได้</li>
          </ol>

          <div style={{ overflowX: 'auto', marginTop: '1.25rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--secondary)', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem' }}>ระดับสิทธิ์ (Role)</th>
                  <th style={{ padding: '0.75rem' }}>ขอบเขตการดูข้อมูล</th>
                  <th style={{ padding: '0.75rem' }}>ขอบเขตการแก้ไขข้อมูล</th>
                  <th style={{ padding: '0.75rem' }}>การจัดการผู้ใช้งาน</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600, color: '#0284c7' }}>Super Admin จังหวัด</td>
                  <td style={{ padding: '0.75rem' }}>ดูได้ทั้งจังหวัดและทุกอำเภอ</td>
                  <td style={{ padding: '0.75rem' }}>แก้ไขได้ทุกหน้า ทุกอำเภอ สำรอง/กู้คืนระบบได้</td>
                  <td style={{ padding: '0.75rem' }}>อนุมัติและเปลี่ยนสิทธิ์ผู้ใช้ได้ทุกคน</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600, color: '#7c3aed' }}>Super Admin อำเภอ</td>
                  <td style={{ padding: '0.75rem' }}>ดูได้ทั้งจังหวัดและอำเภอ</td>
                  <td style={{ padding: '0.75rem' }}>แก้ไขข้อมูลเฉพาะอำเภอตนเอง</td>
                  <td style={{ padding: '0.75rem' }}>อนุมัติผู้ใช้เฉพาะภายในอำเภอตนเอง</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600, color: '#059669' }}>User จังหวัด</td>
                  <td style={{ padding: '0.75rem' }}>ดูได้ทั้งจังหวัดและอำเภอ</td>
                  <td style={{ padding: '0.75rem' }}>แก้ไขแผน/ตัวชี้วัดเฉพาะระดับจังหวัด</td>
                  <td style={{ padding: '0.75rem' }}>ไม่มีสิทธิ์อนุมัติผู้ใช้</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.75rem', fontWeight: 600, color: '#d97706' }}>User อำเภอ</td>
                  <td style={{ padding: '0.75rem' }}>ดูได้ทั้งจังหวัดและอำเภอ</td>
                  <td style={{ padding: '0.75rem' }}>แก้ไขแผน/ตัวชี้วัดเฉพาะอำเภอตนเอง</td>
                  <td style={{ padding: '0.75rem' }}>ไม่มีสิทธิ์อนุมัติผู้ใช้</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )
    },
    {
      id: 'section-3',
      number: '3',
      title: 'หน้าหลักและโมเดลบ้านยุทธศาสตร์ (Strategic Roadmap & House Model)',
      category: 'general',
      icon: Target,
      summary: 'การอ่าน Bento Grid, โมเดลบ้านยุทธศาสตร์, SWOT Analysis และตารางแผนยุทธศาสตร์',
      keywords: ['หน้าแรก', 'bento', 'house model', 'วิสัยทัศน์', 'swot', 'แผนยุทธศาสตร์', 'เป้าประสงค์', 'กลยุทธ์'],
      content: (
        <div>
          <p>
            หน้าแรกของระบบ (<Link href="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>/</Link>) ถูกออกแบบด้วย 
            <strong> Bento Grid และ Strategic House Model</strong> เพื่อสื่อสารทิศทางยุทธศาสตร์ให้เข้าใจง่ายในหน้าเดียว:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div className="step-card">
              <span className="step-badge">ส่วนที่ 1</span>
              <div>
                <strong>Bento Cards (ข้อมูลทิศทางองค์กร):</strong>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'var(--secondary-foreground)' }}>
                  แสดงวิสัยทัศน์ (Vision), พันธกิจ (Mission), เป้าประสงค์สูงสุด (Ultimate Goal) 
                  และการวิเคราะห์จุดแข็ง-จุดอ่อน-โอกาส-อุปสรรค (SWOT Matrix 4 มิติ)
                </p>
              </div>
            </div>

            <div className="step-card">
              <span className="step-badge">ส่วนที่ 2</span>
              <div>
                <strong>การสรุปสถิติ 5 มิติ (Stats Cards):</strong>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'var(--secondary-foreground)' }}>
                  การนับจำนวนรวมแบบเรียลไทม์ของ: โครงการ (Projects), ประเด็นยุทธศาสตร์ (Issues), 
                  กลยุทธ์ (Strategies), เป้าประสงค์ (Objectives) และ ตัวชี้วัด (Key Results)
                </p>
              </div>
            </div>

            <div className="step-card">
              <span className="step-badge">ส่วนที่ 3</span>
              <div>
                <strong>โมเดลบ้านยุทธศาสตร์ (Strategic House Model):</strong>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'var(--secondary-foreground)' }}>
                  หลังคาบ้านคือ <em>วิสัยทัศน์ของจังหวัด</em> และเสาบ้าน 4 เสาแทน <em>4 ประเด็นยุทธศาสตร์หลัก</em> 
                  พร้อมแสดงกลยุทธ์ที่ขับเคลื่อนอยู่ภายในเสาแต่ละต้น
                </p>
              </div>
            </div>

            <div className="step-card">
              <span className="step-badge">ส่วนที่ 4</span>
              <div>
                <strong>แผนที่ยุทธศาสตร์และกล่องพับขยาย (Collapsible Strategic Issues):</strong>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'var(--secondary-foreground)' }}>
                  เมื่อคลิกขยายประเด็นยุทธศาสตร์ จะพบตัวชี้วัดผลลัพธ์ (Outcome Indicators), กลยุทธ์, เป้าประสงค์, 
                  กิจกรรมริเริ่ม, <strong>แนวทางการขับเคลื่อน 5 ระดับ (สสจ., รพ., สสอ., รพ.สต., ภาคีเครือข่าย)</strong> 
                  และตารางค่าเป้าหมายรายปี 2570–2574
                </p>
              </div>
            </div>
          </div>

          <div className="tip-box" style={{ marginTop: '1.25rem' }}>
            <strong>💡 เคล็ดลับ:</strong> คุณสามารถคลิกที่รหัสหรือชื่อตัวชี้วัด (เช่น <code>[KR1.1.1.1]</code>) 
            เพื่อเปิดหน้าพจนานุกรมตัวชี้วัด (KPI Dictionary) ขึ้นมาอ่านนิยาม สูตรคำนวณ ตัวตั้ง-ตัวหาร และเกณฑ์นับเข้า/ออกได้ทันที
          </div>
        </div>
      )
    },
    {
      id: 'section-4',
      number: '4',
      title: 'แดชบอร์ดกำกับติดตามตัวชี้วัด (KPI Dashboard & Comparison)',
      category: 'kpi',
      icon: BarChart2,
      summary: 'การดูกราฟเปรียบเทียบผลงาน 9 อำเภอ สัญญาณไฟเตือนภัย และการกรองตามกลุ่มงาน/แท็ก',
      keywords: ['kpi', 'dashboard', 'กราฟ', 'เปรียบเทียบ', 'อำเภอ', 'ไฟเขียว', 'ไฟแดง', 'ตัวชี้วัด', 'recharts'],
      content: (
        <div>
          <p>
            หน้าแดชบอร์ดติดตามตัวชี้วัด (<Link href="/kpi/dashboard" style={{ color: 'var(--primary)', fontWeight: 600 }}>/kpi/dashboard</Link>) 
            เป็นศูนย์รวมผลการดำเนินงานของทุกตัวชี้วัดในระบบ รองรับทั้งการดูแบบผู้บริหารและการดูรายละเอียด
          </p>

          <h4 style={{ fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>ฟังก์ชันสำคัญในหน้า KPI Dashboard:</h4>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: '1.8' }}>
            <li>
              <strong>แท็บสำหรับผู้บริหาร (Executive Overview):</strong> สรุปตัวชี้วัดทั้งหมดในรูปแบบ Card พร้อมสถานะไฟสัญญาณ 
              และสรุปสัดส่วนตัวชี้วัดที่ ผ่านเกณฑ์ (สีเขียว), เฝ้าระวัง (สีเหลือง), และ ไม่ผ่านเกณฑ์ (สีแดง)
            </li>
            <li>
              <strong>แท็บรายละเอียด (Detail View):</strong> มีกราฟแท่ง (Bar Chart) เปรียบเทียบผลงานของทั้ง 9 อำเภอ 
              พร้อมเส้นประสีเขียว (เส้นเป้าหมาย Target) และเส้นประสีส้ม (เส้นเฝ้าระวัง Warning) เพื่อให้เห็นชัดเจนว่าอำเภอใดผลงานผ่านหรือตกเกณฑ์
            </li>
            <li>
              <strong>ตัวกรองกลุ่มงาน (Filter by Work Group):</strong> เลือกดูเฉพาะตัวชี้วัดที่กลุ่มงานของท่านรับผิดชอบได้จาก 16 กลุ่มงาน
            </li>
            <li>
              <strong>ตัวกรองแท็ก (Filter by Category/Tag):</strong> สลับดูตามประเภท เช่น ตัวชี้วัดกระทรวงสาธารณสุขปี 2570, 
              ตัวชี้วัดตรวจราชการฯ, หรือ ยุทธศาสตร์สุขภาพ 5 ปี สระแก้ว
            </li>
            <li>
              <strong>ช่องค้นหาแบบพิมพ์ค้นหาด่วน (Live Search):</strong> ค้นหาด้วยชื่อตัวชี้วัด หรือรหัส Auto ID ได้ทันที
            </li>
          </ul>

          <div className="grid-3-cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#16a34a', marginRight: '0.5rem' }}></span>
              <strong style={{ color: '#166534' }}>สีเขียว (ผ่านเกณฑ์)</strong>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#14532d' }}>
                ผลงานบรรลุตามเป้าหมายของไตรมาสนั้นๆ (เช่น ค่ามากกว่าหรือเท่ากับค่าเป้าหมาย)
              </p>
            </div>
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#d97706', marginRight: '0.5rem' }}></span>
              <strong style={{ color: '#b45309' }}>สีเหลือง (เฝ้าระวัง)</strong>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#78350f' }}>
                ผลงานยังไม่ถึงเกณฑ์เป้าหมาย แต่ยังอยู่สูงกว่าระดับเกณฑ์เตือนภัย (Warning Threshold)
              </p>
            </div>
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#dc2626', marginRight: '0.5rem' }}></span>
              <strong style={{ color: '#991b1b' }}>สีแดง (ตกเกณฑ์)</strong>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#7f1d1d' }}>
                ผลงานต่ำกว่าเกณฑ์เตือนภัย ต้องได้รับการแก้ไขหรือวางแผนเร่งรัดการดำเนินงาน
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'section-5',
      number: '5',
      title: 'เวิร์กช็อปจัดทำแผนยุทธศาสตร์ 5 ปี (Strategic Workshop)',
      category: 'user',
      icon: Activity,
      summary: 'การสร้างและจัดการลำดับชั้นแผนยุทธศาสตร์ How-to 5 ระดับ และการผูกโครงการ',
      keywords: ['workshop', 'เพิ่ม', 'แก้ไข', 'ยุทธศาสตร์', 'กลยุทธ์', 'เป้าประสงค์', 'โครงการ', 'how-to', 'รพสต'],
      content: (
        <div>
          <p>
            เมนู <strong>Workshop แผนยุทธศาสตร์ 5 ปี</strong> (<Link href="/editor/workshop" style={{ color: 'var(--primary)', fontWeight: 600 }}>/editor/workshop</Link>) 
            เป็นหัวใจสำคัญในการบันทึกและปรับแต่งโครงสร้างแผนยุทธศาสตร์ทั้งหมด
          </p>

          <h4 style={{ fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>โครงสร้างลำดับชั้น 4 ระดับ (Hierarchy):</h4>
          <div className="hierarchy-box">
            <div className="h-item level-1">
              <div className="h-dot"></div>
              <div className="h-content">
                <strong>1. ประเด็นยุทธศาสตร์ (Strategic Issues: รหัส S1, S2, ...)</strong>
                <p>หมวดหมู่การพัฒนาหลัก เช่น ยุทธศาสตร์ที่ 1: การพัฒนาระบบสุขภาพปฐมภูมิ</p>
              </div>
            </div>
            <div className="h-item level-2">
              <div className="h-dot"></div>
              <div className="h-content">
                <strong>2. กลยุทธ์ (Strategies: รหัส ST1.1, ST1.2, ...)</strong>
                <p>แนวทางการดำเนินงานเพื่อขับเคลื่อนประเด็นยุทธศาสตร์</p>
              </div>
            </div>
            <div className="h-item level-3">
              <div className="h-dot"></div>
              <div className="h-content">
                <strong>3. เป้าประสงค์ (Objectives: รหัส O1.1.1, O1.1.2, ...)</strong>
                <p>เป้าหมายระดับยุทธวิธี พร้อมกำหนดกิจกรรมริเริ่ม (Initiative Activities) และ How-to 5 ระดับ</p>
              </div>
            </div>
            <div className="h-item level-4">
              <div className="h-dot"></div>
              <div className="h-content">
                <strong>4. ผลลัพธ์สำคัญ (Key Results / KPIs: รหัส KR1.1.1.1, ...)</strong>
                <p>ตัวชี้วัดความสำเร็จ พร้อมกำหนดเป้าหมายรายปี พ.ศ. 2570 ถึง 2574 และกลุ่มงานผู้รับผิดชอบ</p>
              </div>
            </div>
          </div>

          <div className="info-box" style={{ marginTop: '1.25rem' }}>
            <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
              🌟 การกรอกแนวทางการขับเคลื่อน 5 ระดับ (How-to 5 Levels) ในเป้าประสงค์:
            </h4>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>
              เมื่อกดแก้ไขหรือเพิ่มเป้าประสงค์ ระบบจะมีช่องให้ระบุแนวทางปฏิบัติของเครือข่ายบริการสุขภาพแต่ละระดับอย่างชัดเจน:
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
              <li><strong>สสจ. (สำนักงานสาธารณสุขจังหวัด):</strong> บทบาทด้านนโยบาย การสนับสนุนงบประมาณ และการกำกับภาพรวม</li>
              <li><strong>รพ. (โรงพยาบาลศูนย์/ทั่วไป/ชุมชน):</strong> บทบาทด้านการรักษาพยาบาลและการส่งต่อ</li>
              <li><strong>สสอ. (สำนักงานสาธารณสุขอำเภอ):</strong> บทบาทด้านการบริหารจัดการระบบสุขภาพระดับอำเภอ</li>
              <li><strong>รพ.สต. (โรงพยาบาลส่งเสริมสุขภาพตำบล):</strong> บทบาทด้านการดูแลสุขภาพระดับปฐมภูมิในพื้นที่</li>
              <li><strong>ภาคีเครือข่าย:</strong> บทบาทของ อปท., อสม., ชุมชน, ส่วนราชการอื่นๆ</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'section-6',
      number: '6',
      title: 'ระบบอัจฉริยะ Auto-Renumbering และการย้ายข้อมูล (Smart Workshop Features)',
      category: 'user',
      icon: RefreshCw,
      summary: 'การจัดเรียงรหัสอัตโนมัติเมื่อมีการขยับลำดับ และการย้ายเป้าประสงค์/ตัวชี้วัดข้ามสาย',
      keywords: ['renumber', 'จัดเรียง', 'เลื่อนขึ้น', 'เลื่อนลง', 'ย้าย', 'move', 'auto id', 'รหัสอัตโนมัติ'],
      content: (
        <div>
          <p>
            ระบบมีกลไก <strong>Cascade Auto-Renumbering</strong> ที่ช่วยดูแลรหัส Auto ID ให้สัมพันธ์กันตลอดทั้งระบบอัตโนมัติ:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div className="feature-box">
              <h4 style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <RefreshCw size={18} /> Cascade Auto-Renumbering ทำงานอย่างไร?
              </h4>
              <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                เมื่อคุณกดปุ่ม <strong>&ldquo;เลื่อนขึ้น (↑)&rdquo;</strong> หรือ <strong>&ldquo;เลื่อนลง (↓)&rdquo;</strong> 
                หรือทำการลบรายการใดรายการหนึ่ง ระบบจะคำนวณและปรับเปลี่ยนรหัสของรายการลูกทั้งหมดใหม่อัตโนมัติทันที 
                เช่น หากย้ายกลยุทธ์จากลำดับที่ 2 ไปเป็นลำดับที่ 1 รหัสจะเปลี่ยนจาก <code>ST1.2</code> เป็น <code>ST1.1</code> 
                และเป้าประสงค์ใต้กลยุทธ์นั้นจะเปลี่ยนจาก <code>O1.2.1</code> เป็น <code>O1.1.1</code> โดยผู้ใช้ไม่ต้องไล่แก้เอง
              </p>
            </div>

            <div className="feature-box">
              <h4 style={{ color: '#7c3aed', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <ArrowRight size={18} /> การย้ายเป้าประสงค์ (Move Objective)
              </h4>
              <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                หากต้องการย้ายเป้าประสงค์ไปอยู่ภายใต้กลยุทธ์อื่น ให้กดปุ่มไอคอน <strong>&ldquo;ย้าย (Move)&rdquo;</strong> 
                ที่กล่องเป้าประสงค์นั้น แล้วเลือกกลยุทธ์ปลายทาง ระบบจะทำการโอนย้ายเป้าประสงค์พร้อมตัวชี้วัดทั้งหมดใต้เป้าประสงค์นั้นไปยังกลยุทธ์ใหม่พร้อมรันเลขใหม่ทันที
              </p>
            </div>

            <div className="feature-box">
              <h4 style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Sliders size={18} /> การย้ายตัวชี้วัด (Move Key Result)
              </h4>
              <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                คุณสามารถย้าย Key Result ข้ามไปยังเป้าประสงค์อื่น หรือแปลงจาก <em>ตัวชี้วัดเป้าประสงค์ (KR)</em> 
                ให้กลายเป็น <em>ตัวชี้วัดระดับยุทธศาสตร์ (Outcome Indicator: IND)</em> ได้อย่างยืดหยุ่นผ่านปุ่มย้ายในตัวชี้วัดนั้นๆ
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'section-7',
      number: '7',
      title: 'พจนานุกรมตัวชี้วัดและการใช้ AI ช่วยสร้าง (KPI Dictionary & Gemini AI ✨)',
      category: 'kpi',
      icon: Sparkles,
      summary: 'การกรอกรายละเอียดตัวชี้วัด และการใช้ Gemini AI สร้างนิยาม ตัวตั้ง-ตัวหาร อัตโนมัติใน 3 วินาที',
      keywords: ['kpi dictionary', 'ai', 'gemini', 'พจนานุกรม', 'นิยาม', 'ตัวตั้ง', 'ตัวหาร', 'sparkles', 'อัตโนมัติ'],
      content: (
        <div>
          <p>
            เมื่อกำหนดตัวชี้วัดแล้ว จะต้องมีรายละเอียดพจนานุกรมตัวชี้วัด (KPI Dictionary) เพื่อให้หน่วยบริการและผู้ปฏิบัติงานเข้าใจตรงกัน 
            ไปที่เมนู <strong>KPI Dictionary</strong> (<Link href="/editor/kpi-dictionary" style={{ color: 'var(--primary)', fontWeight: 600 }}>/editor/kpi-dictionary</Link>)
          </p>

          <div className="info-box" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', borderColor: '#10b981', color: '#064e3b', marginTop: '1rem' }}>
            <h4 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Sparkles size={20} style={{ color: '#059669' }} /> ฟังก์ชัน AI Auto-Fill ด้วย Google Gemini API:
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
              เพียงคลิกที่ปุ่ม <strong>&ldquo;AI สร้างข้อมูลตัวชี้วัด (✨)&rdquo;</strong> ระบบจะส่งชื่อตัวชี้วัดไปยัง Gemini AI 
              ซึ่งถูกฝึกด้วยบริบทงานสาธารณสุขไทย แล้วตอบกลับมาเป็นข้อมูลที่สมบูรณ์ครบทุกช่องภายใน 3-5 วินาที ได้แก่:
              <em> นิยามเชิงปฏิบัติการ, ตัวตั้ง (Numerator), ตัวหาร (Denominator), เกณฑ์นับเข้า/เกณฑ์นับออก, 
              แหล่งข้อมูล, วิธีจัดเก็บ, ความถี่, วันตัดข้อมูล, เหตุผลประกอบ และความเสี่ยงในการจัดเก็บ</em>
            </p>
          </div>

          <h4 style={{ fontWeight: 700, marginTop: '1.25rem', marginBottom: '0.5rem' }}>ขั้นตอนการบันทึก KPI Dictionary:</h4>
          <ol style={{ paddingLeft: '1.25rem', lineHeight: '1.8' }}>
            <li>เลือกตัวชี้วัดที่ต้องการจากรายการ หรือค้นหาจากชื่อตัวชี้วัด</li>
            <li>กดปุ่ม <strong>&ldquo;แก้ไขพจนานุกรม&rdquo;</strong></li>
            <li>กดปุ่ม <strong>✨ AI Auto-Fill</strong> เพื่อให้ AI ช่วยร่างข้อมูลตั้งต้นให้</li>
            <li>ตรวจสอบและปรับแก้ข้อความให้เข้ากับบริบทจริงของจังหวัดสระแก้ว</li>
            <li>กดปุ่ม <strong>&ldquo;บันทึกข้อมูล&rdquo;</strong> ข้อมูลจะไปปรากฏในหน้าแสดงผลตัวชี้วัดสาธารณะทันที</li>
          </ol>
        </div>
      )
    },
    {
      id: 'section-8',
      number: '8',
      title: 'การตั้งค่าสูตรและสร้างตัวชี้วัด (KPI Template Builder)',
      category: 'kpi',
      icon: Settings,
      summary: 'การเลือกประเภทการคำนวณ การเขียนสูตร (A/B)*100 การกำหนดเป้าหมายรายไตรมาส และการเชื่อมต่อ API',
      keywords: ['template', 'ตั้งค่าตัวชี้วัด', 'สูตร', 'เปอร์เซ็นต์', 'ร้อยละ', 'อัตราส่วน', 'ไตรมาส', 'เกณฑ์', 'api', 'hdc'],
      content: (
        <div>
          <p>
            เมนู <strong>⚙️ ตั้งค่าตัวชี้วัด (KPI)</strong> (<Link href="/editor/kpi-template" style={{ color: 'var(--primary)', fontWeight: 600 }}>/editor/kpi-template</Link>) 
            (สำหรับผู้ใช้ระดับจังหวัด) ใช้สำหรับตั้งค่ากลไกการคำนวณ เกณฑ์เป้าหมาย และการประเมินผล
          </p>

          <h4 style={{ fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>1. รูปแบบการคำนวณ 4 ประเภท (Calculation Types):</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="feature-box">
              <strong>1. ร้อยละ (Percent)</strong>
              <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>สูตรมาตรฐาน เช่น <code>(A/B)*100</code></p>
              <span style={{ fontSize: '0.8rem', color: 'var(--secondary-foreground)' }}>กำหนดตัวแปร A = ตัวตั้ง, B = ตัวหาร</span>
            </div>
            <div className="feature-box">
              <strong>2. จำนวนนับ (Count)</strong>
              <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>สูตรนับค่า เช่น <code>A</code></p>
              <span style={{ fontSize: '0.8rem', color: 'var(--secondary-foreground)' }}>นับจำนวนครั้ง, จำนวนคน, จำนวนแห่ง</span>
            </div>
            <div className="feature-box">
              <strong>3. อัตราส่วน (Ratio)</strong>
              <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>สูตรแสดงสัดส่วน เช่น <code>1 : (B/A)</code></p>
              <span style={{ fontSize: '0.8rem', color: 'var(--secondary-foreground)' }}>เช่น สัดส่วนแพทย์ต่อประชากร (1 : 1,000)</span>
            </div>
            <div className="feature-box">
              <strong>4. เชิงกระบวนการ (Process Status)</strong>
              <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>ประเมินขั้นตอนความสำเร็จ</p>
              <span style={{ fontSize: '0.8rem', color: 'var(--secondary-foreground)' }}>สถานะ: บรรลุ, กำลังดำเนินการ, ไม่บรรลุ</span>
            </div>
          </div>

          <h4 style={{ fontWeight: 700, marginTop: '1.25rem', marginBottom: '0.5rem' }}>2. การกำหนดเกณฑ์ประเมินรายไตรมาส (Evaluation Criteria):</h4>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
            กำหนดเป้าหมายของแต่ละไตรมาส (Q1, Q2, Q3, Q4) พร้อมกำหนด <strong>ค่าเตือนภัย (Warning Threshold)</strong> 
            และเลือกตัวดำเนินการเปรียบเทียบ:
          </p>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
            <li><code>&gt;=</code> (มากกว่าหรือเท่ากับ): ยิ่งมากยิ่งดี เช่น อัตราการรอดชีวิต, ความครอบคลุมวัคซีน</li>
            <li><code>&lt;=</code> (น้อยกว่าหรือเท่ากับ): ยิ่งน้อยยิ่งดี เช่น อัตราการเสียชีวิต, อัตราการติดเชื้อ</li>
            <li><code>=</code> (เท่ากับ): ต้องตรงตามเกณฑ์ที่กำหนดเป๊ะ</li>
          </ul>

          <div className="tip-box" style={{ marginTop: '1rem' }}>
            <strong>💡 ตัวชี้วัดอิสระ (Standalone KPI):</strong> หากคุณมีตัวชี้วัดนโยบายเร่งด่วน หรือตัวชี้วัดที่ไม่ได้อยู่ในเล่มยุทธศาสตร์ 5 ปี 
            คุณสามารถกดปุ่ม <strong>&ldquo;+ เพิ่มตัวชี้วัดใหม่ (Standalone)&rdquo;</strong> เพื่อนำมาติดตามผลใน Dashboard ได้เช่นกัน
          </div>
        </div>
      )
    },
    {
      id: 'section-9',
      number: '9',
      title: 'การบันทึกผลการดำเนินงานตัวชี้วัด (KPI Quarterly Reporting)',
      category: 'kpi',
      icon: FileText,
      summary: 'วิธีการบันทึกผลงานรายไตรมาส การคำนวณผลลัพธ์อัตโนมัติ และการรายงานระดับอำเภอ',
      keywords: ['kpi report', 'บันทึกผล', 'ไตรมาส', 'q1', 'q2', 'q3', 'q4', 'ผลงาน', 'กรอกผล'],
      content: (
        <div>
          <p>
            เมนู <strong>📝 บันทึกผล KPI</strong> (<Link href="/editor/kpi-report" style={{ color: 'var(--primary)', fontWeight: 600 }}>/editor/kpi-report</Link>) 
            เป็นหน้าสำหรับผู้รับผิดชอบตัวชี้วัดในการกรอกตัวเลขผลงานจริงในแต่ละรอบไตรมาส
          </p>

          <h4 style={{ fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>ขั้นตอนการบันทึกผลงาน:</h4>
          <ol style={{ paddingLeft: '1.25rem', lineHeight: '1.8' }}>
            <li>เลือกตัวชี้วัดที่ต้องการบันทึกจากเมนูด้านบน</li>
            <li>เลือกไตรมาสที่ต้องการรายงานผล: <strong>Q1, Q2, Q3 หรือ Q4</strong></li>
            <li>
              หากตัวชี้วัดกำหนดระดับการวัดเป็น <strong>&ldquo;ระดับอำเภอ (District)&rdquo;</strong> 
              จะมีตารางแสดงทั้ง 9 อำเภอ ให้กรอกตัวเลขในช่องตัวแปร (เช่น ช่อง A ตัวตั้ง, ช่อง B ตัวหาร)
            </li>
            <li>ระบบจะ <strong>คำนวณผลลัพธ์ (Result) ให้อัตโนมัติทันทีแบบเรียลไทม์</strong> พร้อมแสดงสถานะสีไฟสัญญาณ</li>
            <li>หากเป็นตัวชี้วัดเชิงกระบวนการ ให้เลือกสถานะ (บรรลุ / ไม่บรรลุ) และกรอกข้อความสรุปความก้าวหน้า</li>
            <li>กดปุ่ม <strong>&ldquo;บันทึกผลการประเมิน&rdquo;</strong> ข้อมูลจะถูกอัปเดตไปยังหน้า Dashboard ทันที</li>
          </ol>
        </div>
      )
    },
    {
      id: 'section-10',
      number: '10',
      title: 'แผนปฏิบัติการ 1 ปี (Action Plan รายไตรมาส)',
      category: 'user',
      icon: Calendar,
      summary: 'การแตกเป้าหมายจาก Key Result ประจำปี ลงตารางรายไตรมาส Q1-Q4',
      keywords: ['action plan', 'แผนปฏิบัติการ', 'ไตรมาส', '1 ปี', 'เป้าหมายย่อย', 'แผนงาน'],
      content: (
        <div>
          <p>
            เมนู <strong>แผนปฏิบัติการ 1 ปี (Action Plan)</strong> (<Link href="/editor/action-plan" style={{ color: 'var(--primary)', fontWeight: 600 }}>/editor/action-plan</Link>) 
            คือการนำเป้าหมาย Key Result ประจำปี (เช่น ปี 2570) มากำหนดกิจกรรมและเป้าหมายย่อยลงใน 4 ไตรมาส:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div className="feature-box">
              <strong style={{ color: '#0284c7' }}>ไตรมาส 1 (ต.ค. - ธ.ค.)</strong>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>ขั้นเตรียมการ ประชุมชี้แจง และเริ่มต้นขับเคลื่อนกิจกรรม</p>
            </div>
            <div className="feature-box">
              <strong style={{ color: '#7c3aed' }}>ไตรมาส 2 (ม.ค. - มี.ค.)</strong>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>การดำเนินงานระยะที่ 1 และติดตามผลรอบ 6 เดือน</p>
            </div>
            <div className="feature-box">
              <strong style={{ color: '#059669' }}>ไตรมาส 3 (เม.ย. - มิ.ย.)</strong>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>การดำเนินงานระยะที่ 2 และประเมินความก้าวหน้ารอบ 9 เดือน</p>
            </div>
            <div className="feature-box">
              <strong style={{ color: '#d97706' }}>ไตรมาส 4 (ก.ค. - ก.ย.)</strong>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>การสรุปผล ประเมินผลงานสิ้นปี และถอดบทเรียน</p>
            </div>
          </div>

          <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
            ในแต่ละ Key Result ท่านสามารถกด <strong>&ldquo;+ เพิ่มเป้าหมายไตรมาส&rdquo;</strong> 
            ระบบจะสร้างรหัสแผนปฏิบัติการย่อยอัตโนมัติ เช่น <code>KR1.1.1.1-Q1.1</code> และสามารถแก้ไขหรือลบรายการได้ตามต้องการ
          </p>
        </div>
      )
    },
    {
      id: 'section-11',
      number: '11',
      title: 'การพิมพ์เล่มรายงานทางการ (Print Book) และการส่งออก Excel',
      category: 'general',
      icon: Printer,
      summary: 'การจัดพิมพ์เอกสารรูปเล่ม A4 รองรับ PDF และการดาวน์โหลดข้อมูลเป็นไฟล์ Excel ครบทุกมิติ',
      keywords: ['print', 'พิมพ์', 'pdf', 'excel', 'ส่งออก', 'ดาวน์โหลด', 'รูปเล่ม', 'รายงาน'],
      content: (
        <div>
          <p>
            ระบบรองรับการส่งออกข้อมูลและการจัดพิมพ์รายงานที่เป็นมาตรฐานราชการ 2 ช่องทาง:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div className="feature-box">
              <h4 style={{ color: '#107c41', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Download size={18} /> 1. การดาวน์โหลดไฟล์ Excel
              </h4>
              <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                กดปุ่ม <strong>&ldquo;ดาวน์โหลด Excel&rdquo;</strong> (สีเขียว) จากหน้าแรกหรือหน้า Dashboard 
                ระบบจะดึงโครงสร้างแผนทั้งหมดและแปลงเป็นไฟล์ <code>Strategic_Plan_Export.xlsx</code> 
                ซึ่งรวมทั้ง ประเด็นยุทธศาสตร์, กลยุทธ์, เป้าประสงค์, กิจกรรมริเริ่ม, 
                <strong>How to 5 ระดับ (สสจ., รพ., สสอ., รพ.สต., ภาคี)</strong>, ตัวชี้วัด, เป้าหมาย 5 ปี และแผนปฏิบัติการ 4 ไตรมาสในตารางเดียว
              </p>
            </div>

            <div className="feature-box">
              <h4 style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Printer size={18} /> 2. การพิมพ์เอกสารรูปเล่มทางการ (Print Book)
              </h4>
              <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                ไปที่หน้า <Link href="/print-book" target="_blank" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>/print-book</Link> 
                เพื่อเปิดหน้ารูปเล่มเอกสารทางการ จัดหน้าตามมาตรฐาน A4 มีหน้าปกตราสัญลักษณ์, คำนำ, สารบัญ, 
                สรุปสถิติ, โมเดลบ้านยุทธศาสตร์, SWOT, ตารางโครงสร้างยุทธศาสตร์ และภาคผนวกพจนานุกรมตัวชี้วัด 
                พร้อมสั่งพิมพ์หรือกด Save as PDF ได้ทันที
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'section-12',
      number: '12',
      title: 'การจัดการข้อมูลองค์กร (Core Data) และตรวจสอบคุณภาพแผน (QC Dashboard)',
      category: 'admin',
      icon: Layers,
      summary: 'การกำหนด Vision, Mission, SWOT และระบบตรวจจับข้อมูลที่ยังไม่สมบูรณ์',
      keywords: ['core data', 'vision', 'mission', 'swot', 'qc', 'ตรวจแผน', 'completeness', 'missing'],
      content: (
        <div>
          <p>
            สำหรับผู้ดูแลระบบ (Super Admin) ในการกำหนดทิศทางองค์กรและตรวจสอบความพร้อมของแผน:
          </p>

          <h4 style={{ fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>1. หน้าข้อมูลองค์กร (Core Data):</h4>
          <p style={{ fontSize: '0.9rem' }}>
            ไปที่เมนู <Link href="/editor/core-data" style={{ color: 'var(--primary)', fontWeight: 600 }}>/editor/core-data</Link> 
            เพื่อกรอกวิสัยทัศน์ (Vision), พันธกิจ (Mission), เป้าประสงค์สูงสุด (Ultimate Goal) และ SWOT Matrix 
            โดยสามารถกำหนดแยกตามแต่ละอำเภอได้
          </p>

          <h4 style={{ fontWeight: 700, marginTop: '1.25rem', marginBottom: '0.5rem' }}>2. หน้าตรวจสอบความสมบูรณ์ของแผน (Completeness QC):</h4>
          <p style={{ fontSize: '0.9rem' }}>
            ไปที่เมนู <Link href="/editor/dashboard" style={{ color: 'var(--primary)', fontWeight: 600 }}>/editor/dashboard</Link> 
            ระบบจะมีกล่องแจ้งเตือนความสมบูรณ์ของแผน (QC Status) เพื่อชี้เป้าว่ามีส่วนใดที่ยังกรอกข้อมูลไม่ครบถ้วน:
          </p>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', lineHeight: 1.8 }}>
            <li><strong>Missing Objectives:</strong> กลยุทธ์ที่ยังไม่มีการเพิ่มเป้าประสงค์</li>
            <li><strong>Missing Key Results:</strong> เป้าประสงค์ที่ยังไม่มีตัวชี้วัดความสำเร็จ</li>
            <li><strong>Missing Initiatives:</strong> เป้าประสงค์ที่ยังไม่ได้ระบุกิจกรรมริเริ่ม</li>
            <li><strong>Missing How-To:</strong> เป้าประสงค์ที่ยังกรอกบทบาท 5 ระดับ (สสจ., รพ., สสอ., รพ.สต., ภาคี) ไม่ครบถ้วน</li>
          </ul>
        </div>
      )
    },
    {
      id: 'section-13',
      number: '13',
      title: 'การสำรองและกู้คืนฐานข้อมูล (Backup & Disaster Recovery)',
      category: 'admin',
      icon: Database,
      summary: 'การดาวน์โหลด Snapshot JSON และการกู้คืนข้อมูลอย่างปลอดภัย',
      keywords: ['backup', 'restore', 'สำรอง', 'กู้คืน', 'json', 'ฐานข้อมูล', 'admin', 'disaster'],
      content: (
        <div>
          <p>
            เมนู <strong>สำรอง/กู้คืนข้อมูล (Backup)</strong> (<Link href="/editor/admin" style={{ color: 'var(--primary)', fontWeight: 600 }}>/editor/admin</Link>) 
            สงวนสิทธิ์เฉพาะ <strong>Province Super Admin</strong> เพื่อป้องกันความปลอดภัยของข้อมูล
          </p>

          <div className="grid-2-cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div className="feature-box">
              <h4 style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Download size={18} /> การสำรองข้อมูล (Backup)
              </h4>
              <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                กดปุ่ม <strong>&ldquo;ดาวน์โหลดไฟล์สำรองข้อมูล (Backup JSON)&rdquo;</strong> 
                ระบบจะรวบรวมข้อมูลจาก 8 ตารางหลัก (Core Organization, SWOT, Issues, Strategies, Objectives, Key Results, KPI Dictionaries) 
                แล้วดาวน์โหลดเป็นไฟล์ <code>strategic_backup_YYYY-MM-DD.json</code>
              </p>
            </div>

            <div className="feature-box">
              <h4 style={{ color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <AlertTriangle size={18} /> การกู้คืนข้อมูล (Restore)
              </h4>
              <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                เลือกไฟล์ Backup JSON แล้วกดปุ่มกู้คืนข้อมูล ระบบจะล้างข้อมูลเดิมอย่างปลอดภัยตามลำดับ Foreign Key 
                และนำชุดข้อมูลจากไฟล์สำรองใส่กลับเข้าไปใหม่ตามโครงสร้างเดิม
              </p>
            </div>
          </div>

          <div className="warning-box" style={{ marginTop: '1rem' }}>
            <strong>⚠️ คำเตือนสำคัญ:</strong> การกด Restore ข้อมูล จะเป็นการ <u>เขียนทับข้อมูลปัจจุบันทั้งหมดในระบบ</u> 
            ดังนั้นควรสำรองไฟล์เดิมเก็บไว้ก่อนทำการ Restore เสมอ
          </div>
        </div>
      )
    },
    {
      id: 'section-14',
      number: '14',
      title: 'คำถามที่พบบ่อยและการแก้ไขปัญหา (FAQ & Troubleshooting)',
      category: 'faq',
      icon: HelpCircle,
      summary: 'คำตอบสำหรับข้อสงสัยที่พบบ่อยในการใช้งานระบบ และแนวทางแก้ไขเมื่อเจอปัญหา',
      keywords: ['faq', 'ปัญหา', 'ทำไม', 'error', 'แก้ไข', 'ไม่ขึ้น', 'รออนุมัติ', 'สูตรผิด', 'คำถาม'],
      content: (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="faq-item">
              <h4 style={{ color: 'var(--primary)', fontWeight: 700, margin: '0 0 0.5rem' }}>
                Q1: ลงทะเบียนเสร็จแล้ว ล็อกอินแล้วเจอหน้า &ldquo;รอการอนุมัติ&rdquo; ต้องทำอย่างไร?
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--secondary-foreground)' }}>
                <strong>ตอบ:</strong> เป็นระบบความปลอดภัยของหน่วยงาน บัญชีผู้ใช้ใหม่จะต้องได้รับการอนุมัติสิทธิ์จาก Super Admin ก่อน 
                ให้แจ้งผู้ดูแลระบบของ สสจ. หรือ Super Admin ประจำอำเภอของท่านเพื่อเข้าไปกด <strong>&ldquo;อนุมัติ (Approve)&rdquo;</strong> 
                ที่เมนู <Link href="/editor/users" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>จัดการสิทธิ์ (Users)</Link>
              </p>
            </div>

            <div className="faq-item">
              <h4 style={{ color: 'var(--primary)', fontWeight: 700, margin: '0 0 0.5rem' }}>
                Q2: ทำไมแถบเมนูด้านซ้ายของฉันไม่มีเมนู &ldquo;ตั้งค่าตัวชี้วัด&rdquo; หรือ &ldquo;สำรองข้อมูล&rdquo;?
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--secondary-foreground)' }}>
                <strong>ตอบ:</strong> ระบบจำกัดการมองเห็นเมนูตามระดับสิทธิ์ (Role-Based Access Control) โดยเมนูตั้งค่าตัวชี้วัดและบันทึกผล KPI 
                จะเปิดให้เฉพาะเจ้าหน้าที่ระดับจังหวัด (Province User/Super Admin) ส่วนเมนูสำรองข้อมูลเปิดเฉพาะ Province Super Admin เท่านั้น
              </p>
            </div>

            <div className="faq-item">
              <h4 style={{ color: 'var(--primary)', fontWeight: 700, margin: '0 0 0.5rem' }}>
                Q3: ผลลัพธ์ตัวชี้วัดในหน้าบันทึกผลคำนวณออกมาเป็น 0.00 หรือสูตร Error เกิดจากอะไร?
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--secondary-foreground)' }}>
                <strong>ตอบ:</strong> ตรวจสอบสูตรคำนวณในหน้าตั้งค่าตัวชี้วัด: 
                (1) ตัวพิมพ์ใหญ่-เล็กของตัวแปรต้องตรงกัน เช่น <code>(A/B)*100</code> 
                (2) ตรวจสอบว่าตัวหาร B ไม่เป็น 0 หรือว่างเปล่า 
                (3) หากเป็นตัวชี้วัดเชิงกระบวนการ ให้ตั้งประเภทเป็น &ldquo;กระบวนการ (Process Status)&rdquo; แทนการใช้สูตรร้อยละ
              </p>
            </div>

            <div className="faq-item">
              <h4 style={{ color: 'var(--primary)', fontWeight: 700, margin: '0 0 0.5rem' }}>
                Q4: ถ้าฉันเลื่อนสลับลำดับตัวชี้วัด เลขรหัส (เช่น KR1.1.1.2) จะผิดเพี้ยนหรือไม่?
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--secondary-foreground)' }}>
                <strong>ตอบ:</strong> ไม่เพี้ยนแน่นอนครับ ระบบมีฟังก์ชัน <strong>Cascade Auto-Renumbering</strong> 
                ที่จะคำนวณและจัดเรียงเลขรหัส S, ST, O, KR ให้อัตโนมัติทุกครั้งที่มีการขยับขึ้น/ลง
              </p>
            </div>

            <div className="faq-item">
              <h4 style={{ color: 'var(--primary)', fontWeight: 700, margin: '0 0 0.5rem' }}>
                Q5: สั่งพิมพ์หน้ารูปเล่มเอกสาร (/print-book) แล้วหน้าตกขอบหรือตัดหน้าไม่สวย ควรตั้งค่าอย่างไร?
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--secondary-foreground)' }}>
                <strong>ตอบ:</strong> ในหน้าต่าง Print ของเบราว์เซอร์: 
                (1) เลือก Destination เป็น <strong>Save as PDF</strong> 
                (2) ขนาดกระดาษเลือก <strong>A4</strong> 
                (3) Margins เลือกเป็น <strong>Default หรือ Minimum</strong> 
                (4) ติ๊กถูกที่ช่อง <strong>&ldquo;Background graphics&rdquo;</strong> เพื่อให้สีและธีมของเอกสารแสดงครบถ้วน
              </p>
            </div>
          </div>
        </div>
      )
    }
  ], []);

  // Filter sections by search and category
  const filteredSections = useMemo(() => {
    return sections.filter(sec => {
      const matchCategory = activeCategory === 'all' || sec.category === activeCategory;
      if (!matchCategory) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const matchTitle = sec.title.toLowerCase().includes(q);
      const matchSummary = sec.summary.toLowerCase().includes(q);
      const matchKeywords = sec.keywords.some(k => k.toLowerCase().includes(q));
      return matchTitle || matchSummary || matchKeywords;
    });
  }, [sections, activeCategory, searchTerm]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '5rem' }}>
      {/* Header Banner */}
      <header style={{ 
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', 
        color: 'white', 
        padding: '2.5rem 1.5rem', 
        boxShadow: '0 4px 20px rgba(2, 132, 199, 0.25)' 
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <Link 
              href="/" 
              style={{ 
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
                color: 'rgba(255,255,255,0.9)', textDecoration: 'none', 
                fontSize: '0.875rem', fontWeight: 600,
                backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-md)'
              }}
            >
              <ArrowLeft size={16} /> กลับสู่หน้าแรก (Viewer)
            </Link>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link 
                href="/kpi/dashboard"
                style={{ 
                  backgroundColor: 'white', color: 'var(--primary)', 
                  padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-md)', 
                  fontSize: '0.875rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
                }}
              >
                <BarChart2 size={16} /> แดชบอร์ดตัวชี้วัด
              </Link>
              <Link 
                href="/editor/login"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', 
                  padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-md)', 
                  fontSize: '0.875rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
                }}
              >
                <Lock size={16} /> เข้าสู่ระบบจัดการ
              </Link>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <BookOpen size={36} />
            </div>
            <div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                คู่มือการใช้งานระบบ (System Manual)
              </h1>
              <p style={{ fontSize: '1.05rem', opacity: 0.95, margin: '0.25rem 0 0' }}>
                ระบบบริหารจัดการแผนยุทธศาสตร์สุขภาพและตัวชี้วัด 5 ปี สำนักงานสาธารณสุขจังหวัดสระแก้ว
              </p>
            </div>
          </div>

          {/* Live Search Bar */}
          <div style={{ marginTop: '2rem', position: 'relative', maxWidth: '650px' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="พิมพ์ค้นหาหัวข้อ คำสำคัญ เช่น สูตรคำนวณ, AI, อนุมัติสิทธิ์, Excel, ย้ายตัวชี้วัด..."
              style={{
                width: '100%',
                padding: '0.85rem 2.8rem 0.85rem 3rem',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                fontSize: '1rem',
                color: 'var(--foreground)',
                backgroundColor: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                outline: 'none'
              }}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: '1200px', margin: '2rem auto 0', padding: '0 1.5rem', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Sticky Table of Contents */}
        <aside style={{ position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Category Filter Pills */}
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--secondary-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              หมวดหมู่คู่มือ
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: activeCategory === cat.id ? 600 : 500,
                    backgroundColor: activeCategory === cat.id ? 'var(--primary)' : 'transparent',
                    color: activeCategory === cat.id ? 'white' : 'var(--foreground)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Jump Links */}
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', maxHeight: '60vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--secondary-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              สารบัญด่วน ({filteredSections.length} หัวข้อ)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {filteredSections.map(sec => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => setActiveSectionId(sec.id)}
                  style={{
                    display: 'block',
                    padding: '0.4rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: activeSectionId === sec.id ? 'var(--primary)' : 'var(--secondary-foreground)',
                    fontWeight: activeSectionId === sec.id ? 700 : 500,
                    textDecoration: 'none',
                    lineHeight: 1.4,
                    transition: 'color 0.15s'
                  }}
                >
                  {sec.number}. {sec.title.split('(')[0]}
                </a>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Content Stream */}
        <main>
          {filteredSections.length === 0 ? (
            <div style={{ backgroundColor: 'white', padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <HelpCircle size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)' }}>ไม่พบข้อมูลที่ตรงกับคำค้นหา</h3>
              <p style={{ color: 'var(--secondary-foreground)', marginTop: '0.5rem' }}>
                ลองเปลี่ยนคำค้นหา หรือกดเลือกหมวดหมู่เป็น &ldquo;ทั้งหมด&rdquo;
              </p>
              <button 
                onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}
                className="btn-secondary"
                style={{ marginTop: '1rem' }}
              >
                ล้างการค้นหา
              </button>
            </div>
          ) : (
            filteredSections.map((sec) => {
              const Icon = sec.icon;
              return (
                <section key={sec.id} id={sec.id} className="manual-card">
                  <div className="manual-card-header">
                    <div style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', color: 'var(--primary)', padding: '0.65rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        หมวดที่ {sec.number}
                      </span>
                      <h2>{sec.title}</h2>
                    </div>
                  </div>
                  <div className="manual-card-content">
                    {sec.content}
                  </div>
                </section>
              );
            })
          )}
        </main>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .manual-card {
          background: white;
          border-radius: var(--radius-lg);
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border);
          scroll-margin-top: 2rem;
        }
        .manual-card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }
        .manual-card-header h2 {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--foreground);
          line-height: 1.3;
        }
        .manual-card-content {
          color: var(--foreground);
          line-height: 1.7;
        }
        .manual-card-content p {
          margin-top: 0;
          margin-bottom: 1rem;
        }
        .feature-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: var(--radius-md);
          padding: 1rem 1.25rem;
        }
        .info-box {
          background: #eff6ff;
          border-left: 4px solid var(--primary);
          padding: 1rem 1.25rem;
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
          color: #1e3a8a;
        }
        .tip-box {
          background: #f0fdf4;
          border-left: 4px solid #10b981;
          padding: 1rem 1.25rem;
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
          color: #064e3b;
        }
        .warning-box {
          background: #fef2f2;
          border-left: 4px solid #ef4444;
          padding: 1rem 1.25rem;
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
          color: #7f1d1d;
        }
        .step-card {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 0.85rem 1rem;
          background: #f8fafc;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }
        .step-badge {
          background: var(--primary);
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.5rem;
          border-radius: 99px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .faq-item {
          background: #f8fafc;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 1.25rem;
        }
        .hierarchy-box {
          background: #f8fafc;
          padding: 1.25rem;
          border-radius: var(--radius-md);
          border: 1px solid #e2e8f0;
          margin-top: 1rem;
        }
        .h-item {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.85rem;
        }
        .h-item:last-child {
          margin-bottom: 0;
        }
        .h-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--primary);
          margin-top: 6px;
          flex-shrink: 0;
        }
        .h-content {
          background: white;
          padding: 0.65rem 1rem;
          border-radius: var(--radius-sm);
          border: 1px solid #e2e8f0;
          flex-grow: 1;
        }
        .h-content strong {
          color: var(--foreground);
          display: block;
          margin-bottom: 0.2rem;
          font-size: 0.95rem;
        }
        .h-content p {
          margin: 0 !important;
          font-size: 0.85rem;
          color: var(--secondary-foreground);
        }
        .level-1 { margin-left: 0; }
        .level-1 .h-dot { background: #0284c7; width: 14px; height: 14px; }
        .level-2 { margin-left: 1.5rem; }
        .level-2 .h-dot { background: #0ea5e9; }
        .level-3 { margin-left: 3rem; }
        .level-3 .h-dot { background: #38bdf8; }
        .level-4 { margin-left: 4.5rem; }
        .level-4 .h-dot { background: #7dd3fc; }

        @media (max-width: 900px) {
          div[style*="grid-template-columns: 280px 1fr"] {
            grid-template-columns: 1fr !important;
          }
          aside {
            position: static !important;
          }
        }
      `}} />
    </div>
  );
}

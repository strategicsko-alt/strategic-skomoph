"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, MapPin, ShieldCheck, Target, Activity, CheckCircle2, ChevronRight, Info } from 'lucide-react';

export default function ManualPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '4rem' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '2rem 1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.875rem' }} className="hover:text-white">
            <ArrowLeft size={16} /> กลับสู่หน้าแรก
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <BookOpen size={32} />
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>คู่มือการใช้งานระบบ</h1>
          </div>
          <p style={{ fontSize: '1.125rem', opacity: 0.9, marginTop: '0.5rem', maxWidth: '600px' }}>
            คำแนะนำการใช้งานระบบบริหารจัดการแผนยุทธศาสตร์สุขภาพและแผนปฏิบัติการ 5 ปี จังหวัดสระแก้ว
          </p>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1.5rem' }}>
        
        {/* Section 1: Overview */}
        <section className="manual-card">
          <div className="manual-card-header">
            <MapPin size={24} style={{ color: 'var(--primary)' }} />
            <h2>1. ภาพรวมของระบบ (System Overview)</h2>
          </div>
          <div className="manual-card-content">
            <p>ระบบนี้ออกแบบมาเพื่อบริหารจัดการแผนยุทธศาสตร์ (5 ปี) และแผนปฏิบัติการ (1 ปี) โดยเชื่อมโยงข้อมูลตั้งแต่ระดับจังหวัดจนถึงระดับอำเภอ (9 อำเภอ)</p>
            <ul>
              <li><strong>หน้าแรก (Viewer):</strong> ประชาชนและผู้บริหารสามารถเข้ามาดูแผนและผลการดำเนินงานของจังหวัด หรือเลือกดูเฉพาะของแต่ละอำเภอได้ (ผ่าน Dropdown มุมขวาบน)</li>
              <li><strong>ระบบจัดการ (Editor):</strong> สำหรับเจ้าหน้าที่ผู้รับผิดชอบในการกรอกข้อมูลแผน ตัวชี้วัด และการเบิกจ่ายโครงการ</li>
            </ul>
          </div>
        </section>

        {/* Section 2: Roles */}
        <section className="manual-card">
          <div className="manual-card-header">
            <ShieldCheck size={24} style={{ color: 'var(--primary)' }} />
            <h2>2. การเข้าใช้งานและการจัดการสิทธิ์</h2>
          </div>
          <div className="manual-card-content">
            <p>เจ้าหน้าที่สามารถเข้าสู่ระบบจัดการข้อมูลได้ที่ <Link href="/editor/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>เมนูเข้าสู่ระบบจัดการข้อมูล</Link> โดยจะต้องสมัครสมาชิกและรอการอนุมัติสิทธิ์ก่อน</p>
            
            <div className="info-box">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Info size={16} /> ระดับสิทธิ์ในระบบ (Roles)
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                <li><strong>Super Admin จังหวัด:</strong> จัดการข้อมูลได้ทั้งระดับจังหวัดและทุกอำเภอ รวมถึงอนุมัติสิทธิ์ผู้ใช้งานทั้งหมด</li>
                <li><strong>User จังหวัด:</strong> จัดการข้อมูลได้เฉพาะของจังหวัดสระแก้วเท่านั้น</li>
                <li><strong>Super Admin อำเภอ:</strong> จัดการข้อมูลของอำเภอตนเองได้ทั้งหมด และอนุมัติสิทธิ์ผู้ใช้งานภายในอำเภอ</li>
                <li><strong>User อำเภอ:</strong> จัดการข้อมูลได้เฉพาะของอำเภอที่ตนเองสังกัด</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: Core Data */}
        <section className="manual-card">
          <div className="manual-card-header">
            <Target size={24} style={{ color: 'var(--primary)' }} />
            <h2>3. ข้อมูลองค์กร (Core Data)</h2>
          </div>
          <div className="manual-card-content">
            <p>เป็นส่วนแรกที่ต้องกำหนดทิศทางหลักของหน่วยงาน ประกอบด้วย 4 ส่วนสำคัญ:</p>
            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
              <div className="term-item">
                <span className="term-title">วิสัยทัศน์ (Vision)</span>
                <span>ภาพฝันในอนาคตระยะยาวที่หน่วยงานต้องการไปให้ถึง (เช่น สระแก้ว เมืองสุขภาพดี)</span>
              </div>
              <div className="term-item">
                <span className="term-title">พันธกิจ (Mission)</span>
                <span>หน้าที่หลักและสิ่งที่ต้องทำเพื่อให้บรรลุวิสัยทัศน์ที่ตั้งไว้</span>
              </div>
              <div className="term-item">
                <span className="term-title">เป้าประสงค์สูงสุด (Ultimate Goal)</span>
                <span>ผลลัพธ์สุดท้ายหรือตัวชี้วัดระดับบนสุดที่ต้องการเห็น (เช่น อายุคาดเฉลี่ย)</span>
              </div>
              <div className="term-item">
                <span className="term-title">การวิเคราะห์ SWOT/TOWS</span>
                <span>การวิเคราะห์จุดแข็ง (Strengths), จุดอ่อน (Weaknesses), โอกาส (Opportunities) และอุปสรรค (Threats)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Workshop */}
        <section className="manual-card">
          <div className="manual-card-header">
            <Activity size={24} style={{ color: 'var(--primary)' }} />
            <h2>4. การจัดทำแผนยุทธศาสตร์ (Strategic Plan)</h2>
          </div>
          <div className="manual-card-content">
            <p>โครงสร้างของแผนยุทธศาสตร์จะถูกจัดเรียงเป็นลำดับชั้น (Hierarchy) ดังนี้:</p>
            
            <div className="hierarchy-box">
              <div className="h-item level-1">
                <div className="h-dot"></div>
                <div className="h-content">
                  <strong>ประเด็นยุทธศาสตร์ (Strategic Issues)</strong>
                  <p>หัวข้อการพัฒนาหลัก (เช่น การพัฒนาระบบบริการปฐมภูมิ)</p>
                </div>
              </div>
              <div className="h-item level-2">
                <div className="h-dot"></div>
                <div className="h-content">
                  <strong>ตัวชี้วัดเป้าประสงค์ (Outcome Indicators)</strong>
                  <p>ตัวชี้วัดความสำเร็จของประเด็นยุทธศาสตร์นั้นๆ</p>
                </div>
              </div>
              <div className="h-item level-2">
                <div className="h-dot"></div>
                <div className="h-content">
                  <strong>กลยุทธ์ (Strategies)</strong>
                  <p>วิธีการหรือแนวทางที่จะใช้ขับเคลื่อนประเด็นยุทธศาสตร์</p>
                </div>
              </div>
              <div className="h-item level-3">
                <div className="h-dot"></div>
                <div className="h-content">
                  <strong>เป้าประสงค์ (Objectives)</strong>
                  <p>ผลลัพธ์ที่คาดหวังในระดับกลยุทธ์</p>
                </div>
              </div>
              <div className="h-item level-4">
                <div className="h-dot"></div>
                <div className="h-content">
                  <strong>ผลลัพธ์ที่สำคัญ (Key Results / KPIs)</strong>
                  <p>ตัวชี้วัดเป้าประสงค์แบบรายปี (พ.ศ. 2570-2574) เพื่อวัดว่าทำสำเร็จหรือไม่</p>
                </div>
              </div>
            </div>
            
            <p style={{ marginTop: '1rem' }}><strong>โครงการ (Projects):</strong> ในเมนูนี้คุณสามารถสร้าง "โครงการ" ที่จะมารองรับกลยุทธ์ต่างๆ ได้ด้วย</p>
          </div>
        </section>

        {/* Section 5: KPI Dictionary */}
        <section className="manual-card">
          <div className="manual-card-header">
            <BookOpen size={24} style={{ color: 'var(--primary)' }} />
            <h2>5. พจนานุกรมตัวชี้วัด (KPI Dictionary)</h2>
          </div>
          <div className="manual-card-content">
            <p>เมื่อกำหนด Key Results แล้ว ผู้รับผิดชอบจะต้องมาเขียนรายละเอียดของแต่ละตัวชี้วัด เพื่อให้ทุกคนทำงานบนมาตรฐานเดียวกัน ข้อมูลที่ต้องกรอก เช่น:</p>
            <ul>
              <li><strong>ความหมาย / นิยาม:</strong> อธิบายให้ชัดเจนว่าตัวชี้วัดนี้หมายถึงอะไร</li>
              <li><strong>สูตรคำนวณ:</strong> ระบุ "ตัวตั้ง" (Numerator) และ "ตัวหาร" (Denominator)</li>
              <li><strong>เกณฑ์การเก็บข้อมูล:</strong> เกณฑ์ที่รวม (Inclusion) และ เกณฑ์ที่ตัดออก (Exclusion)</li>
              <li><strong>แหล่งข้อมูล / ระยะเวลา:</strong> เอาข้อมูลมาจากไหน และเก็บถี่แค่ไหน (ความถี่)</li>
            </ul>
          </div>
        </section>

        {/* Section 6: Action Plan */}
        <section className="manual-card">
          <div className="manual-card-header">
            <CheckCircle2 size={24} style={{ color: 'var(--primary)' }} />
            <h2>6. แผนปฏิบัติการ 1 ปี (Action Plan)</h2>
          </div>
          <div className="manual-card-content">
            <p>ส่วนนี้คือการนำ "เป้าหมายประจำปีนั้นๆ" มาแตกย่อยเป็นการดำเนินงานจริงในรอบ 1 ปี:</p>
            <ul>
              <li><strong>การตั้งเป้ารายไตรมาส:</strong> กำหนดเป้าหมาย Q1, Q2, Q3, และ Q4 (สะสมให้ได้ตามเป้าหมายรายปี)</li>
              <li><strong>การบันทึกผลลัพธ์:</strong> กรอกผลงานจริงที่ทำได้ในแต่ละไตรมาส (Actual) ระบบจะคำนวณร้อยละความสำเร็จให้โดยอัตโนมัติ</li>
              <li><strong>การใช้จ่ายงบประมาณ:</strong> สามารถบันทึกงบที่ได้รับ และงบที่เบิกจ่ายจริงในแต่ละช่วงเวลาได้</li>
            </ul>
          </div>
        </section>

      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .manual-card {
          background: white;
          border-radius: var(--radius-lg);
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          border: 1px solid var(--border);
        }
        .manual-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }
        .manual-card-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--foreground);
        }
        .manual-card-content {
          color: var(--secondary-foreground);
          line-height: 1.7;
        }
        .manual-card-content p {
          margin-top: 0;
          margin-bottom: 1rem;
        }
        .manual-card-content ul {
          margin-top: 0;
          padding-left: 1.25rem;
        }
        .manual-card-content li {
          margin-bottom: 0.5rem;
        }
        .info-box {
          background: #eff6ff;
          border-left: 4px solid var(--primary);
          padding: 1rem 1.25rem;
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
          margin-top: 1.5rem;
          color: #1e3a8a;
        }
        .term-item {
          background: #f8fafc;
          padding: 1rem;
          border-radius: var(--radius-md);
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .term-title {
          font-weight: 600;
          color: var(--primary);
          font-size: 1.1rem;
        }
        
        .hierarchy-box {
          margin-top: 1.5rem;
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: var(--radius-md);
          border: 1px solid #e2e8f0;
        }
        .h-item {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          position: relative;
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
          z-index: 2;
        }
        .h-content {
          background: white;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          border: 1px solid #e2e8f0;
          flex-grow: 1;
        }
        .h-content strong {
          color: var(--foreground);
          display: block;
          margin-bottom: 0.25rem;
        }
        .h-content p {
          margin: 0 !important;
          font-size: 0.9rem;
          color: var(--secondary-foreground);
        }
        
        .level-1 { margin-left: 0; }
        .level-1 .h-dot { background: #0284c7; width: 16px; height: 16px; margin-top: 4px; }
        .level-2 { margin-left: 2rem; }
        .level-2 .h-dot { background: #0ea5e9; }
        .level-3 { margin-left: 4rem; }
        .level-3 .h-dot { background: #38bdf8; }
        .level-4 { margin-left: 6rem; }
        .level-4 .h-dot { background: #7dd3fc; }
        
        @media (max-width: 640px) {
          .level-2 { margin-left: 1rem; }
          .level-3 { margin-left: 2rem; }
          .level-4 { margin-left: 3rem; }
        }
      `}} />
    </div>
  );
}

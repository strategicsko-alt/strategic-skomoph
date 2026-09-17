"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HDC_CATEGORIES } from '@/lib/hdc';

export interface HdcAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  newHdcForm: {
    code: string;
    name: string;
    tableName: string;
    year: string;
    mainCategory: string;
    subCategory: string;
    targetOperator: string;
    targetValue: number;
    warningValue?: number;
    resultColumn?: string;
    targetColumn?: string;
  };
  setNewHdcForm: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: () => void;
  handleInspectHdcTable: (tableName: string, year: string) => Promise<void>;
  inspectingHdc: boolean;
  inspectedSchema: {
    tableName: string;
    availableCols: string[];
    sampleRow: Record<string, any>;
  } | null;
}

export function HdcAddModal({
  isOpen,
  onClose,
  newHdcForm,
  setNewHdcForm,
  onSubmit,
  handleInspectHdcTable,
  inspectingHdc,
  inspectedSchema
}: HdcAddModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem',
        overflow: 'hidden',
        overscrollBehavior: 'contain'
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          animation: 'modalFadeIn 0.15s ease-out'
        }}
      >
        {/* Pinned Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.15rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            backgroundColor: '#fff',
            flexShrink: 0
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)' }}>
            ➕ เพิ่มตัวชี้วัด HDC Open Data (ระดับ รพ.สต.)
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b', padding: '0.25rem', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                รหัสตัวชี้วัด
              </label>
              <input
                type="text"
                className="input-field"
                value={newHdcForm.code}
                onChange={(e) => setNewHdcForm({ ...newHdcForm, code: e.target.value })}
                placeholder="เช่น HDC-04"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                ชื่อตัวชี้วัด *
              </label>
              <input
                type="text"
                className="input-field"
                value={newHdcForm.name}
                onChange={(e) => setNewHdcForm({ ...newHdcForm, name: e.target.value })}
                placeholder="เช่น ร้อยละหญิงตั้งครรภ์ฝากครรภ์ครั้งแรกก่อน 12 สัปดาห์"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                ชื่อตาราง HDC (tableName) *
              </label>
              <input
                type="text"
                className="input-field"
                value={newHdcForm.tableName}
                onChange={(e) => setNewHdcForm({ ...newHdcForm, tableName: e.target.value })}
                placeholder="เช่น s_ttm27, s_ncd_dm"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                ปีงบประมาณ (year)
              </label>
              <input
                type="text"
                className="input-field"
                value={newHdcForm.year}
                onChange={(e) => setNewHdcForm({ ...newHdcForm, year: e.target.value })}
                placeholder="2569"
              />
            </div>
          </div>

          {/* หมวดหมู่หลัก และ หมวดหมู่ย่อย */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                หมวดหมู่หลัก *
              </label>
              <select
                className="input-field"
                value={newHdcForm.mainCategory}
                onChange={(e) => {
                  const selectedCat = e.target.value;
                  const firstSub = HDC_CATEGORIES[selectedCat]?.[0] || '';
                  setNewHdcForm({
                    ...newHdcForm,
                    mainCategory: selectedCat,
                    subCategory: firstSub
                  });
                }}
              >
                {Object.keys(HDC_CATEGORIES).map((cat) => (
                  <option key={cat} value={cat}>📁 {cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                หมวดหมู่ย่อย *
              </label>
              <select
                className="input-field"
                value={newHdcForm.subCategory}
                onChange={(e) => setNewHdcForm({ ...newHdcForm, subCategory: e.target.value })}
              >
                {(HDC_CATEGORIES[newHdcForm.mainCategory] || []).map((sub) => (
                  <option key={sub} value={sub}>📂 {sub}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                เครื่องหมาย
              </label>
              <select
                className="input-field"
                value={newHdcForm.targetOperator}
                onChange={(e) => {
                  const op = e.target.value;
                  const curTarget = Number(newHdcForm.targetValue) || 0;
                  const newWarn = op === '<='
                    ? (Math.round(curTarget * 1.3) || (curTarget + 4))
                    : Math.round(curTarget * 0.8);
                  setNewHdcForm({ ...newHdcForm, targetOperator: op, warningValue: newWarn });
                }}
              >
                <option value=">=">&gt;= (มากกว่า ยิ่งมากยิ่งดี)</option>
                <option value="<=">&lt;= (น้อยกว่า ยิ่งน้อยยิ่งดี)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#16a34a' }}>
                {newHdcForm.targetOperator === '<=' ? 'ผ่านเกณฑ์ (<= %) *' : 'ผ่านเกณฑ์ (>= %) *'}
              </label>
              <input
                type="number"
                step="any"
                className="input-field"
                value={newHdcForm.targetValue}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const newWarn = newHdcForm.targetOperator === '<='
                    ? (Math.round(val * 1.3) || (val + 4))
                    : Math.round(val * 0.8);
                  setNewHdcForm({ ...newHdcForm, targetValue: val, warningValue: newWarn });
                }}
                placeholder={newHdcForm.targetOperator === '<=' ? "เช่น 11" : "เช่น 75"}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#ca8a04' }}>
                {newHdcForm.targetOperator === '<=' ? 'เฝ้าระวัง (<= %)' : 'เฝ้าระวัง (>= %)'}
              </label>
              <input
                type="number"
                step="any"
                className="input-field"
                value={newHdcForm.warningValue !== undefined ? newHdcForm.warningValue : (newHdcForm.targetOperator === '<=' ? Math.round(newHdcForm.targetValue * 1.3) : Math.round(newHdcForm.targetValue * 0.8))}
                onChange={(e) => setNewHdcForm({ ...newHdcForm, warningValue: Number(e.target.value) })}
                placeholder={newHdcForm.targetOperator === '<=' ? "เช่น 15" : "เช่น 60"}
              />
            </div>
          </div>

          {/* Color guide explanation badge */}
          <div
            style={{
              fontSize: '0.75rem',
              padding: '0.4rem 0.65rem',
              backgroundColor: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #e2e8f0',
              marginTop: '-0.25rem',
              lineHeight: 1.4
            }}
          >
            {newHdcForm.targetOperator === '<=' ? (
              <div>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>🟢 ผ่านเกณฑ์: ≤ {newHdcForm.targetValue}% (ยิ่งน้อยยิ่งดี)</span>
                {' · '}
                <span style={{ color: '#ca8a04', fontWeight: 700 }}>🟡 เฝ้าระวัง: &gt; {newHdcForm.targetValue}% ถึง ≤ {newHdcForm.warningValue}%</span>
                {' · '}
                <span style={{ color: '#dc2626', fontWeight: 700 }}>🔴 ไม่ผ่านเกณฑ์: &gt; {newHdcForm.warningValue}% (เกินเกณฑ์คือแย่)</span>
              </div>
            ) : (
              <div>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>🟢 ผ่านเกณฑ์: ≥ {newHdcForm.targetValue}%</span>
                {' · '}
                <span style={{ color: '#ca8a04', fontWeight: 700 }}>🟡 เฝ้าระวัง: ≥ {newHdcForm.warningValue}% ถึง &lt; {newHdcForm.targetValue}%</span>
                {' · '}
                <span style={{ color: '#dc2626', fontWeight: 700 }}>🔴 ไม่ผ่านเกณฑ์: &lt; {newHdcForm.warningValue}%</span>
              </div>
            )}
          </div>

          {/* Column Mapping Section */}
          <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                ⚙️ ตั้งค่าคอลัมน์ HDC สำหรับคำนวณ (สูตร: ตัวตั้ง ÷ ตัวหาร × 100)
              </label>
              <button
                type="button"
                onClick={() => handleInspectHdcTable(newHdcForm.tableName, newHdcForm.year)}
                disabled={inspectingHdc}
                style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #0284c7',
                  backgroundColor: '#f0f9ff',
                  color: '#0284c7',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {inspectingHdc ? '⏳ กำลังตรวจ...' : '🔍 ตรวจสอบคอลัมน์จาก HDC'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>
                  คอลัมน์ผลงาน (ตัวตั้ง / Numerator)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={newHdcForm.resultColumn}
                  onChange={e => setNewHdcForm({ ...newHdcForm, resultColumn: e.target.value })}
                  placeholder="auto (เช่น result, result1, result2)"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>
                  คอลัมน์เป้าหมาย (ตัวหาร / Denominator)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={newHdcForm.targetColumn}
                  onChange={e => setNewHdcForm({ ...newHdcForm, targetColumn: e.target.value })}
                  placeholder="target"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                />
              </div>
            </div>

            {/* Inspected schema pills preview */}
            {inspectedSchema && inspectedSchema.tableName === newHdcForm.tableName && (
              <div style={{ marginTop: '0.6rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', padding: '0.6rem' }}>
                <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                  📊 คอลัมน์ที่พบในตาราง HDC (ตัวอย่าง รพ.สต. {inspectedSchema.sampleRow.hospcode}):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.4rem' }}>
                  {inspectedSchema.availableCols.map(col => {
                    const val = inspectedSchema.sampleRow[col];
                    const isRes = newHdcForm.resultColumn === col;
                    const isTar = newHdcForm.targetColumn === col;
                    return (
                      <div
                        key={col}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          border: isRes ? '1.5px solid #2563eb' : isTar ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                          borderRadius: '4px',
                          backgroundColor: isRes ? '#eff6ff' : isTar ? '#f0fdf4' : '#fff',
                          padding: '0.1rem 0.35rem',
                          fontSize: '0.72rem'
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{col}: <strong>{val ?? '-'}</strong></span>
                        <button
                          type="button"
                          onClick={() => setNewHdcForm({ ...newHdcForm, resultColumn: col })}
                          style={{
                            marginLeft: '0.3rem',
                            padding: '0.05rem 0.2rem',
                            borderRadius: '2px',
                            border: 'none',
                            backgroundColor: isRes ? '#2563eb' : '#e2e8f0',
                            color: isRes ? '#fff' : '#334155',
                            cursor: 'pointer',
                            fontSize: '0.65rem',
                            fontWeight: 600
                          }}
                        >
                          ตั้ง
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewHdcForm({ ...newHdcForm, targetColumn: col })}
                          style={{
                            marginLeft: '0.15rem',
                            padding: '0.05rem 0.2rem',
                            borderRadius: '2px',
                            border: 'none',
                            backgroundColor: isTar ? '#16a34a' : '#e2e8f0',
                            color: isTar ? '#fff' : '#334155',
                            cursor: 'pointer',
                            fontSize: '0.65rem',
                            fontWeight: 600
                          }}
                        >
                          หาร
                        </button>
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  const nCol = newHdcForm.resultColumn || 'result';
                  const dCol = newHdcForm.targetColumn || 'target';
                  const nVal = Number(inspectedSchema.sampleRow[nCol]) || 0;
                  const dVal = Number(inspectedSchema.sampleRow[dCol]) || 0;
                  const sPct = dVal > 0 ? Math.round((nVal / dVal) * 1000) / 10 : 0;
                  return (
                    <div style={{ backgroundColor: '#fff', padding: '0.3rem 0.5rem', borderRadius: '3px', border: '1px solid #bbf7d0', color: '#166534', fontSize: '0.73rem' }}>
                      💡 <b>ตัวอย่างผลคำนวณ:</b> ({nCol}: {nVal} ÷ {dCol}: {dVal}) × 100 = <b>{sPct}%</b>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* API Code Preview (Collapsible) */}
          <details style={{ backgroundColor: '#0f172a', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem', color: '#f8fafc', fontSize: '0.75rem', fontFamily: 'monospace' }}>
            <summary style={{ color: '#94a3b8', cursor: 'pointer', outline: 'none' }}>
              // โครงสร้าง Web Service: <span style={{ color: '#38bdf8' }}>{newHdcForm.tableName || 's_ttm27'} ({newHdcForm.year || '2569'})</span>
            </summary>
            <pre style={{ margin: '0.4rem 0 0 0', overflowX: 'auto', whiteSpace: 'pre-wrap', color: '#e2e8f0', fontSize: '0.72rem' }}>
{`{
  "tableName": "${newHdcForm.tableName || 's_ttm27'}",
  "year": "${newHdcForm.year || '2569'}",
  "province": "27",
  "type": "json"
}`}
            </pre>
          </details>
        </div>

        {/* Pinned Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid var(--border)',
            backgroundColor: '#f8fafc',
            flexShrink: 0
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onSubmit}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            บันทึกตัวชี้วัด
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export interface HdcEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingHdcKpi: {
    id: string;
    code: string;
    name: string;
    tableName: string;
    year: string;
    mainCategory: string;
    subCategory: string;
    targetOperator: string;
    targetValue: number;
    warningValue?: number;
    resultColumn?: string;
    targetColumn?: string;
    refetchOnSave: boolean;
  } | null;
  setEditingHdcKpi: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: () => void;
  handleInspectHdcTable: (tableName: string, year: string) => Promise<void>;
  inspectingHdc: boolean;
  inspectedSchema: {
    tableName: string;
    availableCols: string[];
    sampleRow: Record<string, any>;
  } | null;
}

export function HdcEditModal({
  isOpen,
  onClose,
  editingHdcKpi,
  setEditingHdcKpi,
  onSubmit,
  handleInspectHdcTable,
  inspectingHdc,
  inspectedSchema
}: HdcEditModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || !editingHdcKpi) return null;

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem',
        overflow: 'hidden',
        overscrollBehavior: 'contain'
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          animation: 'modalFadeIn 0.15s ease-out'
        }}
      >
        {/* Pinned Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.15rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            backgroundColor: '#fff',
            flexShrink: 0
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)' }}>
            ✏️ แก้ไขตัวชี้วัด HDC Open Data ({editingHdcKpi.code})
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b', padding: '0.25rem', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                รหัสตัวชี้วัด
              </label>
              <input
                type="text"
                className="input-field"
                value={editingHdcKpi.code}
                onChange={(e) => setEditingHdcKpi({ ...editingHdcKpi, code: e.target.value })}
                placeholder="เช่น HDC-01"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                ชื่อตัวชี้วัด *
              </label>
              <input
                type="text"
                className="input-field"
                value={editingHdcKpi.name}
                onChange={(e) => setEditingHdcKpi({ ...editingHdcKpi, name: e.target.value })}
                placeholder="ชื่อตัวชี้วัด"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                ชื่อตาราง HDC (tableName) *
              </label>
              <input
                type="text"
                className="input-field"
                value={editingHdcKpi.tableName}
                onChange={(e) => setEditingHdcKpi({ ...editingHdcKpi, tableName: e.target.value })}
                placeholder="เช่น s_kpi_anc12"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                ปีงบประมาณ (year) *
              </label>
              <select
                className="input-field"
                value={editingHdcKpi.year}
                onChange={(e) => setEditingHdcKpi({ ...editingHdcKpi, year: e.target.value })}
              >
                <option value="2570">ปีงบประมาณ 2570</option>
                <option value="2569">ปีงบประมาณ 2569</option>
                <option value="2568">ปีงบประมาณ 2568</option>
                <option value="2567">ปีงบประมาณ 2567</option>
              </select>
            </div>
          </div>

          {/* หมวดหมู่หลัก และ หมวดหมู่ย่อย */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                หมวดหมู่หลัก *
              </label>
              <select
                className="input-field"
                value={editingHdcKpi.mainCategory || 'ส่งเสริมป้องกัน'}
                onChange={(e) => {
                  const selectedCat = e.target.value;
                  const firstSub = HDC_CATEGORIES[selectedCat]?.[0] || '';
                  setEditingHdcKpi({
                    ...editingHdcKpi,
                    mainCategory: selectedCat,
                    subCategory: firstSub
                  });
                }}
              >
                {Object.keys(HDC_CATEGORIES).map((cat) => (
                  <option key={cat} value={cat}>📁 {cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                หมวดหมู่ย่อย *
              </label>
              <select
                className="input-field"
                value={editingHdcKpi.subCategory || (HDC_CATEGORIES[editingHdcKpi.mainCategory || 'ส่งเสริมป้องกัน']?.[0] || '')}
                onChange={(e) => setEditingHdcKpi({ ...editingHdcKpi, subCategory: e.target.value })}
              >
                {(HDC_CATEGORIES[editingHdcKpi.mainCategory || 'ส่งเสริมป้องกัน'] || []).map((sub) => (
                  <option key={sub} value={sub}>📂 {sub}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                เครื่องหมาย
              </label>
              <select
                className="input-field"
                value={editingHdcKpi.targetOperator}
                onChange={(e) => {
                  const op = e.target.value;
                  const curTarget = Number(editingHdcKpi.targetValue) || 0;
                  const newWarn = op === '<='
                    ? (Math.round(curTarget * 1.3) || (curTarget + 4))
                    : Math.round(curTarget * 0.8);
                  setEditingHdcKpi({ ...editingHdcKpi, targetOperator: op, warningValue: newWarn });
                }}
              >
                <option value=">=">&gt;= (มากกว่า ยิ่งมากยิ่งดี)</option>
                <option value="<=">&lt;= (น้อยกว่า ยิ่งน้อยยิ่งดี)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#16a34a' }}>
                {editingHdcKpi.targetOperator === '<=' ? 'ผ่านเกณฑ์ (<= %) *' : 'ผ่านเกณฑ์ (>= %) *'}
              </label>
              <input
                type="number"
                step="any"
                className="input-field"
                value={editingHdcKpi.targetValue}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const newWarn = editingHdcKpi.targetOperator === '<='
                    ? (Math.round(val * 1.3) || (val + 4))
                    : Math.round(val * 0.8);
                  setEditingHdcKpi({ ...editingHdcKpi, targetValue: val, warningValue: newWarn });
                }}
                placeholder={editingHdcKpi.targetOperator === '<=' ? "เช่น 11" : "เช่น 75"}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#ca8a04' }}>
                {editingHdcKpi.targetOperator === '<=' ? 'เฝ้าระวัง (<= %)' : 'เฝ้าระวัง (>= %)'}
              </label>
              <input
                type="number"
                step="any"
                className="input-field"
                value={editingHdcKpi.warningValue !== undefined ? editingHdcKpi.warningValue : (editingHdcKpi.targetOperator === '<=' ? Math.round(editingHdcKpi.targetValue * 1.3) : Math.round(editingHdcKpi.targetValue * 0.8))}
                onChange={(e) => setEditingHdcKpi({ ...editingHdcKpi, warningValue: Number(e.target.value) })}
                placeholder={editingHdcKpi.targetOperator === '<=' ? "เช่น 15" : "เช่น 60"}
              />
            </div>
          </div>

          {/* Color guide explanation badge */}
          <div
            style={{
              fontSize: '0.75rem',
              padding: '0.4rem 0.65rem',
              backgroundColor: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #e2e8f0',
              marginTop: '-0.25rem',
              lineHeight: 1.4
            }}
          >
            {editingHdcKpi.targetOperator === '<=' ? (
              <div>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>🟢 ผ่านเกณฑ์: ≤ {editingHdcKpi.targetValue}% (ยิ่งน้อยยิ่งดี)</span>
                {' · '}
                <span style={{ color: '#ca8a04', fontWeight: 700 }}>🟡 เฝ้าระวัง: &gt; {editingHdcKpi.targetValue}% ถึง ≤ {editingHdcKpi.warningValue}%</span>
                {' · '}
                <span style={{ color: '#dc2626', fontWeight: 700 }}>🔴 ไม่ผ่านเกณฑ์: &gt; {editingHdcKpi.warningValue}% (เกินเกณฑ์คือแย่)</span>
              </div>
            ) : (
              <div>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>🟢 ผ่านเกณฑ์: ≥ {editingHdcKpi.targetValue}%</span>
                {' · '}
                <span style={{ color: '#ca8a04', fontWeight: 700 }}>🟡 เฝ้าระวัง: ≥ {editingHdcKpi.warningValue}% ถึง &lt; {editingHdcKpi.targetValue}%</span>
                {' · '}
                <span style={{ color: '#dc2626', fontWeight: 700 }}>🔴 ไม่ผ่านเกณฑ์: &lt; {editingHdcKpi.warningValue}%</span>
              </div>
            )}
          </div>

          {/* Column Mapping Section */}
          <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                ⚙️ ตั้งค่าคอลัมน์ HDC สำหรับคำนวณ (สูตร: ตัวตั้ง ÷ ตัวหาร × 100)
              </label>
              <button
                type="button"
                onClick={() => handleInspectHdcTable(editingHdcKpi.tableName, editingHdcKpi.year)}
                disabled={inspectingHdc}
                style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #0284c7',
                  backgroundColor: '#f0f9ff',
                  color: '#0284c7',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {inspectingHdc ? '⏳ กำลังตรวจ...' : '🔍 ตรวจสอบคอลัมน์จาก HDC'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>
                  คอลัมน์ผลงาน (ตัวตั้ง / Numerator)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={editingHdcKpi.resultColumn || ''}
                  onChange={e => setEditingHdcKpi({ ...editingHdcKpi, resultColumn: e.target.value })}
                  placeholder="auto (เช่น result, result1, result2)"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>
                  คอลัมน์เป้าหมาย (ตัวหาร / Denominator)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={editingHdcKpi.targetColumn || 'target'}
                  onChange={e => setEditingHdcKpi({ ...editingHdcKpi, targetColumn: e.target.value })}
                  placeholder="target"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                />
              </div>
            </div>

            {/* Inspected schema pills preview */}
            {inspectedSchema && inspectedSchema.tableName === editingHdcKpi.tableName && (
              <div style={{ marginTop: '0.6rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', padding: '0.6rem' }}>
                <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                  📊 คอลัมน์ที่พบในตาราง HDC (ตัวอย่าง รพ.สต. {inspectedSchema.sampleRow.hospcode}):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.4rem' }}>
                  {inspectedSchema.availableCols.map(col => {
                    const val = inspectedSchema.sampleRow[col];
                    const isRes = editingHdcKpi.resultColumn === col;
                    const isTar = (editingHdcKpi.targetColumn || 'target') === col;
                    return (
                      <div
                        key={col}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          border: isRes ? '1.5px solid #2563eb' : isTar ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                          borderRadius: '4px',
                          backgroundColor: isRes ? '#eff6ff' : isTar ? '#f0fdf4' : '#fff',
                          padding: '0.1rem 0.35rem',
                          fontSize: '0.72rem'
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{col}: <strong>{val ?? '-'}</strong></span>
                        <button
                          type="button"
                          onClick={() => setEditingHdcKpi({ ...editingHdcKpi, resultColumn: col })}
                          style={{
                            marginLeft: '0.3rem',
                            padding: '0.05rem 0.2rem',
                            borderRadius: '2px',
                            border: 'none',
                            backgroundColor: isRes ? '#2563eb' : '#e2e8f0',
                            color: isRes ? '#fff' : '#334155',
                            cursor: 'pointer',
                            fontSize: '0.65rem',
                            fontWeight: 600
                          }}
                        >
                          ตั้ง
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingHdcKpi({ ...editingHdcKpi, targetColumn: col })}
                          style={{
                            marginLeft: '0.15rem',
                            padding: '0.05rem 0.2rem',
                            borderRadius: '2px',
                            border: 'none',
                            backgroundColor: isTar ? '#16a34a' : '#e2e8f0',
                            color: isTar ? '#fff' : '#334155',
                            cursor: 'pointer',
                            fontSize: '0.65rem',
                            fontWeight: 600
                          }}
                        >
                          หาร
                        </button>
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  const nCol = editingHdcKpi.resultColumn || 'result';
                  const dCol = editingHdcKpi.targetColumn || 'target';
                  const nVal = Number(inspectedSchema.sampleRow[nCol]) || 0;
                  const dVal = Number(inspectedSchema.sampleRow[dCol]) || 0;
                  const sPct = dVal > 0 ? Math.round((nVal / dVal) * 1000) / 10 : 0;
                  return (
                    <div style={{ backgroundColor: '#fff', padding: '0.3rem 0.5rem', borderRadius: '3px', border: '1px solid #bbf7d0', color: '#166534', fontSize: '0.73rem' }}>
                      💡 <b>ตัวอย่างผลคำนวณ:</b> ({nCol}: {nVal} ÷ {dCol}: {dVal}) × 100 = <b>{sPct}%</b>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Option Checkbox */}
          <div style={{ backgroundColor: '#f0f9ff', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #bae6fd' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#0369a1', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={editingHdcKpi.refetchOnSave}
                onChange={(e) => setEditingHdcKpi({ ...editingHdcKpi, refetchOnSave: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span>🔄 ดึงข้อมูลผลงานสดจาก HDC ใหม่ทันทีหลังกดบันทึก (แนะนำเมื่อเปลี่ยนชื่อตารางหรือปีงบประมาณ)</span>
            </label>
          </div>
        </div>

        {/* Pinned Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid var(--border)',
            backgroundColor: '#f8fafc',
            flexShrink: 0
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onSubmit}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            บันทึกการแก้ไข
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

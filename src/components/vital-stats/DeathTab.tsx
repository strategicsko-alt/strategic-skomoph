'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { Skull, Filter, Activity, Table, AlertCircle } from 'lucide-react';
import vitalSummaryData from '@/data/vital_stats_summary.json';

interface DeathTabProps {
  districts: string[];
}

const LINE_COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f43f5e', '#6366f1', '#84cc16'
];

export default function DeathTab({ districts }: DeathTabProps) {
  const deathYears = vitalSummaryData.meta.deathYears || [2564, 2565, 2566, 2567, 2568];
  const deathAgeGroups = vitalSummaryData.meta.deathAgeGroups || [];

  const [selectedDistrict, setSelectedDistrict] = useState<string>('รวมทั้งหมด');
  const [selectedGender, setSelectedGender] = useState<string>('รวมทั้งหมด');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('รวมทั้งหมด');

  // Point tracking refs
  const generalPointsRef = useRef<Record<string, { x: number; y: number; year: string; disease: string; value: number; color: string }>>({});
  const cancerPointsRef = useRef<Record<string, { x: number; y: number; year: string; disease: string; value: number; color: string }>>({});

  // Active point state for floating tooltips
  const [activeGeneralPoint, setActiveGeneralPoint] = useState<{ x: number; y: number; year: string; disease: string; value: number; color: string } | null>(null);
  const [activeCancerPoint, setActiveCancerPoint] = useState<{ x: number; y: number; year: string; disease: string; value: number; color: string } | null>(null);

  // Line hover and focus state
  const [hoveredGeneralLine, setHoveredGeneralLine] = useState<string | null>(null);
  const [hoveredCancerLine, setHoveredCancerLine] = useState<string | null>(null);
  const [focusGeneralDisease, setFocusGeneralDisease] = useState<string>('all');
  const [focusCancerDisease, setFocusCancerDisease] = useState<string>('all');

  const deathData = useMemo(() => {
    const distData = (vitalSummaryData.deathCache as any)[selectedDistrict] || (vitalSummaryData.deathCache as any)['รวมทั้งหมด'] || {};
    const gData = distData[selectedGender] || distData['รวมทั้งหมด'] || {};
    const agData = gData[selectedAgeGroup] || gData['รวมทั้งหมด'] || {
      popByYear: {},
      generalTable: [],
      generalDatasets: [],
      cancerTable: [],
      cancerDatasets: []
    };

    // Format general causes chart data
    const generalChartList = deathYears.map((yr, idx) => {
      const point: any = { year: `ปี ${yr}` };
      agData.generalDatasets.forEach((ds: any) => {
        point[ds.label] = ds.data[idx] || 0;
      });
      return point;
    });

    // Format cancer causes chart data
    const cancerChartList = deathYears.map((yr, idx) => {
      const point: any = { year: `ปี ${yr}` };
      agData.cancerDatasets.forEach((ds: any) => {
        point[ds.label] = ds.data[idx] || 0;
      });
      return point;
    });

    return {
      popByYear: agData.popByYear,
      generalTable: agData.generalTable,
      generalDatasets: agData.generalDatasets,
      generalChartList,
      cancerTable: agData.cancerTable,
      cancerDatasets: agData.cancerDatasets,
      cancerChartList
    };
  }, [selectedDistrict, selectedGender, selectedAgeGroup, deathYears]);

  useEffect(() => {
    generalPointsRef.current = {};
    cancerPointsRef.current = {};
    setActiveGeneralPoint(null);
    setActiveCancerPoint(null);
  }, [deathData]);

  const handleGeneralMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let closest = null;
    let minD = 35;

    for (const pt of Object.values(generalPointsRef.current)) {
      const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY);
      if (dist < minD) {
        minD = dist;
        closest = pt;
      }
    }
    setActiveGeneralPoint(closest);
  };

  const handleGeneralMouseLeave = () => {
    setActiveGeneralPoint(null);
    setHoveredGeneralLine(null);
  };

  const handleCancerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let closest = null;
    let minD = 35;

    for (const pt of Object.values(cancerPointsRef.current)) {
      const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY);
      if (dist < minD) {
        minD = dist;
        closest = pt;
      }
    }
    setActiveCancerPoint(closest);
  };

  const handleCancerMouseLeave = () => {
    setActiveCancerPoint(null);
    setHoveredCancerLine(null);
  };

  const renderGeneralDot = (dotProps: any, diseaseName: string, color: string) => {
    const { cx, cy, value, payload } = dotProps;
    if (cx == null || cy == null || value == null || isNaN(Number(value))) return null;

    const key = `${diseaseName}_${payload?.year}`;
    generalPointsRef.current[key] = {
      x: cx,
      y: cy,
      year: payload?.year,
      disease: diseaseName,
      value: Number(value),
      color
    };

    const isActive = activeGeneralPoint && activeGeneralPoint.disease === diseaseName && activeGeneralPoint.year === payload?.year;
    const isLineHovered = (activeGeneralPoint && activeGeneralPoint.disease === diseaseName) || (hoveredGeneralLine === diseaseName) || (focusGeneralDisease === diseaseName);
    const isDimmed = (activeGeneralPoint != null || hoveredGeneralLine != null || focusGeneralDisease !== 'all') && !isLineHovered;

    return (
      <g key={key}>
        <circle
          cx={cx}
          cy={cy}
          r={isActive ? 7 : (isLineHovered ? 5 : 3.5)}
          fill={isActive ? '#ffffff' : color}
          stroke={color}
          strokeWidth={isActive ? 3 : 1}
          opacity={isDimmed ? 0.25 : 1}
          style={{ pointerEvents: 'none', transition: 'all 0.1s ease' }}
        />
      </g>
    );
  };

  const renderCancerDot = (dotProps: any, diseaseName: string, color: string) => {
    const { cx, cy, value, payload } = dotProps;
    if (cx == null || cy == null || value == null || isNaN(Number(value))) return null;

    const key = `${diseaseName}_${payload?.year}`;
    cancerPointsRef.current[key] = {
      x: cx,
      y: cy,
      year: payload?.year,
      disease: diseaseName,
      value: Number(value),
      color
    };

    const isActive = activeCancerPoint && activeCancerPoint.disease === diseaseName && activeCancerPoint.year === payload?.year;
    const isLineHovered = (activeCancerPoint && activeCancerPoint.disease === diseaseName) || (hoveredCancerLine === diseaseName) || (focusCancerDisease === diseaseName);
    const isDimmed = (activeCancerPoint != null || hoveredCancerLine != null || focusCancerDisease !== 'all') && !isLineHovered;

    return (
      <g key={key}>
        <circle
          cx={cx}
          cy={cy}
          r={isActive ? 7 : (isLineHovered ? 5 : 3.5)}
          fill={isActive ? '#ffffff' : color}
          stroke={color}
          strokeWidth={isActive ? 3 : 1}
          opacity={isDimmed ? 0.25 : 1}
          style={{ pointerEvents: 'none', transition: 'all 0.1s ease' }}
        />
      </g>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Filters Bar */}
      <div style={{
        background: '#ffffff',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.85rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="#ef4444" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>ตัวกรองสาเหตุการตาย:</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          {/* District */}
          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="input-field"
              style={{ width: '170px', padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
            >
              <option value="รวมทั้งหมด">อำเภอ: รวมทั้งหมด</option>
              {districts.map(d => (
                <option key={d} value={d}>อำเภอ{d}</option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="input-field"
              style={{ width: '150px', padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
            >
              <option value="รวมทั้งหมด">เพศ: รวมทั้งหมด</option>
              <option value="ชาย">เพศชาย</option>
              <option value="หญิง">เพศหญิง</option>
            </select>
          </div>

          {/* Age Group */}
          <div>
            <select
              value={selectedAgeGroup}
              onChange={(e) => setSelectedAgeGroup(e.target.value)}
              className="input-field"
              style={{ width: '180px', padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
            >
              <option value="รวมทั้งหมด">ช่วงอายุ: รวมทั้งหมด</option>
              {deathAgeGroups.map(ag => (
                <option key={ag} value={ag}>ช่วงอายุ: {ag}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div style={{
        background: '#fff1f2',
        border: '1px solid #fecdd3',
        borderRadius: '0.5rem',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.85rem',
        color: '#9f1239'
      }}>
        <AlertCircle size={16} color="#e11d48" />
        <span>
          อัตราตายคำนวณเป็น <strong>อัตราต่อแสนประชากร (Mortality Rate per 100,000 population)</strong> โดยคำนวณจากฐานประชากรจริงแยกตามปี อำเภอ เพศ และกลุ่มอายุที่เลือก
        </span>
      </div>

      {/* Multi-Line Charts Container */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.25rem' }}>
        {/* General Causes Chart */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                📈 แนวโน้มสาเหตุการตายทั่วไป (ต่อแสนประชากร)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                10 สาเหตุอันดับแรก (โรคมะเร็งนับรวมกัน) — {selectedDistrict}
              </p>
            </div>
            {/* Quick Disease Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>โฟกัสโรค:</span>
              <select
                value={focusGeneralDisease}
                onChange={(e) => setFocusGeneralDisease(e.target.value)}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #cbd5e1',
                  maxWidth: '190px',
                  background: '#f8fafc',
                  color: '#1e293b'
                }}
              >
                <option value="all">แสดงครบ 10 สาเหตุ</option>
                {deathData.generalDatasets.map((ds: any) => (
                  <option key={ds.label} value={ds.label}>{ds.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{ position: 'relative', height: '340px', width: '100%' }}
            onMouseMove={handleGeneralMouseMove}
            onMouseLeave={handleGeneralMouseLeave}
          >
            {/* Custom Isolated Point Tooltip */}
            {activeGeneralPoint && (
              <div
                style={{
                  position: 'absolute',
                  left: activeGeneralPoint.x,
                  top: activeGeneralPoint.y - 12,
                  transform: activeGeneralPoint.y < 110 ? 'translate(-50%, 15px)' : 'translate(-50%, -100%)',
                  background: 'rgba(15, 23, 42, 0.96)',
                  backdropFilter: 'blur(4px)',
                  color: '#ffffff',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  fontSize: '0.8rem',
                  border: `1.5px solid ${activeGeneralPoint.color || '#38bdf8'}`,
                  maxWidth: '300px',
                  pointerEvents: 'none',
                  zIndex: 50,
                  transition: 'left 0.05s ease, top 0.05s ease'
                }}
              >
                <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginBottom: '0.2rem' }}>
                  {activeGeneralPoint.year}
                </div>
                <div style={{ fontWeight: 600, color: activeGeneralPoint.color || '#38bdf8', marginBottom: '0.25rem', lineHeight: 1.35, wordBreak: 'break-word' }}>
                  {activeGeneralPoint.disease}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                  {activeGeneralPoint.value.toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>ต่อแสนประชากร</span>
                </div>
              </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={deathData.generalChartList}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" fontSize={11} stroke="#64748b" />
                <YAxis fontSize={11} stroke="#64748b" tickFormatter={(v) => v.toLocaleString()} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  onMouseEnter={(e: any) => setHoveredGeneralLine(e.dataKey)}
                  onMouseLeave={() => setHoveredGeneralLine(null)}
                />
                {deathData.generalDatasets.map((ds: any, idx: number) => {
                  const activeLine = focusGeneralDisease !== 'all' ? focusGeneralDisease : (activeGeneralPoint?.disease || hoveredGeneralLine);
                  const isCurrent = activeLine === ds.label;
                  const isDimmed = activeLine != null && !isCurrent;
                  const color = LINE_COLORS[idx % LINE_COLORS.length];

                  return (
                    <Line
                      key={ds.label}
                      type="monotone"
                      dataKey={ds.label}
                      stroke={color}
                      strokeWidth={isCurrent ? 3.5 : (isDimmed ? 1.5 : 2.5)}
                      strokeOpacity={isDimmed ? 0.25 : 1}
                      dot={(p: any) => renderGeneralDot(p, ds.label, color)}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cancer In-Depth Chart */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                🔬 เจาะลึกแนวโน้มโรคมะเร็ง (ต่อแสนประชากร)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                10 ชนิดมะเร็งที่มีอัตราตายสูงสุด — {selectedDistrict}
              </p>
            </div>
            {/* Quick Disease Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>โฟกัสโรค:</span>
              <select
                value={focusCancerDisease}
                onChange={(e) => setFocusCancerDisease(e.target.value)}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #cbd5e1',
                  maxWidth: '190px',
                  background: '#f8fafc',
                  color: '#1e293b'
                }}
              >
                <option value="all">แสดงครบ 10 สาเหตุ</option>
                {deathData.cancerDatasets.map((ds: any) => (
                  <option key={ds.label} value={ds.label}>{ds.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{ position: 'relative', height: '340px', width: '100%' }}
            onMouseMove={handleCancerMouseMove}
            onMouseLeave={handleCancerMouseLeave}
          >
            {/* Custom Isolated Point Tooltip */}
            {activeCancerPoint && (
              <div
                style={{
                  position: 'absolute',
                  left: activeCancerPoint.x,
                  top: activeCancerPoint.y - 12,
                  transform: activeCancerPoint.y < 110 ? 'translate(-50%, 15px)' : 'translate(-50%, -100%)',
                  background: 'rgba(15, 23, 42, 0.96)',
                  backdropFilter: 'blur(4px)',
                  color: '#ffffff',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  fontSize: '0.8rem',
                  border: `1.5px solid ${activeCancerPoint.color || '#38bdf8'}`,
                  maxWidth: '300px',
                  pointerEvents: 'none',
                  zIndex: 50,
                  transition: 'left 0.05s ease, top 0.05s ease'
                }}
              >
                <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginBottom: '0.2rem' }}>
                  {activeCancerPoint.year}
                </div>
                <div style={{ fontWeight: 600, color: activeCancerPoint.color || '#38bdf8', marginBottom: '0.25rem', lineHeight: 1.35, wordBreak: 'break-word' }}>
                  {activeCancerPoint.disease}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                  {activeCancerPoint.value.toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>ต่อแสนประชากร</span>
                </div>
              </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={deathData.cancerChartList}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" fontSize={11} stroke="#64748b" />
                <YAxis fontSize={11} stroke="#64748b" tickFormatter={(v) => v.toLocaleString()} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  onMouseEnter={(e: any) => setHoveredCancerLine(e.dataKey)}
                  onMouseLeave={() => setHoveredCancerLine(null)}
                />
                {deathData.cancerDatasets.map((ds: any, idx: number) => {
                  const activeLine = focusCancerDisease !== 'all' ? focusCancerDisease : (activeCancerPoint?.disease || hoveredCancerLine);
                  const isCurrent = activeLine === ds.label;
                  const isDimmed = activeLine != null && !isCurrent;
                  const color = LINE_COLORS[(idx + 3) % LINE_COLORS.length];

                  return (
                    <Line
                      key={ds.label}
                      type="monotone"
                      dataKey={ds.label}
                      stroke={color}
                      strokeWidth={isCurrent ? 3.5 : (isDimmed ? 1.5 : 2.5)}
                      strokeOpacity={isDimmed ? 0.25 : 1}
                      dot={(p: any) => renderCancerDot(p, ds.label, color)}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Matrix Data Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Table size={18} color="#0284c7" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
              ตารางสรุปจำนวนรายและอัตราป่วยตาย (ต่อแสนประชากร) รายปี
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {selectedDistrict !== 'รวมทั้งหมด' ? `อำเภอ${selectedDistrict}` : 'ภาพรวมทั้งจังหวัด'} | เพศ: {selectedGender}
          </span>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '520px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{
                  padding: '0.65rem 0.85rem',
                  borderBottom: '2px solid #cbd5e1',
                  minWidth: '260px',
                  maxWidth: '360px',
                  position: 'sticky',
                  left: 0,
                  background: '#f1f5f9',
                  zIndex: 20
                }}>
                  กลุ่มโรค / สาเหตุการตาย
                </th>
                {deathYears.map(y => (
                  <React.Fragment key={y}>
                    <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderBottom: '2px solid #cbd5e1', borderLeft: '1px solid #e2e8f0', minWidth: '85px' }}>
                      {y} (ราย)
                    </th>
                    <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderBottom: '2px solid #cbd5e1', color: '#0284c7', minWidth: '95px' }}>
                      {y} (ต่อแสน)
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* General Causes Section */}
              <tr style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
                <td
                  colSpan={deathYears.length * 2 + 1}
                  style={{ padding: '0.5rem 0.85rem', fontWeight: 700, color: '#1e40af', position: 'sticky', left: 0 }}
                >
                  📌 กลุ่มสาเหตุการตายทั่วไป
                </td>
              </tr>
              {deathData.generalTable.map((row: any, idx: number) => (
                <tr
                  key={`gen-${idx}`}
                  style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{
                    padding: '0.55rem 0.85rem',
                    fontWeight: 600,
                    color: '#334155',
                    position: 'sticky',
                    left: 0,
                    background: '#ffffff',
                    borderRight: '1px solid #e2e8f0',
                    zIndex: 5
                  }}>
                    {row.name}
                  </td>
                  {deathYears.map(y => (
                    <React.Fragment key={y}>
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', borderLeft: '1px solid #f1f5f9', color: '#64748b' }}>
                        {(row.counts[y] || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', fontWeight: 700, color: '#0284c7' }}>
                        {(row.rates[y] || 0).toFixed(2)}
                      </td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}

              {/* Cancer Section */}
              <tr style={{ background: '#fdf2f8', borderBottom: '1px solid #fbcfe8' }}>
                <td
                  colSpan={deathYears.length * 2 + 1}
                  style={{ padding: '0.5rem 0.85rem', fontWeight: 700, color: '#9d174d', position: 'sticky', left: 0 }}
                >
                  🔬 เจาะลึกเฉพาะกลุ่มโรคมะเร็ง (ICD-10 หมวด C)
                </td>
              </tr>
              {deathData.cancerTable.map((row: any, idx: number) => (
                <tr
                  key={`cancer-${idx}`}
                  style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fdf2f8'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{
                    padding: '0.55rem 0.85rem',
                    fontWeight: 600,
                    color: '#334155',
                    position: 'sticky',
                    left: 0,
                    background: '#ffffff',
                    borderRight: '1px solid #e2e8f0',
                    zIndex: 5
                  }}>
                    {row.name}
                  </td>
                  {deathYears.map(y => (
                    <React.Fragment key={y}>
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', borderLeft: '1px solid #f1f5f9', color: '#64748b' }}>
                        {(row.counts[y] || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', fontWeight: 700, color: '#ec4899' }}>
                        {(row.rates[y] || 0).toFixed(2)}
                      </td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

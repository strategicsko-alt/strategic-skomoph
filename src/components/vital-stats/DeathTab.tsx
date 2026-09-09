'use client';
import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                📈 แนวโน้มสาเหตุการตายทั่วไป (ต่อแสนประชากร)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                10 สาเหตุอันดับแรก (โรคมะเร็งนับรวมกัน) — {selectedDistrict}
              </p>
            </div>
          </div>

          <div style={{ height: '340px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={deathData.generalChartList} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" fontSize={11} stroke="#64748b" />
                <YAxis fontSize={11} stroke="#64748b" tickFormatter={(v) => v.toLocaleString()} />
                <Tooltip formatter={(v: any, name: any) => [`${Number(v).toFixed(2)} ต่อแสน`, name]} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {deathData.generalDatasets.map((ds: any, idx: number) => (
                  <Line
                    key={ds.label}
                    type="monotone"
                    dataKey={ds.label}
                    stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                🔬 เจาะลึกแนวโน้มโรคมะเร็ง (ต่อแสนประชากร)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                10 ชนิดมะเร็งที่มีอัตราตายสูงสุด — {selectedDistrict}
              </p>
            </div>
          </div>

          <div style={{ height: '340px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={deathData.cancerChartList} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" fontSize={11} stroke="#64748b" />
                <YAxis fontSize={11} stroke="#64748b" tickFormatter={(v) => v.toLocaleString()} />
                <Tooltip formatter={(v: any, name: any) => [`${Number(v).toFixed(2)} ต่อแสน`, name]} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {deathData.cancerDatasets.map((ds: any, idx: number) => (
                  <Line
                    key={ds.label}
                    type="monotone"
                    dataKey={ds.label}
                    stroke={LINE_COLORS[(idx + 3) % LINE_COLORS.length]}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
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

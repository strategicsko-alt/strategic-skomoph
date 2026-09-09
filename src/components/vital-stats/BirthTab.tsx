'use client';
import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { Baby, Activity, AlertTriangle, Heart, Calendar, Filter } from 'lucide-react';
import vitalSummaryData from '@/data/vital_stats_summary.json';

interface BirthTabProps {
  districts: string[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#6366f1'];

export default function BirthTab({ districts }: BirthTabProps) {
  const birthYears = vitalSummaryData.meta.birthYears || [2564, 2565, 2566, 2567, 2568];
  const [selectedYear, setSelectedYear] = useState<string>('2568');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('รวมทั้งหมด');
  const [selectedGender, setSelectedGender] = useState<string>('รวมทั้งหมด');

  const birthData = useMemo(() => {
    const yrData = (vitalSummaryData.birthCache as any)[selectedYear] || (vitalSummaryData.birthCache as any)['รวมทั้งหมด'] || {};
    const distData = yrData[selectedDistrict] || yrData['รวมทั้งหมด'] || {};
    const gData = distData[selectedGender] || distData['รวมทั้งหมด'] || {
      totalBirths: 0,
      crudeBirthRate: 0,
      lowWeightCount: 0,
      lowWeightPct: 0,
      teenMotherCount: 0,
      teenMotherPct: 0,
      olderMotherCount: 0,
      olderMotherPct: 0,
      districtComparison: [],
      weightDistribution: [],
      motherAgeDistribution: [],
      yearlyTrend: []
    };

    return gData;
  }, [selectedYear, selectedDistrict, selectedGender]);

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
          <Filter size={18} color="#0284c7" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>ตัวกรองสถิติการเกิด:</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          {/* Year */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="input-field"
              style={{ width: '150px', padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
            >
              <option value="รวมทั้งหมด">ปี: รวมทั้งหมด (5 ปี)</option>
              {birthYears.map(yr => (
                <option key={yr} value={String(yr)}>ปี {yr}</option>
              ))}
            </select>
          </div>

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
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Total Births */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #0284c7',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>เด็กเกิดมีชีพทั้งหมด</span>
            <div style={{ background: '#e0f2fe', padding: '0.4rem', borderRadius: '0.5rem' }}>
              <Baby size={18} color="#0284c7" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0369a1', marginTop: '0.5rem' }}>
            {birthData.totalBirths.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#64748b' }}>คน</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            {selectedYear === 'รวมทั้งหมด' ? 'สะสม 5 ปี (2564-2568)' : `ปี พ.ศ. ${selectedYear}`}
          </div>
        </div>

        {/* Crude Birth Rate */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #10b981',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>อัตราเกิดอย่างหยาบ (CBR)</span>
            <div style={{ background: '#ecfdf5', padding: '0.4rem', borderRadius: '0.5rem' }}>
              <Activity size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#047857', marginTop: '0.5rem' }}>
            {birthData.crudeBirthRate.toFixed(2)} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#64748b' }}>ต่อพัน ปชก.</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            คำนวณเปรียบเทียบฐานประชากรจริง
          </div>
        </div>

        {/* Low Birth Weight */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #f59e0b',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>น้ำหนักแรกเกิด &lt; 2,500g</span>
            <div style={{ background: '#fef3c7', padding: '0.4rem', borderRadius: '0.5rem' }}>
              <AlertTriangle size={18} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#b45309', marginTop: '0.5rem' }}>
            {birthData.lowWeightCount.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#64748b' }}>คน ({birthData.lowWeightPct}%)</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: birthData.lowWeightPct > 8 ? '#b45309' : '#047857', marginTop: '0.25rem' }}>
            {birthData.lowWeightPct > 8 ? '⚠️ สูงกว่าเกณฑ์เฝ้าระวัง 8%' : '✓ อยู่ในเกณฑ์มาตรฐาน'}
          </div>
        </div>

        {/* Teenage Pregnancy */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #ec4899',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>มารดาวัยรุ่น (&lt; 20 ปี)</span>
            <div style={{ background: '#fdf2f8', padding: '0.4rem', borderRadius: '0.5rem' }}>
              <Heart size={18} color="#ec4899" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#be185d', marginTop: '0.5rem' }}>
            {birthData.teenMotherCount.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#64748b' }}>คน ({birthData.teenMotherPct}%)</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            มารดาอายุ 35 ปีขึ้นไป: {birthData.olderMotherCount.toLocaleString()} คน ({birthData.olderMotherPct}%)
          </div>
        </div>
      </div>

      {/* Grid of Visualizations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.25rem' }}>
        {/* Trend of Births across 2564-2568 */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
            📈 แนวโน้มจำนวนเกิดมีชีพรายปี (2564 - 2568)
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
            {selectedDistrict !== 'รวมทั้งหมด' ? `อำเภอ${selectedDistrict}` : 'ภาพรวมทั้งจังหวัดสระแก้ว'}
          </p>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={birthData.yearlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" fontSize={11} stroke="#64748b" tickFormatter={(v) => `ปี ${v}`} />
                <YAxis fontSize={11} stroke="#64748b" tickFormatter={(v) => v.toLocaleString()} />
                <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} คน`, 'จำนวนเกิดมีชีพ']} />
                <Line type="monotone" dataKey="count" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* District Comparison */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
            🏢 จำนวนการเกิดเปรียบเทียบรายอำเภอ
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
            {selectedYear === 'รวมทั้งหมด' ? 'สะสมปี 2564 - 2568' : `ปี พ.ศ. ${selectedYear}`}
          </p>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={birthData.districtComparison} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="district" fontSize={10} stroke="#64748b" angle={-30} textAnchor="end" interval={0} />
                <YAxis fontSize={11} stroke="#64748b" tickFormatter={(v) => v.toLocaleString()} />
                <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} คน`, 'จำนวนเกิด']} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {birthData.districtComparison.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mother's Age Distribution */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
            👩 สัดส่วนการเกิดตามกลุ่มอายุมารดา
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
            การกระจายตามช่วงวัยของมารดา (วัยรุ่น, เจริญพันธุ์, สูงวัย)
          </p>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={birthData.motherAgeDistribution} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" fontSize={11} stroke="#64748b" tickFormatter={(v) => v.toLocaleString()} />
                <YAxis type="category" dataKey="label" fontSize={11} stroke="#64748b" width={110} />
                <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} คน`, 'จำนวน']} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                  <Cell fill="#ec4899" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f59e0b" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Birth Weight Distribution */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
            ⚖️ การกระจายน้ำหนักแรกเกิดของทารก
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
            สัดส่วนทารกน้ำหนักน้อย (&lt;2,500g), ปกติ, และน้ำหนักมาก (&gt;4,000g)
          </p>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={birthData.weightDistribution} layout="vertical" margin={{ top: 10, right: 30, left: 50, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" fontSize={11} stroke="#64748b" tickFormatter={(v) => v.toLocaleString()} />
                <YAxis type="category" dataKey="label" fontSize={11} stroke="#64748b" width={120} />
                <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} คน`, 'จำนวน']} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]}>
                  <Cell fill="#ef4444" />
                  <Cell fill="#10b981" />
                  <Cell fill="#6366f1" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

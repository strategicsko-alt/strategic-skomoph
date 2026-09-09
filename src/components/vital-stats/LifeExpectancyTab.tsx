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
import { Clock, Filter, Table, Info, User, UserCheck, HeartPulse, ShieldAlert } from 'lucide-react';
import vitalSummaryData from '@/data/vital_stats_summary.json';

interface LifeExpectancyTabProps {
  districts: string[];
}

const SingleLeTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length > 0) {
    const item = payload[0];
    if (!item || item.value === undefined || item.value === null) return null;
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#ffffff',
        padding: '0.5rem 0.75rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
        fontSize: '0.8rem',
        border: `1px solid ${item.color || '#8b5cf6'}`,
        maxWidth: '300px',
        pointerEvents: 'none'
      }}>
        <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginBottom: '0.2rem' }}>
          {label}
        </div>
        <div style={{ fontWeight: 600, color: item.color || '#38bdf8', marginBottom: '0.25rem' }}>
          {item.name}
        </div>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
          {Number(item.value).toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>ปี</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function LifeExpectancyTab({ districts }: LifeExpectancyTabProps) {
  const deathYears = vitalSummaryData.meta.deathYears || [2564, 2565, 2566, 2567, 2568];
  const [selectedDistrict, setSelectedDistrict] = useState<string>('รวมทั้งหมด');
  const [selectedGender, setSelectedGender] = useState<'รวม' | 'ชาย' | 'หญิง'>('รวม');
  const [selectedTableYear, setSelectedTableYear] = useState<number>(2568);
  const [chartMode, setChartMode] = useState<'hale_compare' | 'by_gender_e0' | 'by_gender_hale' | 'all'>('hale_compare');
  const [showFullTable, setShowFullTable] = useState<boolean>(false);

  const leData = useMemo(() => {
    const distData = (vitalSummaryData.leCache as any)[selectedDistrict] || (vitalSummaryData.leCache as any)['รวมทั้งหมด'] || {
      years: deathYears,
      trends: { 'รวม': [], 'ชาย': [], 'หญิง': [] },
      haleTrends: { 'รวม': [], 'ชาย': [], 'หญิง': [] },
      tableDetail: {}
    };

    const chartList = distData.years.map((yr: number, idx: number) => ({
      year: `ปี ${yr}`,
      e0_total: distData.trends['รวม'] ? distData.trends['รวม'][idx] : 0,
      e0_male: distData.trends['ชาย'] ? distData.trends['ชาย'][idx] : 0,
      e0_female: distData.trends['หญิง'] ? distData.trends['หญิง'][idx] : 0,
      hale_total: distData.haleTrends && distData.haleTrends['รวม'] ? distData.haleTrends['รวม'][idx] : 0,
      hale_male: distData.haleTrends && distData.haleTrends['ชาย'] ? distData.haleTrends['ชาย'][idx] : 0,
      hale_female: distData.haleTrends && distData.haleTrends['หญิง'] ? distData.haleTrends['หญิง'][idx] : 0,
    }));

    // Current latest year (2568) values
    const latestIdx = distData.years.indexOf(2568);
    const currTotal = latestIdx >= 0 && distData.trends['รวม'] ? distData.trends['รวม'][latestIdx] : 0;
    const currMale = latestIdx >= 0 && distData.trends['ชาย'] ? distData.trends['ชาย'][latestIdx] : 0;
    const currFemale = latestIdx >= 0 && distData.trends['หญิง'] ? distData.trends['หญิง'][latestIdx] : 0;

    const currHaleTotal = latestIdx >= 0 && distData.haleTrends && distData.haleTrends['รวม'] ? distData.haleTrends['รวม'][latestIdx] : 0;
    const currHaleMale = latestIdx >= 0 && distData.haleTrends && distData.haleTrends['ชาย'] ? distData.haleTrends['ชาย'][latestIdx] : 0;
    const currHaleFemale = latestIdx >= 0 && distData.haleTrends && distData.haleTrends['หญิง'] ? distData.haleTrends['หญิง'][latestIdx] : 0;

    const unhealthyYears = Math.max(0, currTotal - currHaleTotal);
    const healthyRatio = currTotal > 0 ? ((currHaleTotal / currTotal) * 100).toFixed(1) : '0';

    // Table rows for selected table year & gender
    const tableRows = (distData.tableDetail[selectedTableYear] && distData.tableDetail[selectedTableYear][selectedGender]) || [];

    return {
      chartList,
      currTotal,
      currMale,
      currFemale,
      currHaleTotal,
      currHaleMale,
      currHaleFemale,
      unhealthyYears,
      healthyRatio,
      tableRows
    };
  }, [selectedDistrict, selectedGender, selectedTableYear, deathYears]);

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
          <Filter size={18} color="#8b5cf6" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>
            ตัวกรองอายุคาดเฉลี่ย (Life Expectancy) & สุขภาวะ (HALE):
          </span>
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
              onChange={(e) => setSelectedGender(e.target.value as any)}
              className="input-field"
              style={{ width: '150px', padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
            >
              <option value="รวม">เพศ: รวมทั้งหมด</option>
              <option value="ชาย">เพศชาย</option>
              <option value="หญิง">เพศหญิง</option>
            </select>
          </div>

          {/* Table Year */}
          <div>
            <select
              value={selectedTableYear}
              onChange={(e) => setSelectedTableYear(parseInt(e.target.value))}
              className="input-field"
              style={{ width: '135px', padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
            >
              {deathYears.map(yr => (
                <option key={yr} value={yr}>ตารางชีพปี {yr}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards for e0 & HALE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* Total e0 */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #8b5cf6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
              อายุคาดเฉลี่ยแรกเกิด (e₀)
            </span>
            <div style={{ background: '#f5f3ff', padding: '0.4rem', borderRadius: '0.5rem' }}>
              <Clock size={18} color="#8b5cf6" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#6d28d9', marginTop: '0.5rem' }}>
            {leData.currTotal.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 400, color: '#64748b' }}>ปี</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Chiang's Method (ปี 2568) — {selectedDistrict}
          </div>
        </div>

        {/* HALE Total */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #10b981',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
              อายุคาดเฉลี่ยสุขภาวะ (HALE₀)
            </span>
            <div style={{ background: '#ecfdf5', padding: '0.4rem', borderRadius: '0.5rem' }}>
              <HeartPulse size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#059669', marginTop: '0.5rem' }}>
            {leData.currHaleTotal.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 400, color: '#64748b' }}>ปี</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '0.25rem', fontWeight: 500 }}>
            คิดเป็น {leData.healthyRatio}% ของช่วงชีวิตที่มีสุขภาพดี
          </div>
        </div>

        {/* Unhealthy Years (Gap: e0 - HALE) */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #f59e0b',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
              ปีสุขภาวะที่สูญเสียไป (e₀ - HALE)
            </span>
            <div style={{ background: '#fffbeb', padding: '0.4rem', borderRadius: '0.5rem' }}>
              <ShieldAlert size={18} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#d97706', marginTop: '0.5rem' }}>
            {leData.unhealthyYears.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 400, color: '#64748b' }}>ปี</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: '0.25rem' }}>
            ระยะเวลาที่ใช้ชีวิตพร้อมภาวะเจ็บป่วย/ทุพพลภาพ
          </div>
        </div>

        {/* Male vs Female Comparison */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #3b82f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
              เปรียบเทียบเพศ (ชาย vs หญิง)
            </span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <User size={16} color="#3b82f6" />
              <UserCheck size={16} color="#ec4899" />
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: '#3b82f6', fontWeight: 600 }}>👨 ชาย:</span>
              <span>e₀ <b>{leData.currMale.toFixed(2)}</b> | HALE <b>{leData.currHaleMale.toFixed(2)}</b> ปี</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: '#ec4899', fontWeight: 600 }}>👩 หญิง:</span>
              <span>e₀ <b>{leData.currFemale.toFixed(2)}</b> | HALE <b>{leData.currHaleFemale.toFixed(2)}</b> ปี</span>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
            หญิงอายุยืนกว่าชาย +{(leData.currFemale - leData.currMale).toFixed(2)} ปี
          </div>
        </div>
      </div>

      {/* Life Expectancy & HALE Trend Chart */}
      <div style={{
        background: '#ffffff',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
              ⏳ แนวโน้มอายุคาดเฉลี่ย (e₀) และอายุคาดเฉลี่ยสุขภาวะ (HALE) รายปี (2564 - 2568)
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
              เปรียบเทียบช่วงชีวิตทั้งหมดกับช่วงชีวิตที่มีสุขภาพดี (ปี พ.ศ. 2564 - 2568) — {selectedDistrict !== 'รวมทั้งหมด' ? `อำเภอ${selectedDistrict}` : 'ภาพรวมทั้งจังหวัดสระแก้ว'}
            </p>
          </div>

          {/* Chart View Modes */}
          <div style={{ display: 'flex', gap: '0.35rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
            <button
              onClick={() => setChartMode('hale_compare')}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: chartMode === 'hale_compare' ? 700 : 500,
                borderRadius: '0.375rem',
                border: 'none',
                background: chartMode === 'hale_compare' ? '#ffffff' : 'transparent',
                color: chartMode === 'hale_compare' ? '#1e293b' : '#64748b',
                boxShadow: chartMode === 'hale_compare' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer'
              }}
            >
              🌱 เปรียบเทียบ e₀ vs HALE
            </button>
            <button
              onClick={() => setChartMode('by_gender_e0')}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: chartMode === 'by_gender_e0' ? 700 : 500,
                borderRadius: '0.375rem',
                border: 'none',
                background: chartMode === 'by_gender_e0' ? '#ffffff' : 'transparent',
                color: chartMode === 'by_gender_e0' ? '#1e293b' : '#64748b',
                boxShadow: chartMode === 'by_gender_e0' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer'
              }}
            >
              👥 e₀ ตามเพศ
            </button>
            <button
              onClick={() => setChartMode('by_gender_hale')}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: chartMode === 'by_gender_hale' ? 700 : 500,
                borderRadius: '0.375rem',
                border: 'none',
                background: chartMode === 'by_gender_hale' ? '#ffffff' : 'transparent',
                color: chartMode === 'by_gender_hale' ? '#1e293b' : '#64748b',
                boxShadow: chartMode === 'by_gender_hale' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer'
              }}
            >
              💚 HALE ตามเพศ
            </button>
            <button
              onClick={() => setChartMode('all')}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: chartMode === 'all' ? 700 : 500,
                borderRadius: '0.375rem',
                border: 'none',
                background: chartMode === 'all' ? '#ffffff' : 'transparent',
                color: chartMode === 'all' ? '#1e293b' : '#64748b',
                boxShadow: chartMode === 'all' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer'
              }}
            >
              📊 ทุกเส้น
            </button>
          </div>
        </div>

        <div style={{ height: '360px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={leData.chartList} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" fontSize={11} stroke="#64748b" />
              <YAxis fontSize={11} stroke="#64748b" domain={['dataMin - 3', 'dataMax + 3']} tickFormatter={(v) => `${v} ปี`} />
              <Tooltip shared={false} content={<SingleLeTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

              {(chartMode === 'hale_compare' || chartMode === 'all') && (
                <>
                  <Line
                    type="monotone"
                    dataKey="e0_total"
                    name="อายุคาดเฉลี่ย e₀ (รวม)"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hale_total"
                    name="อายุคาดเฉลี่ยสุขภาวะ HALE (รวม)"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </>
              )}

              {(chartMode === 'by_gender_e0' || chartMode === 'all') && (
                <>
                  {chartMode === 'by_gender_e0' && (
                    <Line
                      type="monotone"
                      dataKey="e0_total"
                      name="e₀ (รวม)"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="e0_male"
                    name="e₀ เพศชาย"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                    strokeDasharray={chartMode === 'all' ? '4 4' : undefined}
                  />
                  <Line
                    type="monotone"
                    dataKey="e0_female"
                    name="e₀ เพศหญิง"
                    stroke="#ec4899"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                    strokeDasharray={chartMode === 'all' ? '4 4' : undefined}
                  />
                </>
              )}

              {(chartMode === 'by_gender_hale' || chartMode === 'all') && (
                <>
                  {chartMode === 'by_gender_hale' && (
                    <Line
                      type="monotone"
                      dataKey="hale_total"
                      name="HALE (รวม)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="hale_male"
                    name="HALE เพศชาย"
                    stroke="#0284c7"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                    strokeDasharray="2 2"
                  />
                  <Line
                    type="monotone"
                    dataKey="hale_female"
                    name="HALE เพศหญิง"
                    stroke="#d946ef"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                    strokeDasharray="2 2"
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Info Box explaining Sullivan & Chiang */}
        <div style={{
          marginTop: '1.25rem',
          padding: '1rem 1.25rem',
          background: '#f8fafc',
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Info size={16} color="#8b5cf6" />
              <span>ระเบียบวิธีทางระบาดวิทยาและคณิตศาสตร์ประชากร (Methodology)</span>
            </div>
            <button
              onClick={() => setShowFullTable(!showFullTable)}
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#6d28d9',
                background: '#f5f3ff',
                border: '1px solid #ddd6fe',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            >
              {showFullTable ? 'ซ่อนตารางชีพเชิงลึก (Abridged Life Table)' : '📊 แสดงตารางชีพเชิงลึก (Abridged Life Table)'}
            </button>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 0.35rem 0' }}>
              • <b>อายุคาดเฉลี่ยเมื่อแรกเกิด (Life Expectancy: e₀)</b> คำนวณด้วยวิธี <b>Chiang's Abridged Life Table</b> แบ่งประชากรเป็น 17 ช่วงอายุ (0-4, 5-9, ..., 80+) จากจำนวนตายและประชากรจริงในพื้นที่ (Radix l₀ = 100,000)
            </p>
            <p style={{ margin: '0 0 0.35rem 0' }}>
              • <b>อายุคาดเฉลี่ยของการมีสุขภาพดี (Healthy Life Expectancy: HALE₀)</b> คำนวณด้วยวิธี <b>Sullivan's Method</b> โดยนำปีบุคคล (Lₓ) ของแต่ละช่วงอายุมาปรับลดด้วยค่าน้ำหนักความพิการ/ทุพพลภาพ (Disability Weights: d_w) จากโครงการศึกษาภาระโรคแห่งชาติ (Burden of Disease: BOD Thailand / IHPP กระทรวงสาธารณสุข)
            </p>
            <p style={{ margin: 0, color: '#64748b' }}>
              💡 <i>หมายเหตุ: ในระบบเดิม (GAS/Excel) มีเฉพาะตาราง e₀ จากมรณบัตรและทะเบียนราษฎร์ ซึ่งยังไม่มีการสำรวจภาวะความพิการรายบุคคล เมื่อผสานวิธี Sullivan's Method ร่วมกับค่ามาตรฐานภาระโรคของไทย จึงสามารถประมาณการ HALE ได้อย่างสมบูรณ์และแม่นยำตามหลักระบาดวิทยาสากล</i>
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Abridged Life Table */}
      {showFullTable && (
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                📋 ตารางชีพแบบย่อและสุขภาวะ (Abridged Life & Health Table) ปี {selectedTableYear} — {selectedDistrict} ({selectedGender})
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                แสดงขั้นตอนการคำนวณพารามิเตอร์ตารางชีพ 17 ช่วงอายุ และ Sullivan's HALE
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '0.65rem 0.5rem', textAlign: 'left' }}>กลุ่มอายุ (x)</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>ประชากร (Pₓ)</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>คนตาย (Dₓ)</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>อัตราตาย (Mₓ)</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>โอกาสตาย (qₓ)</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>ผู้รอดชีวิต (lₓ)</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>คนตายในตาราง (dₓ)</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>ปีบุคคล (Lₓ)</th>
                  <th style={{ padding: '0.65rem 0.5rem', color: '#059669', fontWeight: 600 }}>ทุพพลภาพ (d_w)</th>
                  <th style={{ padding: '0.65rem 0.5rem', color: '#6d28d9', fontWeight: 700 }}>อายุขัยเฉลี่ย (eₓ)</th>
                  <th style={{ padding: '0.65rem 0.5rem', color: '#059669', fontWeight: 700 }}>สุขภาวะ (HALEₓ)</th>
                </tr>
              </thead>
              <tbody>
                {leData.tableRows.map((r: any, idx: number) => (
                  <tr
                    key={`lt-${idx}`}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: idx === 0 ? '#f5f3ff' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '0.55rem 0.5rem', textAlign: 'left', fontWeight: idx === 0 ? 700 : 500 }}>
                      {r.ageGroup} {idx === 0 ? '(วัยแรกเกิด)' : ''}
                    </td>
                    <td style={{ padding: '0.55rem 0.5rem', color: '#64748b' }}>{r.P ? r.P.toLocaleString() : 0}</td>
                    <td style={{ padding: '0.55rem 0.5rem', color: '#64748b' }}>{r.D ? r.D.toLocaleString() : 0}</td>
                    <td style={{ padding: '0.55rem 0.5rem' }}>{r.M}</td>
                    <td style={{ padding: '0.55rem 0.5rem' }}>{r.q}</td>
                    <td style={{ padding: '0.55rem 0.5rem', fontWeight: 600 }}>{r.l ? r.l.toLocaleString() : 0}</td>
                    <td style={{ padding: '0.55rem 0.5rem' }}>{r.d ? r.d.toLocaleString() : 0}</td>
                    <td style={{ padding: '0.55rem 0.5rem' }}>{r.L ? r.L.toLocaleString() : 0}</td>
                    <td style={{ padding: '0.55rem 0.5rem', color: '#059669' }}>
                      {r.disabilityWeight !== undefined ? `${(r.disabilityWeight * 100).toFixed(1)}%` : '-'}
                    </td>
                    <td style={{ padding: '0.55rem 0.5rem', fontWeight: 700, color: '#6d28d9' }}>
                      {r.e} ปี
                    </td>
                    <td style={{ padding: '0.55rem 0.5rem', fontWeight: 700, color: '#059669' }}>
                      {r.hale !== undefined ? `${r.hale} ปี` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

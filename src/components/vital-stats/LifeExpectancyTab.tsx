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
import { Clock, Filter, Table, Info, Award, User, UserCheck } from 'lucide-react';
import vitalSummaryData from '@/data/vital_stats_summary.json';

interface LifeExpectancyTabProps {
  districts: string[];
}

export default function LifeExpectancyTab({ districts }: LifeExpectancyTabProps) {
  const deathYears = vitalSummaryData.meta.deathYears || [2564, 2565, 2566, 2567, 2568];
  const [selectedDistrict, setSelectedDistrict] = useState<string>('รวมทั้งหมด');
  const [selectedGender, setSelectedGender] = useState<'รวม' | 'ชาย' | 'หญิง'>('รวม');
  const [selectedTableYear, setSelectedTableYear] = useState<number>(2568);
  const [showFullTable, setShowFullTable] = useState<boolean>(false);

  const leData = useMemo(() => {
    const distData = (vitalSummaryData.leCache as any)[selectedDistrict] || (vitalSummaryData.leCache as any)['รวมทั้งหมด'] || {
      years: deathYears,
      trends: { 'รวม': [], 'ชาย': [], 'หญิง': [] },
      tableDetail: {}
    };

    const chartList = distData.years.map((yr: number, idx: number) => ({
      year: `ปี ${yr}`,
      total: distData.trends['รวม'] ? distData.trends['รวม'][idx] : 0,
      male: distData.trends['ชาย'] ? distData.trends['ชาย'][idx] : 0,
      female: distData.trends['หญิง'] ? distData.trends['หญิง'][idx] : 0
    }));

    // Current latest year (2568) values
    const latestIdx = distData.years.indexOf(2568);
    const currTotal = latestIdx >= 0 && distData.trends['รวม'] ? distData.trends['รวม'][latestIdx] : 0;
    const currMale = latestIdx >= 0 && distData.trends['ชาย'] ? distData.trends['ชาย'][latestIdx] : 0;
    const currFemale = latestIdx >= 0 && distData.trends['หญิง'] ? distData.trends['หญิง'][latestIdx] : 0;

    // Table rows for selected table year & gender
    const tableRows = (distData.tableDetail[selectedTableYear] && distData.tableDetail[selectedTableYear][selectedGender]) || [];

    return {
      chartList,
      currTotal,
      currMale,
      currFemale,
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
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>ตัวกรองอายุคาดเฉลี่ย (Life Expectancy):</span>
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
              style={{ width: '130px', padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
            >
              {deathYears.map(yr => (
                <option key={yr} value={yr}>ตารางชีพปี {yr}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards for e0 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* Male e0 */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #3b82f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>อายุคาดเฉลี่ยแรกเกิด (ชาย)</span>
            <div style={{ background: '#eff6ff', padding: '0.4rem', borderRadius: '0.5rem' }}>
              <User size={18} color="#3b82f6" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1d4ed8', marginTop: '0.5rem' }}>
            {leData.currMale.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 400, color: '#64748b' }}>ปี</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            ปี พ.ศ. 2568 ({selectedDistrict})
          </div>
        </div>

        {/* Female e0 */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #ec4899',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>อายุคาดเฉลี่ยแรกเกิด (หญิง)</span>
            <div style={{ background: '#fdf2f8', padding: '0.4rem', borderRadius: '0.5rem' }}>
              <UserCheck size={18} color="#ec4899" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#be185d', marginTop: '0.5rem' }}>
            {leData.currFemale.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 400, color: '#64748b' }}>ปี</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            สูงกว่าเพศชาย +{(leData.currFemale - leData.currMale).toFixed(2)} ปี
          </div>
        </div>

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
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>อายุคาดเฉลี่ยแรกเกิด (รวมทั้งหมด)</span>
            <div style={{ background: '#f5f3ff', padding: '0.4rem', borderRadius: '0.5rem' }}>
              <Clock size={18} color="#8b5cf6" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#6d28d9', marginTop: '0.5rem' }}>
            {leData.currTotal.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 400, color: '#64748b' }}>ปี</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Chiang's Abridged Life Table (ปี 2568)
          </div>
        </div>
      </div>

      {/* Life Expectancy Trend Chart */}
      <div style={{
        background: '#ffffff',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
              ⏳ แนวโน้มอายุคาดเฉลี่ยเมื่อแรกเกิด ($e_0$) รายปี (2564 - 2568)
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
              วิธี Abridged Life Table (Chiang's Method) — {selectedDistrict !== 'รวมทั้งหมด' ? `อำเภอ${selectedDistrict}` : 'ภาพรวมทั้งจังหวัดสระแก้ว'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '12px', height: '12px', background: '#8b5cf6', borderRadius: '50%', display: 'inline-block' }}></span>
              <span>รวมทั้งหมด</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '50%', display: 'inline-block' }}></span>
              <span>ชาย</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '12px', height: '12px', background: '#ec4899', borderRadius: '50%', display: 'inline-block' }}></span>
              <span>หญิง</span>
            </div>
          </div>
        </div>

        <div style={{ height: '340px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={leData.chartList} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" fontSize={11} stroke="#64748b" />
              <YAxis fontSize={11} stroke="#64748b" domain={['dataMin - 2', 'dataMax + 2']} tickFormatter={(v) => `${v} ปี`} />
              <Tooltip formatter={(v: any, name: any) => [`${Number(v).toFixed(2)} ปี`, name === 'total' ? 'รวมทั้งหมด' : (name === 'male' ? 'ชาย' : 'หญิง')]} />
              <Line type="monotone" dataKey="total" name="total" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="male" name="male" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="female" name="female" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 3 }} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          background: '#f8fafc',
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Info size={15} color="#8b5cf6" />
            <span>
              * การคำนวณแบ่งช่วงอายุเป็น 17 ช่วงมาตรฐาน (0-4, 5-9, ..., 80+) ตามสูตร Chiang's Method (radix $l_0 = 100,000$)
            </span>
          </div>
          <button
            onClick={() => setShowFullTable(!showFullTable)}
            style={{
              padding: '0.35rem 0.75rem',
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
                📋 ตารางชีพแบบย่อ (Abridged Life Table) ปี {selectedTableYear} — {selectedDistrict} ({selectedGender})
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                แสดงขั้นตอนการคำนวณพารามิเตอร์ตารางชีพ 17 ช่วงอายุ
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '0.65rem 0.5rem', textAlign: 'left' }}>กลุ่มอายุ ($x$)</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>ประชากร ($P_x$)</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>คนตาย ($D_x$)</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>อัตราตาย ($M_x$)</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>โอกาสตาย ($q_x$)</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>ผู้รอดชีวิต ($l_x$)</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>คนตายในตาราง ($d_x$)</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>ปีบุคคล ($L_x$)</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>ปีสะสม ($T_x$)</th>
                  <th style={{ padding: '0.65rem 0.5rem', color: '#6d28d9', fontWeight: 700 }}>อายุขัยเฉลี่ย ($e_x$)</th>
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
                      {r.ageGroup} {idx === 0 ? '(วัยแรกเกิด e0)' : ''}
                    </td>
                    <td style={{ padding: '0.55rem 0.5rem', color: '#64748b' }}>{r.P.toLocaleString()}</td>
                    <td style={{ padding: '0.55rem 0.5rem', color: '#64748b' }}>{r.D.toLocaleString()}</td>
                    <td style={{ padding: '0.55rem 0.5rem' }}>{r.M}</td>
                    <td style={{ padding: '0.55rem 0.5rem' }}>{r.q}</td>
                    <td style={{ padding: '0.55rem 0.5rem', fontWeight: 600 }}>{r.l.toLocaleString()}</td>
                    <td style={{ padding: '0.55rem 0.5rem' }}>{r.d.toLocaleString()}</td>
                    <td style={{ padding: '0.55rem 0.5rem' }}>{r.L.toLocaleString()}</td>
                    <td style={{ padding: '0.55rem 0.5rem' }}>{r.T.toLocaleString()}</td>
                    <td style={{ padding: '0.55rem 0.5rem', fontWeight: 700, color: '#6d28d9' }}>
                      {r.e} ปี
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

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
  ReferenceLine
} from 'recharts';
import { Users, User, UserCheck, TrendingUp, Filter } from 'lucide-react';
import vitalSummaryData from '@/data/vital_stats_summary.json';

interface PopulationTabProps {
  districts: string[];
}

export default function PopulationTab({ districts }: PopulationTabProps) {
  const availableYears = vitalSummaryData.meta.availableYears || [2568];
  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] || 2568);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('รวมทั้งหมด');
  const [selectedType, setSelectedType] = useState<string>('รวมทั้งหมด');
  const [selectedFormat, setSelectedFormat] = useState<'กลุ่มอายุ' | 'รายปี'>('กลุ่มอายุ');

  // Retrieve Pyramid data
  const pyramidData = useMemo(() => {
    const yrData = (vitalSummaryData.popPyramids as any)[selectedYear] || {};
    const distData = yrData[selectedDistrict] || yrData['รวมทั้งหมด'] || {};
    const typeData = distData[selectedType] || distData['รวมทั้งหมด'] || {
      summary: { male: 0, female: 0, total: 0 },
      grouped: { labels: [], male: [], female: [], maleCounts: [], femaleCounts: [] },
      single: { labels: [], male: [], female: [] }
    };

    const isGrouped = selectedFormat === 'กลุ่มอายุ';
    const chartList = [];

    if (isGrouped) {
      const g = typeData.grouped;
      for (let i = 0; i < g.labels.length; i++) {
        chartList.push({
          label: g.labels[i],
          male: -Math.abs(g.male[i] || 0), // Negative for left side
          female: Math.abs(g.female[i] || 0),
          maleCount: g.maleCounts[i] || 0,
          femaleCount: g.femaleCounts[i] || 0
        });
      }
    } else {
      const s = typeData.single;
      for (let i = 0; i < s.labels.length; i++) {
        chartList.push({
          label: s.labels[i],
          male: -Math.abs(s.male[i] || 0),
          female: Math.abs(s.female[i] || 0),
          maleCount: s.male[i] || 0,
          femaleCount: s.female[i] || 0
        });
      }
    }

    return {
      summary: typeData.summary,
      chartList,
      isGrouped
    };
  }, [selectedYear, selectedDistrict, selectedType, selectedFormat]);

  // Retrieve Trend data
  const trendData = useMemo(() => {
    const distTrends = (vitalSummaryData.popTrends as any)[selectedDistrict] || (vitalSummaryData.popTrends as any)['รวมทั้งหมด'] || {};
    const typeTrends = distTrends[selectedType] || distTrends['รวมทั้งหมด'] || {
      years: [],
      male: [],
      female: [],
      total: []
    };

    const list = [];
    for (let i = 0; i < typeTrends.years.length; i++) {
      list.push({
        year: `ปี ${typeTrends.years[i]}`,
        male: typeTrends.male[i] || 0,
        female: typeTrends.female[i] || 0,
        total: typeTrends.total[i] || 0
      });
    }
    return list;
  }, [selectedDistrict, selectedType]);

  const oldestYear = availableYears[availableYears.length - 1];
  const newestYear = availableYears[0];

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
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>ตัวกรองสถิติประชากร:</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          {/* Year */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input-field"
              style={{ width: '130px', padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr}>ปี {yr}</option>
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

          {/* Nationality */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-field"
              style={{ width: '170px', padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
            >
              <option value="รวมทั้งหมด">กลุ่ม: รวมทั้งหมด</option>
              <option value="สัญชาติไทย">กลุ่ม: สัญชาติไทย</option>
              <option value="ไม่ใช่สัญชาติไทย">กลุ่ม: ไม่ใช่สัญชาติไทย</option>
            </select>
          </div>

          {/* Format */}
          <div>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as any)}
              className="input-field"
              style={{ width: '150px', padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
            >
              <option value="กลุ่มอายุ">รูปแบบ: กลุ่มอายุ (5 ปี)</option>
              <option value="รายปี">รูปแบบ: รายปี (0-100+)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* Male Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #3b82f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>รวมประชากรชาย</span>
            <div style={{ background: '#eff6ff', padding: '0.4rem', borderRadius: '0.5rem' }}>
              <User size={18} color="#3b82f6" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1d4ed8', marginTop: '0.5rem' }}>
            {pyramidData.summary.male.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#64748b' }}>คน</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            สัดส่วน {pyramidData.summary.total > 0 ? ((pyramidData.summary.male / pyramidData.summary.total) * 100).toFixed(1) : 0}% ของประชากร
          </div>
        </div>

        {/* Female Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #ec4899',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>รวมประชากรหญิง</span>
            <div style={{ background: '#fdf2f8', padding: '0.4rem', borderRadius: '0.5rem' }}>
              <UserCheck size={18} color="#ec4899" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#be185d', marginTop: '0.5rem' }}>
            {pyramidData.summary.female.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#64748b' }}>คน</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            สัดส่วน {pyramidData.summary.total > 0 ? ((pyramidData.summary.female / pyramidData.summary.total) * 100).toFixed(1) : 0}% ของประชากร
          </div>
        </div>

        {/* Total Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #10b981',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>รวมประชากรทั้งหมด</span>
            <div style={{ background: '#ecfdf5', padding: '0.4rem', borderRadius: '0.5rem' }}>
              <Users size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#047857', marginTop: '0.5rem' }}>
            {pyramidData.summary.total.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#64748b' }}>คน</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            ปี พ.ศ. {selectedYear} {selectedDistrict !== 'รวมทั้งหมด' ? `(${selectedDistrict})` : '(ทั้งจังหวัด)'}
          </div>
        </div>
      </div>

      {/* Population Pyramid */}
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
              📊 พีระมิดประชากร (Population Pyramid) ปี {selectedYear}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
              {selectedDistrict !== 'รวมทั้งหมด' ? `อำเภอ${selectedDistrict}` : 'ภาพรวมทั้งจังหวัดสระแก้ว'} — กลุ่ม: {selectedType} ({selectedFormat})
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '2px', display: 'inline-block' }}></span>
              <span>ชาย ({pyramidData.isGrouped ? '% สัดส่วน' : 'จำนวนคน'})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '12px', height: '12px', background: '#ec4899', borderRadius: '2px', display: 'inline-block' }}></span>
              <span>หญิง ({pyramidData.isGrouped ? '% สัดส่วน' : 'จำนวนคน'})</span>
            </div>
          </div>
        </div>

        <div style={{ height: selectedFormat === 'รายปี' ? '650px' : '450px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={pyramidData.chartList}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 30, bottom: 20 }}
              stackOffset="sign"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis
                type="number"
                tickFormatter={(val) => Math.abs(val) + (pyramidData.isGrouped ? '%' : '')}
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis
                type="category"
                dataKey="label"
                reversed={true}
                stroke="#64748b"
                fontSize={11}
                width={75}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const maleVal = payload[0]?.payload?.maleCount || 0;
                    const femaleVal = payload[0]?.payload?.femaleCount || 0;
                    const mPct = payload[0]?.payload?.male ? Math.abs(payload[0].payload.male) : 0;
                    const fPct = payload[0]?.payload?.female ? Math.abs(payload[0].payload.female) : 0;

                    return (
                      <div style={{ background: '#1e293b', color: '#ffffff', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600, borderBottom: '1px solid #334155', paddingBottom: '0.35rem', marginBottom: '0.35rem' }}>
                          ช่วงอายุ: {label}
                        </div>
                        <div style={{ color: '#93c5fd', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                          <span>ชาย:</span>
                          <span style={{ fontWeight: 600 }}>{maleVal.toLocaleString()} คน {pyramidData.isGrouped ? `(${mPct.toFixed(2)}%)` : ''}</span>
                        </div>
                        <div style={{ color: '#f472b6', display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '0.2rem' }}>
                          <span>หญิง:</span>
                          <span style={{ fontWeight: 600 }}>{femaleVal.toLocaleString()} คน {pyramidData.isGrouped ? `(${fPct.toFixed(2)}%)` : ''}</span>
                        </div>
                        <div style={{ color: '#cbd5e1', borderTop: '1px solid #334155', paddingTop: '0.25rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>รวม:</span>
                          <span style={{ fontWeight: 600 }}>{(maleVal + femaleVal).toLocaleString()} คน</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1.5} />
              <Bar dataKey="male" name="ชาย" fill="#3b82f6" stackId="pyramid" radius={[3, 0, 0, 3]} />
              <Bar dataKey="female" name="หญิง" fill="#ec4899" stackId="pyramid" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Population Trends Over 11 Years (2558 - 2568) */}
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
              📈 แนวโน้มจำนวนประชากรย้อนหลัง ({oldestYear} - {newestYear})
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
              {selectedDistrict !== 'รวมทั้งหมด' ? `อำเภอ${selectedDistrict}` : 'ภาพรวมทั้งจังหวัดสระแก้ว'} — กลุ่ม: {selectedType}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Total Trend */}
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#047857', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
              แนวโน้มประชากรรวมทั้งหมด (คน)
            </div>
            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" fontSize={11} stroke="#64748b" />
                  <YAxis fontSize={11} stroke="#64748b" tickFormatter={(v) => v.toLocaleString()} domain={['dataMin - 1000', 'dataMax + 1000']} />
                  <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} คน`, 'รวมทั้งหมด']} />
                  <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Male Trend */}
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1d4ed8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '50%', display: 'inline-block' }}></span>
              แนวโน้มประชากรชาย (คน)
            </div>
            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" fontSize={11} stroke="#64748b" />
                  <YAxis fontSize={11} stroke="#64748b" tickFormatter={(v) => v.toLocaleString()} domain={['dataMin - 500', 'dataMax + 500']} />
                  <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} คน`, 'ชาย']} />
                  <Line type="monotone" dataKey="male" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Female Trend */}
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#be185d', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', background: '#ec4899', borderRadius: '50%', display: 'inline-block' }}></span>
              แนวโน้มประชากรหญิง (คน)
            </div>
            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" fontSize={11} stroke="#64748b" />
                  <YAxis fontSize={11} stroke="#64748b" tickFormatter={(v) => v.toLocaleString()} domain={['dataMin - 500', 'dataMax + 500']} />
                  <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} คน`, 'หญิง']} />
                  <Line type="monotone" dataKey="female" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

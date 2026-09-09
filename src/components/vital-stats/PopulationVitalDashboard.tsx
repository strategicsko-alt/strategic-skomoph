'use client';
import React, { useState } from 'react';
import { Users, Baby, Skull, Clock, Database, ExternalLink, ShieldCheck } from 'lucide-react';
import PopulationTab from './PopulationTab';
import BirthTab from './BirthTab';
import DeathTab from './DeathTab';
import LifeExpectancyTab from './LifeExpectancyTab';
import vitalSummaryData from '@/data/vital_stats_summary.json';

const DISTRICTS = [
  "เมืองสระแก้ว", "คลองหาด", "ตาพระยา", "วังน้ำเย็น",
  "วัฒนานคร", "อรัญประเทศ", "เขาฉกรรจ์", "โคกสูง", "วังสมบูรณ์"
];

export default function PopulationVitalDashboard() {
  const [subTab, setSubTab] = useState<'pop' | 'birth' | 'death' | 'le'>('pop');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Sub-navigation Menu */}
      <div style={{
        background: '#ffffff',
        borderRadius: '0.75rem',
        padding: '0.5rem',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.04)'
      }}>
        <button
          onClick={() => setSubTab('pop')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.1rem',
            borderRadius: '0.5rem',
            fontWeight: subTab === 'pop' ? 700 : 500,
            fontSize: '0.9rem',
            color: subTab === 'pop' ? '#ffffff' : '#475569',
            backgroundColor: subTab === 'pop' ? '#0284c7' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Users size={17} />
          <span>ข้อมูลประชากร (Population)</span>
        </button>

        <button
          onClick={() => setSubTab('birth')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.1rem',
            borderRadius: '0.5rem',
            fontWeight: subTab === 'birth' ? 700 : 500,
            fontSize: '0.9rem',
            color: subTab === 'birth' ? '#ffffff' : '#475569',
            backgroundColor: subTab === 'birth' ? '#10b981' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Baby size={17} />
          <span>ข้อมูลการเกิด (Birth Statistics)</span>
        </button>

        <button
          onClick={() => setSubTab('death')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.1rem',
            borderRadius: '0.5rem',
            fontWeight: subTab === 'death' ? 700 : 500,
            fontSize: '0.9rem',
            color: subTab === 'death' ? '#ffffff' : '#475569',
            backgroundColor: subTab === 'death' ? '#ef4444' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Skull size={17} />
          <span>สาเหตุการตาย (Mortality & Cause of Death)</span>
        </button>

        <button
          onClick={() => setSubTab('le')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.1rem',
            borderRadius: '0.5rem',
            fontWeight: subTab === 'le' ? 700 : 500,
            fontSize: '0.9rem',
            color: subTab === 'le' ? '#ffffff' : '#475569',
            backgroundColor: subTab === 'le' ? '#8b5cf6' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Clock size={17} />
          <span>อายุคาดเฉลี่ยและสุขภาวะ (LE: e₀ & HALE)</span>
        </button>
      </div>

      {/* Sub-tab Content Views */}
      {subTab === 'pop' && <PopulationTab districts={DISTRICTS} />}
      {subTab === 'birth' && <BirthTab districts={DISTRICTS} />}
      {subTab === 'death' && <DeathTab districts={DISTRICTS} />}
      {subTab === 'le' && <LifeExpectancyTab districts={DISTRICTS} />}

      {/* Footer & Official Data Source Citations */}
      <div style={{
        background: '#ffffff',
        borderRadius: '0.75rem',
        padding: '1.25rem 1.5rem',
        border: '1px solid #e2e8f0',
        marginTop: '0.5rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontWeight: 600, fontSize: '0.95rem' }}>
          <Database size={18} color="#0284c7" />
          <span>แหล่งที่มาและการอ้างอิงข้อมูล (Data Source Citations & References)</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '0.85rem',
          fontSize: '0.85rem',
          color: '#475569'
        }}>
          {/* Population & Birth Source */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem'
          }}>
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>🏛️</span>
            <div>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>
                ข้อมูลสถิติประชากร และข้อมูลการเกิด
              </div>
              <div style={{ marginTop: '0.2rem', color: '#64748b' }}>
                {vitalSummaryData.meta.citations.population}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '0.25rem' }}>
                ครอบคลุมประชากรรายอายุ 18 สำนักทะเบียนใน 9 อำเภอ จังหวัดสระแก้ว
              </div>
            </div>
          </div>

          {/* Death Source */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem'
          }}>
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>🏥</span>
            <div>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>
                ข้อมูลสถิติสาเหตุการตาย และอายุคาดเฉลี่ย ($e_0$)
              </div>
              <div style={{ marginTop: '0.2rem', color: '#64748b' }}>
                {vitalSummaryData.meta.citations.death}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
                จำแนกตามรหัส ICD-10 และกลุ่มโรค 103 กลุ่มมาตรฐานกระทรวงสาธารณสุข
              </div>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '0.75rem',
          fontSize: '0.78rem',
          color: '#94a3b8',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>ระบบบูรณาการฐานข้อมูลสถิติชีพ สำนักงานสาธารณสุขจังหวัดสระแก้ว (Strategic SKO)</span>
          </div>
          <div>
            ตารางฐานข้อมูล: <code>dopa_populations</code> | <code>dopa_deaths</code> | <code>dopa_births</code>
          </div>
        </div>
      </div>
    </div>
  );
}

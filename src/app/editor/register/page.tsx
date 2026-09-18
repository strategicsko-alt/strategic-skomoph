"use client";

import { useState, useEffect } from 'react';
import { register } from './actions';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, UserPlus, Loader2 } from 'lucide-react';

const WORK_GROUPS = [
  "คุ้มครองผู้บริโภคและเภสัชสาธารณสุข",
  "บริหารทรัพยากรบุคคล",
  "กลุ่มกฎหมาย",
  "พัฒนายุทธศาสตร์สาธารณสุข",
  "สุขภาพดิจิทัล",
  "คุ้มครองผู้บริโภค",
  "พัฒนาคุณภาพและรูปแบบบริการ",
  "ควบคุมโรคติดต่อ",
  "ประกันสุขภาพ",
  "ส่งเสริมสุขภาพ",
  "ทันตสาธารณสุข",
  "บริหารทั่วไป",
  "อนามัยสิ่งแวดล้อมและอาชีวอนามัย",
  "ควบคุมโรคไม่ติดต่อ",
  "ปฐมภูมิและเครือข่ายสุขภาพ",
  "การแพทย์แผนไทยและการแพทย์ทางเลือก",
  "พัฒนาทรัพยากรบุคคล"
];

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [districtId, setDistrictId] = useState('');
  const [role, setRole] = useState('district_user'); // Default role
  const [workGroup, setWorkGroup] = useState('');
  
  const [districts, setDistricts] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch districts for dropdown
    const fetchDistricts = async () => {
      try {
        const { data, error } = await supabase.from('districts').select('*').order('name');
        if (data) {
          setDistricts(data);
          if (data.length > 0) setDistrictId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load districts", err);
      }
    };
    fetchDistricts();
  }, []);

  const selectedDistrict = districts.find(d => d.id === districtId);
  const isProvince = selectedDistrict?.type === 'province' || role.includes('province');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isProvince && !workGroup) {
      setError('กรุณาเลือกกลุ่มงานสำหรับผู้ใช้งานระดับจังหวัด');
      return;
    }

    if (password.trim().length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('email', email.trim().toLowerCase());
      formData.append('password', password.trim());
      formData.append('district_id', districtId);
      formData.append('work_group', isProvince ? workGroup : '');
      
      // Determine role based on selected district
      let assignedRole = role;
      
      if (selectedDistrict && selectedDistrict.type === 'province') {
         // If they select the province, force role to province_user (super admin should be granted manually)
         assignedRole = 'province_user';
         if (role === 'district_super_admin') assignedRole = 'province_super_admin'; // Allow asking for super admin
      } else {
         if (role === 'province_super_admin' || role === 'province_user') {
            assignedRole = 'district_user'; // Fallback
         }
      }
      
      formData.append('role', assignedRole);

      const res = await register(formData);
      if (res?.error) {
        setError(res.error);
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--secondary)', padding: '1.5rem 1rem' }}>
      <div className="card" style={{ maxWidth: '520px', width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'inline-flex', padding: '0.75rem', backgroundColor: '#e0f2fe', borderRadius: '50%', color: 'var(--primary)', marginBottom: '0.75rem' }}>
          <UserPlus size={28} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem', color: 'var(--primary)' }}>ลงทะเบียนผู้ใช้งาน</h1>
        <p style={{ marginBottom: '1.5rem', color: 'var(--secondary-foreground)', fontSize: '0.9rem' }}>สร้างบัญชีผู้ใช้งานระบบ Strategic SKO</p>
        
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ textAlign: 'left' }}>
              <label htmlFor="firstName" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.875rem' }}>
                ชื่อ (ภาษาไทย)
              </label>
              <input 
                type="text" 
                id="firstName"
                placeholder="เช่น สมชาย"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input-field" 
                required
                style={{ width: '100%', padding: '0.7rem 0.85rem' }}
              />
            </div>
            <div style={{ textAlign: 'left' }}>
              <label htmlFor="lastName" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.875rem' }}>
                นามสกุล (ภาษาไทย)
              </label>
              <input 
                type="text" 
                id="lastName"
                placeholder="เช่น ใจดี"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input-field" 
                required
                style={{ width: '100%', padding: '0.7rem 0.85rem' }}
              />
            </div>
          </div>
          <p style={{ textAlign: 'left', fontSize: '0.75rem', color: 'var(--secondary-foreground)', marginTop: '-0.5rem', marginBottom: '0.1rem' }}>
            💡 กรุณากรอกชื่อ-นามสกุลเป็น <strong>ภาษาไทย</strong> เพื่อความถูกต้องในการแสดงผลในระบบ
          </p>

          <div style={{ textAlign: 'left' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.875rem' }}>
              อีเมล (Username สำหรับเข้าสู่ระบบ)
            </label>
            <input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field" 
              placeholder="example@gmail.com"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              required
              style={{ width: '100%', padding: '0.7rem 0.85rem' }}
            />
            <small style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
              * ระบบจะบันทึกเป็นตัวพิมพ์เล็กเสมอเพื่อป้องกันปัญหาล็อกอิน
            </small>
          </div>

          <div style={{ textAlign: 'left' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.875rem' }}>
              รหัสผ่าน
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field" 
                placeholder="ความยาวอย่างน้อย 6 ตัวอักษร"
                required
                style={{ width: '100%', padding: '0.7rem 2.75rem 0.7rem 0.85rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                style={{
                  position: 'absolute',
                  right: '0.65rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--secondary-foreground)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <label htmlFor="district" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.875rem' }}>
              หน่วยงานต้นสังกัด
            </label>
            <select 
              id="district"
              value={districtId}
              onChange={(e) => setDistrictId(e.target.value)}
              className="input-field"
              required
              style={{ width: '100%', padding: '0.7rem 0.85rem' }}
            >
              {districts.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          
          <div style={{ textAlign: 'left' }}>
            <label htmlFor="role" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.875rem' }}>
              ระดับสิทธิ์ที่ต้องการขอ
            </label>
            <select 
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input-field"
              required
              style={{ width: '100%', padding: '0.7rem 0.85rem' }}
            >
              <option value="district_user">User (ระดับอำเภอ)</option>
              <option value="district_super_admin">Super Admin (ระดับอำเภอ)</option>
              <option value="province_user">User (ระดับจังหวัด)</option>
              <option value="province_super_admin">Super Admin (ระดับจังหวัด)</option>
            </select>
            <small style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
              * บัญชีใหม่จะต้องได้รับการอนุมัติจาก Admin ก่อนจึงจะสามารถเข้าสู่ระบบได้
            </small>
          </div>

          {isProvince && (
            <div style={{ textAlign: 'left', backgroundColor: '#f0f9ff', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid #bae6fd' }}>
              <label htmlFor="workGroup" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#0369a1', fontSize: '0.875rem' }}>
                กลุ่มงาน (สำหรับบุคลากร สสจ.สระแก้ว) <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <select 
                id="workGroup"
                value={workGroup}
                onChange={(e) => setWorkGroup(e.target.value)}
                className="input-field"
                required={isProvince}
                style={{ width: '100%', padding: '0.7rem 0.85rem', backgroundColor: '#fff' }}
              >
                <option value="">-- กรุณาเลือกกลุ่มงาน --</option>
                {WORK_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <small style={{ color: '#0369a1', display: 'block', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                * สิทธิ์ระดับจังหวัดจำเป็นต้องระบุกลุ่มงาน เพื่อจัดสรรตัวชี้วัดที่ท่านรับผิดชอบ
              </small>
            </div>
          )}

          {error && (
            <div style={{ 
              color: '#b91c1c', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecdd3', 
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              fontSize: '0.85rem', 
              textAlign: 'left' 
            }}>
              ⚠️ {error}
            </div>
          )}
          
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading} 
            style={{ 
              marginTop: '0.5rem', 
              padding: '0.75rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>กำลังลงทะเบียน...</span>
              </>
            ) : (
              <span>ลงทะเบียน</span>
            )}
          </button>
        </form>
        
        <div style={{ marginTop: '1.25rem', fontSize: '0.875rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          มีบัญชีอยู่แล้ว? <a href="/editor/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>เข้าสู่ระบบที่นี่</a>
        </div>
      </div>
    </div>
  );
}

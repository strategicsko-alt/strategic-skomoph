"use client";

import { useState, useEffect } from 'react';
import { register } from './actions';
import { supabase } from '@/lib/supabase'; // Using the client-side supabase for fetching districts

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

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('email', email);
      formData.append('password', password);
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
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--secondary)' }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>ลงทะเบียน</h1>
        <p style={{ marginBottom: '2rem', color: 'var(--secondary-foreground)' }}>สร้างบัญชีผู้ใช้งานใหม่</p>
        
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <label htmlFor="firstName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
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
              />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <label htmlFor="lastName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
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
              />
            </div>
          </div>
          <p style={{ textAlign: 'left', fontSize: '0.75rem', color: 'var(--secondary-foreground)', marginTop: '-0.5rem', marginBottom: '0.25rem' }}>
            💡 กรุณากรอกชื่อ-นามสกุลเป็น <strong>ภาษาไทย</strong> เพื่อความถูกต้องในการแสดงผลในระบบและรายงาน
          </p>

          <div style={{ textAlign: 'left' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>อีเมล (Username)</label>
            <input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field" 
              placeholder="example@gmail.com"
              required
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>รหัสผ่าน</label>
            <input 
              type="password" 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field" 
              placeholder="ตั้งรหัสผ่าน (สามารถใช้ 0 นำหน้าได้)"
              required
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label htmlFor="district" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>หน่วยงานต้นสังกัด</label>
            <select 
              id="district"
              value={districtId}
              onChange={(e) => setDistrictId(e.target.value)}
              className="input-field"
              required
            >
              {districts.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          
          <div style={{ textAlign: 'left' }}>
            <label htmlFor="role" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ระดับสิทธิ์ที่ต้องการขอ</label>
            <select 
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input-field"
              required
            >
              <option value="district_user">User (ระดับอำเภอ)</option>
              <option value="district_super_admin">Super Admin (ระดับอำเภอ)</option>
              <option value="province_user">User (ระดับจังหวัด)</option>
              <option value="province_super_admin">Super Admin (ระดับจังหวัด)</option>
            </select>
            <small style={{ color: 'var(--muted-foreground)' }}>ต้องรอการอนุมัติจาก Admin ก่อนจึงจะใช้งานได้</small>
          </div>

          {isProvince && (
            <div style={{ textAlign: 'left', backgroundColor: '#f0f9ff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #bae6fd' }}>
              <label htmlFor="workGroup" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#0369a1' }}>
                กลุ่มงาน (สำหรับบุคลากร สสจ.สระแก้ว) <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <select 
                id="workGroup"
                value={workGroup}
                onChange={(e) => setWorkGroup(e.target.value)}
                className="input-field"
                required={isProvince}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: '#fff' }}
              >
                <option value="">-- กรุณาเลือกกลุ่มงาน --</option>
                {WORK_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <small style={{ color: '#0369a1', display: 'block', marginTop: '0.35rem', fontSize: '0.75rem' }}>
                * สิทธิ์ระดับจังหวัดจำเป็นต้องระบุกลุ่มงาน เพื่อจัดสรรตัวชี้วัดที่ท่านรับผิดชอบ
              </small>
            </div>
          )}

          {error && <div style={{ color: 'var(--destructive)', fontSize: '0.875rem', textAlign: 'left' }}>{error}</div>}
          
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
          </button>
        </form>
        
        <div style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
          มีบัญชีอยู่แล้ว? <a href="/editor/login" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>เข้าสู่ระบบ</a>
        </div>
      </div>
    </div>
  );
}

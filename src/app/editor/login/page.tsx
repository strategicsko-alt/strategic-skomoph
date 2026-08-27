"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from './actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      
      const res = await login(formData);
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
      <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>Editor Portal</h1>
        <p style={{ marginBottom: '2rem', color: 'var(--secondary-foreground)' }}>เข้าสู่ระบบด้วยบัญชีผู้ใช้งาน</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ textAlign: 'left' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>อีเมล</label>
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
              placeholder="กรอกรหัสผ่าน"
              required
            />
          </div>
          
          {error && <div style={{ color: 'var(--destructive)', fontSize: '0.875rem', textAlign: 'left' }}>{error}</div>}
          
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
        
        <div style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
          ยังไม่มีบัญชีใช่หรือไม่? <a href="/editor/register" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>ลงทะเบียนที่นี่</a>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
          <a href="/" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>กลับสู่หน้า Dashboard (Viewer)</a>
        </div>
      </div>
    </div>
  );
}

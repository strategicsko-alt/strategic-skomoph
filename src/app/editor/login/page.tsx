"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/editor/dashboard');
        router.refresh();
      } else {
        setError(data.message || 'รหัสผ่านไม่ถูกต้อง');
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
        <p style={{ marginBottom: '2rem', color: 'var(--secondary-foreground)' }}>ระบบจัดการยุทธศาสตร์สุขภาพ 5 ปี</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ textAlign: 'left' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>รหัสผ่าน</label>
            <input 
              type="password" 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field" 
              placeholder="กรอกรหัสผ่านเพื่อเข้าสู่ระบบ"
              required
            />
          </div>
          
          {error && <div style={{ color: 'var(--destructive)', fontSize: '0.875rem', textAlign: 'left' }}>{error}</div>}
          
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
        
        <div style={{ marginTop: '2rem', fontSize: '0.875rem' }}>
          <a href="/" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>กลับสู่หน้า Dashboard (Viewer)</a>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from './actions';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email.trim().toLowerCase());
      formData.append('password', password);
      
      const res = await login(formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else if (res?.success) {
        // Use full page reload to ensure fresh session cookies are sent
        window.location.href = '/editor/dashboard';
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--secondary)', padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'inline-flex', padding: '0.75rem', backgroundColor: '#e0f2fe', borderRadius: '50%', color: 'var(--primary)', marginBottom: '0.75rem' }}>
          <Lock size={28} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem', color: 'var(--primary)' }}>Editor Portal</h1>
        <p style={{ marginBottom: '1.5rem', color: 'var(--secondary-foreground)', fontSize: '0.9rem' }}>
          เข้าสู่ระบบบริหารจัดการยุทธศาสตร์สุขภาพ สสจ.สระแก้ว
        </p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ textAlign: 'left' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.875rem' }}>
              อีเมล (Username)
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field" 
                placeholder="เช่น example@gmail.com"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                required
                style={{ width: '100%', padding: '0.7rem 0.85rem' }}
              />
            </div>
            <small style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
              * สามารถพิมพ์ตัวพิมพ์เล็กหรือใหญ่ ระบบจะปรับให้อัตโนมัติ
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
                placeholder="กรอกรหัสผ่าน"
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
          
          {error && (
            <div style={{ 
              color: '#b91c1c', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecdd3', 
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              fontSize: '0.85rem', 
              textAlign: 'left',
              lineHeight: 1.4
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
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <span>เข้าสู่ระบบ</span>
            )}
          </button>
        </form>
        
        <div style={{ marginTop: '1.5rem', fontSize: '0.875rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          ยังไม่มีบัญชีใช่หรือไม่? <a href="/editor/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>ลงทะเบียนใหม่ที่นี่</a>
        </div>
        <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
          <a href="/" style={{ color: 'var(--secondary-foreground)', textDecoration: 'none' }}>← กลับสู่หน้าหลักยุทธศาสตร์</a>
        </div>
      </div>
    </div>
  );
}

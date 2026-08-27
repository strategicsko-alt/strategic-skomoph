"use client"
import { useRouter } from 'next/navigation';

export default function PendingApprovalPage() {
  const router = useRouter();
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--secondary)' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>รอการอนุมัติ</h1>
        <p style={{ marginBottom: '2rem', color: 'var(--secondary-foreground)' }}>บัญชีของคุณถูกสร้างเรียบร้อยแล้ว แต่ต้องรอการอนุมัติจากผู้ดูแลระบบก่อนจึงจะเข้าใช้งานได้</p>
        
        <button onClick={() => router.push('/editor/login')} className="btn-secondary" style={{ width: '100%' }}>
          กลับไปหน้าเข้าสู่ระบบ
        </button>
      </div>
    </div>
  );
}

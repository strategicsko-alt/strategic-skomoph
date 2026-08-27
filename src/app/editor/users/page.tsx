"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { CheckCircle, XCircle, Loader2, ShieldCheck, User } from 'lucide-react';

type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  approval_status: string;
  districts: { name: string } | null;
  created_at: string;
};

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get my profile first to see my role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      setMyProfile(profile);

      // We use RPC or just raw fetch depending on RLS. 
      // Because we want to fetch pending users, and RLS only allows selecting if we are province_super_admin (all) or district_super_admin (own district).
      // Our RLS policies should allow this.
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, first_name, last_name, role, approval_status, created_at,
          districts ( name )
        `)
        .order('created_at', { ascending: false });

      if (data) {
        setUsers(data as any[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'approved' | 'rejected') => {
    if (!confirm(`คุณต้องการ ${newStatus === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'} ผู้ใช้นี้ใช่หรือไม่?`)) return;
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      
      if (res.ok) {
        // Update local state
        setUsers(users.map(u => u.id === userId ? { ...u, approval_status: newStatus } : u));
      } else {
        alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด');
    }
  };

  const pendingUsers = users.filter(u => u.approval_status === 'pending');
  const approvedUsers = users.filter(u => u.approval_status === 'approved');

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'province_super_admin': return <span className="badge" style={{backgroundColor: '#e0e7ff', color: '#3730a3'}}>Super Admin จังหวัด</span>;
      case 'province_user': return <span className="badge" style={{backgroundColor: '#f3f4f6', color: '#1f2937'}}>User จังหวัด</span>;
      case 'district_super_admin': return <span className="badge" style={{backgroundColor: '#dbeafe', color: '#1e40af'}}>Super Admin อำเภอ</span>;
      default: return <span className="badge" style={{backgroundColor: '#f3f4f6', color: '#1f2937'}}>User อำเภอ</span>;
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 className="animate-spin" /></div>;
  }

  if (myProfile?.role !== 'province_super_admin' && myProfile?.role !== 'district_super_admin') {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShieldCheck size={28} /> จัดการผู้ใช้งาน
      </h1>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          รอการอนุมัติ ({pendingUsers.length})
        </h2>
        {pendingUsers.length === 0 ? (
          <p style={{ color: 'var(--muted-foreground)' }}>ไม่มีผู้ใช้ที่รอการอนุมัติ</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0' }}>ชื่อ - นามสกุล</th>
                <th>หน่วยงาน</th>
                <th>ระดับสิทธิ์</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 0' }}>{user.first_name} {user.last_name}</td>
                  <td>{user.districts?.name || '-'}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleStatusChange(user.id, 'approved')} className="btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                        อนุมัติ
                      </button>
                      <button onClick={() => handleStatusChange(user.id, 'rejected')} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none' }}>
                        ปฏิเสธ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          ผู้ใช้ในระบบทั้งหมด ({approvedUsers.length})
        </h2>
        {approvedUsers.length === 0 ? (
          <p style={{ color: 'var(--muted-foreground)' }}>ไม่มีผู้ใช้ในระบบ</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0' }}>ชื่อ - นามสกุล</th>
                <th>หน่วยงาน</th>
                <th>ระดับสิทธิ์</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {approvedUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 0' }}>{user.first_name} {user.last_name}</td>
                  <td>{user.districts?.name || '-'}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>
                     <span style={{ color: 'green', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                        <CheckCircle size={16} /> อนุมัติแล้ว
                     </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

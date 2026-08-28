"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { CheckCircle, XCircle, Loader2, ShieldCheck, User, Edit } from 'lucide-react';
import { Modal } from '@/components/Modal';

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
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setMyProfile(profile);

      const { data, error } = await supabase
        .from('profiles')
        .select(`id, first_name, last_name, role, approval_status, created_at, districts ( name )`)
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

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditRole(user.role || 'district_user');
    setEditStatus(user.approval_status || 'pending');
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSaving(true);
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: editingUser.id, status: editStatus, role: editRole }),
      });
      
      const resData = await res.json();
      if (res.ok && resData.success) {
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, approval_status: editStatus, role: editRole } : u));
        setIsEditModalOpen(false);
      } else {
        alert(resData.message || 'เกิดข้อผิดพลาดในการอัปเดตสิทธิ์');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSaving(false);
    }
  };

  const pendingUsers = users.filter(u => u.approval_status === 'pending');
  const approvedUsers = users.filter(u => u.approval_status !== 'pending');

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'province_super_admin': return <span className="badge" style={{backgroundColor: '#e0e7ff', color: '#3730a3'}}>Super Admin จังหวัด</span>;
      case 'province_user': return <span className="badge" style={{backgroundColor: '#f3f4f6', color: '#1f2937'}}>User จังหวัด</span>;
      case 'district_super_admin': return <span className="badge" style={{backgroundColor: '#dbeafe', color: '#1e40af'}}>Super Admin อำเภอ</span>;
      default: return <span className="badge" style={{backgroundColor: '#f3f4f6', color: '#1f2937'}}>User อำเภอ</span>;
    }
  };

  const renderUserCard = (user: UserProfile) => (
    <div key={user.id} style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
          <User size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--foreground)' }}>{user.first_name} {user.last_name}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--secondary-foreground)', marginTop: '0.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span>{user.districts?.name || 'ระดับจังหวัด'}</span>
            <span>{getRoleBadge(user.role)}</span>
          </div>
        </div>
      </div>
      <div>
        <button className="btn-secondary" onClick={() => handleOpenEdit(user)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
          <Edit size={16} /> จัดการสิทธิ์
        </button>
      </div>
    </div>
  );

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.5rem' }}>
            จัดการผู้ใช้งาน
          </h1>
          <p style={{ color: 'var(--secondary-foreground)' }}>
            อนุมัติการเข้าใช้งานและกำหนดระดับสิทธิ์ (Role)
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={20} style={{ color: 'var(--warning)' }} />
          รอดำเนินการ ({pendingUsers.length})
        </h2>
        {pendingUsers.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {pendingUsers.map(renderUserCard)}
          </div>
        ) : (
          <p style={{ color: 'var(--muted-foreground)', fontStyle: 'italic', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)' }}>ไม่มีผู้ใช้ที่รอการอนุมัติ</p>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={20} style={{ color: 'var(--success)' }} />
          ผู้ใช้งานในระบบ ({approvedUsers.length})
        </h2>
        {approvedUsers.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {approvedUsers.map(renderUserCard)}
          </div>
        ) : (
          <p style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>ไม่มีผู้ใช้</p>
        )}
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="จัดการสิทธิ์ผู้ใช้งาน">
        <form onSubmit={handleSaveUser}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>ระดับสิทธิ์ (Role)</label>
            <select
              className="input-field"
              value={editRole}
              onChange={e => setEditRole(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
            >
              <option value="district_user">User อำเภอ (จัดการได้แค่อำเภอตนเอง)</option>
              {myProfile?.role === 'province_super_admin' && (
                <>
                  <option value="district_super_admin">Super Admin อำเภอ (จัดการอำเภอตนเอง + อนุมัติ User อำเภอ)</option>
                  <option value="province_user">User จังหวัด (จัดการได้แค่ของจังหวัด)</option>
                  <option value="province_super_admin">Super Admin จังหวัด (สิทธิ์สูงสุดจัดการได้ทุกอย่าง)</option>
                </>
              )}
            </select>
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>สถานะการใช้งาน</label>
            <select
              className="input-field"
              value={editStatus}
              onChange={e => setEditStatus(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
            >
              <option value="pending">รอการอนุมัติ (เข้าใช้งานไม่ได้)</option>
              <option value="approved">อนุมัติแล้ว (เข้าใช้งานได้ปกติ)</option>
              <option value="rejected">ปฏิเสธ (เข้าใช้งานไม่ได้)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>
              ยกเลิก
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} 
              บันทึกการเปลี่ยนแปลง
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

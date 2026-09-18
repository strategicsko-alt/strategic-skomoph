"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ShieldCheck, 
  User, 
  Edit, 
  Key, 
  Eye, 
  EyeOff, 
  Mail, 
  Search 
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/ui/Toast';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  email?: string;
  work_group?: string;
  approval_status: string;
  districts: { name: string } | null;
  created_at: string;
  last_sign_in_at?: string | null;
};

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

export default function UsersManagementPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editWorkGroup, setEditWorkGroup] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setUsers(json.users || []);
          setMyProfile(json.myProfile || null);
          return;
        }
      }

      // Fallback direct query if API fails
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setMyProfile(profile);

      const { data } = await supabase
        .from('profiles')
        .select(`id, first_name, last_name, role, work_group, approval_status, created_at, districts ( name )`)
        .order('created_at', { ascending: false });

      if (data) {
        setUsers(data as any[]);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      toast.error('ไม่สามารถโหลดรายชื่อผู้ใช้งานได้');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditFirstName(user.first_name || '');
    setEditLastName(user.last_name || '');
    setEditRole(user.role || 'district_user');
    setEditWorkGroup(user.work_group || '');
    setEditStatus(user.approval_status || 'pending');
    setEditNewPassword('');
    setShowPassword(false);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (editNewPassword.trim() && editNewPassword.trim().length < 6) {
      toast.error('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsSaving(true);
    
    try {
      const payload: any = { 
        userId: editingUser.id, 
        firstName: editFirstName,
        lastName: editLastName,
        status: editStatus, 
        role: editRole, 
        workGroup: editRole.includes('province') ? editWorkGroup : null 
      };

      if (editNewPassword.trim()) {
        payload.newPassword = editNewPassword.trim();
      }

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const resData = await res.json();
      if (res.ok && resData.success) {
        setUsers(users.map(u => u.id === editingUser.id ? { 
          ...u, 
          first_name: editFirstName.trim(),
          last_name: editLastName.trim(),
          approval_status: editStatus, 
          role: editRole, 
          work_group: editRole.includes('province') ? editWorkGroup : undefined 
        } : u));
        setIsEditModalOpen(false);
        toast.success(
          editNewPassword.trim() 
            ? 'อัปเดตสิทธิ์และเปลี่ยนรหัสผ่านสำเร็จ' 
            : 'อัปเดตข้อมูลและสิทธิ์ผู้ใช้งานสำเร็จ'
        );
      } else {
        toast.error(resData.message || 'เกิดข้อผิดพลาดในการอัปเดตสิทธิ์');
      }
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const district = (u.districts?.name || 'ระดับจังหวัด').toLowerCase();
    const workGroup = (u.work_group || '').toLowerCase();
    return fullName.includes(term) || email.includes(term) || district.includes(term) || workGroup.includes(term);
  });

  const pendingUsers = filteredUsers.filter(u => u.approval_status === 'pending');
  const approvedUsers = filteredUsers.filter(u => u.approval_status !== 'pending');

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'province_super_admin': return <span className="badge" style={{backgroundColor: '#e0e7ff', color: '#3730a3'}}>Super Admin จังหวัด</span>;
      case 'province_user': return <span className="badge" style={{backgroundColor: '#f3f4f6', color: '#1f2937'}}>User จังหวัด</span>;
      case 'district_super_admin': return <span className="badge" style={{backgroundColor: '#dbeafe', color: '#1e40af'}}>Super Admin อำเภอ</span>;
      default: return <span className="badge" style={{backgroundColor: '#f3f4f6', color: '#1f2937'}}>User อำเภอ</span>;
    }
  };

  const renderUserCard = (user: UserProfile) => (
    <div 
      key={user.id} 
      style={{ 
        backgroundColor: 'white', 
        padding: '1.25rem', 
        borderRadius: 'var(--radius-md)', 
        border: '1px solid var(--border)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '0.75rem',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ width: '42px', height: '42px', backgroundColor: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
          <User size={22} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span>{user.first_name} {user.last_name}</span>
            {user.email && (
              <span style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 500, backgroundColor: '#f0f9ff', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                ✉️ {user.email}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--secondary-foreground)', marginTop: '0.35rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>🏢 {user.districts?.name || 'ระดับจังหวัด'}</span>
            <span>{getRoleBadge(user.role)}</span>
            {user.work_group && (
              <span style={{ fontSize: "0.75rem", backgroundColor: "#fef08a", color: "#854d0e", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>
                {user.work_group}
              </span>
            )}
            {user.last_sign_in_at && (
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                เข้าสู่ระบบล่าสุด: {new Date(user.last_sign_in_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>
      <div>
        <button 
          className="btn-secondary" 
          onClick={() => handleOpenEdit(user)} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500 }}
        >
          <Edit size={16} /> จัดการสิทธิ์ / รหัสผ่าน
        </button>
      </div>
    </div>
  );

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <Breadcrumbs items={[{ label: 'Editor Portal', href: '/editor/dashboard' }, { label: 'จัดการผู้ใช้งาน' }]} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.25rem' }}>
            จัดการผู้ใช้งาน
          </h1>
          <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.9rem' }}>
            อนุมัติการเข้าใช้งาน กำหนดระดับสิทธิ์ และรีเซ็ตรหัสผ่านผู้ใช้งาน
          </p>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="ค้นหาชื่อ อีเมล หรืออำเภอ..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.4rem', fontSize: '0.875rem' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={20} style={{ color: 'var(--warning)' }} />
          รอดำเนินการ ({pendingUsers.length})
        </h2>
        {pendingUsers.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {pendingUsers.map(renderUserCard)}
          </div>
        ) : (
          <p style={{ color: 'var(--muted-foreground)', fontStyle: 'italic', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}>
            ไม่มีผู้ใช้ที่รอการอนุมัติ
          </p>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={20} style={{ color: 'var(--success)' }} />
          ผู้ใช้งานในระบบ ({approvedUsers.length})
        </h2>
        {approvedUsers.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {approvedUsers.map(renderUserCard)}
          </div>
        ) : (
          <p style={{ color: 'var(--muted-foreground)', fontStyle: 'italic', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}>
            {searchTerm ? 'ไม่พบผู้ใช้ที่ตรงกับคำค้นหา' : 'ไม่มีผู้ใช้'}
          </p>
        )}
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="จัดการข้อมูล สิทธิ์ และรหัสผ่าน">
        <form onSubmit={handleSaveUser}>
          {editingUser?.email && (
            <div style={{ marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--secondary-foreground)', display: 'block', marginBottom: '0.2rem' }}>
                อีเมลผู้ใช้งาน (Username สำหรับเข้าสู่ระบบ)
              </span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={16} /> {editingUser.email}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                ชื่อ (First Name)
              </label>
              <input
                type="text"
                className="input-field"
                value={editFirstName}
                onChange={e => setEditFirstName(e.target.value)}
                placeholder="ชื่อ (ภาษาไทย)"
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                นามสกุล (Last Name)
              </label>
              <input
                type="text"
                className="input-field"
                value={editLastName}
                onChange={e => setEditLastName(e.target.value)}
                placeholder="นามสกุล (ภาษาไทย)"
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              ระดับสิทธิ์ (Role)
            </label>
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
          
          {editRole.includes('province') && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                กลุ่มงาน (Work Group)
              </label>
              <select
                className="input-field"
                value={editWorkGroup}
                onChange={e => setEditWorkGroup(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
              >
                <option value="">-- ไม่ระบุ / ดูภาพรวมทั้งหมด --</option>
                {WORK_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <p style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)', marginTop: '0.25rem' }}>
                * สิทธิ์ระดับจังหวัด จะเห็นตัวชี้วัดเฉพาะกลุ่มงานของตัวเอง (ถ้าไม่ระบุ จะเห็นทั้งหมด)
              </p>
            </div>
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              สถานะการใช้งาน
            </label>
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

          {/* Reset Password Field */}
          <div style={{ marginBottom: '1.75rem', padding: '1rem', backgroundColor: '#fdf4ff', borderRadius: 'var(--radius-sm)', border: '1px solid #f5d0fe' }}>
            <label htmlFor="newPassword" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 600, color: '#86198f', marginBottom: '0.4rem' }}>
              <Key size={16} /> ตั้งรหัสผ่านใหม่ (Reset Password)
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                className="input-field"
                value={editNewPassword}
                onChange={e => setEditNewPassword(e.target.value)}
                placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน"
                style={{ width: '100%', padding: '0.7rem 2.5rem 0.7rem 0.75rem', backgroundColor: 'white' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.6rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--secondary-foreground)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#a21caf', marginTop: '0.35rem' }}>
              * กรอกอย่างน้อย 6 ตัวอักษร สำหรับกรณีผู้ใช้ลืมรหัสผ่านหรือเข้าสู่ระบบไม่ได้ (หากไม่ต้องการเปลี่ยน ให้ปล่อยว่างไว้)
            </p>
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

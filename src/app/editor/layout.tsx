"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, FileText, LogOut, Building, ExternalLink, ChevronLeft, ChevronRight, Settings, CalendarDays, Users, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EditorProvider, useEditor } from '@/components/EditorContext';

// We create an InnerLayout to use the hook, while the default export wraps it in the Provider.
function EditorLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { profile, loading } = useEditor();
  

  // Don't show sidebar on login/register/pending pages
  if (pathname === '/editor/login' || pathname === '/editor/register' || pathname === '/editor/pending-approval') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = 'editor_auth=; Max-Age=0; path=/';
    router.push('/editor/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/editor/dashboard', icon: LayoutDashboard },
    { name: 'ข้อมูลองค์กร (Core Data)', href: '/editor/core-data', icon: Building },
    { name: 'Workshop (แผนยุทธศาสตร์ 5 ปี)', href: '/editor/workshop', icon: BookOpen },
    { name: 'แผนปฏิบัติการ 1 ปี', href: '/editor/action-plan', icon: CalendarDays },
    { name: 'KPI Dictionary', href: '/editor/kpi-dictionary', icon: FileText },
    { name: 'สำรอง/กู้คืนข้อมูล (Backup)', href: '/editor/admin', icon: Settings },
  ];

  if (profile && (profile.role === 'province_super_admin' || profile.role === 'district_super_admin')) {
    navItems.push({ name: 'จัดการสิทธิ์ (Users)', href: '/editor/users', icon: Users });
  }

  const sidebarWidth = sidebarOpen ? '240px' : '64px';

  const getRoleDisplay = (role: string) => {
    if (role === 'province_super_admin') return 'Super Admin จ.';
    if (role === 'district_super_admin') return 'Super Admin อ.';
    if (role === 'province_user') return 'User จ.';
    return 'User อ.';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        backgroundColor: 'var(--card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ padding: sidebarOpen ? '1.25rem 1rem' : '1.25rem 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'space-between' : 'center', overflow: 'hidden', minHeight: '72px' }}>
          {sidebarOpen && (
            <div style={{ overflow: 'hidden', flex: 1, marginRight: '0.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Editor Portal</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)', whiteSpace: 'nowrap' }}>ระบบจัดการยุทธศาสตร์</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'ซ่อนเมนู' : 'แสดงเมนู'}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', padding: '0.35rem', display: 'flex', alignItems: 'center',
              color: 'var(--secondary-foreground)', flexShrink: 0,
              transition: 'background 0.15s'
            }}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* User Info */}
        {!loading && profile && (
          <div style={{ padding: sidebarOpen ? '0.75rem 1rem' : '0.75rem 0', display: 'flex', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
            {sidebarOpen ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', width: '100%' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                  <User size={18} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {profile.first_name} {profile.last_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                    {getRoleDisplay(profile.role)}
                  </div>
                </div>
              </div>
            ) : (
              <div title={`${profile.first_name}\n${getRoleDisplay(profile.role)}`} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <User size={18} />
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav style={{ padding: sidebarOpen ? '0.75rem' : '0.75rem 0.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={!sidebarOpen ? item.name : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: sidebarOpen ? '0.75rem' : '0',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  padding: sidebarOpen ? '0.65rem 0.875rem' : '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'white' : 'var(--foreground)',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.15s',
                  textDecoration: 'none',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={20} style={{ flexShrink: 0 }} />
                {sidebarOpen && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: sidebarOpen ? '0.75rem' : '0.75rem 0.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <Link
            href="/"
            target="_blank"
            title={!sidebarOpen ? 'ดูหน้าเว็บหลัก' : undefined}
            style={{
              display: 'flex', alignItems: 'center',
              gap: sidebarOpen ? '0.75rem' : '0', justifyContent: sidebarOpen ? 'flex-start' : 'center',
              padding: sidebarOpen ? '0.65rem 0.875rem' : '0.65rem',
              borderRadius: 'var(--radius-md)', color: 'var(--primary)',
              fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden'
            }}
          >
            <ExternalLink size={20} style={{ flexShrink: 0 }} />
            {sidebarOpen && <span>ดูหน้าเว็บหลัก</span>}
          </Link>
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? 'ออกจากระบบ' : undefined}
            style={{
              display: 'flex', alignItems: 'center',
              gap: sidebarOpen ? '0.75rem' : '0', justifyContent: sidebarOpen ? 'flex-start' : 'center',
              padding: sidebarOpen ? '0.65rem 0.875rem' : '0.65rem',
              width: '100%', borderRadius: 'var(--radius-md)', backgroundColor: 'transparent',
              color: 'var(--destructive)', border: 'none', fontWeight: 500, cursor: 'pointer', textAlign: 'left',
              whiteSpace: 'nowrap', overflow: 'hidden'
            }}
          >
            <LogOut size={20} style={{ flexShrink: 0 }} />
            {sidebarOpen && <span>ออกจากระบบ</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <EditorProvider>
      <EditorLayoutInner>{children}</EditorLayoutInner>
    </EditorProvider>
  );
}

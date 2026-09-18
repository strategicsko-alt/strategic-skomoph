"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  BarChart2, 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  LogOut, 
  Building, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  CalendarDays, 
  Users, 
  User,
  Menu,
  X,
  Activity
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EditorProvider, useEditor } from '@/components/EditorContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

// We create an InnerLayout to use the hook, while the default export wraps it in the Provider.
function EditorLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile, loading } = useEditor();

  // Close mobile drawer when pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);


  // Don't show sidebar on login/register/pending pages
  if (pathname === '/editor/login' || pathname === '/editor/register' || pathname === '/editor/pending-approval') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = 'editor_auth=; Max-Age=0; path=/';
    router.push('/editor/login');
  };

  const isSuperAdmin = profile?.role === 'province_super_admin' || profile?.role === 'district_super_admin';

  // Items available to ALL logged-in users
  const baseNavItems = [
    { name: 'Dashboard', href: '/editor/dashboard', icon: LayoutDashboard },
    { name: 'Workshop (แผนยุทธศาสตร์ 5 ปี)', href: '/editor/workshop', icon: BookOpen },
    { name: 'แผนปฏิบัติการ 1 ปี', href: '/editor/action-plan', icon: CalendarDays },
    { name: 'KPI Dictionary', href: '/editor/kpi-dictionary', icon: FileText },
  ];

  const isProvincial = profile?.role === 'province_super_admin' || profile?.role === 'province_user';

  let navItems = [...baseNavItems];

  if (isProvincial) {
    navItems.push({ name: '📝 บันทึกผล KPI', href: '/editor/kpi-report', icon: FileText });
    navItems.push({ name: '⚙️ ตั้งค่าตัวชี้วัด (KPI)', href: '/editor/kpi-template', icon: BarChart2 });
  }

  if (isSuperAdmin) {
    navItems = [
      { name: 'ข้อมูลองค์กร (Core Data)', href: '/editor/core-data', icon: Building },
      ...navItems,
      { name: 'สำรอง/กู้คืนข้อมูล (Backup)', href: '/editor/admin', icon: Settings },
      { name: 'จัดการสิทธิ์ (Users)', href: '/editor/users', icon: Users },
    ];
  }

  const sidebarWidth = sidebarOpen ? '240px' : '64px';

  const getRoleDisplay = (role: string) => {
    if (role === 'province_super_admin') return 'Super Admin จ.';
    if (role === 'district_super_admin') return 'Super Admin อ.';
    if (role === 'province_user') return 'User จ.';
    return 'User อ.';
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      {/* Mobile Top Header (<= 768px) */}
      <header className="editor-mobile-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="เปิดเมนูนำทาง"
            className="btn-ghost touch-target-sm"
            style={{ padding: '0.4rem' }}
          >
            <Menu size={22} />
          </button>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Strategic SKO</h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--secondary-foreground)', margin: 0 }}>Editor Portal</p>
          </div>
        </div>
        {profile && (
          <span className="badge badge-info">
            {getRoleDisplay(profile.role)}
          </span>
        )}
      </header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Mobile Drawer Overlay */}
        {mobileMenuOpen && (
          <div
            role="presentation"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              backdropFilter: 'blur(2px)',
              zIndex: 9990,
              animation: 'modalFadeIn 0.15s ease-out',
            }}
          />
        )}

        {/* Mobile Drawer */}
        <aside
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: '280px',
            backgroundColor: 'var(--card)',
            zIndex: 9995,
            display: mobileMenuOpen ? 'flex' : 'none',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-xl)',
            animation: 'toastSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Editor Portal</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)', margin: 0 }}>สำนักงานสาธารณสุขจังหวัดสระแก้ว</p>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="ปิดเมนู"
              className="btn-ghost touch-target-sm"
              style={{ padding: '0.35rem' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* User Info inside Drawer */}
          {!loading && profile && (
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--secondary)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{profile.first_name} {profile.last_name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)' }}>{getRoleDisplay(profile.role)}</div>
            </div>
          )}

          {/* Drawer Nav Links */}
          <nav style={{ padding: '0.75rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                    color: isActive ? 'white' : 'var(--foreground)',
                    fontWeight: isActive ? 600 : 500,
                    textDecoration: 'none',
                    minHeight: '44px',
                  }}
                >
                  <Icon size={20} style={{ flexShrink: 0 }} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Drawer Footer */}
          <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <Link
              href="/"
              target="_blank"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                color: 'var(--primary)',
                fontWeight: 500,
                textDecoration: 'none',
                minHeight: '44px',
              }}
            >
              <ExternalLink size={20} />
              <span>ดูหน้าเว็บหลัก</span>
            </Link>
            <a
              href="https://sakaeo-epiwatch-ai.web.app/"
              target="_blank"
              rel="noopener noreferrer"
              title="ระบบวิเคราะห์และเฝ้าระวังระบาดวิทยาอัจฉริยะ สำนักงานสาธารณสุขจังหวัดสระแก้ว"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                color: '#be123c',
                fontWeight: 600,
                textDecoration: 'none',
                minHeight: '44px',
                backgroundColor: '#fff1f2',
              }}
            >
              <Activity size={20} />
              <span>ระบาดวิทยาอัจฉริยะ (EpiWatch) ↗</span>
            </a>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'transparent',
                color: 'var(--danger-text)',
                border: 'none',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '44px',
              }}
            >
              <LogOut size={20} />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </aside>

        {/* Desktop Sidebar (> 768px) */}
        <aside
          className="editor-sidebar-desktop"
          style={{
            width: sidebarWidth,
            minWidth: sidebarWidth,
            backgroundColor: 'var(--card)',
            borderRight: '1px solid var(--border)',
            flexDirection: 'column',
            transition: 'width 0.25s ease, min-width 0.25s ease',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
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
              aria-label={sidebarOpen ? 'ซ่อนเมนูด้านข้าง' : 'ขยายเมนูด้านข้าง'}
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
                    <div style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)', whiteSpace: 'nowrap' }}>
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
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--secondary)',
                  opacity: 0.5,
                  animation: 'shimmer 1.5s ease-in-out infinite',
                }} />
              ))
            ) : (
              navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
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
              })
            )}
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
            <a
              href="https://sakaeo-epiwatch-ai.web.app/"
              target="_blank"
              rel="noopener noreferrer"
              title={!sidebarOpen ? 'ระบาดวิทยาอัจฉริยะ (EpiWatch AI)' : 'ระบบวิเคราะห์และเฝ้าระวังระบาดวิทยาอัจฉริยะ สำนักงานสาธารณสุขจังหวัดสระแก้ว'}
              style={{
                display: 'flex', alignItems: 'center',
                gap: sidebarOpen ? '0.75rem' : '0', justifyContent: sidebarOpen ? 'flex-start' : 'center',
                padding: sidebarOpen ? '0.65rem 0.875rem' : '0.65rem',
                borderRadius: 'var(--radius-md)', color: '#be123c',
                backgroundColor: sidebarOpen ? '#fff1f2' : 'transparent',
                fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden'
              }}
            >
              <Activity size={20} style={{ flexShrink: 0 }} />
              {sidebarOpen && <span>เฝ้าระวังระบาดวิทยา (EpiWatch) ↗</span>}
            </a>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              title={!sidebarOpen ? 'ออกจากระบบ' : undefined}
              aria-label="ออกจากระบบ"
              style={{
                display: 'flex', alignItems: 'center',
                gap: sidebarOpen ? '0.75rem' : '0', justifyContent: sidebarOpen ? 'flex-start' : 'center',
                padding: sidebarOpen ? '0.65rem 0.875rem' : '0.65rem',
                width: '100%', borderRadius: 'var(--radius-md)', backgroundColor: 'transparent',
                color: 'var(--danger-text)', border: 'none', fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                whiteSpace: 'nowrap', overflow: 'hidden'
              }}
            >
              <LogOut size={20} style={{ flexShrink: 0 }} />
              {sidebarOpen && <span>ออกจากระบบ</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="editor-main-container" style={{ flex: 1, overflowY: 'auto', padding: '2rem', minWidth: 0 }}>
          {children}
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="ยืนยันการออกจากระบบ"
        message="ท่านต้องการออกจากระบบจัดการยุทธศาสตร์ใช่หรือไม่?"
        confirmLabel="ออกจากระบบ"
        cancelLabel="ยกเลิก"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
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

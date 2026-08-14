"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, BookOpen, FileText, LogOut, Building } from 'lucide-react';

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show sidebar on login page
  if (pathname === '/editor/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    // A simple logout by removing the cookie. In a real app, you'd call an API.
    document.cookie = 'editor_auth=; Max-Age=0; path=/';
    router.push('/');
  };

  const navItems = [
    { name: 'Dashboard', href: '/editor/dashboard', icon: LayoutDashboard },
    { name: 'ข้อมูลองค์กร (Core Data)', href: '/editor/core-data', icon: Building },
    { name: 'Workshop (แผนยุทธศาสตร์)', href: '/editor/workshop', icon: BookOpen },
    { name: 'KPI Dictionary', href: '/editor/kpi-dictionary', icon: FileText },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      {/* Sidebar */}
      <aside style={{ width: '280px', backgroundColor: 'var(--card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>Editor Portal</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--secondary-foreground)' }}>ระบบจัดการยุทธศาสตร์สุขภาพ</p>
        </div>
        
        <nav style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'white' : 'var(--foreground)',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s',
                  textDecoration: 'none'
                }}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              width: '100%',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'transparent',
              color: 'var(--destructive)',
              border: 'none',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <LogOut size={20} />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
}

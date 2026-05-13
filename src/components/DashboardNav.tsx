'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  id: string
  email: string | null
  full_name: string | null
  role: string
}

export default function DashboardNav({ user }: { user: Profile | null }) {
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const navItems = [
    { href: '/dashboard', label: 'Tổng quan', icon: '📊' },
    { href: '/dashboard/exams', label: 'Đề thi', icon: '📝' },
    { href: '/dashboard/sessions', label: 'Ca thi', icon: '👥' },
    { href: '/dashboard/scoring', label: 'Chấm điểm', icon: '✅' },
  ]

  return (
    <nav style={{
      width: '240px',
      background: 'var(--card)',
      borderRight: '1px solid var(--border)',
      padding: '1rem 0',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: '0 1rem 1rem', borderBottom: '1px solid var(--border)', marginBottom: '0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
          TLSV2
        </h2>
        <p className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>
          {user?.full_name || user?.email}
        </p>
        <span className={`badge ${user?.role === 'admin' ? 'badge-info' : 'badge-success'}`} style={{ marginTop: '0.5rem' }}>
          {user?.role === 'admin' ? 'Quản trị' : 'Giám khảo'}
        </span>
      </div>

      <div style={{ flex: 1 }}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              color: pathname === item.href ? 'var(--primary)' : 'var(--text)',
              background: pathname === item.href ? '#eff6ff' : 'transparent',
              fontWeight: pathname === item.href ? 600 : 400,
              fontSize: '0.875rem',
              textDecoration: 'none',
              borderLeft: pathname === item.href ? '3px solid var(--primary)' : '3px solid transparent',
            }}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          🚪 Đăng xuất
        </button>
      </div>
    </nav>
  )
}

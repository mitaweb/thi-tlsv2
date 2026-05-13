'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      setError('Cấu hình admin chưa được thiết lập. Liên hệ quản trị viên.')
      setLoading(false)
      return
    }

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password,
    })

    if (signInError) {
      setError('Mật khẩu không đúng')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            TLSV2
          </h1>
          <p className="text-muted">Hệ thống thi trực tuyến</p>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
            Đăng nhập
          </h2>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="input-label">Mật khẩu</label>
              <input
                type="password"
                className="input"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
            <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 500 }}>
              Tạo tài khoản giám khảo
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

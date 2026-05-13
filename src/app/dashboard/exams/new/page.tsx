'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewExamPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const defaultCategory = (searchParams.get('category') as 'sinh_vien' | 'thpt') || 'sinh_vien'

  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    category: defaultCategory,
    duration_minutes: 90,
    total_score: 100,
    status: 'draft' as 'draft' | 'active' | 'archived',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('exams').insert({
      ...form,
      created_by: user.id,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/exams')
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="page-header">
        <h1 className="page-title">Tạo đề thi</h1>
      </div>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="input-label">Mã đề thi *</label>
            <input
              type="text"
              className="input"
              placeholder="VD: CS101-2025"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="input-label">Tên đề thi *</label>
            <input
              type="text"
              className="input"
              placeholder="VD: Kiểm tra Giải tích 1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="input-label">Mô tả</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Mô tả nội dung đề thi..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="input-label">Phân loại đề thi</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as 'sinh_vien' | 'thpt' })}
            >
              <option value="sinh_vien">🎓 Thủ lĩnh Sinh viên</option>
              <option value="thpt">🏫 Học sinh THPT</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="input-label">Thời gian (phút)</label>
              <input
                type="number"
                className="input"
                min={1}
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="form-group">
              <label className="input-label">Tổng điểm</label>
              <input
                type="number"
                className="input"
                min={1}
                value={form.total_score}
                onChange={(e) => setForm({ ...form, total_score: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="form-group">
              <label className="input-label">Trạng thái</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
              >
                <option value="draft">Nháp</option>
                <option value="active">Hoạt động</option>
                <option value="archived">Lưu trữ</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo đề thi'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push('/dashboard/exams')}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

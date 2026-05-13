'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SessionsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    examId: '',
    candidateName: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdSession, setCreatedSession] = useState<{ code: string; url: string } | null>(null)

  const [exams, setExams] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [tab, setTab] = useState<'create' | 'list'>('create')
  const [loadingData, setLoadingData] = useState(false)
  const [activeCategory, setActiveCategory] = useState<'sinh_vien' | 'thpt'>('sinh_vien')

  const loadData = async () => {
    setLoadingData(true)
    const [{ data: examData }, { data: sessionData }] = await Promise.all([
      supabase.from('exams').select('id, code, name, category').eq('status', 'active').eq('category', activeCategory),
      supabase.from('sessions').select('*, exams:exam_id(name, code, category)').eq('exams.category', activeCategory).order('created_at', { ascending: false }).limit(50),
    ])
    setExams(examData || [])
    setSessions(sessionData || [])
    if (examData && examData.length > 0) {
      setForm(f => ({ ...f, examId: examData[0].id }))
    } else {
      setForm(f => ({ ...f, examId: '' }))
    }
    setLoadingData(false)
  }

  if (tab === 'list' && sessions.length === 0 && !loadingData) {
    loadData(activeCategory)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const code = generateCode()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      setError('Không xác định được người dùng')
      setLoading(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('sessions')
      .insert({
        exam_id: form.examId,
        code,
        candidate_name: form.candidateName || null,
        status: 'waiting',
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    const sessionUrl = `${window.location.origin}/exam/${code}`
    setCreatedSession({ code, url: sessionUrl })
    setLoading(false)
    setForm({ examId: form.examId, candidateName: '' })
  }

  const handleStatusChange = async (sessionId: string, newStatus: string) => {
    await supabase.from('sessions').update({ status: newStatus }).eq('id', sessionId)
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: newStatus } : s))
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quản lý ca thi</h1>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
        <button
          className={`btn ${activeCategory === 'sinh_vien' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveCategory('sinh_vien'); setForm(f => ({ ...f, category: 'sinh_vien', examId: '', sessions: [] })); setTab('create') }}
        >
          🎓 Thủ lĩnh Sinh viên
        </button>
        <button
          className={`btn ${activeCategory === 'thpt' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveCategory('thpt'); setForm(f => ({ ...f, category: 'thpt', examId: '', sessions: [] })); setTab('create') }}
        >
          🏫 Học sinh THPT
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          className={`btn ${tab === 'create' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setTab('create'); setCreatedSession(null) }}
        >
          + Tạo ca thi
        </button>
        <button
          className={`btn ${tab === 'create' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setTab('create'); setCreatedSession(null) }}
        >
          + Tạo ca thi
        </button>
        <button
          className={`btn ${tab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setTab('list'); loadData(activeCategory) }}
        >
          📋 Danh sách ca thi
        </button>
      </div>

      {tab === 'create' ? (
        <div style={{ maxWidth: '500px' }}>
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Tạo ca thi mới</h3>

            {error && <div className="alert alert-error">{error}</div>}

            {createdSession && (
              <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Tạo thành công!</div>
                <div>Mã ca thi: <strong style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{createdSession.code}</strong></div>
                <div style={{ marginTop: '0.5rem' }}>
                  <input
                    type="text"
                    className="input"
                    readOnly
                    value={createdSession.url}
                    onClick={e => (e.target as HTMLInputElement).select()}
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => navigator.clipboard.writeText(createdSession.url)}
                  >
                    📋 Copy link
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => navigator.clipboard.writeText(createdSession.code)}
                  >
                    📋 Copy mã
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="input-label">Đề thi *</label>
                <select
                  className="input"
                  value={form.examId}
                  onChange={e => setForm({ ...form, examId: e.target.value })}
                  required
                >
                  <option value="">-- Chọn đề thi --</option>
                  {exams.map(exam => (
                    <option key={exam.id} value={exam.id}>
                      [{exam.code}] {exam.name}
                    </option>
                  ))}
                </select>
                {tab === 'create' && exams.length === 0 && (
                  <p className="text-sm text-muted mt-1">
                    Chưa có đề thi hoạt động.{' '}
                    <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => router.push('/dashboard/exams')}>
                      Tạo đề thi
                    </span>
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="input-label">Tên thí sinh (tùy chọn)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Để trống nếu thí sinh tự nhập"
                  value={form.candidateName}
                  onChange={e => setForm({ ...form, candidateName: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Đang tạo...' : '🎫 Tạo ca thi'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="card">
          {loadingData ? (
            <p className="text-muted">Đang tải...</p>
          ) : sessions.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Mã ca thi</th>
                  <th>Đề thi</th>
                  <th>Thí sinh</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session: any) => (
                  <tr key={session.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{session.code}</td>
                    <td>{(session.exams as any)?.name}</td>
                    <td>{session.candidate_name || '—'}</td>
                    <td>
                      <span className={`badge ${
                        session.status === 'completed' ? 'badge-success' :
                        session.status === 'active' ? 'badge-warning' :
                        session.status === 'waiting' ? 'badge-info' : 'badge-danger'
                      }`}>
                        {session.status === 'completed' ? 'Hoàn thành' :
                         session.status === 'active' ? 'Đang thi' :
                         session.status === 'waiting' ? 'Chờ' : 'Hết hạn'}
                      </span>
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(session.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {session.status === 'waiting' && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => handleStatusChange(session.id, 'active')}
                          >
                            ▶ Bắt đầu
                          </button>
                        )}
                        {session.status === 'active' && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => handleStatusChange(session.id, 'completed')}
                          >
                            ⏹ Kết thúc
                          </button>
                        )}
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/exam/${session.code}`)
                          }}
                        >
                          📋 Copy link
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted">Chưa có ca thi nào.</p>
          )}
        </div>
      )}
    </div>
  )
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

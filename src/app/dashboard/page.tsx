'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Exam = {
  id: string
  code: string
  name: string
  status: string
}

type Session = {
  id: string
  exam_id: string
  status: string
}

export default function DashboardPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [examUrl, setExamUrl] = useState('http://localhost:3000')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const url = window.location.origin
      setExamUrl(url)

      const [{ data: examsData }, { data: sessionsData }] = await Promise.all([
        supabase.from('exams').select('*').order('created_at', { ascending: false }),
        supabase.from('sessions').select('id, exam_id, status'),
      ])

      setExams(examsData || [])
      setSessions(sessionsData || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  const itExam = exams.find((e) => e.code === 'IT')
  const monitorExam = exams.find((e) => e.code === 'MONITOR')

  const itSessions = sessions.filter((s) => s.exam_id === itExam?.id)
  const monitorSessions = sessions.filter((s) => s.exam_id === monitorExam?.id)
  const itCompleted = itSessions.filter((s) => s.status === 'completed').length
  const monitorCompleted = monitorSessions.filter((s) => s.status === 'completed').length

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p className="text-muted">Đang tải...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quản lý thi</h1>
        <Link href="/dashboard/exams/new" className="btn btn-primary">
          + Tạo ca thi
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
        {/* IT Section */}
        <div className="card" style={{ border: '2px solid var(--primary)' }}>
          <div style={{
            background: 'var(--primary)',
            color: 'white',
            padding: '0.75rem 1rem',
            margin: '-1rem -1rem 1rem -1rem',
            borderRadius: '0.5rem 0.5rem 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Phần thi IT</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{itSessions.length} ca thi</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--bg)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{itSessions.length}</div>
              <div className="text-sm text-muted">Tổng ca thi</div>
            </div>
            <div style={{ background: 'var(--bg)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{itCompleted}</div>
              <div className="text-sm text-muted">Hoàn thành</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link href="/dashboard/sessions?exam=IT" className="btn btn-primary" style={{ justifyContent: 'center' }}>
              📋 Danh sách ca thi
            </Link>
            <Link href="/dashboard/scoring?exam=IT" className="btn" style={{ justifyContent: 'center', border: '1px solid var(--border)', background: 'white' }}>
              ✅ Chấm điểm
            </Link>
            <Link href="/dashboard/exams/new?exam=IT" className="btn" style={{ justifyContent: 'center', border: '1px solid var(--border)', background: 'white' }}>
              + Tạo ca thi IT
            </Link>
          </div>
        </div>

        {/* Màn hình Section */}
        <div className="card" style={{ border: '2px solid #9333ea' }}>
          <div style={{
            background: '#9333ea',
            color: 'white',
            padding: '0.75rem 1rem',
            margin: '-1rem -1rem 1rem -1rem',
            borderRadius: '0.5rem 0.5rem 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Phần thi Màn hình</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{monitorSessions.length} ca thi</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--bg)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#9333ea' }}>{monitorSessions.length}</div>
              <div className="text-sm text-muted">Tổng ca thi</div>
            </div>
            <div style={{ background: 'var(--bg)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{monitorCompleted}</div>
              <div className="text-sm text-muted">Hoàn thành</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link href="/dashboard/sessions?exam=MONITOR" className="btn btn-primary" style={{ justifyContent: 'center', background: '#9333ea', borderColor: '#9333ea' }}>
              📋 Danh sách ca thi
            </Link>
            <Link href="/dashboard/scoring?exam=MONITOR" className="btn" style={{ justifyContent: 'center', border: '1px solid var(--border)', background: 'white' }}>
              ✅ Chấm điểm
            </Link>
            <Link href="/dashboard/exams/new?exam=MONITOR" className="btn" style={{ justifyContent: 'center', border: '1px solid var(--border)', background: 'white' }}>
              + Tạo ca thi Màn hình
            </Link>
          </div>
        </div>
      </div>

      {/* Link cho giám khảo */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Link cho giám khảo chấm điểm</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="input-label">Link chấm điểm IT</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="input"
                readOnly
                value={`${examUrl}/scoring?exam=IT`}
                style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
              />
              <button
                className="btn"
                style={{ border: '1px solid var(--border)', whiteSpace: 'nowrap' }}
                onClick={() => navigator.clipboard.writeText(`${examUrl}/scoring?exam=IT`)}
              >
                Copy
              </button>
            </div>
          </div>
          <div>
            <label className="input-label">Link chấm điểm Màn hình</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="input"
                readOnly
                value={`${examUrl}/scoring?exam=MONITOR`}
                style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
              />
              <button
                className="btn"
                style={{ border: '1px solid var(--border)', whiteSpace: 'nowrap' }}
                onClick={() => navigator.clipboard.writeText(`${examUrl}/scoring?exam=MONITOR`)}
              >
                Copy
              </button>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted" style={{ marginTop: '0.75rem' }}>
          Giám khảo chỉ cần mở link, điền mã ca thi và chấm điểm. Không cần đăng nhập.
        </p>
      </div>
    </div>
  )
}

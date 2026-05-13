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

      {/* Link cho Ban Giám khảo */}
      <div style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>Ban Giám khảo (BGK)</h2>
          <span className="badge badge-info">4 người</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { num: 1, name: 'Giám khảo 1', code: 'BGK-1', exam: 'IT' },
            { num: 2, name: 'Giám khảo 2', code: 'BGK-2', exam: 'MONITOR' },
            { num: 3, name: 'Giám khảo 3', code: 'BGK-3', exam: 'IT' },
            { num: 4, name: 'Giám khảo 4', code: 'BGK-4', exam: 'MONITOR' },
          ].map((gk) => (
            <div
              key={gk.code}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1rem',
                flexShrink: 0,
              }}>
                {gk.num}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{gk.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{gk.code}</div>
              </div>
              <button
                className="btn"
                style={{
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.75rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                onClick={() => {
                  const link = `${examUrl}/scoring?exam=${gk.exam}&code=${gk.code}`
                  navigator.clipboard.writeText(link)
                }}
              >
                Copy link
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>Giám khảo sinh viên (GK)</h2>
          <span className="badge badge-info">30 người</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
          {Array.from({ length: 30 }, (_, i) => {
            const num = i + 1
            const exam = num <= 15 ? 'IT' : 'MONITOR'
            return (
              <div
                key={num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: exam === 'IT' ? 'var(--primary)' : '#9333ea',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  flexShrink: 0,
                }}>
                  {num}
                </div>
                <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 500 }}>GK {num}</span>
                <button
                  style={{
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.7rem',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    color: 'var(--text)',
                  }}
                  onClick={() => {
                    const link = `${examUrl}/scoring?exam=${exam}&code=GK-${String(num).padStart(2, '0')}`
                    navigator.clipboard.writeText(link)
                  }}
                >
                  Copy
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'

type Session = {
  id: string
  code: string
  candidate_name: string
  status: string
  ended_at: string
  exams: {
    id: string
    name: string
    code: string
  }
  answers: Array<{
    id: string
    answer_value: string
    is_correct: boolean | null
    score_obtained: number
    questions: {
      id: string
      content: string
      score: number
      type: string
    }
  }>
}

export default function PublicScoringPage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string; code?: string }>
}) {
  const params = use(searchParams)
  const [examFilter, setExamFilter] = useState(params.exam || 'IT')
  const [sessionCode, setSessionCode] = useState(params.code || '')
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchSessions()
  }, [examFilter])

  const fetchSessions = async () => {
    setLoading(true)
    const { data: exams } = await supabase
      .from('exams')
      .select('id')
      .eq('code', examFilter)
      .single()

    if (!exams) {
      setSessions([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('sessions')
      .select(`
        *,
        exams:exam_id(id, name, code),
        answers(id, answer_value, is_correct, score_obtained, questions:question_id(id, content, score, type))
      `)
      .eq('exam_id', exams.id)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })

    setSessions((data || []) as Session[])
    setLoading(false)
  }

  const handleSearch = () => {
    if (!sessionCode.trim()) {
      fetchSessions()
      return
    }
    const found = sessions.find(s => s.code.toLowerCase() === sessionCode.toLowerCase())
    if (found) {
      setSelectedSession(found)
      const initialScores: Record<string, number> = {}
      found.answers.forEach((a: any) => {
        initialScores[a.id] = a.score_obtained || 0
      })
      setScores(initialScores)
    } else {
      alert('Không tìm thấy ca thi với mã: ' + sessionCode)
    }
  }

  const handleSaveScore = async (session: Session) => {
    setSaving(true)

    for (const answer of session.answers) {
      const score = scores[answer.id] || 0
      await supabase
        .from('answers')
        .update({
          score_obtained: score,
          is_correct: score >= (answer.questions.score / 2),
          graded_at: new Date().toISOString(),
        })
        .eq('id', answer.id)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const examColor = examFilter === 'MONITOR' ? '#9333ea' : 'var(--primary)'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: examColor }}>
            Chấm điểm - Phần thi {examFilter === 'MONITOR' ? 'Màn hình' : 'IT'}
          </h1>
          <p className="text-muted text-sm">Giám khảo không cần đăng nhập</p>
        </div>

        {/* Exam filter tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            onClick={() => { setExamFilter('IT'); setSelectedSession(null) }}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              background: examFilter === 'IT' ? 'var(--primary)' : 'white',
              color: examFilter === 'IT' ? 'white' : 'var(--text)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Phần thi IT
          </button>
          <button
            onClick={() => { setExamFilter('MONITOR'); setSelectedSession(null) }}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              background: examFilter === 'MONITOR' ? '#9333ea' : 'white',
              color: examFilter === 'MONITOR' ? 'white' : 'var(--text)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Phần thi Màn hình
          </button>
        </div>

        {/* Search by code */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <label className="input-label">Tìm theo mã ca thi</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="input"
              placeholder="Nhập mã ca thi (VD: IT-2026-001)"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={handleSearch}>
              Tìm
            </button>
          </div>
        </div>

        {/* Session list or selected session */}
        {!selectedSession ? (
          <>
            <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
              Danh sách ca thi ({sessions.length})
            </h3>
            {loading ? (
              <p className="text-muted">Đang tải...</p>
            ) : sessions.length === 0 ? (
              <p className="text-muted">Chưa có ca thi nào.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {sessions.map(session => {
                  const totalScore = session.answers.reduce((sum, a) => sum + (a.score_obtained || 0), 0)
                  const maxScore = session.answers.reduce((sum, a) => sum + a.questions.score, 0)

                  return (
                    <div
                      key={session.id}
                      className="card"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedSession(session)
                        const initialScores: Record<string, number> = {}
                        session.answers.forEach((a: any) => {
                          initialScores[a.id] = a.score_obtained || 0
                        })
                        setScores(initialScores)
                      }}
                    >
                      <div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem' }}>
                          {session.code}
                        </div>
                        <div className="text-sm text-muted">{session.candidate_name || 'Thí sinh'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>{totalScore}/{maxScore}</div>
                        <div className="text-sm text-muted">
                          {session.ended_at ? new Date(session.ended_at).toLocaleString('vi-VN') : ''}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Back button & session info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <button
                className="btn"
                style={{ border: '1px solid var(--border)', background: 'white' }}
                onClick={() => setSelectedSession(null)}
              >
                Quay lại danh sách
              </button>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: 'monospace' }}>
                  {selectedSession.code}
                </div>
                <div className="text-sm text-muted">{selectedSession.candidate_name || 'Thí sinh'}</div>
              </div>
            </div>

            {/* Scoring form */}
            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Câu trả lời</h3>
              {selectedSession.answers.map((answer, idx) => (
                <div
                  key={answer.id}
                  style={{
                    padding: '1rem',
                    borderBottom: idx < selectedSession.answers.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
                    Câu {idx + 1}: {answer.questions.content}
                  </div>
                  <div style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <strong>Trả lời:</strong> {answer.answer_value || '(không có)'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label className="text-sm">Điểm:</label>
                    <input
                      type="number"
                      min={0}
                      max={answer.questions.score}
                      className="input"
                      style={{ width: '80px' }}
                      value={scores[answer.id] || 0}
                      onChange={(e) => setScores({ ...scores, [answer.id]: parseInt(e.target.value) || 0 })}
                    />
                    <span className="text-sm text-muted">/ {answer.questions.score}</span>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600 }}>
                  Tổng điểm: {
                    Object.values(scores).reduce((sum, s) => sum + s, 0)
                  }/{selectedSession.answers.reduce((sum, a) => sum + a.questions.score, 0)}
                </div>
                <button
                  className="btn btn-primary"
                  style={{ background: examColor, borderColor: examColor }}
                  onClick={() => handleSaveScore(selectedSession)}
                  disabled={saving}
                >
                  {saving ? 'Đang lưu...' : saved ? 'Đã lưu!' : 'Lưu điểm'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

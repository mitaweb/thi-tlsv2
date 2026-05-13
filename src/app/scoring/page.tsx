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
  const [examinerCode, setExaminerCode] = useState(params.code || '')
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copyMsg, setCopyMsg] = useState('')

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

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}/scoring?exam=${examFilter}&code=${code}`
    navigator.clipboard.writeText(url)
    setCopyMsg('Đã copy!')
    setTimeout(() => setCopyMsg(''), 2000)
  }

  const handleSelectSession = (session: Session) => {
    setSelectedSession(session)
    const initialScores: Record<string, number> = {}
    session.answers.forEach((a: any) => {
      initialScores[a.id] = a.score_obtained || 0
    })
    setScores(initialScores)
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
  const bgkNumbers = ['BGK-1', 'BGK-2', 'BGK-3', 'BGK-4']
  const isBgv = examinerCode && bgkNumbers.includes(examinerCode)
  const isGk = examinerCode && examinerCode.startsWith('GK-')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1rem',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            padding: '0.75rem 1.5rem',
            marginBottom: '0.5rem',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: examColor,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.25rem',
            }}>
              {examinerCode ? (examinerCode.startsWith('BGK') ? examinerCode.split('-')[1] : examinerCode.split('-')[1]) : '?'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: examColor }}>
                {isBgv ? `Ban Giám khảo ${examinerCode.split('-')[1]}` :
                 isGk ? `Giám khảo SV ${parseInt(examinerCode.split('-')[1])}` :
                 examinerCode ? examinerCode : 'Chấm điểm'}
              </div>
              <div className="text-sm text-muted">
                Phần thi {examFilter === 'MONITOR' ? 'Màn hình' : 'IT'} · {sessions.length} bài thi
              </div>
            </div>
          </div>
          {examinerCode && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => setExamFilter(examFilter === 'IT' ? 'MONITOR' : 'IT')}
                style={{
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.8rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  background: 'var(--card)',
                  cursor: 'pointer',
                }}
              >
                Chuyển sang {examFilter === 'IT' ? 'Màn hình' : 'IT'}
              </button>
              <button
                onClick={() => handleCopyLink(examinerCode)}
                style={{
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.8rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  background: copyMsg ? '#dcfce7' : 'var(--card)',
                  cursor: 'pointer',
                  color: copyMsg ? 'var(--success)' : 'var(--text)',
                }}
              >
                {copyMsg || 'Share link'}
              </button>
            </div>
          )}
        </div>

        {/* Exam filter tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            onClick={() => { setExamFilter('IT'); setSelectedSession(null) }}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              background: examFilter === 'IT' ? 'var(--primary)' : 'var(--card)',
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
              background: examFilter === 'MONITOR' ? '#9333ea' : 'var(--card)',
              color: examFilter === 'MONITOR' ? 'white' : 'var(--text)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Phần thi Màn hình
          </button>
        </div>

        {/* Session list or selected session */}
        {!selectedSession ? (
          <>
            <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
              Danh sách bài thi ({sessions.length})
            </h3>
            {loading ? (
              <p className="text-muted">Đang tải...</p>
            ) : sessions.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                <p className="text-muted">Chưa có bài thi nào trong phần thi này.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {sessions.map(session => {
                  const totalScore = session.answers.reduce((sum, a) => sum + (a.score_obtained || 0), 0)
                  const maxScore = session.answers.reduce((sum, a) => sum + a.questions.score, 0)

                  return (
                    <div
                      key={session.id}
                      className="card"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        borderLeft: `4px solid ${examColor}`,
                      }}
                      onClick={() => handleSelectSession(session)}
                    >
                      <div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem' }}>
                          {session.code}
                        </div>
                        <div className="text-sm text-muted">{session.candidate_name || 'Thí sinh'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                          {totalScore}/{maxScore}
                        </div>
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
                style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
                onClick={() => setSelectedSession(null)}
              >
                Quay lại
              </button>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: 'monospace', color: examColor }}>
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
                  <div style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', background: 'var(--bg)', padding: '0.5rem', borderRadius: '0.375rem' }}>
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

              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'var(--bg)',
                borderRadius: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  Tổng: {Object.values(scores).reduce((sum, s) => sum + s, 0)}/{selectedSession.answers.reduce((sum, a) => sum + a.questions.score, 0)}
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

'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ScoringDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [session, setSession] = useState<any>(null)
  const [exam, setExam] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: sess } = await supabase.from('sessions').select('*, exams:exam_id(*)').eq('id', id).single()
      if (!sess) return

      setSession(sess)
      setExam(sess.exams)

      const { data: qs } = await supabase
        .from('questions')
        .select('*, answer_options(*)')
        .eq('exam_id', sess.exam_id)
        .order('order_index')

      const { data: as } = await supabase
        .from('answers')
        .select('*')
        .eq('session_id', id)

      setQuestions(qs || [])
      setAnswers(as || [])
      setLoading(false)
    }
    load()
  }, [id])

  const updateScore = (answerId: string, score: number) => {
    setAnswers(prev => prev.map(a => a.id === answerId ? { ...a, score_obtained: score } : a))
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    for (const answer of answers) {
      const q = questions.find(q => q.id === answer.question_id)
      const isCorrect = q?.type === 'text' || q?.type === 'file_upload'
        ? null
        : answer.answer_value === q?.answer_options?.find((o: any) => o.is_correct)?.id

      await supabase.from('answers').update({
        score_obtained: answer.score_obtained || 0,
        is_correct: isCorrect,
        graded_at: new Date().toISOString(),
        graded_by: userId,
      }).eq('id', answer.id)
    }

    const totalScore = answers.reduce((sum, a) => sum + (a.score_obtained || 0), 0)
    const maxScore = questions.reduce((sum, q) => sum + q.score, 0)

    await supabase.from('score_histories').insert({
      session_id: id,
      scored_by: userId,
      total_score: totalScore,
      max_score: maxScore,
    })

    setSaving(false)
    router.push('/dashboard/scoring')
    router.refresh()
  }

  if (loading) return <div className="text-muted">Đang tải...</div>
  if (!session) return <div className="alert alert-error">Không tìm thấy ca thi.</div>

  const totalScore = answers.reduce((sum, a) => sum + (a.score_obtained || 0), 0)
  const maxScore = questions.reduce((sum, q) => sum + q.score, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Chấm điểm: {session.code}</h1>
          <p className="text-sm text-muted">
            {(exam as any)?.name} — {session.candidate_name || 'Thí sinh'}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Tổng: {totalScore}/{maxScore}
          </span>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : '💾 Lưu điểm'}
          </button>
          <button className="btn btn-secondary" onClick={() => router.push('/dashboard/scoring')}>
            ← Quay lại
          </button>
        </div>
      </div>

      {questions.map((q, qi) => {
        const answer = answers.find(a => a.question_id === q.id)
        const correctOption = q.answer_options?.find((o: any) => o.is_correct)
        const isAutoGraded = q.type === 'single_choice' || q.type === 'multiple_choice'

        return (
          <div key={q.id} className="card mb-4">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div className="flex items-center gap-2">
                <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '0.375rem', padding: '0.25rem 0.625rem', fontWeight: 600 }}>
                  Câu {qi + 1}
                </span>
                <span className="badge badge-info">
                  {q.type === 'single_choice' ? 'Một đáp án' :
                   q.type === 'multiple_choice' ? 'Nhiều đáp án' :
                   q.type === 'text' ? 'Tự luận' : 'Upload file'}
                </span>
                <span className="text-sm text-muted">{q.score} điểm</span>
              </div>
              {answer?.graded_at && (
                <span className="badge badge-success">Đã chấm</span>
              )}
            </div>

            <div style={{ marginBottom: '1rem', fontWeight: 500 }}>{q.content}</div>

            {(q.type === 'single_choice' || q.type === 'multiple_choice') && (
              <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: '0.5rem' }}>
                {q.answer_options?.sort((a: any, b: any) => a.order_index - b.order_index).map((opt: any) => {
                  const isSelected = answer?.answer_value?.split(',').includes(opt.id)
                  const isCorrectOpt = opt.is_correct

                  return (
                    <div key={opt.id} style={{
                      padding: '0.5rem',
                      marginBottom: '0.25rem',
                      borderRadius: '0.375rem',
                      background: isCorrectOpt ? '#dcfce7' : isSelected ? '#fee2e2' : 'transparent',
                      border: isCorrectOpt ? '2px solid var(--success)' : isSelected ? '2px solid var(--danger)' : '1px solid var(--border)',
                    }}>
                      <span style={{ fontWeight: 600 }}>{opt.option_key}.</span> {opt.content}
                      {isCorrectOpt && <span style={{ color: 'var(--success)', marginLeft: '0.5rem' }}>✓ Đáp án đúng</span>}
                      {isSelected && !isCorrectOpt && <span style={{ color: 'var(--danger)', marginLeft: '0.5rem' }}>✗ Sai</span>}
                    </div>
                  )
                })}
              </div>
            )}

            {(q.type === 'text' || q.type === 'file_upload') && answer && (
              <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: '0.5rem' }}>
                {answer.answer_value ? (
                  <div>
                    <div className="text-sm text-muted" style={{ marginBottom: '0.25rem' }}>Câu trả lời:</div>
                    {q.type === 'file_upload' ? (
                      <a href={answer.answer_value} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                        📎 Xem file đã nộp
                      </a>
                    ) : (
                      <div>{answer.answer_value}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted">Thí sinh chưa trả lời.</div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0, width: '120px' }}>
                <label className="input-label">Điểm</label>
                <input
                  type="number"
                  className="input"
                  min={0}
                  max={q.score}
                  value={answer?.score_obtained ?? 0}
                  onChange={e => updateScore(answer?.id, parseInt(e.target.value))}
                />
              </div>
              <span className="text-muted text-sm" style={{ paddingTop: '1.5rem' }}>
                / {q.score} điểm
              </span>

              {q.explanation && (
                <div style={{ flex: 1, padding: '0.75rem', background: '#eff6ff', borderRadius: '0.5rem', fontSize: '0.875rem', marginLeft: '1rem' }}>
                  <span className="text-muted">💡</span> {q.explanation}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

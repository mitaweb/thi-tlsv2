'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Session = {
  id: string
  code: string
  candidate_name: string | null
  status: string
  exam_id: string
  exams: any
  started_at: string
}

type Question = {
  id: string
  type: string
  content: string
  media_url: string | null
  score: number
  answer_options: any[]
}

type Answer = {
  question_id: string
  answer_value: string | null
  file_url: string | null
}

export default function StudentExamClient({ session, questions }: { session: Session; questions: Question[] }) {
  const supabase = createClient()
  const exam = session.exams

  const [status, setStatus] = useState(session.status)
  const [candidateName, setCandidateName] = useState(session.candidate_name || '')
  const [nameConfirmed, setNameConfirmed] = useState(!!session.candidate_name)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [timeLeft, setTimeLeft] = useState(exam.duration_minutes * 60)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(status === 'completed')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Realtime: listen to session status changes
  useEffect(() => {
    const channel = supabase
      .channel(`session-${session.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${session.id}`,
      }, (payload) => {
        const newStatus = payload.new.status
        if (newStatus === 'expired' && status !== 'completed') {
          handleSubmit(true)
        }
        setStatus(newStatus)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session.id, status])

  // Timer
  useEffect(() => {
    if (status !== 'active' || submitted) return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [status, submitted])

  // Auto-save answers
  useEffect(() => {
    if (status !== 'active' || submitted) return
    const interval = setInterval(async () => {
      await saveAnswers()
    }, 15000)
    return () => clearInterval(interval)
  }, [answers, status, submitted])

  const saveAnswers = async () => {
    setSaving(true)
    for (const [qId, ans] of Object.entries(answers)) {
      await supabase.from('answers').upsert({
        session_id: session.id,
        question_id: qId,
        answer_value: ans.answer_value,
        file_url: ans.file_url,
      }, { onConflict: 'session_id,question_id' })
    }
    setSaving(false)
  }

  const handleStartExam = async () => {
    if (!candidateName.trim()) {
      setError('Vui lòng nhập tên của bạn')
      return
    }
    setError('')

    await supabase.from('sessions').update({
      status: 'active',
      candidate_name: candidateName.trim(),
      started_at: new Date().toISOString(),
    }).eq('id', session.id)

    setStatus('active')
    setNameConfirmed(true)
  }

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], question_id: questionId, answer_value: value, file_url: prev[questionId]?.file_url || null },
    }))
  }

  const handleFileUpload = async (questionId: string, file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${session.id}/${questionId}/${Date.now()}.${fileExt}`

    const { data, error: uploadError } = await supabase.storage
      .from('exam-uploads')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      setError('Upload file thất bại: ' + uploadError.message)
      return
    }

    const { data: urlData } = supabase.storage.from('exam-uploads').getPublicUrl(fileName)

    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], question_id: questionId, answer_value: file.name, file_url: urlData.publicUrl },
    }))
  }

  const handleSubmit = async (auto = false) => {
    setSubmitting(true)
    await saveAnswers()

    await supabase.from('sessions').update({
      status: 'completed',
      ended_at: new Date().toISOString(),
    }).eq('id', session.id)

    // Auto-grade for choice questions
    for (const q of questions) {
      if (q.type === 'single_choice' || q.type === 'multiple_choice') {
        const answer = answers[q.id]
        const correctOpt = q.answer_options.find(o => o.is_correct)
        const isCorrect = answer?.answer_value === correctOpt?.id

        if (answer) {
          await supabase.from('answers').upsert({
            session_id: session.id,
            question_id: q.id,
            answer_value: answer.answer_value,
            file_url: answer.file_url,
            is_correct: isCorrect,
            score_obtained: isCorrect ? q.score : 0,
            graded_at: new Date().toISOString(),
          }, { onConflict: 'session_id,question_id' })
        }
      }
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const answeredCount = Object.keys(answers).filter(k => answers[k]?.answer_value || answers[k]?.file_url).length

  // Not found
  if (!exam) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Không tìm thấy ca thi</h2>
          <p className="text-muted">Mã ca thi "{session.code}" không tồn tại.</p>
        </div>
      </div>
    )
  }

  // Submitted
  if (submitted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: '450px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Đã nộp bài!</h2>
          <p className="text-muted">Bài thi của bạn đã được gửi thành công.</p>
          <p className="text-sm text-muted mt-4">
            Bài thi: <strong>{exam.name}</strong>
          </p>
          <p className="text-sm text-muted">
            Mã ca: <strong style={{ fontFamily: 'monospace' }}>{session.code}</strong>
          </p>
        </div>
      </div>
    )
  }

  // Waiting / Not active
  if (status === 'waiting') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: '450px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h2 style={{ marginBottom: '0.5rem' }}>{exam.name}</h2>
          <p className="text-muted mb-6">{exam.description}</p>

          <div style={{ background: 'var(--bg)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="text-muted">Mã ca thi:</span>
              <strong style={{ fontFamily: 'monospace' }}>{session.code}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="text-muted">Thời gian:</span>
              <strong>{exam.duration_minutes} phút</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Số câu hỏi:</span>
              <strong>{questions.length}</strong>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {!nameConfirmed ? (
            <div style={{ textAlign: 'left' }}>
              <div className="form-group">
                <label className="input-label">Nhập tên của bạn</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Họ và tên"
                  value={candidateName}
                  onChange={e => setCandidateName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleStartExam()}
                />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleStartExam}>
                Bắt đầu thi
              </button>
            </div>
          ) : (
            <div>
              <p className="text-muted mb-4">Xin chào, <strong>{candidateName}</strong></p>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleStartExam}>
                ▶ Bắt đầu thi
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Expired
  if (status === 'expired') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏰</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Hết giờ!</h2>
          <p className="text-muted">Bài thi đã tự động nộp.</p>
        </div>
      </div>
    )
  }

  // Active exam
  const q = questions[currentQ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '0.75rem 1.5rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{exam.name}</strong>
            <span className="text-muted text-sm" style={{ marginLeft: '0.75rem' }}>
              {candidateName}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {saving && <span className="text-sm text-muted">Đang lưu...</span>}
            <div style={{
              fontFamily: 'monospace',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: timeLeft < 300 ? 'var(--danger)' : 'var(--text)',
            }}>
              {formatTime(timeLeft)}
            </div>
            <button
              className="btn btn-success"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
            >
              {submitting ? 'Đang nộp...' : '✅ Nộp bài'}
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Progress */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span className="text-sm text-muted">
              Câu {currentQ + 1} / {questions.length}
            </span>
            <span className="text-sm text-muted">
              Đã trả lời: {answeredCount}/{questions.length}
            </span>
          </div>
          <div style={{ height: '4px', background: 'var(--border)', borderRadius: '9999px' }}>
            <div style={{
              height: '100%',
              background: 'var(--primary)',
              borderRadius: '9999px',
              width: `${((currentQ + 1) / questions.length) * 100}%`,
              transition: 'width 0.3s',
            }} />
          </div>
        </div>

        {/* Question nav pills */}
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {questions.map((_, i) => {
            const ans = answers[questions[i].id]
            const hasAnswer = ans?.answer_value || ans?.file_url
            return (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '0.375rem',
                  border: i === currentQ ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: hasAnswer ? 'var(--primary)' : i === currentQ ? '#eff6ff' : 'var(--card)',
                  color: hasAnswer ? 'white' : 'var(--text)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {i + 1}
              </button>
            )
          })}
        </div>

        {/* Question content */}
        {q && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '0.375rem', padding: '0.25rem 0.75rem', fontWeight: 600 }}>
                Câu {currentQ + 1}
              </span>
              <span className="badge badge-info">{q.score} điểm</span>
            </div>

            <div style={{ fontWeight: 500, fontSize: '1.05rem', marginBottom: '1.5rem' }}>
              {q.content}
            </div>

            {/* Single choice */}
            {q.type === 'single_choice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {q.answer_options.map((opt: any) => (
                  <label
                    key={opt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      background: answers[q.id]?.answer_value === opt.id ? '#eff6ff' : 'var(--card)',
                      borderColor: answers[q.id]?.answer_value === opt.id ? 'var(--primary)' : 'var(--border)',
                    }}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[q.id]?.answer_value === opt.id}
                      onChange={() => handleAnswer(q.id, opt.id)}
                      style={{ width: '1.125rem', height: '1.125rem' }}
                    />
                    <span style={{ fontWeight: 600 }}>{opt.option_key}.</span>
                    <span>{opt.content}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Multiple choice */}
            {q.type === 'multiple_choice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {q.answer_options.map((opt: any) => {
                  const selected = answers[q.id]?.answer_value?.split(',').includes(opt.id) || false
                  return (
                    <label
                      key={opt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        background: selected ? '#eff6ff' : 'var(--card)',
                        borderColor: selected ? 'var(--primary)' : 'var(--border)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          const current = answers[q.id]?.answer_value?.split(',').filter(Boolean) || []
                          const next = selected
                            ? current.filter(id => id !== opt.id)
                            : [...current, opt.id]
                          handleAnswer(q.id, next.join(','))
                        }}
                        style={{ width: '1.125rem', height: '1.125rem' }}
                      />
                      <span style={{ fontWeight: 600 }}>{opt.option_key}.</span>
                      <span>{opt.content}</span>
                    </label>
                  )
                })}
              </div>
            )}

            {/* Text answer */}
            {q.type === 'text' && (
              <textarea
                className="input"
                rows={6}
                placeholder="Nhập câu trả lời của bạn..."
                value={answers[q.id]?.answer_value || ''}
                onChange={e => handleAnswer(q.id, e.target.value)}
              />
            )}

            {/* File upload */}
            {q.type === 'file_upload' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(q.id, file)
                  }}
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📎 Chọn file
                </button>
                {answers[q.id]?.file_url && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg)', borderRadius: '0.5rem' }}>
                    <span>✅ {answers[q.id].answer_value}</span>
                    <button
                      className="btn btn-secondary"
                      style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                      onClick={() => handleAnswer(q.id, '')}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
            disabled={currentQ === 0}
          >
            ← Câu trước
          </button>

          {currentQ < questions.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={() => setCurrentQ(currentQ + 1)}
            >
              Câu tiếp →
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
            >
              {submitting ? 'Đang nộp...' : '✅ Nộp bài'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

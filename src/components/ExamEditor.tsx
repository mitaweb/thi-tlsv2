'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types'

type Exam = Database['public']['Tables']['exams']['Row']
type Question = Database['public']['Tables']['questions']['Row'] & {
  answer_options: Database['public']['Tables']['answer_options']['Row'][]
}
type AnswerOption = Database['public']['Tables']['answer_options']['Row']

type QuestionInput = {
  id?: string
  type: 'single_choice' | 'multiple_choice' | 'text' | 'file_upload'
  content: string
  media_url: string | null
  score: number
  explanation: string | null
  order_index: number
  answer_options: AnswerOption[]
}

export default function ExamEditor({
  exam,
  initialQuestions,
}: {
  exam: Exam
  initialQuestions: Question[]
}) {
  const router = useRouter()
  const supabase = createClient()

  const [questions, setQuestions] = useState<QuestionInput[]>(
    initialQuestions.length > 0
      ? initialQuestions.map(q => ({
          ...q,
          answer_options: q.answer_options.sort((a, b) => a.order_index - b.order_index),
        }))
      : []
  )
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importStatus, setImportStatus] = useState('')
  const [status, setStatus] = useState(exam.status)
  const [examInfo, setExamInfo] = useState({
    name: exam.name,
    code: exam.code,
    description: exam.description || '',
    category: (exam as any).category || 'sinh_vien',
    duration_minutes: exam.duration_minutes,
    total_score: exam.total_score,
  })

  const addQuestion = (type: QuestionInput['type']) => {
    setQuestions(prev => [
      ...prev,
      {
        type,
        content: '',
        media_url: null,
        score: 1,
        explanation: null,
        order_index: prev.length,
        answer_options: type === 'single_choice' || type === 'multiple_choice'
          ? [
              { id: crypto.randomUUID(), question_id: '', option_key: 'A', content: '', is_correct: false, order_index: 0, created_at: '' },
              { id: crypto.randomUUID(), question_id: '', option_key: 'B', content: '', is_correct: false, order_index: 1, created_at: '' },
              { id: crypto.randomUUID(), question_id: '', option_key: 'C', content: '', is_correct: false, order_index: 2, created_at: '' },
              { id: crypto.randomUUID(), question_id: '', option_key: 'D', content: '', is_correct: false, order_index: 3, created_at: '' },
            ]
          : [],
      },
    ])
  }

  const updateQuestion = (index: number, field: keyof QuestionInput, value: any) => {
    setQuestions(prev => prev.map((q, i) =>
      i === index ? { ...q, [field]: value } : q
    ))
  }

  const updateOption = (qIndex: number, optIndex: number, field: keyof AnswerOption, value: any) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q
      const newOpts = q.answer_options.map((o, oi) =>
        oi === optIndex ? { ...o, [field]: value } : o
      )
      if (field === 'is_correct' && q.type === 'single_choice') {
        return { ...q, answer_options: newOpts.map(o => ({ ...o, is_correct: o === newOpts[optIndex] })) }
      }
      return { ...q, answer_options: newOpts }
    }))
  }

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, order_index: i })))
  }

  const addOption = (qIndex: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q
      const keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      return {
        ...q,
        answer_options: [
          ...q.answer_options,
          {
            id: crypto.randomUUID(),
            question_id: '',
            option_key: keys[q.answer_options.length] || String(q.answer_options.length + 1),
            content: '',
            is_correct: false,
            order_index: q.answer_options.length,
            created_at: '',
          },
        ],
      }
    }))
  }

  const removeOption = (qIndex: number, optIndex: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q
      return {
        ...q,
        answer_options: q.answer_options
          .filter((_, oi) => oi !== optIndex)
          .map((o, oi) => ({ ...o, order_index: oi }))
      }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    // Update exam info
    await supabase.from('exams').update(examInfo).eq('id', exam.id)

    // Delete removed questions
    const initialIds = initialQuestions.map(q => q.id)
    const currentIds = questions.filter(q => q.id).map(q => q.id)
    const deletedIds = initialIds.filter(id => !currentIds.includes(id))
    if (deletedIds.length > 0) {
      await supabase.from('questions').delete().in('id', deletedIds)
    }

    // Upsert questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const { data: savedQ } = await supabase
        .from('questions')
        .upsert({
          id: q.id || undefined,
          exam_id: exam.id,
          type: q.type,
          content: q.content,
          media_url: q.media_url,
          score: q.score,
          explanation: q.explanation,
          order_index: i,
        })
        .select()
        .single()

      if (!savedQ) continue

      // Delete old options and insert new
      await supabase.from('answer_options').delete().eq('question_id', savedQ.id)

      if (q.type === 'single_choice' || q.type === 'multiple_choice') {
        await supabase.from('answer_options').insert(
          q.answer_options.map((o, oi) => ({
            question_id: savedQ.id,
            option_key: o.option_key,
            content: o.content,
            is_correct: o.is_correct,
            order_index: oi,
          }))
        )
      }
    }

    setSaving(false)
    router.refresh()
  }

  const handleImportTxt = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setImporting(true)
      setImportStatus('Đang đọc file...')

      const text = await file.text()
      setImportStatus('Đang import...')

      const res = await fetch('/api/import-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_id: exam.id, txt_content: text }),
      })

      const data = await res.json()
      setImporting(false)

      if (data.success) {
        setImportStatus(`✅ Đã import ${data.imported} câu hỏi!`)
        setTimeout(() => setImportStatus(''), 3000)
        router.refresh()
      } else {
        setImportStatus(`❌ Lỗi: ${data.error}`)
      }
    }
    input.click()
  }

  const questionTypeLabels: Record<string, string> = {
    single_choice: 'Một đáp án',
    multiple_choice: 'Nhiều đáp án',
    text: 'Tự luận',
    file_upload: 'Upload file',
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sửa đề thi: {exam.code}</h1>
          <p className="text-sm text-muted mt-1">Cập nhật câu hỏi và nội dung đề thi</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={handleImportTxt} disabled={importing}>
            {importing ? '⏳ Importing...' : '📥 Import TXT'}
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
          </button>
        </div>
      </div>

      {/* Import Status */}
      {importStatus && (
        <div className={`card mb-4 ${importStatus.includes('❌') ? 'alert alert-error' : 'alert alert-success'}`}>
          {importStatus}
        </div>
      )}

      {/* Exam Info */}
      <div className="card mb-6">
        <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Thông tin đề thi</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="input-label">Mã đề</label>
            <input className="input" value={examInfo.code} onChange={e => setExamInfo({ ...examInfo, code: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="input-label">Tên đề thi</label>
            <input className="input" value={examInfo.name} onChange={e => setExamInfo({ ...examInfo, name: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="input-label">Thời gian (phút)</label>
            <input type="number" className="input" value={examInfo.duration_minutes} onChange={e => setExamInfo({ ...examInfo, duration_minutes: +e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="input-label">Trạng thái</label>
            <select className="input" value={status} onChange={e => setStatus(e.target.value as any)}>
              <option value="draft">Nháp</option>
              <option value="active">Hoạt động</option>
              <option value="archived">Lưu trữ</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginTop: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="input-label">Phân loại đề thi</label>
            <select className="input" value={examInfo.category} onChange={e => setExamInfo({ ...examInfo, category: e.target.value as 'sinh_vien' | 'thpt' })}>
              <option value="sinh_vien">🎓 Thủ lĩnh Sinh viên</option>
              <option value="thpt">🏫 Học sinh THPT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="mb-4">
        <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
          Câu hỏi ({questions.length})
        </h3>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {Object.entries(questionTypeLabels).map(([type, label]) => (
            <button key={type} className="btn btn-secondary" onClick={() => addQuestion(type as any)}>
              + {label}
            </button>
          ))}
        </div>

        {questions.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p className="text-muted">Chưa có câu hỏi nào. Nhấn nút bên trên để thêm.</p>
          </div>
        )}

        {questions.map((q, qi) => (
          <div key={q.id || `new-${qi}`} className="card mb-4">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div className="flex items-center gap-2">
                <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '0.375rem', padding: '0.25rem 0.625rem', fontSize: '0.875rem', fontWeight: 600 }}>
                  Câu {qi + 1}
                </span>
                <span className="badge badge-info">{questionTypeLabels[q.type]}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {q.score} điểm
                </span>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', color: 'var(--danger)', border: 'none' }} onClick={() => removeQuestion(qi)}>
                🗑️
              </button>
            </div>

            <div className="form-group">
              <label className="input-label">Nội dung câu hỏi</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Nhập nội dung câu hỏi..."
                value={q.content}
                onChange={e => updateQuestion(qi, 'content', e.target.value)}
              />
            </div>

            {(q.type === 'single_choice' || q.type === 'multiple_choice') && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="input-label" style={{ margin: 0 }}>
                    Đáp án {q.type === 'multiple_choice' ? '(chọn nhiều)' : '(chọn 1)'}
                  </label>
                  <button className="btn btn-secondary" style={{ padding: '0.25rem 0.625rem', fontSize: '0.8rem' }} onClick={() => addOption(qi)}>
                    + Thêm đáp án
                  </button>
                </div>
                {q.answer_options.map((opt, oi) => (
                  <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type={q.type === 'multiple_choice' ? 'checkbox' : 'radio'}
                      checked={opt.is_correct}
                      onChange={e => updateOption(qi, oi, 'is_correct', e.target.checked)}
                      style={{ width: '1rem', height: '1rem' }}
                    />
                    <input
                      type="text"
                      className="input"
                      style={{ flex: 1 }}
                      placeholder={`Đáp án ${opt.option_key}`}
                      value={opt.content}
                      onChange={e => updateOption(qi, oi, 'content', e.target.value)}
                    />
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => removeOption(qi, oi)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0, width: '100px' }}>
                <label className="input-label">Điểm</label>
                <input
                  type="number"
                  className="input"
                  min={0}
                  value={q.score}
                  onChange={e => updateQuestion(qi, 'score', parseInt(e.target.value))}
                />
              </div>
              <div style={{ flex: 1, margin: 0 }} className="form-group">
                <label className="input-label">Giải thích / Đáp án đúng (tùy chọn)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Hiển thị sau khi chấm điểm..."
                  value={q.explanation || ''}
                  onChange={e => updateQuestion(qi, 'explanation', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

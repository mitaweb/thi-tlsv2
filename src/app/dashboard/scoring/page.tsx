import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ScoringPage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string }>
}) {
  const params = await searchParams
  const examFilter = params.exam || 'IT'

  const supabase = await createClient()

  // Get exams
  const { data: exams } = await supabase
    .from('exams')
    .select('id, name, code')
    .order('code')

  const filteredExam = examFilter === 'MONITOR'
    ? exams?.find((e: any) => e.code === 'MONITOR')
    : exams?.find((e: any) => e.code === 'IT')

  let query = supabase
    .from('sessions')
    .select(`
      *,
      exams:exam_id(id, name, code, duration_minutes),
      answers(id, question_id, answer_value, is_correct, score_obtained, graded_at, questions:question_id(score, content, type))
    `)
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })
    .limit(100)

  if (filteredExam) {
    query = query.eq('exam_id', filteredExam.id)
  }

  const { data: sessions } = await query

  const typedSessions = (sessions || []).map((s: any) => ({
    ...s,
    answers: (s.answers || []).map((a: any) => ({
      ...a,
      questions: a.questions || {},
    })),
  }))

  const pendingScoring = typedSessions.filter(s =>
    s.answers.some((a: any) => a.questions.type === 'text' || a.questions.type === 'file_upload')
  )

  const examUrl = process.env.NEXT_PUBLIC_EXAM_URL || 'http://localhost:3000'
  const scoringUrl = `${examUrl}/scoring`

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Chấm điểm</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            href={`/dashboard/scoring?exam=IT`}
            className={`btn ${examFilter === 'IT' ? 'btn-primary' : ''}`}
            style={examFilter !== 'IT' ? { border: '1px solid var(--border)' } : {}}
          >
            Phần thi IT
          </Link>
          <Link
            href={`/dashboard/scoring?exam=MONITOR`}
            className={`btn ${examFilter === 'MONITOR' ? 'btn-primary' : ''}`}
            style={examFilter !== 'MONITOR' ? { border: '1px solid var(--border)', background: examFilter === 'MONITOR' ? '#9333ea' : 'white', color: examFilter === 'MONITOR' ? 'white' : undefined } : { background: '#9333ea', borderColor: '#9333ea' }}
          >
            Phần thi Màn hình
          </Link>
        </div>
      </div>

      {/* Link for examiners */}
      <div className="card" style={{ marginBottom: '1.5rem', background: '#fef3c7', border: '1px solid #f59e0b' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>Link cho giám khảo (không cần đăng nhập):</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <code style={{ flex: 1, padding: '0.5rem', background: 'white', borderRadius: '0.375rem', fontSize: '0.85rem' }}>
            {scoringUrl}?exam={examFilter}
          </code>
          <button
            className="btn"
            style={{ border: '1px solid var(--border)' }}
            onClick={() => {}}
            data-copy={`${scoringUrl}?exam=${examFilter}`}
          >
            Copy
          </button>
        </div>
      </div>

      {pendingScoring.length > 0 ? (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--warning)' }}>
            Cần chấm tay ({pendingScoring.length})
          </h3>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
            {pendingScoring.map(session => {
              const needsManual = session.answers.filter((a: any) =>
                a.questions.type === 'text' || a.questions.type === 'file_upload'
              )
              const totalScore = session.answers.reduce((sum: number, a: any) => sum + (a.score_obtained || 0), 0)
              const maxScore = session.answers.reduce((sum: number, a: any) => sum + (a.questions.score || 0), 0)

              return (
                <div key={session.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem' }}>
                        {session.code}
                      </div>
                      <div className="text-sm text-muted">{(session.exams as any)?.name}</div>
                      <div className="text-sm text-muted">{session.candidate_name || 'Thí sinh'}</div>
                    </div>
                    <span className="badge badge-warning">Cần chấm tay</span>
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <div className="text-sm text-muted">
                      Điểm hiện tại: <strong>{totalScore}/{maxScore}</strong>
                    </div>
                    <div className="text-sm" style={{ color: 'var(--warning)' }}>
                      {needsManual.length} câu cần chấm tay
                    </div>
                  </div>

                  <a
                    href={`/dashboard/scoring/${session.id}?exam=${examFilter}`}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Chấm điểm
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', marginBottom: '1.5rem' }}>
          <p className="text-muted">Không có bài thi nào cần chấm tay.</p>
        </div>
      )}

      <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Tất cả bài đã chấm</h3>
      <div className="card">
        {typedSessions.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Mã ca thi</th>
                <th>Đề thi</th>
                <th>Thí sinh</th>
                <th>Điểm</th>
                <th>Ngày nộp</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {typedSessions.map((session: any) => {
                const totalScore = session.answers.reduce((sum: number, a: any) => sum + (a.score_obtained || 0), 0)
                const maxScore = session.answers.reduce((sum: number, a: any) => sum + (a.questions.score || 0), 0)
                const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

                return (
                  <tr key={session.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{session.code}</td>
                    <td>{(session.exams as any)?.name}</td>
                    <td>{session.candidate_name || '—'}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{totalScore}/{maxScore}</span>
                      <span className="text-muted text-sm"> ({percentage}%)</span>
                    </td>
                    <td className="text-muted text-sm">
                      {session.ended_at ? new Date(session.ended_at).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td>
                      <a
                        href={`/dashboard/scoring/${session.id}?exam=${examFilter}`}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                      >
                        Xem
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-muted">Chưa có bài thi nào được chấm.</p>
        )}
      </div>
    </div>
  )
}

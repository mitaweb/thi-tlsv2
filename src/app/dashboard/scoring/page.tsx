import { createClient } from '@/lib/supabase/server'

export default async function ScoringPage() {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      *,
      exams:exam_id(id, name, code, duration_minutes),
      answers(id, question_id, answer_value, is_correct, score_obtained, graded_at, questions:question_id(score, content, type))
    `)
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })
    .limit(100)

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

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Chấm điểm</h1>
      </div>

      {pendingScoring.length > 0 ? (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--warning)' }}>
            ⏳ Cần chấm tay ({pendingScoring.length})
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
                    href={`/dashboard/scoring/${session.id}`}
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
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
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
                const needsManual = session.answers.some((a: any) =>
                  a.questions.type === 'text' || a.questions.type === 'file_upload'
                )

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
                        href={`/dashboard/scoring/${session.id}`}
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

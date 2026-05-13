import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: exams }, { data: sessions }, { data: recentSessions }] = await Promise.all([
    supabase.from('exams').select('id', { count: 'exact' }),
    supabase.from('sessions').select('id, status', { count: 'exact' }),
    supabase
      .from('sessions')
      .select('*, exams:exam_id(name, code)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const activeSessions = (sessions as any[])?.filter(s => s.status === 'active').length ?? 0

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tổng quan</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Tổng đề thi" value={exams?.length ?? 0} icon="📝" />
        <StatCard label="Tổng ca thi" value={sessions?.length ?? 0} icon="👥" />
        <StatCard label="Đang thi" value={activeSessions} icon="🟢" color="var(--success)" />
      </div>

      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Ca thi gần đây</h3>
        {recentSessions && recentSessions.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Mã ca thi</th>
                <th>Đề thi</th>
                <th>Thí sinh</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((session: any) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted">Chưa có ca thi nào.</p>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color?: string }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: color || 'var(--text)' }}>{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  )
}

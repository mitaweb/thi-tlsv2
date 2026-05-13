import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ExamsPage() {
  const supabase = await createClient()
  const { data: exams } = await supabase
    .from('exams')
    .select('*, profiles:created_by(full_name)')
    .order('created_at', { ascending: false })

  const sinhVienExams = (exams || []).filter((e: any) => e.category === 'sinh_vien')
  const thptExams = (exams || []).filter((e: any) => e.category === 'thpt')

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Đề thi</h1>
        <Link href="/dashboard/exams/new" className="btn btn-primary">
          + Tạo đề thi
        </Link>
      </div>

      {/* Đề thi Thủ lĩnh Sinh viên */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🎓</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Thủ lĩnh Sinh viên</h2>
        </div>

        <div className="card">
          {sinhVienExams.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên đề thi</th>
                  <th>Thời lượng</th>
                  <th>Điểm</th>
                  <th>Trạng thái</th>
                  <th>Người tạo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sinhVienExams.map((exam: any) => (
                  <tr key={exam.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{exam.code}</td>
                    <td>{exam.name}</td>
                    <td>{exam.duration_minutes} phút</td>
                    <td>{exam.total_score} điểm</td>
                    <td>
                      <span className={`badge ${
                        exam.status === 'active' ? 'badge-success' :
                        exam.status === 'draft' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {exam.status === 'active' ? 'Đang hoạt động' :
                         exam.status === 'draft' ? 'Nháp' : 'Lưu trữ'}
                      </span>
                    </td>
                    <td className="text-muted text-sm">{(exam.profiles as any)?.full_name}</td>
                    <td>
                      <Link href={`/dashboard/exams/${exam.id}`} className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}>
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <p className="text-muted">Chưa có đề thi nào.</p>
              <Link href="/dashboard/exams/new?category=sinh_vien" className="btn btn-primary mt-4">
                + Tạo đề thi Thủ lĩnh Sinh viên
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Đề thi THPT */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🏫</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Học sinh THPT</h2>
        </div>

        <div className="card">
          {thptExams.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên đề thi</th>
                  <th>Thời lượng</th>
                  <th>Điểm</th>
                  <th>Trạng thái</th>
                  <th>Người tạo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {thptExams.map((exam: any) => (
                  <tr key={exam.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{exam.code}</td>
                    <td>{exam.name}</td>
                    <td>{exam.duration_minutes} phút</td>
                    <td>{exam.total_score} điểm</td>
                    <td>
                      <span className={`badge ${
                        exam.status === 'active' ? 'badge-success' :
                        exam.status === 'draft' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {exam.status === 'active' ? 'Đang hoạt động' :
                         exam.status === 'draft' ? 'Nháp' : 'Lưu trữ'}
                      </span>
                    </td>
                    <td className="text-muted text-sm">{(exam.profiles as any)?.full_name}</td>
                    <td>
                      <Link href={`/dashboard/exams/${exam.id}`} className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}>
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <p className="text-muted">Chưa có đề thi nào.</p>
              <Link href="/dashboard/exams/new?category=thpt" className="btn btn-primary mt-4">
                + Tạo đề thi THPT
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

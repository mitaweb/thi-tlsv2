/**
 * Script tạo ca thi hàng loạt cho 13 thí sinh
 * Run: npx tsx scripts/create-sessions.ts
 */

import { createAdminClient } from '../src/lib/supabase/admin.ts'
import * as fs from 'fs'

const supabase = createAdminClient()

const EXAM_CODE = 'THPT-2025' // ← Đổi mã đề thi

const students = {
  'ĐH': [
    'Phạm Hoàng Tấn Lộc',
    'Nguyễn Thành Thái Bảo',
    'Trần Duy Tân',
    'Trần Công Thành',
    'Trần Thị Ngân Phúc',
    'Hà Đức Cường',
    'Lê Quang Thạch Anh',
  ],
  'THPT': [
    'Phạm Nguyễn Bảo Hân',
    'Lương Nguyễn Hiền Trinh',
    'Nguyễn Ngọc Khải Vy',
    'Lê Phan Bảo Phúc',
    'Lê Hoàng Duy',
    'Trần Huỳnh Như',
  ],
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

async function main() {
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id, code, name')
    .eq('code', EXAM_CODE)
    .single()

  if (examError || !exam) {
    console.error('❌ Không tìm thấy đề thi:', EXAM_CODE)
    const { data: allExams } = await supabase.from('exams').select('id, code, name, status')
    console.log('\nDanh sách đề thi hiện có:')
    console.table(allExams || [])
    return
  }

  console.log(`✅ Tìm thấy đề thi: [${exam.code}] ${exam.name}\n`)

  const results: Array<{ group: string; name: string; code: string; url: string; status: string }> = []
  const errors: Array<{ name: string; error: string }> = []

  for (const [group, names] of Object.entries(students)) {
    console.log(`\n📋 Nhóm: ${group}`)
    for (const name of names) {
      const code = generateCode()
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          exam_id: exam.id,
          code,
          candidate_name: name,
          status: 'waiting',
        })
        .select()
        .single()

      if (error) {
        console.log(`  ❌ ${name}: ${error.message}`)
        errors.push({ name, error: error.message })
      } else {
        const url = `${process.env.NEXT_PUBLIC_EXAM_URL || 'http://localhost:3000'}/exam/${code}`
        console.log(`  ✅ ${name} → ${code}`)
        results.push({ group, name, code, url, status: 'OK' })
      }
    }
  }

  // Save results to CSV
  const csv = [
    ['Nhóm', 'Thí sinh', 'Mã ca thi', 'Link'].join(','),
    ...results.map(r => [r.group, r.name, r.code, r.url].join(','))
  ].join('\n')

  fs.writeFileSync('C:/Users/Minh Tam/Desktop/TLSV2/danh-sach-ca-thi.csv', csv, 'utf8')
  fs.writeFileSync('C:/Users/Minh Tam/Desktop/TLSV2/danh-sach-ca-thi.json', JSON.stringify(results, null, 2), 'utf8')

  console.log('\n🎉 Hoàn tất!')
  console.log(`   ✅ Tạo thành công: ${results.length}`)
  console.log(`   ❌ Thất bại: ${errors.length}`)
  console.log('\n📄 Danh sách lưu tại:')
  console.log('   - danh-sach-ca-thi.csv')
  console.log('   - danh-sach-ca-thi.json')
}

main().catch(console.error)

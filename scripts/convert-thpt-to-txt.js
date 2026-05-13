/**
 * Convert XLSX THPT data to importable TXT format
 * Run: node scripts/convert-thpt-to-txt.js
 */

import XLSX from 'xlsx'
import { writeFileSync } from 'fs'

const wb = XLSX.readFile('C:\\Users\\Minh Tam\\Desktop\\TLSV2\\Phần thi trắc nghiệm học sinh THPT (1).xlsx')
const ws = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })

// Skip header row
const data = rows.slice(1).filter(r => r[0] && r[1])

const questions = data.map(r => {
  const stt = r[0]
  const question = r[1]
  const answers = r[2] // "A. ...\nB. ...\nC. ...\nD. ..."
  const correct = r[3]

  // Parse correct answer
  const correctLetter = correct?.match(/^([A-D])/)?.[1] || 'A'
  const correctText = correct?.replace(/^[A-D]\.\s*/, '').trim() || ''

  // Parse options
  const options = {}
  const lines = answers?.split('\n') || []
  for (const line of lines) {
    const m = line.match(/^([A-D])\.\s*(.*)/)
    if (m) options[m[1]] = m[2].trim()
  }

  return {
    stt,
    question: question?.trim(),
    options,
    correct: correctLetter,
    correct_text: correctText,
  }
})

// Output TXT format for import
// Format: CÂU|SỐ THỨ TỰ
// CÂU HỎI: <nội dung>
// A. <đáp án A>
// B. <đáp án B>
// C. <đáp án C>
// D. <đáp án D>
// ĐÚNG: <A/B/C/D>
// KẾT THÚC
let txt = `KHUNG ĐỀ THI THPT 2025
TỔNG SỐ CÂU: ${questions.length}
LOẠI: TRẮC NGHIỆM
THỜI GIAN MỖI CÂU: 30 GIÂY
ĐIỂM MỖI CÂU: 5

---DANH SÁCH CÂU HỎI---

`

for (const q of questions) {
  txt += `CÂU|${q.stt}
CÂU HỎI: ${q.question}
A. ${q.options['A'] || ''}
B. ${q.options['B'] || ''}
C. ${q.options['C'] || ''}
D. ${q.options['D'] || ''}
ĐÚNG: ${q.correct}
KẾT THÚC

`
}

writeFileSync('C:\\Users\\Minh Tam\\Desktop\\TLSV2\\Đề THPT 2025.txt', txt, 'utf8')
console.log('✅ Đã tạo: Đề THPT 2025.txt')
console.log(`   Tổng: ${questions.length} câu hỏi`)

// Print summary
console.log('\n--- Preview ---')
questions.slice(0, 3).forEach(q => {
  console.log(`Câu ${q.stt}: ${q.question?.substring(0, 60)}...`)
  console.log(`  Đúng: ${q.correct} - ${q.correct_text}`)
})

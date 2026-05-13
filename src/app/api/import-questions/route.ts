import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { exam_id?: string; txt_content?: string; file?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { exam_id, txt_content, file } = body
  if (!exam_id || (!txt_content && !file)) {
    return NextResponse.json({ error: 'Missing exam_id or content' }, { status: 400 })
  }

  // Read content
  let content: string
  if (txt_content) {
    content = txt_content
  } else if (file) {
    const res = await fetch(file)
    content = await res.text()
  } else {
    return NextResponse.json({ error: 'No content provided' }, { status: 400 })
  }

  // Parse TXT
  // Format:
  // CÂU|<stt>
  // CÂU HỎI: <nội dung>
  // A. <đáp án A>
  // B. <đáp án B>
  // ...
  // ĐÚNG: <A/B/C/D>
  // KẾT THÚC

  const questions: Array<{
    order_index: number
    type: 'single_choice'
    content: string
    score: number
    explanation: string | null
    answer_options: Array<{ option_key: string; content: string; is_correct: boolean; order_index: number }>
  }> = []

  const blocks = content.split(/KẾT THÚC\s*/i).filter(b => b.trim())

  for (const block of blocks) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean)

    // Parse CÂU|<stt> or just use index
    let orderIndex = questions.length
    const cauMatch = block.match(/CÂU\s*\|\s*(\d+)/i)
    if (cauMatch) {
      orderIndex = parseInt(cauMatch[1]) - 1
    }

    // Find CÂU HỎI
    const questionLine = lines.find(l => l.toUpperCase().startsWith('CÂU HỎI:') || l.toUpperCase().startsWith('CÂU HỎI :'))
    if (!questionLine) continue

    const questionContent = questionLine
      .replace(/^CÂU\s*HỎI\s*:\s*/i, '')
      .replace(/^CÂU\s*HỎI\s*:\s*/i, '')
      .trim()

    // Parse options A, B, C, D
    const options: Array<{ option_key: string; content: string; is_correct: boolean; order_index: number }> = []
    for (const line of lines) {
      const optMatch = line.match(/^([A-Z])\.\s*(.*)/)
      if (optMatch) {
        options.push({
          option_key: optMatch[1],
          content: optMatch[2].trim(),
          is_correct: false,
          order_index: optMatch[1].charCodeAt(0) - 65,
        })
      }
    }

    // Parse correct answer
    const correctLine = lines.find(l => l.toUpperCase().startsWith('ĐÚNG:') || l.toUpperCase().startsWith('DAP AN:'))
    let correctKey = 'A'
    if (correctLine) {
      const m = correctLine.match(/ĐÚNG:\s*([A-D])/i) || correctLine.match(/([A-D])\.\s*./i)
      if (m) correctKey = m[1].toUpperCase()
    }

    const correctOpt = options.find(o => o.option_key === correctKey)
    if (correctOpt) correctOpt.is_correct = true

    // Parse score
    let score = 5
    const scoreMatch = block.match(/ĐIỂM:\s*(\d+)/i)
    if (scoreMatch) score = parseInt(scoreMatch[1])

    questions.push({
      order_index: orderIndex,
      type: 'single_choice',
      content: questionContent,
      score,
      explanation: null,
      answer_options: options.sort((a, b) => a.order_index - b.order_index),
    })
  }

  // Check exam exists
  const { data: exam } = await supabase
    .from('exams')
    .select('id')
    .eq('id', exam_id)
    .single()

  if (!exam) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
  }

  // Delete existing questions for this exam
  const { data: existingQuestions } = await supabase
    .from('questions')
    .select('id')
    .eq('exam_id', exam_id)

  if (existingQuestions && existingQuestions.length > 0) {
    await supabase.from('questions').delete().eq('exam_id', exam_id)
  }

  // Insert new questions
  const insertedQuestions: string[] = []
  for (const q of questions) {
    const { data: savedQ, error: qError } = await supabase
      .from('questions')
      .insert({
        exam_id,
        type: q.type,
        content: q.content,
        score: q.score,
        explanation: q.explanation,
        order_index: q.order_index,
      })
      .select('id')
      .single()

    if (qError || !savedQ) {
      console.error('Question insert error:', qError)
      continue
    }

    insertedQuestions.push(savedQ.id)

    // Insert options
    if (q.answer_options.length > 0) {
      await supabase.from('answer_options').insert(
        q.answer_options.map(o => ({
          question_id: savedQ.id,
          option_key: o.option_key,
          content: o.content,
          is_correct: o.is_correct,
          order_index: o.order_index,
        }))
      )
    }
  }

  return NextResponse.json({
    success: true,
    imported: insertedQuestions.length,
    total_blocks: blocks.length,
  })
}

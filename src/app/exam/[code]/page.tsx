import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StudentExamClient from '@/components/StudentExamClient'

export default async function ExamPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('*, exams:exam_id(*)')
    .eq('code', code)
    .single()

  if (!session) {
    notFound()
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('*, answer_options(*)')
    .eq('exam_id', session.exam_id)
    .order('order_index')

  const typedQuestions = (questions || []).map((q: any) => ({
    ...q,
    answer_options: (q.answer_options || []).sort((a: any, b: any) => a.order_index - b.order_index),
  }))

  return <StudentExamClient session={session} questions={typedQuestions} />
}

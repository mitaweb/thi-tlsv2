import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ExamEditor from '@/components/ExamEditor'

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: exam } = await supabase
    .from('exams')
    .select('*')
    .eq('id', id)
    .single()

  if (!exam) {
    notFound()
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('*, answer_options(*)')
    .eq('exam_id', id)
    .order('order_index')

  const typedQuestions = (questions || []).map((q: any) => ({
    ...q,
    answer_options: q.answer_options || [],
  }))

  return <ExamEditor exam={exam} initialQuestions={typedQuestions} />
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: 'admin' | 'examiner'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: 'admin' | 'examiner'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          role?: 'admin' | 'examiner'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      exams: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          category: 'sinh_vien' | 'thpt'
          duration_minutes: number
          total_score: number
          status: 'draft' | 'active' | 'archived'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          category?: 'sinh_vien' | 'thpt'
          duration_minutes?: number
          total_score?: number
          status?: 'draft' | 'active' | 'archived'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          category?: 'sinh_vien' | 'thpt'
          duration_minutes?: number
          total_score?: number
          status?: 'draft' | 'active' | 'archived'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          exam_id: string
          order_index: number
          type: 'single_choice' | 'multiple_choice' | 'text' | 'file_upload'
          content: string
          media_url: string | null
          score: number
          explanation: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          order_index?: number
          type?: 'single_choice' | 'multiple_choice' | 'text' | 'file_upload'
          content: string
          media_url?: string | null
          score?: number
          explanation?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          order_index?: number
          type?: 'single_choice' | 'multiple_choice' | 'text' | 'file_upload'
          content?: string
          media_url?: string | null
          score?: number
          explanation?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      answer_options: {
        Row: {
          id: string
          question_id: string
          option_key: string
          content: string
          is_correct: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          option_key: string
          content: string
          is_correct?: boolean
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          option_key?: string
          content?: string
          is_correct?: boolean
          order_index?: number
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          exam_id: string
          code: string
          candidate_name: string | null
          started_at: string
          ended_at: string | null
          status: 'waiting' | 'active' | 'completed' | 'expired'
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          code: string
          candidate_name?: string | null
          started_at?: string
          ended_at?: string | null
          status?: 'waiting' | 'active' | 'completed' | 'expired'
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          code?: string
          candidate_name?: string | null
          started_at?: string
          ended_at?: string | null
          status?: 'waiting' | 'active' | 'completed' | 'expired'
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      answers: {
        Row: {
          id: string
          session_id: string
          question_id: string
          answer_value: string | null
          file_url: string | null
          is_correct: boolean | null
          score_obtained: number
          graded_at: string | null
          graded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          question_id: string
          answer_value?: string | null
          file_url?: string | null
          is_correct?: boolean | null
          score_obtained?: number
          graded_at?: string | null
          graded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          question_id?: string
          answer_value?: string | null
          file_url?: string | null
          is_correct?: boolean | null
          score_obtained?: number
          graded_at?: string | null
          graded_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      score_histories: {
        Row: {
          id: string
          session_id: string
          scored_by: string | null
          total_score: number
          max_score: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          scored_by?: string | null
          total_score: number
          max_score: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          scored_by?: string | null
          total_score?: number
          max_score?: number
          created_at?: string
        }
      }
      uploads: {
        Row: {
          id: string
          session_id: string
          question_id: string
          file_name: string
          file_size: number | null
          mime_type: string | null
          storage_path: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          question_id: string
          file_name: string
          file_size?: number | null
          mime_type?: string | null
          storage_path: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          question_id?: string
          file_name?: string
          file_size?: number | null
          mime_type?: string | null
          storage_path?: string
          created_at?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Profile = Tables<'profiles'>
export type Exam = Tables<'exams'>
export type Question = Tables<'questions'>
export type AnswerOption = Tables<'answer_options'>
export type Session = Tables<'sessions'>
export type Answer = Tables<'answers'>
export type ScoreHistory = Tables<'score_histories'>
export type Upload = Tables<'uploads'>

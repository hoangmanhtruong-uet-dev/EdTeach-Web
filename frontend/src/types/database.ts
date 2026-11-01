export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          full_name?: string | null
          role: 'teacher' | 'tutor' | 'student' | 'admin'
          school: string | null
          avatar_url: string | null
          referral_code: string | null
          referred_by: string | null
          tier: 'free' | 'pro' | 'max' | 'school'
          phone?: string | null
          preferences?: Json | null
          teaching_subject?: string | null
          target_grade?: string | null
          organization_name?: string | null
          is_verified_teacher?: boolean
          verified_at?: string | null
          verified_school?: string | null
          verified_teacher_code?: string | null
          affiliate_balance?: number
          total_affiliate_earned?: number
          subscription_expires_at?: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          full_name?: string | null
          role?: 'teacher' | 'tutor' | 'student' | 'admin'
          school?: string | null
          avatar_url?: string | null
          referral_code?: string | null
          referred_by?: string | null
          tier?: 'free' | 'pro' | 'max' | 'school'
          phone?: string | null
          preferences?: Json | null
          teaching_subject?: string | null
          target_grade?: string | null
          organization_name?: string | null
          is_verified_teacher?: boolean
          verified_at?: string | null
          verified_school?: string | null
          verified_teacher_code?: string | null
          affiliate_balance?: number
          total_affiliate_earned?: number
          subscription_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          full_name?: string | null
          role?: 'teacher' | 'tutor' | 'student' | 'admin'
          school?: string | null
          avatar_url?: string | null
          referral_code?: string | null
          referred_by?: string | null
          tier?: 'free' | 'pro' | 'max' | 'school'
          phone?: string | null
          preferences?: Json | null
          teaching_subject?: string | null
          target_grade?: string | null
          organization_name?: string | null
          is_verified_teacher?: boolean
          verified_at?: string | null
          verified_school?: string | null
          verified_teacher_code?: string | null
          affiliate_balance?: number
          total_affiliate_earned?: number
          subscription_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          daily_quota: number
          daily_quota_used: number
          last_quota_reset: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          daily_quota?: number
          daily_quota_used?: number
          last_quota_reset?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          daily_quota?: number
          daily_quota_used?: number
          last_quota_reset?: string
          created_at?: string
          updated_at?: string
        }
      }
      wallet_txns: {
        Row: {
          id: string
          wallet_id: string
          amount: number
          type: 'signup_bonus' | 'generate_exam' | 'export' | 'purchase' | 'refund'
          description: string | null
          ref_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          amount: number
          type: 'signup_bonus' | 'generate_exam' | 'export' | 'purchase' | 'refund'
          description?: string | null
          ref_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          amount?: number
          type?: 'signup_bonus' | 'generate_exam' | 'export' | 'purchase' | 'refund'
          description?: string | null
          ref_id?: string | null
          created_at?: string
        }
      }
      exams: {
        Row: {
          id: string
          user_id: string
          name: string
          title?: string
          subject: string
          grade: string
          chapter: string | null
          config: Json
          status: 'draft' | 'generating' | 'completed' | 'failed'
          credit_cost: number
          question_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          title?: string
          subject: string
          grade: string
          chapter?: string | null
          config?: Json
          status?: 'draft' | 'generating' | 'completed' | 'failed'
          credit_cost?: number
          question_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          title?: string
          subject?: string
          grade?: string
          chapter?: string | null
          config?: Json
          status?: 'draft' | 'generating' | 'completed' | 'failed'
          credit_cost?: number
          question_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          exam_id: string
          type: 'multiple_choice' | 'true_false' | 'essay' | 'fill_blank'
          content: string
          options: Json | null
          correct_answer: string | null
          explanation: string | null
          difficulty: 'easy' | 'medium' | 'hard' | 'very_hard'
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          type: 'multiple_choice' | 'true_false' | 'essay' | 'fill_blank'
          content: string
          options?: Json | null
          correct_answer?: string | null
          explanation?: string | null
          difficulty?: 'easy' | 'medium' | 'hard' | 'very_hard'
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          type?: 'multiple_choice' | 'true_false' | 'essay' | 'fill_blank'
          content?: string
          options?: Json | null
          correct_answer?: string | null
          explanation?: string | null
          difficulty?: 'easy' | 'medium' | 'hard' | 'very_hard'
          order_index?: number
          created_at?: string
        }
      }
      payment_orders: {
        Row: {
          id: string
          user_id: string
          order_code: string
          amount: number
          credits: number
          status: 'pending' | 'paid' | 'cancelled' | 'expired'
          sepay_txn_id: string | null
          created_at: string
          paid_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          order_code: string
          amount: number
          credits: number
          status?: 'pending' | 'paid' | 'cancelled' | 'expired'
          sepay_txn_id?: string | null
          created_at?: string
          paid_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          order_code?: string
          amount?: number
          credits?: number
          status?: 'pending' | 'paid' | 'cancelled' | 'expired'
          sepay_txn_id?: string | null
          created_at?: string
          paid_at?: string | null
        }
      }
      student_reports: {
        Row: {
          id: string
          token: string
          session_id: string
          exam_title: string
          subject: string
          grade: string
          student_id: string
          student_name: string
          student_code: string | null
          score: number
          rank: number | null
          total_students: number | null
          correct_count: number
          incorrect_count: number
          empty_count: number
          metrics: Json
          details: Json
          ai_comment: Json | string | null
          teacher_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          token: string
          session_id: string
          exam_title: string
          subject: string
          grade: string
          student_id: string
          student_name: string
          student_code?: string | null
          score: number
          rank?: number | null
          total_students?: number | null
          correct_count: number
          incorrect_count: number
          empty_count?: number
          metrics?: Json
          details?: Json
          ai_comment?: Json | string | null
          teacher_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          token?: string
          session_id?: string
          exam_title?: string
          subject?: string
          grade?: string
          student_id?: string
          student_name?: string
          student_code?: string | null
          score?: number
          rank?: number | null
          total_students?: number | null
          correct_count?: number
          incorrect_count?: number
          empty_count?: number
          metrics?: Json
          details?: Json
          ai_comment?: Json | string | null
          teacher_note?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      remediation_sheets: {
        Row: {
          id: string
          token: string
          session_id: string
          student_id: string
          student_name: string
          subject: string
          grade: string
          exam_title: string
          target_questions: Json
          cloned_questions: Json
          custom_branding: Json | null
          status: 'pending' | 'in_progress' | 'completed'
          submission_data: Json | null
          score: number | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          token: string
          session_id: string
          student_id: string
          student_name: string
          subject: string
          grade: string
          exam_title: string
          target_questions?: Json
          cloned_questions?: Json
          custom_branding?: Json | null
          status?: 'pending' | 'in_progress' | 'completed'
          submission_data?: Json | null
          score?: number | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          token?: string
          session_id?: string
          student_id?: string
          student_name?: string
          subject?: string
          grade?: string
          exam_title?: string
          target_questions?: Json
          cloned_questions?: Json
          custom_branding?: Json | null
          status?: 'pending' | 'in_progress' | 'completed'
          submission_data?: Json | null
          score?: number | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      teacher_verifications: {
        Row: {
          id: string
          user_id: string
          document_type: 'teacher_card' | 'student_card' | 'degree_certificate' | 'center_card'
          image_url: string
          status: 'pending_review' | 'approved' | 'rejected'
          ocr_extracted_name: string | null
          ocr_extracted_school: string | null
          ocr_extracted_code: string | null
          ocr_confidence: number | null
          role_category: 'teacher' | 'tutor' | 'center_lecturer'
          admin_reviewed_by: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          document_type?: 'teacher_card' | 'student_card' | 'degree_certificate' | 'center_card'
          image_url: string
          status?: 'pending_review' | 'approved' | 'rejected'
          ocr_extracted_name?: string | null
          ocr_extracted_school?: string | null
          ocr_extracted_code?: string | null
          ocr_confidence?: number | null
          role_category?: 'teacher' | 'tutor' | 'center_lecturer'
          admin_reviewed_by?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          document_type?: 'teacher_card' | 'student_card' | 'degree_certificate' | 'center_card'
          image_url?: string
          status?: 'pending_review' | 'approved' | 'rejected'
          ocr_extracted_name?: string | null
          ocr_extracted_school?: string | null
          ocr_extracted_code?: string | null
          ocr_confidence?: number | null
          role_category?: 'teacher' | 'tutor' | 'center_lecturer'
          admin_reviewed_by?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      affiliate_commissions: {
        Row: {
          id: string
          inviter_id: string
          invitee_id: string
          order_code: string
          order_amount: number
          commission_rate: number
          commission_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          inviter_id: string
          invitee_id: string
          order_code: string
          order_amount: number
          commission_rate?: number
          commission_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          inviter_id?: string
          invitee_id?: string
          order_code?: string
          order_amount?: number
          commission_rate?: number
          commission_amount?: number
          created_at?: string
        }
      }
      affiliate_payouts: {
        Row: {
          id: string
          user_id: string
          payout_type: 'cash' | 'credits'
          amount_vnd: number
          credits_received: number
          bank_code: string | null
          bank_account: string | null
          bank_account_name: string | null
          status: 'pending' | 'completed' | 'rejected'
          admin_note: string | null
          reference_code: string | null
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          payout_type: 'cash' | 'credits'
          amount_vnd: number
          credits_received?: number
          bank_code?: string | null
          bank_account?: string | null
          bank_account_name?: string | null
          status?: 'pending' | 'completed' | 'rejected'
          admin_note?: string | null
          reference_code?: string | null
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          payout_type?: 'cash' | 'credits'
          amount_vnd?: number
          credits_received?: number
          bank_code?: string | null
          bank_account?: string | null
          bank_account_name?: string | null
          status?: 'pending' | 'completed' | 'rejected'
          admin_note?: string | null
          reference_code?: string | null
          created_at?: string
          processed_at?: string | null
        }
      }
      student_claimed_reports: {
        Row: {
          id: string
          student_id: string
          report_token: string
          claimed_at: string
        }
        Insert: {
          id?: string
          student_id: string
          report_token: string
          claimed_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          report_token?: string
          claimed_at?: string
        }
      }
      student_exam_enrollments: {
        Row: {
          id: string
          student_id: string
          exam_id: string
          session_id: string | null
          exam_title: string
          subject: string
          grade: string
          teacher_name: string | null
          status: 'assigned' | 'in_progress' | 'completed'
          score: number | null
          submitted_answers: Json
          assigned_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          exam_id: string
          session_id?: string | null
          exam_title: string
          subject: string
          grade: string
          teacher_name?: string | null
          status?: 'assigned' | 'in_progress' | 'completed'
          score?: number | null
          submitted_answers?: Json
          assigned_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          exam_id?: string
          session_id?: string | null
          exam_title?: string
          subject?: string
          grade?: string
          teacher_name?: string | null
          status?: 'assigned' | 'in_progress' | 'completed'
          score?: number | null
          submitted_answers?: Json
          assigned_at?: string
          completed_at?: string | null
        }
      }
      student_practice_enrollments: {
        Row: {
          id: string
          student_id: string
          sheet_token: string
          exam_title: string
          subject: string
          status: 'in_progress' | 'completed'
          score: number | null
          enrolled_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          sheet_token: string
          exam_title: string
          subject: string
          status?: 'in_progress' | 'completed'
          score?: number | null
          enrolled_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          sheet_token?: string
          exam_title?: string
          subject?: string
          status?: 'in_progress' | 'completed'
          score?: number | null
          enrolled_at?: string
          completed_at?: string | null
        }
      }
      live_poll_sessions: {
        Row: {
          id: string
          room_code: string
          teacher_id: string
          teacher_name: string | null
          exam_id: string | null
          question_index: number
          question_title: string
          options: Json
          correct_answer: string | null
          is_open: boolean
          created_at: string
          closed_at: string | null
        }
        Insert: {
          id?: string
          room_code: string
          teacher_id: string
          teacher_name?: string | null
          exam_id?: string | null
          question_index?: number
          question_title: string
          options?: Json
          correct_answer?: string | null
          is_open?: boolean
          created_at?: string
          closed_at?: string | null
        }
        Update: {
          id?: string
          room_code?: string
          teacher_id?: string
          teacher_name?: string | null
          exam_id?: string | null
          question_index?: number
          question_title?: string
          options?: Json
          correct_answer?: string | null
          is_open?: boolean
          created_at?: string
          closed_at?: string | null
        }
      }
      live_poll_votes: {
        Row: {
          id: string
          poll_id: string
          room_code: string
          student_id: string
          student_name: string
          selected_option: string
          is_correct: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          room_code: string
          student_id: string
          student_name: string
          selected_option: string
          is_correct?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          room_code?: string
          student_id?: string
          student_name?: string
          selected_option?: string
          is_correct?: boolean | null
          created_at?: string
        }
      }
      in_app_feedback: {
        Row: {
          id: string
          user_id: string | null
          user_name: string | null
          user_email: string | null
          role: string | null
          category: string
          title: string | null
          content: string
          page_url: string | null
          metadata: Json | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          user_name?: string | null
          user_email?: string | null
          role?: string | null
          category: string
          title?: string | null
          content: string
          page_url?: string | null
          metadata?: Json | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          user_name?: string | null
          user_email?: string | null
          role?: string | null
          category?: string
          title?: string | null
          content?: string
          page_url?: string | null
          metadata?: Json | null
          status?: string
          created_at?: string
        }
      }
    }
  }
}

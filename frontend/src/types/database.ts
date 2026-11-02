export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type WalletTxnType =
  | 'signup_bonus'
  | 'generate_exam'
  | 'export'
  | 'purchase'
  | 'refund'
  | 'marketplace_buy'
  | 'marketplace_sell'
  | 'topup'
  | 'payout_request'
  | 'payout_refund'
  | 'referral_bonus'
  | 'bonus'
  | 'ekyc_bonus'
  | 'subscription_grant'
  | 'ai_usage'
  | 'adjustment'
  | 'admin_grant'

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
          ekyc_rewarded_at?: string | null
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
          ekyc_rewarded_at?: string | null
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
          ekyc_rewarded_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          promotional_balance: number
          purchased_balance: number
          withdrawable_revenue_vnd: number
          escrow_balance_vnd: number
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
          promotional_balance?: number
          purchased_balance?: number
          withdrawable_revenue_vnd?: number
          escrow_balance_vnd?: number
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
          promotional_balance?: number
          purchased_balance?: number
          withdrawable_revenue_vnd?: number
          escrow_balance_vnd?: number
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
          type: WalletTxnType
          description: string | null
          ref_id: string | null
          metadata?: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          amount: number
          type: WalletTxnType
          description?: string | null
          ref_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          amount?: number
          type?: WalletTxnType
          description?: string | null
          ref_id?: string | null
          metadata?: Json | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
          rewarded_at?: string | null
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
          rewarded_at?: string | null
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
          rewarded_at?: string | null
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
      referrals: {
        Row: {
          id: string
          inviter_id: string
          invitee_id: string
          reward_credits: number
          status: 'pending' | 'qualified' | 'rewarded' | 'cancelled'
          qualified_at: string | null
          rewarded_at: string | null
          qualifying_exam_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          inviter_id: string
          invitee_id: string
          reward_credits?: number
          status?: 'pending' | 'qualified' | 'rewarded' | 'cancelled'
          qualified_at?: string | null
          rewarded_at?: string | null
          qualifying_exam_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          inviter_id?: string
          invitee_id?: string
          reward_credits?: number
          status?: 'pending' | 'qualified' | 'rewarded' | 'cancelled'
          qualified_at?: string | null
          rewarded_at?: string | null
          qualifying_exam_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      marketplace_items: {
        Row: {
          id: string
          seller_id: string
          title: string
          subject: string
          grade: number
          description: string | null
          price_credits: number
          question_count: number
          tags: Json | null
          preview_data: Json | null
          downloads_count: number
          rating: number
          review_count: number
          status: 'published' | 'draft' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          title: string
          subject: string
          grade: number
          description?: string | null
          price_credits?: number
          question_count?: number
          tags?: Json | null
          preview_data?: Json | null
          downloads_count?: number
          rating?: number
          review_count?: number
          status?: 'published' | 'draft' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          title?: string
          subject?: string
          grade?: number
          description?: string | null
          price_credits?: number
          question_count?: number
          tags?: Json | null
          preview_data?: Json | null
          downloads_count?: number
          rating?: number
          review_count?: number
          status?: 'published' | 'draft' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
      marketplace_purchases: {
        Row: {
          id: string
          buyer_id: string
          item_id: string
          price_credits: number
          commission_rate: number
          seller_earnings: number
          platform_fee: number
          created_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          item_id: string
          price_credits: number
          commission_rate?: number
          seller_earnings?: number
          platform_fee?: number
          created_at?: string
        }
        Update: {
          id?: string
          buyer_id?: string
          item_id?: string
          price_credits?: number
          commission_rate?: number
          seller_earnings?: number
          platform_fee?: number
          created_at?: string
        }
      }
      marketplace_escrow_holds: {
        Row: {
          id: string
          order_id: string | null
          seller_id: string
          buyer_id: string
          item_id: string
          amount_vnd: number
          status: 'held' | 'released' | 'refunded'
          release_at: string
          created_at: string
          released_at: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          seller_id: string
          buyer_id: string
          item_id: string
          amount_vnd: number
          status?: 'held' | 'released' | 'refunded'
          release_at: string
          created_at?: string
          released_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string | null
          seller_id?: string
          buyer_id?: string
          item_id?: string
          amount_vnd?: number
          status?: 'held' | 'released' | 'refunded'
          release_at?: string
          created_at?: string
          released_at?: string | null
        }
      }
      payout_requests: {
        Row: {
          id: string
          user_id: string
          amount_credits: number
          amount_vnd: number
          bank_name: string
          account_number: string
          account_holder: string
          status: 'pending' | 'processing' | 'completed' | 'rejected'
          admin_note: string | null
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          amount_credits: number
          amount_vnd: number
          bank_name: string
          account_number: string
          account_holder: string
          status?: 'pending' | 'processing' | 'completed' | 'rejected'
          admin_note?: string | null
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          amount_credits?: number
          amount_vnd?: number
          bank_name?: string
          account_number?: string
          account_holder?: string
          status?: 'pending' | 'processing' | 'completed' | 'rejected'
          admin_note?: string | null
          created_at?: string
          processed_at?: string | null
        }
      }
      classrooms: {
        Row: {
          id: string
          teacher_id: string
          name: string
          grade: '10' | '11' | '12'
          subject: string
          academic_year: string
          join_code: string
          join_code_expires_at: string
          is_join_code_active: boolean
          ai_daily_quota: number
          consent_recorded_at: string
          consent_version: string
          consent_statement: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          name: string
          grade: '10' | '11' | '12'
          subject?: string
          academic_year?: string
          join_code: string
          join_code_expires_at?: string
          is_join_code_active?: boolean
          ai_daily_quota?: number
          consent_recorded_at?: string
          consent_version?: string
          consent_statement?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          name?: string
          grade?: '10' | '11' | '12'
          subject?: string
          academic_year?: string
          join_code?: string
          join_code_expires_at?: string
          is_join_code_active?: boolean
          ai_daily_quota?: number
          consent_recorded_at?: string
          consent_version?: string
          consent_statement?: string
          created_at?: string
          updated_at?: string
        }
      }
      classroom_members: {
        Row: {
          id: string
          classroom_id: string
          student_id: string
          display_name: string
          student_code: string | null
          status: 'active' | 'suspended'
          joined_at: string
        }
        Insert: {
          id?: string
          classroom_id: string
          student_id: string
          display_name: string
          student_code?: string | null
          status?: 'active' | 'suspended'
          joined_at?: string
        }
        Update: {
          id?: string
          classroom_id?: string
          student_id?: string
          display_name?: string
          student_code?: string | null
          status?: 'active' | 'suspended'
          joined_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          teacher_id: string
          classroom_id: string
          exam_id: string
          title: string
          duration_minutes: number
          start_at: string
          due_at: string
          show_solutions_at: string | null
          grace_period_seconds: number
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          classroom_id: string
          exam_id: string
          title: string
          duration_minutes?: number
          start_at?: string
          due_at: string
          show_solutions_at?: string | null
          grace_period_seconds?: number
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          classroom_id?: string
          exam_id?: string
          title?: string
          duration_minutes?: number
          start_at?: string
          due_at?: string
          show_solutions_at?: string | null
          grace_period_seconds?: number
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      exam_attempts: {
        Row: {
          id: string
          assignment_id: string
          exam_id: string
          student_id: string
          status: 'in_progress' | 'submitted' | 'graded' | 'timed_out'
          started_at: string
          expires_at: string
          submitted_at: string | null
          answers: Json
          question_timings: Json
          score: number | null
          correct_count: number | null
          total_questions: number
          idempotency_key: string | null
          client_version: number
          telemetry_logs: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          exam_id: string
          student_id: string
          status?: 'in_progress' | 'submitted' | 'graded' | 'timed_out'
          started_at?: string
          expires_at: string
          submitted_at?: string | null
          answers?: Json
          question_timings?: Json
          score?: number | null
          correct_count?: number | null
          total_questions?: number
          idempotency_key?: string | null
          client_version?: number
          telemetry_logs?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          exam_id?: string
          student_id?: string
          status?: 'in_progress' | 'submitted' | 'graded' | 'timed_out'
          started_at?: string
          expires_at?: string
          submitted_at?: string | null
          answers?: Json
          question_timings?: Json
          score?: number | null
          correct_count?: number | null
          total_questions?: number
          idempotency_key?: string | null
          client_version?: number
          telemetry_logs?: Json
          created_at?: string
          updated_at?: string
        }
      }
      student_ai_usage: {
        Row: {
          id: string
          student_id: string
          classroom_id: string | null
          teacher_id: string
          action_type: string
          usage_date: string
          credits_deducted: number
          reservation_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          classroom_id?: string | null
          teacher_id: string
          action_type?: string
          usage_date?: string
          credits_deducted?: number
          reservation_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          classroom_id?: string | null
          teacher_id?: string
          action_type?: string
          usage_date?: string
          credits_deducted?: number
          reservation_id?: string | null
          created_at?: string
        }
      }
      credit_reservations: {
        Row: {
          id: string
          user_id: string
          student_id: string | null
          classroom_id: string | null
          amount: number
          status: 'pending' | 'committed' | 'refunded' | 'expired'
          action: string
          metadata: Json
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          student_id?: string | null
          classroom_id?: string | null
          amount: number
          status?: 'pending' | 'committed' | 'refunded' | 'expired'
          action?: string
          metadata?: Json
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          student_id?: string | null
          classroom_id?: string | null
          amount?: number
          status?: 'pending' | 'committed' | 'refunded' | 'expired'
          action?: string
          metadata?: Json
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      student_submission_links: {
        Row: {
          id: string
          user_id: string | null
          session_id: string
          session_name: string
          subject: string
          grade: string
          class_name: string
          student_name: string | null
          student_code: string | null
          token: string
          duration_minutes: number
          question_count: number
          sheet_type: string
          answer_key: Json
          is_closed: boolean
          submissions_count: number
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id: string
          session_name?: string
          subject?: string
          grade?: string
          class_name?: string
          student_name?: string | null
          student_code?: string | null
          token: string
          duration_minutes?: number
          question_count?: number
          sheet_type?: string
          answer_key?: Json
          is_closed?: boolean
          submissions_count?: number
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string
          session_name?: string
          subject?: string
          grade?: string
          class_name?: string
          student_name?: string | null
          student_code?: string | null
          token?: string
          duration_minutes?: number
          question_count?: number
          sheet_type?: string
          answer_key?: Json
          is_closed?: boolean
          submissions_count?: number
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      student_submissions: {
        Row: {
          id: string
          link_id: string | null
          link_token: string
          session_id: string
          student_name: string
          student_code: string
          class_name: string
          exam_code: string
          score: number
          correct_count: number
          incorrect_count: number
          empty_count: number
          total_questions: number
          answers: Json
          images: Json
          details: Json
          status: 'submitted' | 'graded' | 'pending' | 'rejected'
          source: string
          submitted_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          link_id?: string | null
          link_token: string
          session_id: string
          student_name: string
          student_code?: string
          class_name?: string
          exam_code?: string
          score?: number
          correct_count?: number
          incorrect_count?: number
          empty_count?: number
          total_questions?: number
          answers?: Json
          images?: Json
          details?: Json
          status?: 'submitted' | 'graded' | 'pending' | 'rejected'
          source?: string
          submitted_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          link_id?: string | null
          link_token?: string
          session_id?: string
          student_name?: string
          student_code?: string
          class_name?: string
          exam_code?: string
          score?: number
          correct_count?: number
          incorrect_count?: number
          empty_count?: number
          total_questions?: number
          answers?: Json
          images?: Json
          details?: Json
          status?: 'submitted' | 'graded' | 'pending' | 'rejected'
          source?: string
          submitted_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      remote_cam_sessions: {
        Row: {
          id: string
          teacher_id: string | null
          session_id: string
          session_code: string
          pin: string
          status: 'waiting' | 'connected' | 'active' | 'closed' | 'expired'
          config: Json
          connected: boolean
          connected_at: string | null
          last_active_at: string
          pending_submissions: Json
          latest_result: Json | null
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          teacher_id?: string | null
          session_id: string
          session_code: string
          pin: string
          status?: 'waiting' | 'connected' | 'active' | 'closed' | 'expired'
          config?: Json
          connected?: boolean
          connected_at?: string | null
          last_active_at?: string
          pending_submissions?: Json
          latest_result?: Json | null
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string | null
          session_id?: string
          session_code?: string
          pin?: string
          status?: 'waiting' | 'connected' | 'active' | 'closed' | 'expired'
          config?: Json
          connected?: boolean
          connected_at?: string | null
          last_active_at?: string
          pending_submissions?: Json
          latest_result?: Json | null
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      remote_cam_pin_attempts: {
        Row: {
          ip: string
          attempts: number
          locked_until: string | null
          updated_at: string
        }
        Insert: {
          ip: string
          attempts?: number
          locked_until?: string | null
          updated_at?: string
        }
        Update: {
          ip?: string
          attempts?: number
          locked_until?: string | null
          updated_at?: string
        }
      }
      whiteboards: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          elements: Json
          app_state: Json
          thumbnail_url: string | null
          is_favorite: boolean
          files: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          description?: string | null
          elements?: Json
          app_state?: Json
          thumbnail_url?: string | null
          is_favorite?: boolean
          files?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          elements?: Json
          app_state?: Json
          thumbnail_url?: string | null
          is_favorite?: boolean
          files?: Json
          created_at?: string
          updated_at?: string
        }
      }
      marketplace_item_contents: {
        Row: {
          item_id: string
          exam_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          item_id: string
          exam_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          item_id?: string
          exam_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deduct_user_credits_atomic: {
        Args: {
          p_user_id: string
          p_amount: number
          p_action?: string
          p_metadata?: Json
        }
        Returns: Json
      }
      refund_user_credits_atomic: {
        Args: {
          p_user_id: string
          p_amount: number
          p_action?: string
          p_metadata?: Json
        }
        Returns: Json
      }
      deduct_withdrawable_revenue_atomic: {
        Args: {
          p_user_id: string
          p_amount_vnd: number
          p_payout_type?: string
          p_metadata?: Json
        }
        Returns: Json
      }
      refund_withdrawable_revenue_atomic: {
        Args: {
          p_user_id: string
          p_amount_vnd: number
          p_reason?: string
          p_metadata?: Json
        }
        Returns: Json
      }
      marketplace_purchase_item_v2: {
        Args: {
          p_buyer_id?: string
          p_item_id: string
          p_expected_price?: number | null
        }
        Returns: Json
      }
      release_mature_escrow_atomic: {
        Args: {
          p_hold_id?: string | null
        }
        Returns: Json
      }
      claim_ekyc_reward_atomic: {
        Args: {
          p_user_id: string
          p_admin_id?: string | null
          p_verification_id?: string | null
          p_school_name?: string | null
          p_teacher_code?: string | null
          p_role_category?: string
        }
        Returns: Json
      }
      qualify_and_reward_referral_atomic: {
        Args: {
          p_invitee_id: string
          p_exam_id: string
        }
        Returns: Json
      }
      grade_exam_attempt: {
        Args: {
          p_attempt_id: string
          p_idempotency_key: string
          p_answers: Json
        }
        Returns: Json
      }
      get_student_exam_questions: {
        Args: {
          p_attempt_id: string
        }
        Returns: Json
      }
      reserve_teacher_ai_credits: {
        Args: {
          p_student_id: string
          p_classroom_id: string
          p_amount?: number
        }
        Returns: Json
      }
      commit_teacher_ai_credits: {
        Args: {
          p_reservation_id: string
        }
        Returns: Json
      }
      refund_teacher_ai_credits: {
        Args: {
          p_reservation_id: string
          p_reason?: string
        }
        Returns: Json
      }
      check_and_record_remote_pin_attempt: {
        Args: {
          p_ip: string
          p_is_success: boolean
        }
        Returns: Json
      }
      submit_remote_cam_photo: {
        Args: {
          p_token: string
          p_submission: Json
        }
        Returns: Json
      }
      consume_remote_cam_submissions: {
        Args: {
          p_token: string
        }
        Returns: Json
      }
    }
  }
}


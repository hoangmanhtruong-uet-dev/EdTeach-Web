-- ========================================================
-- MIGRATION: 20261108_exams_soft_delete_and_index.sql
-- Description:
--   1. EXL-04: Thêm Soft Delete (deleted_at) cho bảng exams để chống mất dữ liệu và gãy FK OMR sessions
--   2. EXL-08: Thêm composite index tối ưu hóa truy vấn danh sách đề thi (user_id, created_at DESC)
--   3. EXL-09: Thêm Database Trigger tự động đồng bộ question_count giữa questions và exams
-- ========================================================

-- 1. EXL-04: Thêm cột deleted_at vào public.exams
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. EXL-08: Thêm các Index tối ưu hóa truy vấn
CREATE INDEX IF NOT EXISTS idx_exams_user_created_at 
ON public.exams(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_exams_deleted_at 
ON public.exams(deleted_at);

CREATE INDEX IF NOT EXISTS idx_exams_user_deleted_created 
ON public.exams(user_id, deleted_at, created_at DESC);

-- 3. EXL-09: Trigger tự động cập nhật question_count cho bảng exams
CREATE OR REPLACE FUNCTION public.update_exam_question_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.exams
        SET question_count = (
            SELECT COUNT(*) FROM public.questions WHERE exam_id = NEW.exam_id
        ),
        updated_at = timezone('utc'::text, now())
        WHERE id = NEW.exam_id;
    END IF;

    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.exam_id <> NEW.exam_id) THEN
        UPDATE public.exams
        SET question_count = (
            SELECT COUNT(*) FROM public.questions WHERE exam_id = OLD.exam_id
        ),
        updated_at = timezone('utc'::text, now())
        WHERE id = OLD.exam_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_exam_question_count ON public.questions;
CREATE TRIGGER trg_update_exam_question_count
AFTER INSERT OR UPDATE OR DELETE ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.update_exam_question_count();

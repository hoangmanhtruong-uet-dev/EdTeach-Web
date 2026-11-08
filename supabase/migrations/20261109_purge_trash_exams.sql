-- ========================================================
-- MIGRATION: 20261109_purge_trash_exams.sql
-- Description:
--   1. Tạo hàm Stored Procedure purge_expired_trash_exams()
--      Tự động xóa vĩnh viễn các đề thi trong thùng rác đã quá 14 ngày.
--   2. Đảm bảo toàn vẹn dữ liệu cho tài khoản PRO (14 ngày lưu trữ)
--      và giải phóng dung lượng CSDL.
-- ========================================================

CREATE OR REPLACE FUNCTION public.purge_expired_trash_exams()
RETURNS integer AS $$
DECLARE
    deleted_rows integer;
BEGIN
    DELETE FROM public.exams
    WHERE deleted_at IS NOT NULL
      AND deleted_at < (timezone('utc'::text, now()) - INTERVAL '14 days');

    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    RETURN deleted_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cấp quyền thực thi cho service_role
GRANT EXECUTE ON FUNCTION public.purge_expired_trash_exams() TO service_role;

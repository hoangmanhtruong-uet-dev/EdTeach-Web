-- ==============================================================================
-- Migration: 20261109_hotfix_rls_and_privilege.sql
-- Milestone 1 (PR 0.3): Emergency RLS & Database Privilege Migration
--
-- Security Vulnerabilities Addressed:
-- 1. RC-03 / SET-01 / SEC-03: Privilege escalation lock on public.users
--    (freezing role, tier, referral_code, preferences, affiliate_balance,
--     total_affiliate_earned, is_verified_teacher, verified_at, subscription_expires_at)
-- 2. RC-04 / MKT-04 / SEC-01: Content piracy leak on marketplace_items.exam_data
--    (split exam_data to public.marketplace_item_contents with strict buyer/seller RLS)
-- 3. RC-04 / STU-03 / SEC-01: Insecure USING (true) on student_reports & remediation_sheets
--    (replace with scoped teacher/owner RLS policies, revoke anon writes)
-- 4. RC-04 / STU-05: Direct UPDATE privilege on student_exam_enrollments
--    (prevent score/status tampering by students via RLS and trigger lock)
-- ==============================================================================

-- ==============================================================================
-- 1. BẢO VỆ BẢNG PUBLIC.USERS: NGĂN CHẶN LEO THANG ĐẶC QUYỀN & THAO TÚNG TIỀN (RC-03, SET-01)
-- ==============================================================================

-- Đảm bảo các cột nhạy cảm tồn tại an toàn trên public.users
ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS affiliate_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_affiliate_earned NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_verified_teacher BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS verified_school TEXT,
    ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Cập nhật hàm trigger chặn leo thang đặc quyền với phạm vi bảo vệ toàn diện
CREATE OR REPLACE FUNCTION public.prevent_user_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- Nếu không phải là service_role, không cho phép sửa đổi các trường quyền hạn, kiểm duyệt và tiền bạc
    IF current_user <> 'service_role' AND COALESCE((auth.jwt()->>'role'), '') <> 'service_role' THEN
        NEW.role := OLD.role;
        NEW.tier := OLD.tier;
        NEW.referral_code := OLD.referral_code;
        NEW.is_verified_teacher := OLD.is_verified_teacher;
        NEW.verified_at := OLD.verified_at;
        NEW.verified_school := OLD.verified_school;
        NEW.affiliate_balance := OLD.affiliate_balance;
        NEW.total_affiliate_earned := OLD.total_affiliate_earned;
        NEW.subscription_expires_at := OLD.subscription_expires_at;

        -- Bảo vệ JSONB preferences: Ngăn người dùng tự gán subscription_tier ('max', 'pro', 'school') hoặc cờ VIP
        IF NEW.preferences IS DISTINCT FROM OLD.preferences THEN
            IF NEW.preferences IS NOT NULL THEN
                -- Loại bỏ các khóa đặc quyền bị tiêm từ client
                NEW.preferences := NEW.preferences - 'subscription_tier' - 'tier' - 'role' - 'is_admin' - 'is_verified_teacher' - 'credits' - 'affiliate_balance';

                -- Nếu trước đó tài khoản đã có subscription_tier hợp lệ (do service_role cấp), bảo lưu giá trị cũ
                IF OLD.preferences IS NOT NULL AND OLD.preferences ? 'subscription_tier' THEN
                    NEW.preferences := jsonb_set(NEW.preferences, '{subscription_tier}', OLD.preferences->'subscription_tier');
                END IF;
            ELSE
                -- Không cho phép xóa rỗng preferences thành NULL
                NEW.preferences := COALESCE(OLD.preferences, '{}'::jsonb);
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Gắn trigger kiểm tra trước khi UPDATE bảng public.users
DROP TRIGGER IF EXISTS trg_prevent_user_privilege_escalation ON public.users;
CREATE TRIGGER trg_prevent_user_privilege_escalation
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.prevent_user_privilege_escalation();


-- ==============================================================================
-- 2. TÁCH BẢNG MARKETPLACE_ITEM_CONTENTS & KHÓA CHẶT BẢN QUYỀN ĐỀ THI (RC-04, MKT-04)
-- ==============================================================================

-- Tạo bảng lưu trữ nội dung chi tiết câu hỏi & đáp án đề thi bản quyền
CREATE TABLE IF NOT EXISTS public.marketplace_item_contents (
    item_id UUID PRIMARY KEY REFERENCES public.marketplace_items(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    exam_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Đảm bảo ràng buộc foreign key là DEFERRABLE INITIALLY DEFERRED kể cả khi bảng đã tồn tại trước đó
ALTER TABLE public.marketplace_item_contents 
    DROP CONSTRAINT IF EXISTS marketplace_item_contents_item_id_fkey,
    ADD CONSTRAINT marketplace_item_contents_item_id_fkey 
    FOREIGN KEY (item_id) REFERENCES public.marketplace_items(id) 
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- Kích hoạt RLS cho bảng nội dung đề thi
ALTER TABLE public.marketplace_item_contents ENABLE ROW LEVEL SECURITY;

-- Tạo index tối ưu hóa cho truy vấn kiểm tra quyền sở hữu và lượt mua
CREATE INDEX IF NOT EXISTS idx_marketplace_items_seller_id ON public.marketplace_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_status ON public.marketplace_items(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_buyer_item ON public.marketplace_purchases(buyer_id, item_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_item_buyer ON public.marketplace_purchases(item_id, buyer_id);

-- RLS: Chỉ tác giả đề thi hoặc người đã có bản ghi mua thành công mới được SELECT exam_data
DROP POLICY IF EXISTS "Sellers and buyers can view full exam content" ON public.marketplace_item_contents;
CREATE POLICY "Sellers and buyers can view full exam content"
    ON public.marketplace_item_contents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.marketplace_items i
            WHERE i.id = marketplace_item_contents.item_id 
            AND i.seller_id = (SELECT auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.marketplace_purchases p
            WHERE p.item_id = marketplace_item_contents.item_id 
            AND p.buyer_id = (SELECT auth.uid())
        )
    );

-- RLS: Tác giả có quyền thêm nội dung đề thi của mình
DROP POLICY IF EXISTS "Sellers can insert exam content" ON public.marketplace_item_contents;
CREATE POLICY "Sellers can insert exam content"
    ON public.marketplace_item_contents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.marketplace_items i
            WHERE i.id = marketplace_item_contents.item_id 
            AND i.seller_id = (SELECT auth.uid())
        )
    );

-- RLS: Tác giả có quyền sửa nội dung đề thi của mình
DROP POLICY IF EXISTS "Sellers can update exam content" ON public.marketplace_item_contents;
CREATE POLICY "Sellers can update exam content"
    ON public.marketplace_item_contents FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.marketplace_items i
            WHERE i.id = marketplace_item_contents.item_id 
            AND i.seller_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.marketplace_items i
            WHERE i.id = marketplace_item_contents.item_id 
            AND i.seller_id = (SELECT auth.uid())
        )
    );

-- RLS: Tác giả có quyền xóa nội dung đề thi của mình
DROP POLICY IF EXISTS "Sellers can delete exam content" ON public.marketplace_item_contents;
CREATE POLICY "Sellers can delete exam content"
    ON public.marketplace_item_contents FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.marketplace_items i
            WHERE i.id = marketplace_item_contents.item_id 
            AND i.seller_id = (SELECT auth.uid())
        )
    );

-- Data Migration: Di chuyển toàn bộ exam_data hiện có sang marketplace_item_contents
INSERT INTO public.marketplace_item_contents (item_id, exam_data, created_at, updated_at)
SELECT 
    id, 
    COALESCE(exam_data, '{}'::jsonb), 
    COALESCE(created_at, timezone('utc'::text, now())),
    timezone('utc'::text, now())
FROM public.marketplace_items
WHERE exam_data IS NOT NULL AND exam_data <> '{}'::jsonb
ON CONFLICT (item_id) DO UPDATE 
SET exam_data = EXCLUDED.exam_data,
    updated_at = timezone('utc'::text, now());

-- Dọn sạch exam_data trên bảng public.marketplace_items để triệt tiêu nguy cơ lộ dữ liệu qua PostgREST
UPDATE public.marketplace_items
SET exam_data = '{}'::jsonb
WHERE exam_data IS NOT NULL AND exam_data <> '{}'::jsonb;

-- Đặt mặc định exam_data là '{}'::jsonb trên bảng marketplace_items
ALTER TABLE public.marketplace_items 
    ALTER COLUMN exam_data SET DEFAULT '{}'::jsonb;

-- Trigger đồng bộ tự động: Nếu có luồng code cũ chèn exam_data vào marketplace_items,
-- tự động chuyển sang marketplace_item_contents và làm sạch trường exam_data trong marketplace_items
CREATE OR REPLACE FUNCTION public.sync_marketplace_exam_data()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.exam_data IS NOT NULL AND NEW.exam_data <> '{}'::jsonb THEN
        INSERT INTO public.marketplace_item_contents (item_id, exam_data, updated_at)
        VALUES (NEW.id, NEW.exam_data, timezone('utc'::text, now()))
        ON CONFLICT (item_id) DO UPDATE
        SET exam_data = EXCLUDED.exam_data,
            updated_at = timezone('utc'::text, now());
        
        NEW.exam_data := '{}'::jsonb;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_sync_marketplace_exam_data ON public.marketplace_items;
CREATE TRIGGER trg_sync_marketplace_exam_data
    BEFORE INSERT OR UPDATE OF exam_data ON public.marketplace_items
    FOR EACH ROW EXECUTE FUNCTION public.sync_marketplace_exam_data();


-- ==============================================================================
-- 3. XÓA BỎ USING (true) TRÊN STUDENT_REPORTS & REMEDIATION_SHEETS (RC-04, STU-03)
-- ==============================================================================

-- 3.1. BẢO VỆ BẢNG STUDENT_REPORTS
-- Kích hoạt RLS tường minh (phòng thủ khi bảng được khởi tạo mới hoặc bị tắt)
ALTER TABLE public.student_reports ENABLE ROW LEVEL SECURITY;

-- Xóa các policy lỏng lẻo cho phép đọc/sửa công khai
DROP POLICY IF EXISTS "Public can view report with valid token" ON public.student_reports;
DROP POLICY IF EXISTS "Allow select for all" ON public.student_reports;
DROP POLICY IF EXISTS "Users can view authorized student reports" ON public.student_reports;

-- Chỉ cho phép giáo viên sở hữu kỳ thi HOẶC học sinh sở hữu/được liên kết bài thi SELECT
CREATE POLICY "Users can view authorized student reports"
    ON public.student_reports FOR SELECT
    USING (
        -- Giáo viên sở hữu phiên chấm thi
        EXISTS (
            SELECT 1 FROM public.grading_sessions gs
            WHERE gs.id = student_reports.session_id
            AND gs.user_id = (SELECT auth.uid())
        )
        OR
        -- Học sinh là chủ sở hữu mã học sinh
        student_reports.student_id = (SELECT auth.uid())::text
        OR
        -- Học sinh đã liên kết báo cáo vào tài khoản qua student_claimed_reports
        EXISTS (
            SELECT 1 FROM public.student_claimed_reports scr
            WHERE scr.report_token = student_reports.token
            AND scr.student_id = (SELECT auth.uid())
        )
    );

-- Cập nhật policy cho giáo viên tạo, sửa, xóa với (SELECT auth.uid()) tối ưu hiệu năng
DROP POLICY IF EXISTS "Teachers can insert student reports" ON public.student_reports;
CREATE POLICY "Teachers can insert student reports"
    ON public.student_reports FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.grading_sessions gs
            WHERE gs.id = student_reports.session_id
            AND gs.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Teachers can update student reports" ON public.student_reports;
CREATE POLICY "Teachers can update student reports"
    ON public.student_reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.grading_sessions gs
            WHERE gs.id = student_reports.session_id
            AND gs.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Teachers can delete student reports" ON public.student_reports;
CREATE POLICY "Teachers can delete student reports"
    ON public.student_reports FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.grading_sessions gs
            WHERE gs.id = student_reports.session_id
            AND gs.user_id = (SELECT auth.uid())
        )
    );

-- Thu hồi quyền ghi trực tiếp từ vai trò anon đối với student_reports
REVOKE INSERT, UPDATE, DELETE ON public.student_reports FROM anon;

-- 3.2. BẢO VỆ BẢNG REMEDIATION_SHEETS
-- Kích hoạt RLS tường minh (phòng thủ khi bảng được khởi tạo mới hoặc bị tắt)
ALTER TABLE public.remediation_sheets ENABLE ROW LEVEL SECURITY;

-- Xóa policy USING (true) và UPDATE USING (true) lỏng lẻo
DROP POLICY IF EXISTS "Public can view practice sheet with valid token" ON public.remediation_sheets;
DROP POLICY IF EXISTS "Public can submit practice sheet" ON public.remediation_sheets;
DROP POLICY IF EXISTS "Users can view authorized remediation sheets" ON public.remediation_sheets;

-- Chỉ cho phép giáo viên sở hữu kỳ thi HOẶC học sinh sở hữu/được ghi danh SELECT phiếu luyện bù
CREATE POLICY "Users can view authorized remediation sheets"
    ON public.remediation_sheets FOR SELECT
    USING (
        -- Giáo viên sở hữu phiên chấm thi
        EXISTS (
            SELECT 1 FROM public.grading_sessions gs
            WHERE gs.id = remediation_sheets.session_id
            AND gs.user_id = (SELECT auth.uid())
        )
        OR
        -- Học sinh sở hữu phiếu luyện bù
        remediation_sheets.student_id = (SELECT auth.uid())::text
        OR
        -- Học sinh đã ghi danh vào phiếu luyện bù
        EXISTS (
            SELECT 1 FROM public.student_practice_enrollments spe
            WHERE spe.sheet_token = remediation_sheets.token
            AND spe.student_id = (SELECT auth.uid())
        )
    );

-- Giáo viên quản lý phiếu luyện bù thuộc phiên chấm của mình
DROP POLICY IF EXISTS "Teachers can insert and manage remediation sheets" ON public.remediation_sheets;
CREATE POLICY "Teachers can insert and manage remediation sheets"
    ON public.remediation_sheets FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.grading_sessions gs
            WHERE gs.id = remediation_sheets.session_id
            AND gs.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.grading_sessions gs
            WHERE gs.id = remediation_sheets.session_id
            AND gs.user_id = (SELECT auth.uid())
        )
    );

-- Thu hồi quyền sửa/xóa trực tiếp từ vai trò anon đối với remediation_sheets
REVOKE INSERT, UPDATE, DELETE ON public.remediation_sheets FROM anon;


-- ==============================================================================
-- 4. THU HỒI QUYỀN SỬA ĐIỂM TRỰC TIẾP TRÊN STUDENT_EXAM_ENROLLMENTS (RC-04, STU-05)
-- ==============================================================================

-- Kích hoạt RLS tường minh cho bảng student_exam_enrollments
ALTER TABLE public.student_exam_enrollments ENABLE ROW LEVEL SECURITY;

-- Xóa bỏ policy FOR ALL cho phép học sinh tự UPDATE điểm thi của chính mình
DROP POLICY IF EXISTS "Students can manage their exam enrollments" ON public.student_exam_enrollments;
DROP POLICY IF EXISTS "Students can view their own exam enrollments" ON public.student_exam_enrollments;
DROP POLICY IF EXISTS "Students can enroll themselves in exams" ON public.student_exam_enrollments;
DROP POLICY IF EXISTS "Teachers can view session enrollments" ON public.student_exam_enrollments;
DROP POLICY IF EXISTS "Teachers can manage session enrollments" ON public.student_exam_enrollments;

-- RLS: Học sinh CHỈ ĐƯỢC PHÉP XEM danh sách bài thi đã được giao cho mình
CREATE POLICY "Students can view their own exam enrollments"
    ON public.student_exam_enrollments FOR SELECT
    USING ((SELECT auth.uid()) = student_id);

-- RLS: Cho phép học sinh ghi danh ban đầu (chưa làm bài, score bắt buộc NULL)
CREATE POLICY "Students can enroll themselves in exams"
    ON public.student_exam_enrollments FOR INSERT
    WITH CHECK (
        (SELECT auth.uid()) = student_id
        AND status IN ('assigned', 'in_progress')
        AND score IS NULL
        AND completed_at IS NULL
    );

-- RLS: Giáo viên sở hữu session có thể xem ghi danh của học sinh
CREATE POLICY "Teachers can view session enrollments"
    ON public.student_exam_enrollments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.grading_sessions gs
            WHERE gs.id = student_exam_enrollments.session_id
            AND gs.user_id = (SELECT auth.uid())
        )
    );

-- RLS: Giáo viên sở hữu session có toàn quyền quản trị bài nộp của học sinh
CREATE POLICY "Teachers can manage session enrollments"
    ON public.student_exam_enrollments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.grading_sessions gs
            WHERE gs.id = student_exam_enrollments.session_id
            AND gs.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.grading_sessions gs
            WHERE gs.id = student_exam_enrollments.session_id
            AND gs.user_id = (SELECT auth.uid())
        )
    );

-- Thu hồi quyền UPDATE trực tiếp từ vai trò anon đối với student_exam_enrollments
REVOKE UPDATE, DELETE ON public.student_exam_enrollments FROM anon;

-- Trigger khóa điểm số: Ngăn chặn tuyệt đối mọi hành vi sửa điểm thi trái phép
CREATE OR REPLACE FUNCTION public.prevent_student_enrollment_score_tampering()
RETURNS TRIGGER AS $$
BEGIN
    -- Chỉ cho phép service_role hoặc giáo viên sở hữu session sửa score, status hoặc completed_at
    IF current_user <> 'service_role' AND COALESCE((auth.jwt()->>'role'), '') <> 'service_role' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.grading_sessions gs
            WHERE gs.id = OLD.session_id AND gs.user_id = auth.uid()
        ) THEN
            NEW.score := OLD.score;
            NEW.status := OLD.status;
            NEW.completed_at := OLD.completed_at;
            NEW.student_id := OLD.student_id;
            NEW.exam_id := OLD.exam_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_prevent_student_enrollment_score_tampering ON public.student_exam_enrollments;
CREATE TRIGGER trg_prevent_student_enrollment_score_tampering
    BEFORE UPDATE ON public.student_exam_enrollments
    FOR EACH ROW EXECUTE FUNCTION public.prevent_student_enrollment_score_tampering();

-- Siết chặt tương tự đối với student_practice_enrollments
ALTER TABLE public.student_practice_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can manage their practice enrollments" ON public.student_practice_enrollments;
DROP POLICY IF EXISTS "Students can view their practice enrollments" ON public.student_practice_enrollments;
DROP POLICY IF EXISTS "Students can insert their practice enrollments" ON public.student_practice_enrollments;

CREATE POLICY "Students can view their practice enrollments"
    ON public.student_practice_enrollments FOR SELECT
    USING ((SELECT auth.uid()) = student_id);

CREATE POLICY "Students can insert their practice enrollments"
    ON public.student_practice_enrollments FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = student_id AND score IS NULL);

REVOKE UPDATE, DELETE ON public.student_practice_enrollments FROM anon;

-- Tối ưu hóa Index cho các bảng truy vấn RLS
CREATE INDEX IF NOT EXISTS idx_student_enrollments_session ON public.student_exam_enrollments(session_id);
CREATE INDEX IF NOT EXISTS idx_student_practice_sheet_token ON public.student_practice_enrollments(sheet_token);

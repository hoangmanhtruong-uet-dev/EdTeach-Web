import { createAdminClient } from "@/lib/supabase/admin";
import { getGeminiApiKey } from "@/lib/ai/gemini-client";

export interface OCRResult {
  isValidDocument: boolean;
  documentType: "teacher_card" | "student_card" | "degree_certificate" | "center_card" | "unknown";
  fullName: string;
  schoolOrOrganization: string;
  cardNumber: string;
  roleCategory: "teacher" | "tutor" | "center_lecturer";
  confidenceScore: number;
  confidenceReason: string;
}

export interface TutorDualOCRResult {
  isValidDocument: boolean;
  studentCard: {
    fullName: string;
    studentCode: string;
    university: string;
    confidence: number;
  };
  cccdCard: {
    fullName: string;
    cccdNumber: string;
    dateOfBirth?: string;
    confidence: number;
  };
  isNameCrossMatched: boolean;
  isAccountNameMatched: boolean;
  finalConfidence: number;
  reason: string;
}

export interface TeacherVerificationRecord {
  id: string;
  userId: string;
  documentType: "teacher_card" | "student_card" | "degree_certificate" | "center_card";
  imageUrl: string;
  status: "pending_review" | "approved" | "rejected";
  ocrExtractedName?: string;
  ocrExtractedSchool?: string;
  ocrExtractedCode?: string;
  ocrConfidence?: number;
  roleCategory: "teacher" | "tutor" | "center_lecturer";
  adminReviewedBy?: string;
  rejectionReason?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  cccdImageUrl?: string;
  cccdNumber?: string;
  isCrossMatched?: boolean;
}

// In-memory fallback store
declare global {
  // eslint-disable-next-line no-var
  var __verificationsStore: Map<string, TeacherVerificationRecord> | undefined;
}

function getStore(): Map<string, TeacherVerificationRecord> {
  if (!globalThis.__verificationsStore) {
    globalThis.__verificationsStore = new Map<string, TeacherVerificationRecord>();
  }
  return globalThis.__verificationsStore;
}

/**
 * Remove Vietnamese accents and normalize string for robust name matching
 */
export function removeVietnameseAccents(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/**
 * Check if the name extracted from card matches the user's profile name
 */
export function isNameMatching(nameOnCard: string, profileName: string): boolean {
  if (!nameOnCard || !profileName) return false;

  const normA = removeVietnameseAccents(nameOnCard);
  const normB = removeVietnameseAccents(profileName);

  if (normA === normB) return true;

  // Split into tokens
  const tokensA = normA.split(/\s+/).filter(Boolean);
  const tokensB = normB.split(/\s+/).filter(Boolean);

  // If both have first name and last name matching
  if (tokensA.length >= 2 && tokensB.length >= 2) {
    const lastNameA = tokensA[0];
    const firstNameA = tokensA[tokensA.length - 1];

    const lastNameB = tokensB[0];
    const firstNameB = tokensB[tokensB.length - 1];

    if (lastNameA === lastNameB && firstNameA === firstNameB) {
      return true;
    }
  }

  // Check if one contains the other
  if (normA.includes(normB) || normB.includes(normA)) {
    return true;
  }

  return false;
}

/**
 * Heuristic fallback OCR for test/offline resilience
 */
export function simulateHeuristicOCR(params: {
  userName?: string;
  schoolName?: string;
}): OCRResult {
  const name = params.userName || "";
  const school = params.schoolName || "";

  return {
    isValidDocument: false,
    documentType: "unknown",
    fullName: name,
    schoolOrOrganization: school,
    cardNumber: "",
    roleCategory: "teacher",
    confidenceScore: 0.35,
    confidenceReason: "Chế độ dự phòng: Gemini Vision AI không khả dụng. Hồ sơ cần được chuyển sang ban quản trị phê duyệt thủ công.",
  };
}

/**
 * Multimodal Gemini Vision OCR caller
 */
export async function performTeacherCardOCR(
  base64Image: string,
  mimeType: string = "image/jpeg",
  userName?: string
): Promise<OCRResult> {
  const geminiKey = getGeminiApiKey();

  if (!geminiKey) {
    return simulateHeuristicOCR({ userName });
  }

  const prompt = `
Bạn là Hệ thống AI Chuyên gia Giám định Thẻ ngành & Văn bằng Giáo dục Việt Nam của EduTest AI Tutor OS.
Nhiệm vụ: Phân tích ảnh chụp thẻ ngành/thẻ sinh viên/bằng cấp giáo viên được cung cấp và trích xuất dữ liệu xác thực danh tính.

Các loại thẻ hợp lệ:
1. Thẻ viên chức giáo dục / Thẻ giáo viên trường THCS, THPT, Đại học, Cao đẳng.
2. Thẻ sinh viên các trường Đại học Sư phạm (ĐH Sư phạm Hà Nội, ĐH Sư phạm TP.HCM, ĐH Giáo dục - ĐHQGHN, ĐH Sư phạm Huế, v.v.).
3. Thẻ giảng viên/nhân viên các trung tâm luyện thi, trung tâm ngoại ngữ, trường tư thục.
4. Bằng tốt nghiệp Đại học chuyên ngành Sư phạm.

Hãy trả về DUY NHẤT một chuỗi JSON hợp lệ với cấu trúc sau:
{
  "is_valid_document": true,
  "document_type": "teacher_card",
  "full_name": "Họ và tên ghi trên thẻ",
  "school_or_organization": "Tên trường học hoặc đơn vị công tác ghi trên thẻ",
  "card_number": "Mã số thẻ / mã cán bộ / mã sinh viên",
  "role_category": "teacher",
  "confidence_score": 0.92,
  "confidence_reason": "Giải thích ngắn gọn căn cứ xác thực"
}

Ghi chú phân loại:
- "document_type" chỉ được là: "teacher_card" (thẻ GV), "student_card" (thẻ SV sư phạm), "degree_certificate" (bằng cấp), "center_card" (thẻ trung tâm), "unknown" (nếu không phải thẻ giáo dục).
- "role_category" chỉ được là: "teacher" (giáo viên trường), "tutor" (gia sư sinh viên), "center_lecturer" (giảng viên trung tâm).
- "confidence_score" là số thực từ 0.0 đến 1.0 (trên 0.85 nếu ảnh rõ nét, con dấu rõ ràng; dưới 0.7 nếu ảnh mờ/lóa sáng).
`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType || "image/jpeg",
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch {
          const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
          parsed = JSON.parse(clean);
        }

        return {
          isValidDocument: Boolean(parsed.is_valid_document),
          documentType: parsed.document_type || "teacher_card",
          fullName: parsed.full_name || "",
          schoolOrOrganization: parsed.school_or_organization || "Đơn vị giáo dục",
          cardNumber: parsed.card_number || "",
          roleCategory: parsed.role_category || "teacher",
          confidenceScore: Number(parsed.confidence_score) || 0.85,
          confidenceReason: parsed.confidence_reason || "Đã trích xuất thông tin qua AI Vision.",
        };
      }
    }
  } catch (err: any) {
    console.warn("Gemini Vision OCR error, falling back to heuristic:", err?.message);
  }

  return simulateHeuristicOCR({ userName });
}

/**
 * Heuristic fallback for Tutor Dual OCR (Thẻ SV + CCCD)
 */
export function simulateTutorDualOCR(params: {
  userName?: string;
  university?: string;
}): TutorDualOCRResult {
  const name = params.userName || "";
  return {
    isValidDocument: false,
    studentCard: {
      fullName: name,
      studentCode: "",
      university: params.university || "",
      confidence: 0.35,
    },
    cccdCard: {
      fullName: name,
      cccdNumber: "",
      confidence: 0.35,
    },
    isNameCrossMatched: false,
    isAccountNameMatched: false,
    finalConfidence: 0.35,
    reason: "Chế độ dự phòng: Gemini Vision AI không khả dụng. Hồ sơ gia sư cần được đối soát thủ công bởi Admin.",
  };
}

/**
 * Multimodal Gemini Vision OCR for Tutor Dual Card (Thẻ Sinh viên + CCCD)
 */
export async function performTutorDualCardOCR(
  studentCardBase64: string,
  studentCardMime: string = "image/jpeg",
  cccdBase64: string,
  cccdMime: string = "image/jpeg",
  userName?: string
): Promise<TutorDualOCRResult> {
  const geminiKey = getGeminiApiKey();

  if (!geminiKey) {
    return simulateTutorDualOCR({ userName });
  }

  const prompt = `
Bạn là Hệ thống AI Chuyên gia Giám định Hồ sơ Xác thực Gia sư & Sinh viên Sư phạm Việt Nam.
Nhiệm vụ: Phân tích 2 ảnh được cung cấp:
- Ảnh 1: Thẻ sinh viên (hoặc Bằng đại học, Chứng chỉ nghiệp vụ sư phạm).
- Ảnh 2: Mặt trước Thẻ Căn cước công dân (CCCD hoặc CMND).

Trích xuất các thông tin sau và đối soát chéo họ tên:
1. Thẻ sinh viên:
   - Họ và tên sinh viên
   - Mã sinh viên / Mã số học viên
   - Tên trường Đại học / Cao đẳng / Học viện
2. Căn cước công dân:
   - Họ và tên trên CCCD
   - Số CCCD (12 chữ số)
   - Ngày tháng năm sinh
3. Đối soát:
   - Họ tên trên Thẻ sinh viên và họ tên trên CCCD có phải cùng một người không? (Khớp nhau dù viết hoa/thường hay không dấu).

Trả về DUY NHẤT một chuỗi JSON hợp lệ với cấu trúc sau:
{
  "is_valid_document": true,
  "student_card": {
    "full_name": "Nguyễn Văn A",
    "student_code": "20020101",
    "university": "Trường Đại học Sư phạm Hà Nội",
    "confidence": 0.95
  },
  "cccd_card": {
    "full_name": "NGUYỄN VĂN A",
    "cccd_number": "001202001234",
    "date_of_birth": "2002-05-15",
    "confidence": 0.96
  },
  "is_name_cross_matched": true,
  "final_confidence": 0.95,
  "reason": "Thẻ sinh viên và CCCD hợp lệ, họ tên đối soát hoàn toàn khớp nhau."
}
`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const cleanStudentBase64 = studentCardBase64.replace(/^data:image\/[a-z]+;base64,/, "");
    const cleanCccdBase64 = cccdBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: studentCardMime || "image/jpeg",
                    data: cleanStudentBase64,
                  },
                },
                {
                  inlineData: {
                    mimeType: cccdMime || "image/jpeg",
                    data: cleanCccdBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch {
          const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
          parsed = JSON.parse(clean);
        }

        const studentCardName = parsed.student_card?.full_name || "";
        const cccdName = parsed.cccd_card?.full_name || "";
        const isCrossMatched = Boolean(parsed.is_name_cross_matched) || isNameMatching(studentCardName, cccdName);
        const isAccountMatched = userName
          ? (isNameMatching(studentCardName, userName) || isNameMatching(cccdName, userName))
          : true;

        return {
          isValidDocument: Boolean(parsed.is_valid_document),
          studentCard: {
            fullName: studentCardName,
            studentCode: parsed.student_card?.student_code || "",
            university: parsed.student_card?.university || "Trường Đại học",
            confidence: Number(parsed.student_card?.confidence) || 0.9,
          },
          cccdCard: {
            fullName: cccdName,
            cccdNumber: parsed.cccd_card?.cccd_number || "",
            dateOfBirth: parsed.cccd_card?.date_of_birth || "",
            confidence: Number(parsed.cccd_card?.confidence) || 0.9,
          },
          isNameCrossMatched: isCrossMatched,
          isAccountNameMatched: isAccountMatched,
          finalConfidence: Number(parsed.final_confidence) || (isCrossMatched ? 0.92 : 0.6),
          reason: parsed.reason || "Đã đối soát Thẻ sinh viên và CCCD qua Gemini Vision AI.",
        };
      }
    }
  } catch (err: any) {
    console.warn("Gemini Vision Tutor Dual OCR error, falling back to heuristic:", err?.message);
  }

  return simulateTutorDualOCR({ userName });
}

/**
 * Save verification record
 */
export async function saveVerificationRecord(
  record: TeacherVerificationRecord
): Promise<TeacherVerificationRecord> {
  // 1. In-memory store
  const store = getStore();
  store.set(record.id, record);
  store.set(`user_${record.userId}`, record);

  // 2. Supabase table upsert
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { error } = await (supabase.from("teacher_verifications") as any).upsert(
        {
          id: record.id,
          user_id: record.userId,
          document_type: record.documentType,
          image_url: record.imageUrl,
          status: record.status,
          ocr_extracted_name: record.ocrExtractedName || null,
          ocr_extracted_school: record.ocrExtractedSchool || null,
          ocr_extracted_code: record.ocrExtractedCode || null,
          ocr_confidence: record.ocrConfidence ?? null,
          role_category: record.roleCategory,
          admin_reviewed_by: record.adminReviewedBy || null,
          rejection_reason: record.rejectionReason || null,
          reviewed_at: record.reviewedAt || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (error) {
        console.warn("Supabase teacher_verifications upsert note:", error.message);
      }
    }
  } catch (e: any) {
    console.warn("Supabase teacher_verifications upsert caught:", e?.message);
  }

  return record;
}

/**
 * Get latest verification for user
 */
export async function getVerificationByUserId(
  userId: string
): Promise<TeacherVerificationRecord | null> {
  if (!userId) return null;

  // 1. Check in-memory store
  const store = getStore();
  const cached = store.get(`user_${userId}`);
  if (cached) return cached;

  // 2. Query Supabase
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data, error } = await (supabase.from("teacher_verifications") as any)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const row = data as any;
        const record: TeacherVerificationRecord = {
          id: row.id,
          userId: row.user_id,
          documentType: row.document_type,
          imageUrl: row.image_url,
          status: row.status,
          ocrExtractedName: row.ocr_extracted_name || undefined,
          ocrExtractedSchool: row.ocr_extracted_school || undefined,
          ocrExtractedCode: row.ocr_extracted_code || undefined,
          ocrConfidence: row.ocr_confidence ? Number(row.ocr_confidence) : undefined,
          roleCategory: row.role_category,
          adminReviewedBy: row.admin_reviewed_by || undefined,
          rejectionReason: row.rejection_reason || undefined,
          reviewedAt: row.reviewed_at || undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };

        store.set(`user_${userId}`, record);
        store.set(record.id, record);
        return record;
      }
    }
  } catch (e: any) {
    console.warn("Supabase fetch verification caught:", e?.message);
  }

  return null;
}

/**
 * Get all verifications (for Admin Dashboard)
 */
export async function getAllVerifications(
  statusFilter?: string
): Promise<TeacherVerificationRecord[]> {
  const store = getStore();
  const list: TeacherVerificationRecord[] = [];

  // 1. Query Supabase
  try {
    const supabase = createAdminClient();
    if (supabase) {
      let query = (supabase.from("teacher_verifications") as any)
        .select("*, users(email, full_name)")
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (!error && data) {
        return (data as any[]).map((row) => ({
          id: row.id,
          userId: row.user_id,
          documentType: row.document_type,
          imageUrl: row.image_url,
          status: row.status,
          ocrExtractedName: row.ocr_extracted_name || row.users?.full_name || undefined,
          ocrExtractedSchool: row.ocr_extracted_school || undefined,
          ocrExtractedCode: row.ocr_extracted_code || undefined,
          ocrConfidence: row.ocr_confidence ? Number(row.ocr_confidence) : undefined,
          roleCategory: row.role_category,
          adminReviewedBy: row.admin_reviewed_by || undefined,
          rejectionReason: row.rejection_reason || undefined,
          reviewedAt: row.reviewed_at || undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
      }
    }
  } catch (e: any) {
    console.warn("Supabase query verifications caught:", e?.message);
  }

  // Fallback: return from in-memory store
  for (const record of store.values()) {
    if (!list.some((r) => r.id === record.id)) {
      if (!statusFilter || statusFilter === "all" || record.status === statusFilter) {
        list.push(record);
      }
    }
  }

  return list;
}

/**
 * Reward teacher upon successful verification (Tích Xanh + 10k Credits)
 */
export async function rewardVerifiedTeacher(params: {
  userId: string;
  schoolName: string;
  teacherCode?: string;
  roleCategory?: string;
  verificationId?: string;
  adminId?: string;
}): Promise<{ success: boolean; alreadyRewarded?: boolean; message?: string }> {
  const { userId, schoolName, teacherCode, roleCategory = "teacher", verificationId, adminId } = params;

  try {
    const supabase = createAdminClient();
    if (!supabase) return { success: false, message: "Không thể kết nối Supabase Admin." };

    // Gọi atomic RPC claim_ekyc_reward_atomic để khóa chống nhận thưởng lặp
    const { data: result, error: rpcError } = await (supabase.rpc as any)("claim_ekyc_reward_atomic", {
      p_user_id: userId,
      p_admin_id: adminId || null,
      p_verification_id: verificationId || null,
      p_school_name: schoolName,
      p_teacher_code: teacherCode || null,
      p_role_category: roleCategory,
    });

    if (rpcError) {
      console.warn("claim_ekyc_reward_atomic RPC fallback to direct check:", rpcError.message);
      // Fallback: Kiểm tra ekyc_rewarded_at trực tiếp trên bảng users
      const { data: userProfile } = await (supabase.from("users") as any)
        .select("ekyc_rewarded_at, is_verified_teacher")
        .eq("id", userId)
        .maybeSingle();

      if (userProfile?.ekyc_rewarded_at) {
        return { success: true, alreadyRewarded: true, message: "Tài khoản đã nhận thưởng eKYC trước đó." };
      }

      await (supabase.from("users") as any)
        .update({
          is_verified_teacher: true,
          verified_school: schoolName,
          verified_teacher_code: teacherCode || `VERIFIED-${Date.now().toString().slice(-6)}`,
          verified_at: new Date().toISOString(),
          ekyc_rewarded_at: new Date().toISOString(),
          organization_name: schoolName,
          role: roleCategory === "tutor" ? "tutor" : "teacher",
        })
        .eq("id", userId);

      const { data: wallet } = await (supabase.from("wallets") as any)
        .select("id, balance, promotional_balance")
        .eq("user_id", userId)
        .maybeSingle();

      if (wallet) {
        const promoBal = Number(wallet.promotional_balance || 0) + 10000;
        await (supabase.from("wallets") as any)
          .update({
            promotional_balance: promoBal,
            balance: (wallet.balance || 0) + 10000,
            updated_at: new Date().toISOString(),
          })
          .eq("id", wallet.id);

        await (supabase.from("wallet_txns") as any).insert({
          wallet_id: wallet.id,
          amount: 10000,
          type: "ekyc_bonus",
          description: "Thưởng hoàn tất xác thực danh tính giáo viên chính chủ (Tích Xanh eKYC) (+10.000 credits)",
          metadata: { verification_id: verificationId, role_category: roleCategory },
        });
      }
      return { success: true, alreadyRewarded: false };
    }

    return result as any;
  } catch (err: any) {
    console.warn("rewardVerifiedTeacher caught:", err?.message);
    return { success: false, message: err?.message };
  }
}

/**
 * Review verification record (Admin action)
 */
export async function reviewVerificationRecord(params: {
  recordId: string;
  adminUserId: string;
  action: "approved" | "rejected";
  rejectionReason?: string;
}): Promise<TeacherVerificationRecord> {
  const { recordId, adminUserId, action, rejectionReason } = params;
  const store = getStore();

  let record = store.get(recordId);

  // If not in memory, query Supabase
  if (!record) {
    const supabase = createAdminClient();
    if (supabase) {
      const { data } = await (supabase.from("teacher_verifications") as any)
        .select("*")
        .eq("id", recordId)
        .maybeSingle();

      if (data) {
        record = {
          id: data.id,
          userId: data.user_id,
          documentType: data.document_type,
          imageUrl: data.image_url,
          status: data.status,
          ocrExtractedName: data.ocr_extracted_name,
          ocrExtractedSchool: data.ocr_extracted_school,
          ocrExtractedCode: data.ocr_extracted_code,
          ocrConfidence: data.ocr_confidence,
          roleCategory: data.role_category,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    }
  }

  if (!record) {
    throw new Error("Không tìm thấy hồ sơ xác thực.");
  }

  if (record.status === "approved" && action === "approved") {
    throw new Error("Hồ sơ này đã được phê duyệt trước đó.");
  }

  record.status = action;
  record.adminReviewedBy = adminUserId;
  record.reviewedAt = new Date().toISOString();
  record.updatedAt = new Date().toISOString();
  if (action === "rejected") {
    record.rejectionReason = rejectionReason || "Hình ảnh không rõ nét hoặc thông tin không trùng khớp.";
  }

  await saveVerificationRecord(record);

  if (action === "approved") {
    await rewardVerifiedTeacher({
      userId: record.userId,
      schoolName: record.ocrExtractedSchool || "Đơn vị giáo dục",
      teacherCode: record.ocrExtractedCode,
      roleCategory: record.roleCategory,
      verificationId: record.id,
      adminId: adminUserId,
    });
  }

  return record;
}

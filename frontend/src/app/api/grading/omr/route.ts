import { NextRequest, NextResponse } from "next/server";
import { resolveGeminiApiKey } from "@/lib/ai/gemini-client";
import { isProUser } from "@/lib/payment/plans";
import { createClient } from "@/lib/supabase/server";
import { getStudentSubmissionLink } from "@/lib/grading/student-submission-store";
import {
  resolveBackendOmrSheetType,
  get2025QuestionCounts,
  normalizeTfChar,
  normalizeTfGroupAnswer,
  scoreStudentAnswers,
  BackendOmrSheetType,
} from "@/lib/grading/omr-template-resolver";

const AI_SERVICE_BASE =
  process.env.INTERNAL_AI_SERVICE_URL ||
  process.env.NEXT_PUBLIC_AI_SERVICE_URL ||
  "http://localhost:8000";

const INTERNAL_KEY = process.env.INTERNAL_API_KEY || "";

export async function GET() {
  try {
    const res = await fetch(`${AI_SERVICE_BASE}/ai/omr/templates`, {
      headers: {
        ...(INTERNAL_KEY ? { "X-Internal-Key": INTERNAL_KEY } : {}),
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Lỗi kết nối AI Service: ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Không thể kết nối dịch vụ OMR: ${err.message}` },
      { status: 502 }
    );
  }
}

// Sprint 6 Security Hardening: In-Memory Rate Limiter for OMR
const omrRateLimits = new Map<string, { count: number; resetAt: number }>();
function checkOmrRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = omrRateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    omrRateLimits.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 60) return false;
  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!checkOmrRateLimit(ip)) {
      return NextResponse.json(
        { error: "Đã vượt quá giới hạn quét bài (tối đa 60 bài/phút). Vui lòng chờ giây lát." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Size cap guard: 10MB base64
    if (body.imageBase64 && body.imageBase64.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Kích thước ảnh vượt quá giới hạn 10MB." },
        { status: 413 }
      );
    }
    const action = body.action || "grade_single";

    let tokenLinkSubject: string | undefined;
    let tokenLinkQCount: number | undefined;
    let tokenLinkSheetType: string | undefined;

    // Action download_pdf cho phép người dùng tải tự do mẫu phiếu trắc nghiệm
    if (action !== "download_pdf") {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (action === "grade_batch") {
        if (!user) {
          return NextResponse.json(
            {
              error: "UNAUTHORIZED",
              message: "Vui lòng đăng nhập tài khoản Giáo viên PRO để sử dụng chức năng chấm bài hàng loạt.",
            },
            { status: 401 }
          );
        }
        const { data: profile } = await supabase
          .from("users")
          .select("tier, subscription_expires_at, email")
          .eq("id", user.id)
          .maybeSingle();

        const userProfile = profile || { email: user.email, tier: "free" };
        if (!isProUser(userProfile)) {
          return NextResponse.json(
            {
              error: "TIER_UPGRADE_REQUIRED",
              message: "Chấm phiếu hàng loạt dành riêng cho Gói Giáo Viên PRO. Vui lòng nâng cấp gói.",
            },
            { status: 403 }
          );
        }
      } else if (action === "grade_single") {
        if (user) {
          const { data: profile } = await supabase
            .from("users")
            .select("tier, subscription_expires_at, email")
            .eq("id", user.id)
            .maybeSingle();

          const userProfile = profile || { email: user.email, tier: "free" };
          if (!isProUser(userProfile)) {
            return NextResponse.json(
              {
                error: "TIER_UPGRADE_REQUIRED",
                message:
                  "Tính năng Chấm phiếu trắc nghiệm tự động bằng OMR / Camera dành riêng cho Gói Giáo Viên PRO. Vui lòng nâng cấp gói để tiếp tục.",
              },
              { status: 403 }
            );
          }
        } else {
          // Đối với học sinh nộp bài: Bắt buộc kèm mã token phiên nộp bài hợp lệ
          const studentToken = body.studentToken || body.token;
          if (!studentToken) {
            return NextResponse.json(
              {
                error: "UNAUTHORIZED",
                message: "Yêu cầu đăng nhập tài khoản Giáo viên PRO hoặc cung cấp mã phiên nộp bài hợp lệ để quét phiếu.",
              },
              { status: 401 }
            );
          }

          const link = await getStudentSubmissionLink(studentToken);
          if (!link || link.isClosed) {
            return NextResponse.json(
              {
                error: "INVALID_SESSION_TOKEN",
                message: "Mã phiên nộp bài không hợp lệ hoặc phòng thi đã đóng.",
              },
              { status: 403 }
            );
          }
          tokenLinkSubject = link.subject;
          tokenLinkQCount = link.questionCount;
          tokenLinkSheetType = link.sheetType;
        }
      }
    }

    const effectiveSheetInput = body.sheetType || tokenLinkSheetType;
    const effectiveSubject = body.subject ?? tokenLinkSubject;
    const effectiveQCount = body.questionCount ?? tokenLinkQCount;
    const sheetType = resolveBackendOmrSheetType(
      effectiveSheetInput,
      effectiveSubject,
      effectiveQCount
    );

    if (action === "download_pdf") {
      const examTitle = body.examTitle || "KỲ THI TRẮC NGHIỆM ĐỊNH KỲ";

      const res = await fetch(`${AI_SERVICE_BASE}/ai/omr/generate-sheet-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(INTERNAL_KEY ? { "X-Internal-Key": INTERNAL_KEY } : {}),
        },
        body: JSON.stringify({
          sheet_type: sheetType,
          exam_title: examTitle,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json({ error: errorText }, { status: res.status });
      }

      const pdfArrayBuffer = await res.arrayBuffer();
      return new NextResponse(pdfArrayBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="phieu_trac_nghiem_${sheetType}.pdf"`,
        },
      });
    }

    if (action === "grade_batch") {
      const res = await fetch(`${AI_SERVICE_BASE}/ai/omr/grade-batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(INTERNAL_KEY ? { "X-Internal-Key": INTERNAL_KEY } : {}),
        },
        body: JSON.stringify({
          items: body.items,
          sheet_type: sheetType,
          answer_key: body.answerKey || {},
          return_annotated_images: Boolean(body.returnAnnotatedImages),
        }),
      });

      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // Default: grade_single
    try {
      const res = await fetch(`${AI_SERVICE_BASE}/ai/omr/grade-single`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(INTERNAL_KEY ? { "X-Internal-Key": INTERNAL_KEY } : {}),
        },
        body: JSON.stringify({
          image_base64: body.imageBase64,
          sheet_type: sheetType,
          answer_key: body.answerKey || {},
          return_annotated_image: body.returnAnnotatedImage !== false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (localOmrErr) {
      console.warn("Python OMR service unreachable, falling back to Gemini Vision OMR:", localOmrErr);
    }

    // Fallback: Gemini Vision OMR (Dùng GEMINI_API_KEY_PRO riêng biệt theo V2)
    const visionData = await runGeminiVisionOMR(
      body.imageBase64,
      sheetType,
      body.answerKey || {},
      effectiveSubject,
      effectiveQCount
    );
    return NextResponse.json(visionData);
  } catch (err: any) {
    console.error("OMR route error:", err);
    return NextResponse.json(
      { error: `Lỗi xử lý OMR: ${err.message}` },
      { status: 500 }
    );
  }
}

/**
 * Fallback Gemini Vision OMR Engine
 * Đọc trực tiếp các ô tròn tô đen từ ảnh phiếu thi với độ chính xác cao
 * Độc quyền cho Giáo viên PRO và MAX khi thuật toán cắt góc OpenCV lỗi ≥ 3 lần
 */
async function runGeminiVisionOMR(
  imageBase64: string,
  sheetType: BackendOmrSheetType,
  answerKey: Record<string, any> = {},
  subject?: string,
  questionCount?: number
) {
  const geminiKey = resolveGeminiApiKey("pro");

  if (!geminiKey) {
    throw new Error("Không có kết nối OMR Service và chưa cấu hình Gemini PRO API Key.");
  }

  // Chuẩn hóa chuỗi base64
  let cleanBase64 = imageBase64;
  let mimeType = "image/jpeg";
  if (imageBase64.includes(";base64,")) {
    const parts = imageBase64.split(";base64,");
    mimeType = parts[0].replace("data:", "") || "image/jpeg";
    cleanBase64 = parts[1];
  }

  const is2025 = sheetType.startsWith("bgd_2025");
  const isLegacy2025 = sheetType === "bgd_2025";
  const counts = get2025QuestionCounts(
    sheetType === "bgd_2025_math"
      ? "Toán"
      : sheetType === "bgd_2025_science"
      ? "Vật lí"
      : sheetType === "bgd_2025_social"
      ? "Lịch sử"
      : subject,
    isLegacy2025 ? 54 : questionCount
  );
  const mcqCount =
    sheetType === "sheet_20" ? 20 : sheetType === "sheet_40" ? 40 : 50;

  const structureDesc = is2025
    ? counts.part3Count > 0
      ? `Phiếu chuẩn GDPT 2025 gồm 3 phần: Phần I có ${counts.part1Count} câu ABCD; Phần II có ${counts.part2Count} câu Đúng/Sai (mỗi câu gồm 4 ý a, b, c, d chọn Đ hoặc S); Phần III có ${counts.part3Count} câu Trả lời ngắn/Điền số (tối đa 4 ký tự gồm dấu -, dấu phẩy/chấm và chữ số).`
      : `Phiếu chuẩn GDPT 2025 nhóm KHXH/Tin/Công nghệ gồm 2 phần: Phần I có ${counts.part1Count} câu ABCD; Phần II có ${counts.part2Count} câu Đúng/Sai (mỗi câu gồm 4 ý a, b, c, d chọn Đ hoặc S). Phiếu này KHÔNG có Phần III.`
    : `Phiếu trắc nghiệm truyền thống gồm ${mcqCount} câu hỏi 4 lựa chọn A, B, C, D.`;

  const prompt = `Bạn là chuyên gia thị giác máy tính đọc phiếu trả lời trắc nghiệm (OMR Scanner) chuẩn Bộ Giáo Dục & Đào Tạo Việt Nam.
Hãy quan sát thật kỹ bức ảnh chụp phiếu trả lời trắc nghiệm đính kèm (${structureDesc}).
Nhiệm vụ: Trích xuất CHÍNH XÁC những gì thí sinh đã dùng bút chì/bút bi tô đen vào các ô tròn.

1. Số báo danh (SBD): Đọc 8 chữ số được tô ở khung "Số báo danh" (góc trên bên phải; hoặc 6 chữ số nếu là mẫu cũ).
2. Mã đề thi: Đọc 3 chữ số được tô ở khung "Mã đề thi".
3. Phần I - Câu hỏi trắc nghiệm nhiều lựa chọn (4 lựa chọn A, B, C, D):
   - Đọc từng câu (từ Câu 1 đến Câu ${is2025 ? counts.part1Count : mcqCount}): Xem ô tròn nào (A, B, C hay D) được tô đen/tô đậm.
   - Nếu câu nào để trắng không tô hoặc bị gạch chéo tẩy xóa thì ghi null.${
     is2025
       ? `\n4. Phần II - Câu hỏi trắc nghiệm Đúng / Sai (từ Câu 1 đến Câu ${counts.part2Count}):
   - Mỗi câu gồm 4 ý a, b, c, d được tô "Đ" (Đúng) hay "S" (Sai).` +
         (counts.part3Count > 0
           ? `\n5. Phần III - Câu hỏi trắc nghiệm trả lời ngắn / điền số (từ Câu 1 đến Câu ${counts.part3Count}):
   - Đọc giá trị số thí sinh tô theo 4 cột (hỗ trợ dấu -, dấu phẩy ',', và chữ số 0-9).`
           : "")
       : ""
   }

YÊU CẦU ĐẶC BIỆT: Trả về DUY NHẤT một chuỗi JSON thuần túy (không bọc trong \`\`\`json):
{
  "student_code": "chuỗi 8 chữ số (hoặc 6 chữ số ở mẫu cũ, '' nếu không đọc được)",
  "exam_code": "chuỗi 3 chữ số (hoặc '')",
  "answers": {
    "1": "A",
    "2": "B"
  },
  "part2_answers": {
    "1": { "a": "Đ", "b": "S", "c": "Đ", "d": "S" }
  },
  "part3_answers": {
    "1": "42"
  }
}`;

  const models = [
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-3.8-flash",
  ];

  // Chuẩn hóa answerKey về dạng phẳng numeric index
  const flatAnswerKey: Record<number, string> = {};
  if (answerKey && ("part1" in answerKey || "part2" in answerKey || "part3" in answerKey)) {
    const p1 = (answerKey.part1 || {}) as Record<string, any>;
    const p2 = (answerKey.part2 || {}) as Record<string, any>;
    const p3 = (answerKey.part3 || {}) as Record<string, any>;
    for (const [k, v] of Object.entries(p1)) {
      const idx = parseInt(k, 10);
      if (!Number.isNaN(idx)) flatAnswerKey[idx] = String(v || "").trim().toUpperCase();
    }
    for (const [k, v] of Object.entries(p2)) {
      const idx = parseInt(k, 10);
      if (!Number.isNaN(idx)) {
        const formatted = normalizeTfGroupAnswer(v);
        if (formatted) flatAnswerKey[counts.part1Count + idx] = formatted;
      }
    }
    for (const [k, v] of Object.entries(p3)) {
      const idx = parseInt(k, 10);
      if (!Number.isNaN(idx)) {
        flatAnswerKey[counts.part1Count + counts.part2Count + idx] = String(v ?? "").trim();
      }
    }
  } else {
    for (const [k, v] of Object.entries(answerKey || {})) {
      const idx = parseInt(k, 10);
      if (!Number.isNaN(idx) && v !== undefined && v !== null) {
        flatAnswerKey[idx] = String(v).trim();
      }
    }
  }

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType,
                      data: cleanBase64,
                    },
                  },
                  { text: prompt },
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

      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          const p1Raw = parsed.answers || parsed.results || parsed.part1_answers || {};
          const p2Raw = parsed.part2_answers || {};
          const p3Raw = parsed.part3_answers || {};

          const studentFlatAnswers: Record<number, string> = {};
          for (const [qStr, chosen] of Object.entries(p1Raw as Record<string, any>)) {
            const qNum = parseInt(qStr, 10);
            if (!Number.isNaN(qNum) && chosen) {
              studentFlatAnswers[qNum] = String(chosen).trim().toUpperCase();
            }
          }

          if (is2025) {
            for (const [qStr, groupVal] of Object.entries(p2Raw as Record<string, any>)) {
              const idx = parseInt(qStr, 10);
              if (!Number.isNaN(idx)) {
                const flatQ = idx > counts.part1Count ? idx : counts.part1Count + idx;
                const formatted = normalizeTfGroupAnswer(groupVal);
                if (formatted) studentFlatAnswers[flatQ] = formatted;
              }
            }
            for (const [qStr, shortVal] of Object.entries(p3Raw as Record<string, any>)) {
              const idx = parseInt(qStr, 10);
              const offset = counts.part1Count + counts.part2Count;
              if (!Number.isNaN(idx) && shortVal !== null && shortVal !== undefined) {
                const flatQ = idx > offset ? idx : offset + idx;
                studentFlatAnswers[flatQ] = String(shortVal).trim();
              }
            }

            const scored = scoreStudentAnswers({
              sheetType,
              subject,
              questionCount: isLegacy2025 ? 54 : counts.totalQuestions,
              answerKey: flatAnswerKey,
              studentAnswers: studentFlatAnswers,
            });

            const part1_results: Record<string, any> = {};
            const part2_results: Record<string, any> = {};
            const part3_results: Record<string, any> = {};
            let part1_score = 0;
            let part2_score = 0;
            let part3_score = 0;

            for (const d of scored.details) {
              if (d.section === "Part I") {
                part1_score += d.score;
                part1_results[String(d.questionNumber)] = {
                  selected: d.studentAnswer || null,
                  correct_answer: d.correctAnswer,
                  is_correct: d.isCorrect,
                  flag: "OK",
                  score: d.score,
                };
              } else if (d.section === "Part II") {
                const relIdx = d.questionNumber - counts.part1Count;
                part2_score += d.score;
                const sParts = d.studentAnswer ? d.studentAnswer.split("-") : ["", "", "", ""];
                const kParts = d.correctAnswer ? d.correctAnswer.split("-") : ["", "", "", ""];
                const sub_items: Record<string, any> = {};
                let correctSubsCount = 0;
                ["a", "b", "c", "d"].forEach((lbl, i) => {
                  const sel = normalizeTfChar(sParts[i]);
                  const exp = normalizeTfChar(kParts[i]);
                  const ok = Boolean(sel && exp && sel === exp);
                  if (ok) correctSubsCount++;
                  sub_items[lbl] = {
                    selected: sel || null,
                    correct: exp,
                    is_correct: ok,
                    flag: "OK",
                  };
                });
                part2_results[String(relIdx)] = {
                  sub_items,
                  correct_subs_count: correctSubsCount,
                  score: d.score,
                };
              } else if (d.section === "Part III") {
                const relIdx = d.questionNumber - counts.part1Count - counts.part2Count;
                part3_score += d.score;
                part3_results[String(relIdx)] = {
                  selected: d.studentAnswer,
                  correct_answer: d.correctAnswer,
                  is_correct: d.isCorrect,
                  score: d.score,
                };
              }
            }

            return {
              success: true,
              data: {
                sheet_type: sheetType,
                student_code: parsed.student_code || "",
                exam_code: parsed.exam_code || "",
                total_score: scored.score,
                correct_count: scored.correctCount,
                total_questions: scored.totalQuestions,
                engine_used: "gemini_vision_omr",
                scores_by_section: {
                  part1_score: Math.round(part1_score * 100) / 100,
                  part2_score: Math.round(part2_score * 100) / 100,
                  part3_score: Math.round(part3_score * 100) / 100,
                },
                part1_results,
                part2_results,
                part3_results,
                flagged_questions: [],
                annotated_image_base64: null,
              },
            };
          }

          // Unified MCQ (20, 40, 50)
          const scored = scoreStudentAnswers({
            sheetType,
            questionCount: mcqCount,
            answerKey: flatAnswerKey,
            studentAnswers: studentFlatAnswers,
          });
          const formattedResults: Record<string, any> = {};
          for (const d of scored.details) {
            formattedResults[String(d.questionNumber)] = {
              selected: d.studentAnswer || null,
              correct_answer: d.correctAnswer,
              is_correct: d.isCorrect,
              flag: "OK",
              score: d.score,
            };
          }

          return {
            success: true,
            data: {
              sheet_type: sheetType,
              student_code: parsed.student_code || "",
              exam_code: parsed.exam_code || "",
              total_score: scored.score,
              correct_count: scored.correctCount,
              total_questions: scored.totalQuestions,
              engine_used: "gemini_vision_omr",
              results: formattedResults,
              flagged_questions: [],
              annotated_image_base64: null,
            },
          };
        }
      }
    } catch (modelErr) {
      console.warn(`Gemini Vision OMR failed with model ${model}:`, modelErr);
    }
  }

  throw new Error("Không thể phân tích ảnh phiếu thi bằng Vision");
}

import { NextRequest, NextResponse } from "next/server";

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


// Sprint 6 Security Hardening: In-Memory Rate Limiter for OMR (Finding S5)
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

    if (action === "download_pdf") {
      const sheetType = body.sheetType === "2025" ? "bgd_2025" : "classic_50";
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
      const sheetType = body.sheetType === "2025" ? "bgd_2025" : "classic_50";
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
    const sheetType = body.sheetType === "2025" ? "bgd_2025" : "classic_50";
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

    // Fallback: Gemini Vision OMR (cho môi trường Vercel Cloud khi không có Python OpenCV)
    const visionData = await runGeminiVisionOMR(
      body.imageBase64,
      sheetType,
      body.answerKey || {}
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
 */
async function runGeminiVisionOMR(
  imageBase64: string,
  sheetType: string,
  answerKey: Record<string, any> = {}
) {
  const geminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY_PAID ||
    "";

  if (!geminiKey) {
    throw new Error("Không có kết nối OMR Service và chưa cấu hình Gemini API Key");
  }

  // Chuẩn hóa chuỗi base64
  let cleanBase64 = imageBase64;
  let mimeType = "image/jpeg";
  if (imageBase64.includes(";base64,")) {
    const parts = imageBase64.split(";base64,");
    mimeType = parts[0].replace("data:", "") || "image/jpeg";
    cleanBase64 = parts[1];
  }

  const prompt = `Bạn là chuyên gia thị giác máy tính đọc phiếu trả lời trắc nghiệm (OMR Scanner) chuẩn Bộ Giáo Dục & Đào Tạo Việt Nam.
Hãy quan sát thật kỹ bức ảnh chụp phiếu trả lời trắc nghiệm đính kèm (có thể là mẫu Bộ GD&ĐT 2025 hoặc mẫu trắc nghiệm truyền thống).
Nhiệm vụ: Trích xuất CHÍNH XÁC những gì thí sinh đã dùng bút chì/bút bi tô đen vào các ô tròn.

1. Số báo danh (SBD): Đọc 6 chữ số được tô ở khung "Số báo danh" (góc trên bên phải).
2. Mã đề thi: Đọc 3 chữ số được tô ở khung "Mã đề thi".
3. Phần I - Câu hỏi trắc nghiệm nhiều lựa chọn (4 lựa chọn A, B, C, D):
   - Đọc từng câu (từ Câu 1 đến 40 hoặc 50 tùy phiếu): Xem ô tròn nào (A, B, C hay D) được tô đen/tô đậm.
   - Nếu câu nào để trắng không tô hoặc bị gạch chéo tẩy xóa thì ghi null.
4. Phần II - Câu hỏi trắc nghiệm Đúng / Sai (nếu phiếu có Phần II):
   - Đọc các câu từ 1 đến 8, mỗi câu gồm 4 ý a, b, c, d được tô "Đ" (Đúng) hay "S" (Sai).
5. Phần III - Câu hỏi trắc nghiệm trả lời ngắn / điền số (nếu có):
   - Đọc giá trị số thí sinh tô.

YÊU CẦU ĐẶC BIỆT: Trả về DUY NHẤT một chuỗi JSON thuần túy (không bọc trong \`\`\`json):
{
  "student_code": "chuỗi 6 chữ số (hoặc '')",
  "exam_code": "chuỗi 3 chữ số (hoặc '')",
  "answers": {
    "1": "A",
    "2": "B",
    "3": "C",
    "4": null
  },
  "part2_answers": {
    "1": { "a": "D", "b": "S", "c": "D", "d": "S" }
  },
  "part3_answers": {
    "1": "42"
  }
}`;

  const models = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3-flash-preview",
  ];

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
          const studentAns = parsed.answers || parsed.results || parsed.part1_answers || {};

          let correctCount = 0;
          const totalQuestions = Object.keys(answerKey).length || Object.keys(studentAns).length || 20;
          const formattedResults: Record<string, any> = {};

          for (const [qStr, chosen] of Object.entries(studentAns)) {
            const correctOpt = answerKey[qStr] || answerKey[Number(qStr)];
            const isCorrect = correctOpt
              ? String(chosen).toUpperCase() === String(correctOpt).toUpperCase()
              : false;
            if (isCorrect) correctCount++;
            formattedResults[qStr] = {
              selected: chosen,
              is_correct: isCorrect,
              correct_answer: correctOpt || null,
            };
          }

          const totalScore =
            totalQuestions > 0
              ? Math.round((correctCount / totalQuestions) * 100) / 10
              : 0;

          return {
            success: true,
            data: {
              student_code: parsed.student_code || "",
              exam_code: parsed.exam_code || "",
              total_score: totalScore,
              correct_count: correctCount,
              total_questions: totalQuestions,
              engine_used: "gemini_vision_omr",
              results: formattedResults,
              part1_results: formattedResults,
              part2_results: parsed.part2_answers || {},
              part3_results: parsed.part3_answers || {},
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


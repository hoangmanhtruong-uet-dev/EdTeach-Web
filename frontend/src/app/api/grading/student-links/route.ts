import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createStudentSubmissionLink,
  getStudentSubmissionLinksBySession,
  getStudentSubmissionsBySession,
} from "@/lib/grading/student-submission-store";
import { getBaseUrl } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để tạo link nộp bài cho học sinh." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      sessionId,
      sessionName,
      subject,
      grade,
      className,
      durationMinutes = 60,
      questionCount = 20,
      sheetType = "20",
      answerKey = {},
    } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Thiếu sessionId của kỳ thi." },
        { status: 400 }
      );
    }

    const link = await createStudentSubmissionLink({
      userId: user.id,
      sessionId,
      sessionName,
      subject,
      grade,
      className,
      durationMinutes: parseInt(durationMinutes.toString()) || 60,
      questionCount: parseInt(questionCount.toString()) || 20,
      sheetType,
      answerKey,
    });

    const baseUrl = getBaseUrl(req);
    const linkUrl = `${baseUrl}/grading/submit/${link.token}`;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=10&data=${encodeURIComponent(
      linkUrl
    )}`;

    return NextResponse.json({
      success: true,
      link: {
        ...link,
        linkUrl,
        qrUrl,
      },
    });
  } catch (err: any) {
    console.error("Create student link error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi tạo link nộp bài." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để xem danh sách bài làm của học sinh." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Thiếu tham số sessionId." },
        { status: 400 }
      );
    }

    // BẢO MẬT: Chỉ trả về link và bài làm thuộc về giáo viên đang đăng nhập
    const links = await getStudentSubmissionLinksBySession(sessionId, user.id);
    const submissions = await getStudentSubmissionsBySession(sessionId);

    const baseUrl = getBaseUrl(req);

    const formattedLinks = links.map((l: any) => {
      const linkUrl = `${baseUrl}/grading/submit/${l.token}`;
      return {
        ...l,
        linkUrl,
        qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=10&data=${encodeURIComponent(
          linkUrl
        )}`,
      };
    });

    return NextResponse.json({
      success: true,
      links: formattedLinks,
      submissions,
    });
  } catch (err: any) {
    console.error("Get student links error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi tải thông tin liên kết." },
      { status: 500 }
    );
  }
}

import { Question } from "@/lib/api/exams";
import { QuestionPreview } from "@/types/marketplace";

interface ConvertQuestionOptions {
  startX?: number;
  startY?: number;
  includeExplanation?: boolean;
  revealMode?: boolean;
  isDarkTheme?: boolean;
  subject?: string;
  grade?: number;
}

const DIFFICULTY_MAP: Record<string, string> = {
  easy: 'Nhận biết',
  medium: 'Thông hiểu',
  hard: 'Vận dụng',
  very_hard: 'Vận dụng cao',
};

/**
 * Tách văn bản thành nhiều dòng với chiều dài dòng tối đa (tránh tràn khung Excalidraw)
 */
function wrapText(text: string, maxCharsPerLine = 48): string[] {
  if (!text) return [];
  const words = text.replace(/\r\n/g, '\n').split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Chuyển đổi một câu hỏi sang nhóm đối tượng Excalidraw (Card Element)
 */
export function convertQuestionToExcalidrawCard(
  question: Question | QuestionPreview | any,
  options: ConvertQuestionOptions = {}
): Record<string, unknown>[] {
  const startX = options.startX ?? 120;
  const startY = options.startY ?? 100;
  const isDark = options.isDarkTheme ?? false;
  const includeExplanation = options.includeExplanation ?? false;
  const cardWidth = 640;

  const groupId = `card_grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const elements: Record<string, unknown>[] = [];

  // Theme colors
  const borderColor = isDark ? '#38bdf8' : '#2563eb';
  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#475569';
  const headerBg = isDark ? '#1e293b' : '#eff6ff';
  const headerText = isDark ? '#38bdf8' : '#1d4ed8';

  // 1. Phân tích nội dung câu hỏi
  const orderNum = question.order || 1;
  const diffLabel = DIFFICULTY_MAP[question.difficulty || 'medium'] || 'Thông hiểu';
  const subjectTag = options.subject ? `${options.subject} ${options.grade ? options.grade : ''}` : '';

  const wrappedQuestion = wrapText(question.content || 'Nội dung câu hỏi', 52);
  const questionTextHeight = wrappedQuestion.length * 26;

  // 2. Phân tích phương án trắc nghiệm hoặc tiểu mục
  let optionsTextHeight = 0;
  const optionLines: string[] = [];

  if (Array.isArray(question.options) && question.options.length > 0) {
    question.options.forEach((opt: string) => {
      const wrapped = wrapText(opt, 50);
      optionLines.push(...wrapped);
    });
    optionsTextHeight = optionLines.length * 24 + 10;
  } else if (Array.isArray(question.sub_questions) && question.sub_questions.length > 0) {
    question.sub_questions.forEach((sub: any) => {
      const subLabel = sub.sub_label || 'a';
      const wrapped = wrapText(`${subLabel}) ${sub.content}`, 50);
      optionLines.push(...wrapped);
    });
    optionsTextHeight = optionLines.length * 24 + 10;
  }

  // 3. Phân tích lời giải (nếu có)
  let explanationHeight = 0;
  const explanationLines: string[] = [];
  if (includeExplanation && (question.explanation || question.correct_answer)) {
    if (question.correct_answer) {
      explanationLines.push(`Đáp án chuẩn: ${question.correct_answer}`);
    }
    if (question.explanation) {
      explanationLines.push(...wrapText(`Hướng dẫn giải: ${question.explanation}`, 50));
    }
    explanationHeight = explanationLines.length * 24 + 40;
  }

  // Tổng chiều cao thẻ
  const totalCardHeight = Math.max(
    180,
    55 + questionTextHeight + 20 + optionsTextHeight + explanationHeight + 25
  );

  // ================= 1. KHUNG THẺ CHÍNH (Background Card) =================
  elements.push({
    id: `rect_bg_${groupId}`,
    type: 'rectangle',
    x: startX,
    y: startY,
    width: cardWidth,
    height: totalCardHeight,
    strokeColor: borderColor,
    backgroundColor: cardBg,
    fillStyle: 'solid',
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 100,
    roundness: { type: 3 },
    groupIds: [groupId],
  });

  // ================= 2. THANH TIÊU ĐỀ THẺ (Header Banner) =================
  elements.push({
    id: `header_bg_${groupId}`,
    type: 'rectangle',
    x: startX,
    y: startY,
    width: cardWidth,
    height: 44,
    strokeColor: borderColor,
    backgroundColor: headerBg,
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 100,
    roundness: { type: 3 },
    groupIds: [groupId],
  });

  // Chữ trên tiêu đề (CÂU SỐ + ĐỘ KHÓ + MÔN)
  const headerTitle = `CÂU ${orderNum}  •  [${diffLabel.toUpperCase()}]${subjectTag ? '  •  ' + subjectTag.toUpperCase() : ''}`;
  elements.push({
    id: `header_txt_${groupId}`,
    type: 'text',
    x: startX + 16,
    y: startY + 12,
    text: headerTitle,
    fontSize: 16,
    fontFamily: 2,
    textAlign: 'left',
    verticalAlign: 'top',
    strokeColor: headerText,
    groupIds: [groupId],
  });

  // ================= 3. NỘI DUNG CÂU HỎI (Question Text) =================
  let currentY = startY + 56;

  elements.push({
    id: `q_content_${groupId}`,
    type: 'text',
    x: startX + 20,
    y: currentY,
    text: wrappedQuestion.join('\n'),
    fontSize: 18,
    fontFamily: 2,
    textAlign: 'left',
    verticalAlign: 'top',
    strokeColor: textColor,
    groupIds: [groupId],
  });

  currentY += questionTextHeight + 16;

  // ================= 4. CÁC PHƯƠNG ÁN (Options / Sub-questions) =================
  if (optionLines.length > 0) {
    // Đường gạch ngăn cách mảnh
    elements.push({
      id: `sep_line_${groupId}`,
      type: 'line',
      x: startX + 20,
      y: currentY - 6,
      width: cardWidth - 40,
      height: 0,
      points: [[0, 0], [cardWidth - 40, 0]],
      strokeColor: isDark ? '#334155' : '#e2e8f0',
      strokeWidth: 1,
      strokeStyle: 'dashed',
      roughness: 0,
      groupIds: [groupId],
    });

    elements.push({
      id: `options_txt_${groupId}`,
      type: 'text',
      x: startX + 24,
      y: currentY + 6,
      text: optionLines.join('\n'),
      fontSize: 16,
      fontFamily: 2,
      textAlign: 'left',
      verticalAlign: 'top',
      strokeColor: subTextColor,
      groupIds: [groupId],
    });

    currentY += optionsTextHeight + 10;
  }

  // ================= 5. KHỐI LỜI GIẢI CHI TIẾT (Nếu có) =================
  if (explanationLines.length > 0) {
    const expBoxHeight = explanationHeight - 10;
    elements.push({
      id: `exp_bg_${groupId}`,
      type: 'rectangle',
      x: startX + 16,
      y: currentY + 4,
      width: cardWidth - 32,
      height: expBoxHeight,
      strokeColor: '#10b981',
      backgroundColor: isDark ? '#064e3b33' : '#ecfdf5',
      fillStyle: 'solid',
      strokeWidth: 1.5,
      strokeStyle: 'solid',
      roughness: 0,
      roundness: { type: 3 },
      groupIds: [groupId],
    });

    elements.push({
      id: `exp_txt_${groupId}`,
      type: 'text',
      x: startX + 28,
      y: currentY + 14,
      text: explanationLines.join('\n'),
      fontSize: 15,
      fontFamily: 2,
      textAlign: 'left',
      verticalAlign: 'top',
      strokeColor: isDark ? '#6ee7b7' : '#047857',
      groupIds: [groupId],
    });

    // Nếu ở chế độ Reveal (Che đáp án để giáo viên bóc tách từng bước)
    if (options.revealMode) {
      elements.push({
        id: `reveal_mask_${groupId}`,
        type: 'rectangle',
        x: startX + 16,
        y: currentY + 4,
        width: cardWidth - 32,
        height: expBoxHeight,
        strokeColor: '#f59e0b',
        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
        fillStyle: 'solid',
        strokeWidth: 2,
        strokeStyle: 'dashed',
        roughness: 0,
        roundness: { type: 3 },
        opacity: 98,
      });

      elements.push({
        id: `reveal_txt_${groupId}`,
        type: 'text',
        x: startX + 32,
        y: currentY + Math.max(14, expBoxHeight / 2 - 12),
        text: '🔒 [ REVEAL MODE: Click chọn & kéo/xóa hộp che để hiện lời giải ]',
        fontSize: 13,
        fontFamily: 2,
        textAlign: 'center',
        verticalAlign: 'middle',
        strokeColor: '#f59e0b',
      });
    }
  }

  return elements;
}

/**
 * Tự động phát hiện dạng hình học hoặc mô phỏng từ nội dung câu hỏi
 * Khớp trực tiếp với các ID trong STEM_LIBRARY_ITEMS
 */
export function detectStemShapeIdForQuestion(content: string): string | null {
  if (!content) return null;
  const lower = content.toLowerCase();

  // 1. Hình không gian 3D (Toán 11, 12)
  if (lower.includes("s.abcd") || lower.includes("chóp tứ giác") || lower.includes("đáy là hình vuông") || lower.includes("đáy là hình chữ nhật") || lower.includes("đáy là hình thoi") || lower.includes("đáy là hình bình hành")) {
    return "stem-geom-pyramid-quad";
  }
  if (lower.includes("hình chóp") || lower.includes("tứ diện") || lower.includes("s.abc") || lower.includes("tam giác đều")) {
    return "stem-geom-pyramid-triangle";
  }
  if (lower.includes("hình hộp") || lower.includes("hình lập phương") || lower.includes("khối hộp")) {
    return "stem-geom-box";
  }
  if (lower.includes("lăng trụ") || lower.includes("lăng trụ đứng") || lower.includes("abc.a'b'c'")) {
    return "stem-geom-prism";
  }
  if (lower.includes("hình nón") || lower.includes("khối nón") || lower.includes("đường sinh") || lower.includes("đỉnh nón")) {
    return "stem-geom-cone";
  }
  if (lower.includes("hình trụ") || lower.includes("khối trụ") || lower.includes("thiết diện qua trục")) {
    return "stem-geom-cylinder";
  }
  if (lower.includes("hình cầu") || lower.includes("mặt cầu") || lower.includes("khối cầu") || lower.includes("bán kính r")) {
    return "stem-geom-sphere";
  }

  // 2. Đồ thị & Lượng giác (Toán 10, 11, 12)
  if (lower.includes("oxyz") || lower.includes("không gian oxyz") || lower.includes("toạ độ trong không gian")) {
    return "stem-coord-oxyz";
  }
  if (lower.includes("lượng giác") || lower.includes("vòng tròn lượng giác") || lower.includes("đường tròn lượng giác") || lower.includes("sin") && lower.includes("cos")) {
    return "stem-trig-circle";
  }
  if (lower.includes("parabol") || lower.includes("bậc hai") || lower.includes("y = ax")) {
    return "stem-parabola";
  }
  if (lower.includes("hệ trục") || lower.includes("toạ độ oxy") || lower.includes("đồ thị hàm số")) {
    return "stem-coord-oxy";
  }

  // 3. Vật lý Cơ học (Lớp 10, 12)
  if (lower.includes("lực") || lower.includes("niuton") || lower.includes("newton") || lower.includes("hợp lực") || lower.includes("hình bình hành lực")) {
    return "stem-force-vector";
  }
  if (lower.includes("con lắc đơn") || lower.includes("dây treo") || lower.includes("góc lệch")) {
    return "stem-pendulum";
  }
  if (lower.includes("lò xo nằm ngang") || lower.includes("mặt phẳng ngang")) {
    return "stem-spring-horizontal";
  }
  if (lower.includes("lò xo") || lower.includes("độ cứng k") || lower.includes("con lắc lò xo")) {
    return "stem-spring";
  }

  // 4. Vật lý Điện học (Lớp 11, 12)
  if (lower.includes("song song") && (lower.includes("mạch điện") || lower.includes("điện trở") || lower.includes("r1") || lower.includes("r2"))) {
    return "stem-circuit-parallel";
  }
  if (lower.includes("nối tiếp") && (lower.includes("mạch điện") || lower.includes("điện trở"))) {
    return "stem-circuit-series";
  }
  if (lower.includes("mạch điện") || lower.includes("hiệu điện thế") || lower.includes("suất điện động") || lower.includes("định luật ôm")) {
    return "stem-circuit-series";
  }
  if (lower.includes("nguồn điện") || lower.includes("pin") || lower.includes("ắc quy")) {
    return "stem-battery";
  }
  if (lower.includes("điện trở")) {
    return "stem-resistor";
  }

  // 5. Vật lý Quang học & Sóng (Lớp 11, 12)
  if (lower.includes("thấu kính phân kì") || lower.includes("phân kì")) {
    return "stem-lens-concave";
  }
  if (lower.includes("thấu kính") || lower.includes("hội tụ") || lower.includes("tiêu cự") || lower.includes("quang tâm")) {
    return "stem-lens-convex";
  }
  if (lower.includes("phản xạ") || lower.includes("gương phẳng") || lower.includes("góc tới") || lower.includes("góc phản xạ")) {
    return "stem-optics-reflection";
  }
  if (lower.includes("lăng kính") || lower.includes("tán sắc") || lower.includes("góc chiết quang")) {
    return "stem-optics-prism";
  }
  if (lower.includes("sóng dừng") || lower.includes("bụng sóng") || lower.includes("nút sóng") || lower.includes("bước sóng")) {
    return "stem-wave-standing";
  }

  // 6. Hóa học & Sinh học
  if (lower.includes("benzen") || lower.includes("c6h6") || lower.includes("hiđrocacbon thơm") || lower.includes("toluen")) {
    return "stem-chem-benzene";
  }
  if (lower.includes("chuẩn độ") || lower.includes("bình tam giác") || lower.includes("erlenmeyer") || lower.includes("buret")) {
    return "stem-chem-erlenmeyer";
  }
  if (lower.includes("ống nghiệm") || lower.includes("kết tủa") || lower.includes("thí nghiệm hóa học")) {
    return "stem-chem-testtube";
  }
  if (lower.includes("nước") || lower.includes("h2o") || lower.includes("liên kết hiđro")) {
    return "stem-chem-water";
  }
  if (lower.includes("metan") || lower.includes("ch4") || lower.includes("tứ diện đều")) {
    return "stem-chem-methane";
  }

  return null;
}

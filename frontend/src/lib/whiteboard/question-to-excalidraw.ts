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
  questionIndex?: number;
}

const DIFFICULTY_MAP: Record<string, string> = {
  easy: 'Nhận biết',
  medium: 'Thông hiểu',
  hard: 'Vận dụng',
  very_hard: 'Vận dụng cao',
};

/**
 * Chuyển đổi mã KaTeX / LaTeX toán học sang ký tự Unicode chuẩn để hiển thị đẹp trên Canvas Excalidraw
 */
export function cleanLatexToUnicode(str: string): string {
  if (!str) return '';
  let s = str;

  // 1. Số mũ: ^{2}, ^2, ^{n+1}, v.v.
  const supers: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
    'n': 'ⁿ', 'x': 'ˣ', 'y': 'ʸ'
  };
  s = s.replace(/\^\{([^}]+)\}/g, (_, exp) =>
    exp.split('').map((c: string) => supers[c] || c).join('')
  );
  s = s.replace(/\^([0-9nxy+-])/g, (_, c) => supers[c] || c);

  // 2. Chỉ số dưới: _{1}, _1, _{i}, v.v.
  const subs: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
    'x': 'ₓ', 'y': 'ᵧ', 'i': 'ᵢ', 'j': 'ⱼ'
  };
  s = s.replace(/_\{([^}]+)\}/g, (_, sub) =>
    sub.split('').map((c: string) => subs[c] || c).join('')
  );
  s = s.replace(/_([0-9xyij])/g, (_, c) => subs[c] || c);

  // 3. Căn bậc hai & căn bậc n: \sqrt{...}, \sqrt[n]{...}
  s = s.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, 'ˢᵘᵖ($1)√($2)');
  s = s.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
  s = s.replace(/\\sqrt\s+([0-9a-zA-Z]+)/g, '√$1');

  // 4. Phân số: \frac{a}{b} -> (a)/(b)
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');

  // 5. Ký hiệu so sánh & phép toán
  s = s.replace(/\\le\b|\\leq\b/g, '≤');
  s = s.replace(/\\ge\b|\\geq\b/g, '≥');
  s = s.replace(/\\ne\b|\\neq\b/g, '≠');
  s = s.replace(/\\pm\b/g, '±');
  s = s.replace(/\\mp\b/g, '∓');
  s = s.replace(/\\times\b/g, '×');
  s = s.replace(/\\cdot\b/g, '·');
  s = s.replace(/\\div\b/g, '÷');

  // 6. Ký hiệu tập hợp & logic & hình học
  s = s.replace(/\\in\b/g, '∈');
  s = s.replace(/\\notin\b/g, '∉');
  s = s.replace(/\\infty\b/g, '∞');
  s = s.replace(/\\subset\b/g, '⊂');
  s = s.replace(/\\cup\b/g, '∪');
  s = s.replace(/\\cap\b/g, '∩');
  s = s.replace(/\\forall\b/g, '∀');
  s = s.replace(/\\exists\b/g, '∃');
  s = s.replace(/\\approx\b/g, '≈');
  s = s.replace(/\\equiv\b/g, '≡');
  s = s.replace(/\\angle\b/g, '∠');
  s = s.replace(/\\parallel\b/g, '∥');
  s = s.replace(/\\perp\b/g, '⊥');
  s = s.replace(/\\vec\{([^}]+)\}/g, 'vec($1)');

  // 7. Ký tự Hy Lạp thường gặp trong Toán/Lý
  s = s.replace(/\\pi\b/g, 'π');
  s = s.replace(/\\alpha\b/g, 'α');
  s = s.replace(/\\beta\b/g, 'β');
  s = s.replace(/\\gamma\b/g, 'γ');
  s = s.replace(/\\theta\b/g, 'θ');
  s = s.replace(/\\Delta\b/g, 'Δ');
  s = s.replace(/\\lambda\b/g, 'λ');
  s = s.replace(/\\omega\b/g, 'ω');
  s = s.replace(/\\Omega\b/g, 'Ω');

  // 8. Bỏ các lệnh bọc định dạng KaTeX: \text{}, \mathrm{}, \mathbf{}, \overline{}, v.v.
  s = s.replace(/\\(text|mathrm|mathbf|mathit|textbf|bar|overline)\{([^}]+)\}/g, '$2');

  // 9. Dấu ngoặc co giãn \left(, \right)
  s = s.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')');
  s = s.replace(/\\left\[/g, '[').replace(/\\right\]/g, ']');
  s = s.replace(/\\left\\\{/g, '{').replace(/\\right\\\}/g, '}');
  s = s.replace(/\\left\|/g, '|').replace(/\\right\|/g, '|');

  // 10. Bỏ dấu bao quanh công thức LaTeX ($ và $$)
  s = s.replace(/\$\$/g, '').replace(/\$/g, '');

  // 11. Bỏ dấu gạch chéo ngược còn sót trước từ đơn
  s = s.replace(/\\([a-zA-Z]+)/g, '$1');

  // Chuẩn hóa khoảng trắng
  s = s.replace(/[ \t]+/g, ' ');

  return s.trim();
}

/**
 * Tách văn bản thành nhiều dòng với chiều dài dòng tối đa (tránh tràn khung Excalidraw)
 */
function wrapText(text: string, maxCharsPerLine = 48): string[] {
  if (!text) return [];
  const rawLines = text.replace(/\r\n/g, '\n').split('\n');
  const finalLines: string[] = [];

  for (const rawLine of rawLines) {
    if (!rawLine.trim()) {
      finalLines.push('');
      continue;
    }
    const words = rawLine.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) finalLines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) finalLines.push(currentLine);
  }

  return finalLines;
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

  // 1. Phân tích số thứ tự & nội dung câu hỏi
  const orderNum =
    options.questionIndex ??
    question.order_index ??
    question.orderIndex ??
    question.order ??
    1;
  const diffLabel = DIFFICULTY_MAP[question.difficulty || 'medium'] || 'Thông hiểu';
  const subjectTag = options.subject ? `${options.subject} ${options.grade ? options.grade : ''}` : '';

  // Chuyển đổi KaTeX sang Unicode toán học chuẩn
  const cleanedContent = cleanLatexToUnicode(question.content || 'Nội dung câu hỏi');
  const wrappedQuestion = wrapText(cleanedContent, 52);
  const questionTextHeight = Math.max(30, wrappedQuestion.length * 28);

  // 2. Phân tích phương án trắc nghiệm hoặc tiểu mục (Hỗ trợ Array, Object key-value, JSON string)
  let rawOptions: string[] = [];
  if (Array.isArray(question.options)) {
    rawOptions = (question.options as unknown[]).map((o) => (typeof o === 'string' ? o : String(o)));
  } else if (typeof question.options === 'object' && question.options !== null) {
    rawOptions = Object.values(question.options as Record<string, unknown>).map(String);
  } else if (typeof question.options === 'string') {
    try {
      const parsed = JSON.parse(question.options);
      if (Array.isArray(parsed)) rawOptions = parsed.map(String);
      else if (typeof parsed === 'object' && parsed !== null) rawOptions = Object.values(parsed).map(String);
      else rawOptions = [question.options];
    } catch {
      rawOptions = [question.options];
    }
  }

  let optionsTextHeight = 0;
  const optionLines: string[] = [];
  const OPTION_PREFIXES = ['A', 'B', 'C', 'D', 'E', 'F'];

  if (rawOptions.length > 0) {
    rawOptions.forEach((opt: string, idx: number) => {
      const prefix = OPTION_PREFIXES[idx] || `${idx + 1}`;
      const cleanedOpt = cleanLatexToUnicode(opt);
      const formatted = /^[A-Z]\s*[\.:]/i.test(cleanedOpt.trim())
        ? cleanedOpt.trim()
        : `${prefix}. ${cleanedOpt.trim()}`;
      const wrapped = wrapText(formatted, 50);
      optionLines.push(...wrapped);
    });
    optionsTextHeight = Math.max(30, optionLines.length * 26 + 12);
  } else if (Array.isArray(question.sub_questions) && question.sub_questions.length > 0) {
    question.sub_questions.forEach((sub: any) => {
      const subLabel = sub.sub_label || 'a';
      const cleanedSub = cleanLatexToUnicode(sub.content);
      const wrapped = wrapText(`${subLabel}) ${cleanedSub}`, 50);
      optionLines.push(...wrapped);
    });
    optionsTextHeight = Math.max(30, optionLines.length * 26 + 12);
  }

  // 3. Phân tích lời giải (nếu có)
  let explanationHeight = 0;
  const explanationLines: string[] = [];
  if (includeExplanation && (question.explanation || question.correct_answer)) {
    if (question.correct_answer) {
      explanationLines.push(`Đáp án chuẩn: ${question.correct_answer}`);
    }
    if (question.explanation) {
      const cleanedExp = cleanLatexToUnicode(question.explanation);
      explanationLines.push(...wrapText(`Hướng dẫn giải: ${cleanedExp}`, 50));
    }
    explanationHeight = Math.max(40, explanationLines.length * 24 + 40);
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
    originalText: headerTitle,
    fontSize: 16,
    fontFamily: 2,
    textAlign: 'left',
    verticalAlign: 'top',
    width: cardWidth - 32,
    height: 28,
    autoResize: true,
    strokeColor: headerText,
    groupIds: [groupId],
  });

  // ================= 3. NỘI DUNG CÂU HỎI (Question Text) =================
  let currentY = startY + 56;
  const qJoined = wrappedQuestion.join('\n');

  elements.push({
    id: `q_content_${groupId}`,
    type: 'text',
    x: startX + 20,
    y: currentY,
    text: qJoined,
    originalText: qJoined,
    fontSize: 18,
    fontFamily: 2,
    textAlign: 'left',
    verticalAlign: 'top',
    width: cardWidth - 40,
    height: questionTextHeight,
    autoResize: true,
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

    const optJoined = optionLines.join('\n');
    elements.push({
      id: `options_txt_${groupId}`,
      type: 'text',
      x: startX + 24,
      y: currentY + 6,
      text: optJoined,
      originalText: optJoined,
      fontSize: 16,
      fontFamily: 2,
      textAlign: 'left',
      verticalAlign: 'top',
      width: cardWidth - 48,
      height: optionsTextHeight,
      autoResize: true,
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

    const expJoined = explanationLines.join('\n');
    elements.push({
      id: `exp_txt_${groupId}`,
      type: 'text',
      x: startX + 28,
      y: currentY + 14,
      text: expJoined,
      originalText: expJoined,
      fontSize: 15,
      fontFamily: 2,
      textAlign: 'left',
      verticalAlign: 'top',
      width: cardWidth - 56,
      height: expBoxHeight - 20,
      autoResize: true,
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
        originalText: '🔒 [ REVEAL MODE: Click chọn & kéo/xóa hộp che để hiện lời giải ]',
        fontSize: 13,
        fontFamily: 2,
        textAlign: 'center',
        verticalAlign: 'middle',
        width: cardWidth - 64,
        height: 24,
        autoResize: true,
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

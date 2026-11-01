import { ExamWithQuestions } from "@/lib/api/exams";

export const SEED_EXAMS: ExamWithQuestions[] = [
  // 1. TOÁN HỌC 12 - CHUẨN MA TRẬN GDPT 2025
  {
    id: "seed-toan-12",
    user_id: "demo-teacher-id",
    name: "Đề Khảo Sát Năng Lực Toán 12 GDPT 2025 (Chuẩn Ma Trận Bộ GD&ĐT)",
    title: "Đề Khảo Sát Năng Lực Toán 12 GDPT 2025 (Chuẩn Ma Trận Bộ GD&ĐT)",
    subject: "Toán Học",
    grade: "12",
    chapter: "Khảo sát hàm số & Tích phân",
    config: {},
    credit_cost: 0,
    question_count: 4,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    status: "completed",
    questions: [
      {
        id: "q-toan-1",
        exam_id: "seed-toan-12",
        order_index: 1,
        type: "multiple_choice",
        content: "Cho hàm số $y = f(x)$ có bảng biến thiên như hình vẽ. Hàm số đã cho đồng biến trên khoảng nào dưới đây?",
        options: [
          "$(-\\infty; -1)$",
          "$(-1; 1)$",
          "$(1; +\\infty)$",
          "$(0; 2)$"
        ],
        correct_answer: "B",
        explanation: "Dựa vào bảng xét dấu đạo hàm $f'(x) > 0$ trên khoảng $(-1; 1)$, suy ra hàm số đồng biến trên $(-1; 1)$.",
        difficulty: "easy",
        created_at: new Date().toISOString(),
      },
      {
        id: "q-toan-2",
        exam_id: "seed-toan-12",
        order_index: 2,
        type: "multiple_choice",
        content: "Tìm giá trị cực đại $y_{\\text{CĐ}}$ của hàm số $y = x^3 - 3x + 2$.",
        options: [
          "$y_{\\text{CĐ}} = 4$",
          "$y_{\\text{CĐ}} = 0$",
          "$y_{\\text{CĐ}} = 2$",
          "$y_{\\text{CĐ}} = -1$"
        ],
        correct_answer: "A",
        explanation: "Ta có $y' = 3x^2 - 3 = 0 \\Leftrightarrow x = \\pm 1$. Vì $y''(-1) = -6 < 0$ nên điểm cực đại là $x = -1$, suy ra $y_{\\text{CĐ}} = (-1)^3 - 3(-1) + 2 = 4$.",
        difficulty: "medium",
        created_at: new Date().toISOString(),
      },
      {
        id: "q-toan-3",
        exam_id: "seed-toan-12",
        order_index: 3,
        type: "multiple_choice",
        content: "Một doanh nghiệp dự kiến chi phí sản xuất $x$ sản phẩm được cho bởi hàm số $C(x) = x^2 + 40x + 10000$ (nghìn đồng). Để chi phí trung bình trên mỗi sản phẩm $\\bar{C}(x) = \\frac{C(x)}{x}$ đạt giá trị nhỏ nhất thì số sản phẩm cần sản xuất là bao nhiêu?",
        options: [
          "$x = 100$",
          "$x = 50$",
          "$x = 200$",
          "$x = 120$"
        ],
        correct_answer: "A",
        explanation: "Chi phí trung bình $\\bar{C}(x) = x + 40 + \\frac{10000}{x}$. Theo bất đẳng thức Cauchy: $x + \\frac{10000}{x} \\ge 2\\sqrt{10000} = 200$. Dấu '=' xảy ra khi $x^2 = 10000 \\Rightarrow x = 100$.",
        difficulty: "hard",
        created_at: new Date().toISOString(),
      },
      {
        id: "q-toan-4",
        exam_id: "seed-toan-12",
        order_index: 4,
        type: "multiple_choice",
        content: "Trong không gian $Oxyz$, cho mặt cầu $(S): (x-1)^2 + (y+2)^2 + (z-3)^2 = 25$ và mặt phẳng $(P): 2x - 2y + z + m = 0$. Tìm tất cả các giá trị của tham số $m$ để mặt phẳng $(P)$ cắt mặt cầu $(S)$ theo giao tuyến là một đường tròn có chu vi bằng $6\\pi$.",
        options: [
          "$m = 5$ hoặc $m = -19$",
          "$m = 2$ hoặc $m = -16$",
          "$m = 3$ hoặc $m = -21$",
          "$m = 7$ hoặc $m = -17$"
        ],
        correct_answer: "A",
        explanation: "Tâm $I(1; -2; 3)$, bán kính $R = 5$. Chu vi đường tròn giao tuyến $C = 2\\pi r = 6\\pi \\Rightarrow r = 3$. Khoảng cách $d(I, (P)) = \\sqrt{R^2 - r^2} = 4$. Ta có $\\frac{|2(1) - 2(-2) + 3 + m|}{\\sqrt{4+4+1}} = 4 \\Leftrightarrow |m + 9| = 12 \\Rightarrow m = 3$ hoặc $m = -21$.",
        difficulty: "very_hard",
        created_at: new Date().toISOString(),
      },
    ],
  },

  // 2. VẬT LÝ 12 - DAO ĐỘNG CƠ & QUANG ĐIỆN (LIÊN KẾT PHÒNG THÍ NGHIỆM 3D)
  {
    id: "seed-ly-12",
    user_id: "demo-teacher-id",
    name: "Khảo Sát Vật Lý 12: Dao Động Cơ & Hiện Tượng Quang Điện (Có 3D Lab)",
    title: "Khảo Sát Vật Lý 12: Dao Động Cơ & Hiện Tượng Quang Điện (Có 3D Lab)",
    subject: "Vật Lý",
    grade: "12",
    chapter: "Sóng cơ & Thuyết lượng tử",
    config: {},
    credit_cost: 0,
    question_count: 3,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    status: "completed",
    questions: [
      {
        id: "q-ly-1",
        exam_id: "seed-ly-12",
        order_index: 1,
        type: "multiple_choice",
        content: "Một vật dao động điều hòa với phương trình $x = 5\\cos(4\\pi t + \\frac{\\pi}{3})$ (cm). Biên độ dao động của vật là:",
        options: [
          "$A = 5\\text{ cm}$",
          "$A = 10\\text{ cm}$",
          "$A = 4\\pi\\text{ cm}$",
          "$A = \\frac{\\pi}{3}\\text{ cm}$"
        ],
        correct_answer: "A",
        explanation: "Phương trình dao động chuẩn $x = A\\cos(\\omega t + \\varphi)$, đối chiếu ta có biên độ $A = 5\\text{ cm}$.",
        difficulty: "easy",
        created_at: new Date().toISOString(),
      },
      {
        id: "q-ly-2",
        exam_id: "seed-ly-12",
        order_index: 2,
        type: "multiple_choice",
        content: "Chiếu bức xạ điện từ có bước sóng $\\lambda = 0{,}3\\,\\mu\\text{m}$ vào bề mặt một kim loại có công thoát $A = 3{,}5\\text{ eV}$. Cho $h = 6{,}625\\cdot 10^{-34}\\text{ J}\\cdot\\text{s}$, $c = 3\\cdot 10^8\\text{ m/s}$. Hiện tượng quang điện có xảy ra không?",
        options: [
          "Có xảy ra, vì năng lượng photon $\\varepsilon \\approx 4{,}14\\text{ eV} > A$",
          "Không xảy ra, vì $\\varepsilon < A$",
          "Có xảy ra nhưng electron không thoát ra ngoài",
          "Chưa đủ dữ kiện kết luận"
        ],
        correct_answer: "A",
        explanation: "Năng lượng photon $\\varepsilon = \\frac{hc}{\\lambda} = \\frac{19{,}875\\cdot 10^{-26}}{0{,}3\\cdot 10^{-6}} = 6{,}625\\cdot 10^{-19}\\text{ J} \\approx 4{,}14\\text{ eV}$. Vì $\\varepsilon > A$ ($4{,}14 > 3{,}5$) nên hiện tượng quang điện ngoài xảy ra.",
        difficulty: "medium",
        created_at: new Date().toISOString(),
      },
      {
        id: "q-ly-3",
        exam_id: "seed-ly-12",
        order_index: 3,
        type: "multiple_choice",
        content: "Một con lắc lò xo gồm vật nặng khối lượng $m = 200\\text{ g}$ và lò xo có độ cứng $k = 50\\text{ N/m}$. Kéo vật lệch khỏi vị trí cân bằng một đoạn $4\\text{ cm}$ rồi truyền vận tốc ban đầu $v_0 = 40\\text{ cm/s}$ theo phương trục lò xo. Biên độ dao động tổng hợp của con lắc là:",
        options: [
          "$A = 4\\sqrt{2}\\text{ cm}$",
          "$A = 8\\text{ cm}$",
          "$A = 5\\text{ cm}$",
          "$A = 6\\text{ cm}$"
        ],
        correct_answer: "A",
        explanation: "Tần số góc $\\omega = \\sqrt{\\frac{k}{m}} = \\sqrt{\\frac{50}{0{,}2}} = 5\\sqrt{10} \\approx 15{,}8\\text{ rad/s}$. Áp dụng hệ thức độc lập $A = \\sqrt{x^2 + \\frac{v^2}{\\omega^2}} = 4\\sqrt{2}\\text{ cm}$.",
        difficulty: "hard",
        created_at: new Date().toISOString(),
      },
    ],
  },

  // 3. HÓA HỌC 12 - ESTE & XÀ PHÒNG HÓA
  {
    id: "seed-hoa-12",
    user_id: "demo-teacher-id",
    name: "Kiểm Tra Hóa Học 12: Este - Lipit & Phản Ứng Xà Phòng Hóa",
    title: "Kiểm Tra Hóa Học 12: Este - Lipit & Phản Ứng Xà Phòng Hóa",
    subject: "Hóa Học",
    grade: "12",
    chapter: "Este - Lipit",
    config: {},
    credit_cost: 0,
    question_count: 2,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    status: "completed",
    questions: [
      {
        id: "q-hoa-1",
        exam_id: "seed-hoa-12",
        order_index: 1,
        type: "multiple_choice",
        content: "Chất nào sau đây là este no, đơn chức, mạch hở?",
        options: [
          "$\\text{CH}_3\\text{COOCH}_3$",
          "$\\text{CH}_2=\\text{CH}-\\text{COOCH}_3$",
          "$\\text{CH}_3\\text{COOH}$",
          "$\\text{HCOOCH}=\\text{CH}_2$"
        ],
        correct_answer: "A",
        explanation: "$\\text{CH}_3\\text{COOCH}_3$ có công thức phân tử $\\text{C}_3\\text{H}_6\\text{O}_2$, thỏa mãn công thức chung $\\text{C}_n\\text{H}_{2n}\\text{O}_2$ ($n \\ge 2$).",
        difficulty: "easy",
        created_at: new Date().toISOString(),
      },
      {
        id: "q-hoa-2",
        exam_id: "seed-hoa-12",
        order_index: 2,
        type: "multiple_choice",
        content: "Xà phòng hóa hoàn toàn $8{,}8\\text{ gam}$ etyl axetat bằng dung dịch $\\text{NaOH}$ dư, đun nóng. Khối lượng muối natri axetat thu được sau phản ứng là:",
        options: [
          "$8{,}2\\text{ gam}$",
          "$6{,}8\\text{ gam}$",
          "$9{,}6\\text{ gam}$",
          "$7{,}4\\text{ gam}$"
        ],
        correct_answer: "A",
        explanation: "$n_{\\text{CH}_3\\text{COOC}_2\\text{H}_5} = \\frac{8{,}8}{88} = 0{,}1\\text{ mol}$. Phương trình: $\\text{CH}_3\\text{COOC}_2\\text{H}_5 + \\text{NaOH} \\to \\text{CH}_3\\text{COONa} + \\text{C}_2\\text{H}_5\\text{OH}$. Khối lượng muối $m = 0{,}1 \\times 82 = 8{,}2\\text{ gam}$.",
        difficulty: "medium",
        created_at: new Date().toISOString(),
      },
    ],
  },
];

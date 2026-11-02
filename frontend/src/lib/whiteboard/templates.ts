import { sanitizeExcalidrawElements } from "@/lib/whiteboard/sanitize-elements";

/**
 * 4 Quick Templates Sư Phạm Mẫu cho Bảng trắng EdTeach
 * Mở khóa cho toàn bộ giáo viên (Free & Pro)
 */

export interface WhiteboardTemplate {
  key: string;
  name: string;
  description: string;
  iconName: string;
  badge: string;
  generateElements: () => Record<string, unknown>[];
  appState?: Record<string, unknown>;
}

export const WHITEBOARD_TEMPLATES: WhiteboardTemplate[] = [
  // 1. Hai cột: Đề bài & Lời giải
  {
    key: "two-columns",
    name: "Hai cột: Đề bài & Lời giải",
    description: "Vách ngăn chuẩn sư phạm phân tách câu hỏi và các bước giải chi tiết",
    iconName: "Columns2",
    badge: "Phổ biến nhất",
    appState: {
      viewBackgroundColor: "#ffffff",
      gridSize: 20,
    },
    generateElements: () =>
      sanitizeExcalidrawElements([
        // Tiêu đề cột trái
      {
        id: "col-left-header-bg",
        type: "rectangle",
        x: 60,
        y: 40,
        width: 520,
        height: 50,
        backgroundColor: "#eff6ff",
        strokeColor: "#3b82f6",
        strokeWidth: 2,
        fillStyle: "solid",
        roughness: 0,
        roundness: { type: 3 },
      },
      {
        id: "col-left-header-text",
        type: "text",
        x: 80,
        y: 52,
        text: "📝 ĐỀ BÀI / CÂU HỎI TRỌNG TÂM",
        fontSize: 20,
        fontFamily: 1,
        strokeColor: "#1d4ed8",
      },
      // Khung nội dung cột trái
      {
        id: "col-left-box",
        type: "rectangle",
        x: 60,
        y: 100,
        width: 520,
        height: 680,
        backgroundColor: "#f8fafc",
        strokeColor: "#cbd5e1",
        strokeWidth: 1.5,
        fillStyle: "solid",
        roughness: 0,
        roundness: { type: 3 },
      },
      // Vách ngăn phân cách giữa
      {
        id: "divider-line",
        type: "line",
        x: 610,
        y: 40,
        width: 0,
        height: 740,
        points: [[0, 0], [0, 740]],
        strokeColor: "#94a3b8",
        strokeWidth: 2,
        strokeStyle: "dashed",
        roughness: 0,
      },
      // Tiêu đề cột phải
      {
        id: "col-right-header-bg",
        type: "rectangle",
        x: 640,
        y: 40,
        width: 720,
        height: 50,
        backgroundColor: "#f0fdf4",
        strokeColor: "#22c55e",
        strokeWidth: 2,
        fillStyle: "solid",
        roughness: 0,
        roundness: { type: 3 },
      },
      {
        id: "col-right-header-text",
        type: "text",
        x: 660,
        y: 52,
        text: "💡 BƯỚC GIẢI CHI TIẾT & KẾT LUẬN",
        fontSize: 20,
        fontFamily: 1,
        strokeColor: "#15803d",
      },
      // Khung nội dung cột phải
      {
        id: "col-right-box",
        type: "rectangle",
        x: 640,
        y: 100,
        width: 720,
        height: 680,
        backgroundColor: "#ffffff",
        strokeColor: "#cbd5e1",
        strokeWidth: 1.5,
        fillStyle: "solid",
        roughness: 0,
        roundness: { type: 3 },
      },
      // Chú thích gợi ý
      {
        id: "hint-note",
        type: "text",
        x: 660,
        y: 130,
        text: "Thầy/Cô hãy viết các bước biến đổi, công thức và hình vẽ minh họa tại đây...",
        fontSize: 16,
        fontFamily: 1,
        strokeColor: "#64748b",
      },
    ]),
  },

  // 2. Sơ đồ tư duy (Mindmap)
  {
    key: "mindmap",
    name: "Sơ đồ tư duy (Mindmap)",
    description: "Khung chủ đề trung tâm với 4 nhánh kiến thức tỏa ra các hướng",
    iconName: "Network",
    badge: "Tổng ôn tập",
    appState: {
      viewBackgroundColor: "#fdfbf7",
      gridSize: 20,
    },
    generateElements: () =>
      sanitizeExcalidrawElements([
        // Nút trung tâm
      {
        id: "mindmap-center",
        type: "rectangle",
        x: 500,
        y: 350,
        width: 280,
        height: 90,
        backgroundColor: "#e0e7ff",
        strokeColor: "#4f46e5",
        strokeWidth: 3,
        fillStyle: "solid",
        roundness: { type: 3 },
        roughness: 0,
      },
      {
        id: "mindmap-center-text",
        type: "text",
        x: 525,
        y: 380,
        text: "🎯 CHỦ ĐỀ TRỌNG TÂM",
        fontSize: 22,
        fontFamily: 1,
        strokeColor: "#3730a3",
      },
      // Nhánh 1: Tây Bắc
      {
        id: "branch-arrow-1",
        type: "arrow",
        x: 520,
        y: 350,
        width: -180,
        height: -140,
        points: [[0, 0], [-180, -140]],
        strokeColor: "#0284c7",
        strokeWidth: 2.5,
        roundness: { type: 2 },
      },
      {
        id: "branch-box-1",
        type: "rectangle",
        x: 180,
        y: 160,
        width: 220,
        height: 60,
        backgroundColor: "#e0f2fe",
        strokeColor: "#0284c7",
        strokeWidth: 2,
        fillStyle: "solid",
        roundness: { type: 3 },
      },
      {
        id: "branch-text-1",
        type: "text",
        x: 200,
        y: 178,
        text: "1. Khái niệm cốt lõi",
        fontSize: 16,
        fontFamily: 1,
        strokeColor: "#0369a1",
      },
      // Nhánh 2: Đông Bắc
      {
        id: "branch-arrow-2",
        type: "arrow",
        x: 760,
        y: 350,
        width: 180,
        height: -140,
        points: [[0, 0], [180, -140]],
        strokeColor: "#16a34a",
        strokeWidth: 2.5,
        roundness: { type: 2 },
      },
      {
        id: "branch-box-2",
        type: "rectangle",
        x: 880,
        y: 160,
        width: 220,
        height: 60,
        backgroundColor: "#dcfce7",
        strokeColor: "#16a34a",
        strokeWidth: 2,
        fillStyle: "solid",
        roundness: { type: 3 },
      },
      {
        id: "branch-text-2",
        type: "text",
        x: 900,
        y: 178,
        text: "2. Công thức & ĐL",
        fontSize: 16,
        fontFamily: 1,
        strokeColor: "#15803d",
      },
      // Nhánh 3: Tây Nam
      {
        id: "branch-arrow-3",
        type: "arrow",
        x: 520,
        y: 440,
        width: -180,
        height: 140,
        points: [[0, 0], [-180, 140]],
        strokeColor: "#ea580c",
        strokeWidth: 2.5,
        roundness: { type: 2 },
      },
      {
        id: "branch-box-3",
        type: "rectangle",
        x: 180,
        y: 560,
        width: 220,
        height: 60,
        backgroundColor: "#ffedd5",
        strokeColor: "#ea580c",
        strokeWidth: 2,
        fillStyle: "solid",
        roundness: { type: 3 },
      },
      {
        id: "branch-text-3",
        type: "text",
        x: 200,
        y: 578,
        text: "3. Dạng bài & Bẫy sai",
        fontSize: 16,
        fontFamily: 1,
        strokeColor: "#c2410c",
      },
      // Nhánh 4: Đông Nam
      {
        id: "branch-arrow-4",
        type: "arrow",
        x: 760,
        y: 440,
        width: 180,
        height: 140,
        points: [[0, 0], [180, 140]],
        strokeColor: "#9333ea",
        strokeWidth: 2.5,
        roundness: { type: 2 },
      },
      {
        id: "branch-box-4",
        type: "rectangle",
        x: 880,
        y: 560,
        width: 220,
        height: 60,
        backgroundColor: "#f3e8ff",
        strokeColor: "#9333ea",
        strokeWidth: 2,
        fillStyle: "solid",
        roundness: { type: 3 },
      },
      {
        id: "branch-text-4",
        type: "text",
        x: 900,
        y: 578,
        text: "4. Ví dụ minh họa",
        fontSize: 16,
        fontFamily: 1,
        strokeColor: "#7e22ce",
      },
    ]),
  },

  // 3. Ô kẻ ô ly 5mm (Tập học sinh)
  {
    key: "grid-5mm",
    name: "Ô ly 5mm (Tập học sinh)",
    description: "Mặt bảng lưới ô ly chuẩn học đường để rèn chữ, vẽ tọa độ và giải toán",
    iconName: "Grid",
    badge: "Chuẩn học đường",
    appState: {
      viewBackgroundColor: "#fbfcf8",
      gridSize: 20,
    },
    generateElements: () => {
      const elements: Record<string, unknown>[] = [];
      // Khung trang tập
      elements.push({
        id: "notebook-page",
        type: "rectangle",
        x: 100,
        y: 40,
        width: 1000,
        height: 720,
        backgroundColor: "#ffffff",
        strokeColor: "#cbd5e1",
        strokeWidth: 2,
        fillStyle: "solid",
        roughness: 0,
      });

      // Lề đỏ bên trái tập
      elements.push({
        id: "margin-line",
        type: "line",
        x: 220,
        y: 40,
        width: 0,
        height: 720,
        points: [[0, 0], [0, 720]],
        strokeColor: "#f87171",
        strokeWidth: 1.5,
        roughness: 0,
      });

      // Nhãn ghi thứ ngày
      elements.push({
        id: "date-text",
        type: "text",
        x: 240,
        y: 55,
        text: "Thứ ...... ngày ..... tháng ..... năm 2026",
        fontSize: 14,
        fontFamily: 1,
        strokeColor: "#94a3b8",
      });

      // Một vài dòng kẻ mờ 40px
      for (let y = 100; y <= 720; y += 40) {
        elements.push({
          id: `notebook-line-${y}`,
          type: "line",
          x: 100,
          y,
          width: 1000,
          height: 0,
          points: [[0, 0], [1000, 0]],
          strokeColor: "#e2e8f0",
          strokeWidth: 1,
          roughness: 0,
        });
      }

      return sanitizeExcalidrawElements(elements);
    },
  },

  // 4. Khổ giấy A4 theo tỷ lệ
  {
    key: "a4-portrait",
    name: "Khổ giấy A4 chuẩn in ấn",
    description: "Khung trang giấy tỷ lệ A4 (1 : 1.414) thuận tiện khi xuất PDF phát cho lớp",
    iconName: "FileText",
    badge: "Xuất in PDF",
    appState: {
      viewBackgroundColor: "#f1f5f9",
      gridSize: 20,
    },
    generateElements: () =>
      sanitizeExcalidrawElements([
        // Tờ giấy A4 (794 x 1123 px)
      {
        id: "a4-paper",
        type: "rectangle",
        x: 200,
        y: 40,
        width: 794,
        height: 1123,
        backgroundColor: "#ffffff",
        strokeColor: "#94a3b8",
        strokeWidth: 2,
        fillStyle: "solid",
        roughness: 0,
        roundness: { type: 2 },
      },
      // Header trường / sở
      {
        id: "a4-header-school",
        type: "text",
        x: 240,
        y: 70,
        text: "SỞ GIÁO DỤC VÀ ĐÀO TẠO",
        fontSize: 14,
        fontFamily: 1,
        strokeColor: "#334155",
      },
      {
        id: "a4-header-title",
        type: "text",
        x: 450,
        y: 110,
        text: "PHIẾU BÀI TẬP VÀ GHI CHÚ BÀI GIẢNG",
        fontSize: 18,
        fontFamily: 1,
        strokeColor: "#0f172a",
      },
      {
        id: "a4-header-line",
        type: "line",
        x: 240,
        y: 150,
        width: 714,
        height: 0,
        points: [[0, 0], [714, 0]],
        strokeColor: "#cbd5e1",
        strokeWidth: 1.5,
        roughness: 0,
      },
    ]),
  },
];

import { sanitizeExcalidrawElements } from "@/lib/whiteboard/sanitize-elements";

/**
 * Thư viện các hình vẽ STEM & Giáo dục chuẩn Chương trình GDPT 2018
 * (Toán học & Hình không gian 3D, Vật lý Cơ - Điện - Quang - Sóng, Hóa học & Sinh học)
 * Dành cho Bảng vẽ Bục giảng EdTeach
 */

export interface ExcalidrawLibraryItem {
  id: string;
  status: "published";
  elements: Record<string, unknown>[];
  name: string;
  category: string;
  subjectGroup: "math" | "physics" | "chemistry";
}

const RAW_STEM_LIBRARY_ITEMS: ExcalidrawLibraryItem[] = [
  // ==========================================
  // PHẦN 1: TOÁN HỌC & ĐỒ THỊ & HÌNH HỌC KHÔNG GIAN 3D
  // ==========================================

  // 1. Hệ trục toạ độ Oxy (Toán 10, 11, 12)
  {
    id: "stem-coord-oxy",
    status: "published",
    name: "Hệ trục toạ độ Oxy",
    category: "Toán học & Đồ thị",
    subjectGroup: "math",
    elements: [
      // Trục hoành Ox
      {
        type: "arrow",
        x: 60,
        y: 220,
        width: 300,
        height: 0,
        points: [[0, 0], [300, 0]],
        strokeColor: "#1e1e1e",
        strokeWidth: 2,
        endArrowhead: "arrow",
        roundness: null,
      },
      // Trục tung Oy
      {
        type: "arrow",
        x: 100,
        y: 240,
        width: 0,
        height: -220,
        points: [[0, 0], [0, -220]],
        strokeColor: "#1e1e1e",
        strokeWidth: 2,
        endArrowhead: "arrow",
        roundness: null,
      },
      // Vạch đơn vị Ox
      { type: "line", x: 160, y: 216, width: 0, height: 8, points: [[0, 0], [0, 8]], strokeColor: "#64748b", strokeWidth: 1.5 },
      { type: "text", x: 156, y: 228, text: "1", fontSize: 13, fontFamily: 1, strokeColor: "#64748b" },
      { type: "line", x: 220, y: 216, width: 0, height: 8, points: [[0, 0], [0, 8]], strokeColor: "#64748b", strokeWidth: 1.5 },
      { type: "text", x: 216, y: 228, text: "2", fontSize: 13, fontFamily: 1, strokeColor: "#64748b" },
      // Vạch đơn vị Oy
      { type: "line", x: 96, y: 160, width: 8, height: 0, points: [[0, 0], [8, 0]], strokeColor: "#64748b", strokeWidth: 1.5 },
      { type: "text", x: 82, y: 153, text: "1", fontSize: 13, fontFamily: 1, strokeColor: "#64748b" },
      { type: "line", x: 96, y: 100, width: 8, height: 0, points: [[0, 0], [8, 0]], strokeColor: "#64748b", strokeWidth: 1.5 },
      { type: "text", x: 82, y: 93, text: "2", fontSize: 13, fontFamily: 1, strokeColor: "#64748b" },
      // Nhãn trục
      { type: "text", x: 366, y: 210, text: "x", fontSize: 18, fontFamily: 1, strokeColor: "#1e1e1e" },
      { type: "text", x: 92, y: 2, text: "y", fontSize: 18, fontFamily: 1, strokeColor: "#1e1e1e" },
      { type: "text", x: 82, y: 224, text: "O", fontSize: 16, fontFamily: 1, strokeColor: "#1e1e1e" },
    ],
  },

  // 2. Hệ trục toạ độ không gian Oxyz 3D (Toán 12)
  {
    id: "stem-coord-oxyz",
    status: "published",
    name: "Hệ trục không gian Oxyz 3D",
    category: "Toán học & Đồ thị",
    subjectGroup: "math",
    elements: [
      // Trục Oz (thẳng đứng lên)
      {
        type: "arrow",
        x: 160,
        y: 180,
        width: 0,
        height: -170,
        points: [[0, 0], [0, -170]],
        strokeColor: "#0284c7",
        strokeWidth: 2,
        endArrowhead: "arrow",
        roundness: null,
      },
      // Trục Oy (ngang sang phải)
      {
        type: "arrow",
        x: 160,
        y: 180,
        width: 200,
        height: 0,
        points: [[0, 0], [200, 0]],
        strokeColor: "#10b981",
        strokeWidth: 2,
        endArrowhead: "arrow",
        roundness: null,
      },
      // Trục Ox (xiên chéo ra ngoài)
      {
        type: "arrow",
        x: 160,
        y: 180,
        width: -110,
        height: 110,
        points: [[0, 0], [-110, 110]],
        strokeColor: "#ef4444",
        strokeWidth: 2,
        endArrowhead: "arrow",
        roundness: null,
      },
      // Nhãn các trục
      { type: "text", x: 154, y: -2, text: "z", fontSize: 20, fontFamily: 1, strokeColor: "#0284c7" },
      { type: "text", x: 366, y: 172, text: "y", fontSize: 20, fontFamily: 1, strokeColor: "#10b981" },
      { type: "text", x: 30, y: 286, text: "x", fontSize: 20, fontFamily: 1, strokeColor: "#ef4444" },
      { type: "text", x: 140, y: 185, text: "O", fontSize: 18, fontFamily: 1, strokeColor: "#1e1e1e" },
    ],
  },

  // 3. Vòng tròn lượng giác (Toán 11)
  {
    id: "stem-trig-circle",
    status: "published",
    name: "Vòng tròn lượng giác",
    category: "Toán học & Đồ thị",
    subjectGroup: "math",
    elements: [
      // Vòng tròn đơn vị
      {
        type: "ellipse",
        x: 70,
        y: 50,
        width: 200,
        height: 200,
        strokeColor: "#2563eb",
        backgroundColor: "#eff6ff",
        fillStyle: "solid",
        strokeWidth: 2,
      },
      // Trục cos (ngang)
      {
        type: "arrow",
        x: 40,
        y: 150,
        width: 260,
        height: 0,
        points: [[0, 0], [260, 0]],
        strokeColor: "#1e1e1e",
        strokeWidth: 1.8,
        endArrowhead: "arrow",
      },
      // Trục sin (dọc)
      {
        type: "arrow",
        x: 170,
        y: 270,
        width: 0,
        height: -240,
        points: [[0, 0], [0, -240]],
        strokeColor: "#1e1e1e",
        strokeWidth: 1.8,
        endArrowhead: "arrow",
      },
      { type: "text", x: 306, y: 142, text: "cos", fontSize: 16, fontFamily: 1, strokeColor: "#1e1e1e" },
      { type: "text", x: 162, y: 6, text: "sin", fontSize: 16, fontFamily: 1, strokeColor: "#1e1e1e" },
      { type: "text", x: 154, y: 154, text: "O", fontSize: 15, fontFamily: 1 },
      { type: "text", x: 274, y: 154, text: "1", fontSize: 14, fontFamily: 1 },
      { type: "text", x: 56, y: 154, text: "-1", fontSize: 14, fontFamily: 1 },
      { type: "text", x: 176, y: 44, text: "1", fontSize: 14, fontFamily: 1 },
      { type: "text", x: 176, y: 246, text: "-1", fontSize: 14, fontFamily: 1 },
      { type: "text", x: 160, y: 28, text: "π/2", fontSize: 12, fontFamily: 1, strokeColor: "#2563eb" },
      { type: "text", x: 275, y: 130, text: "0", fontSize: 12, fontFamily: 1, strokeColor: "#2563eb" },
      { type: "text", x: 42, y: 130, text: "π", fontSize: 12, fontFamily: 1, strokeColor: "#2563eb" },
    ],
  },

  // 4. Đồ thị Parabol y = ax^2 (Toán 10)
  {
    id: "stem-parabola",
    status: "published",
    name: "Đồ thị Parabol y = ax²",
    category: "Toán học & Đồ thị",
    subjectGroup: "math",
    elements: [
      {
        type: "arrow",
        x: 40,
        y: 190,
        width: 260,
        height: 0,
        points: [[0, 0], [260, 0]],
        strokeColor: "#1e1e1e",
        strokeWidth: 1.8,
        endArrowhead: "arrow",
      },
      {
        type: "arrow",
        x: 170,
        y: 220,
        width: 0,
        height: -200,
        points: [[0, 0], [0, -200]],
        strokeColor: "#1e1e1e",
        strokeWidth: 1.8,
        endArrowhead: "arrow",
      },
      // Đường cong Parabol đối xứng
      {
        type: "line",
        x: 90,
        y: 60,
        width: 160,
        height: 130,
        points: [
          [0, 0],
          [20, 50],
          [50, 105],
          [80, 130],
          [110, 105],
          [140, 50],
          [160, 0],
        ],
        strokeColor: "#dc2626",
        strokeWidth: 2.5,
        roundness: { type: 2 },
      },
      { type: "text", x: 305, y: 182, text: "x", fontSize: 17, fontFamily: 1 },
      { type: "text", x: 162, y: -2, text: "y", fontSize: 17, fontFamily: 1 },
      { type: "text", x: 154, y: 194, text: "O", fontSize: 15, fontFamily: 1 },
      { type: "text", x: 235, y: 40, text: "y = ax²", fontSize: 15, fontFamily: 1, strokeColor: "#dc2626" },
    ],
  },

  // 5. Hình chóp tam giác đều S.ABC (Tứ diện) (Toán 11, 12)
  {
    id: "stem-geom-pyramid-triangle",
    status: "published",
    name: "Hình chóp tam giác S.ABC (Tứ diện)",
    category: "Hình học Không gian 3D",
    subjectGroup: "math",
    elements: [
      // Đỉnh S(160, 30)
      // Đáy A(50, 190), B(150, 240), C(270, 180)
      // Cạnh đáy AB (nét liền)
      { type: "line", x: 50, y: 190, width: 100, height: 50, points: [[0, 0], [100, 50]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Cạnh đáy BC (nét liền)
      { type: "line", x: 150, y: 240, width: 120, height: -60, points: [[0, 0], [120, -60]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Cạnh đáy AC (nét đứt khuất)
      { type: "line", x: 50, y: 190, width: 220, height: -10, points: [[0, 0], [220, -10]], strokeColor: "#64748b", strokeWidth: 1.8, strokeStyle: "dashed" },
      // Cạnh bên SA (nét liền)
      { type: "line", x: 160, y: 30, width: -110, height: 160, points: [[0, 0], [-110, 160]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Cạnh bên SB (nét liền)
      { type: "line", x: 160, y: 30, width: -10, height: 210, points: [[0, 0], [-10, 210]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Cạnh bên SC (nét liền)
      { type: "line", x: 160, y: 30, width: 110, height: 150, points: [[0, 0], [110, 150]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Đường cao SH (nét đứt từ S xuống trọng tâm đáy H)
      { type: "line", x: 160, y: 30, width: -5, height: 172, points: [[0, 0], [-5, 172]], strokeColor: "#ef4444", strokeWidth: 1.6, strokeStyle: "dashed" },
      // Nhãn các đỉnh
      { type: "text", x: 155, y: 4, text: "S", fontSize: 19, fontFamily: 1, strokeColor: "#dc2626" },
      { type: "text", x: 28, y: 184, text: "A", fontSize: 18, fontFamily: 1 },
      { type: "text", x: 144, y: 246, text: "B", fontSize: 18, fontFamily: 1 },
      { type: "text", x: 278, y: 172, text: "C", fontSize: 18, fontFamily: 1 },
      { type: "text", x: 158, y: 205, text: "H", fontSize: 14, fontFamily: 1, strokeColor: "#ef4444" },
    ],
  },

  // 6. Hình chóp tứ giác S.ABCD (Toán 11, 12)
  {
    id: "stem-geom-pyramid-quad",
    status: "published",
    name: "Hình chóp tứ giác S.ABCD",
    category: "Hình học Không gian 3D",
    subjectGroup: "math",
    elements: [
      // Đáy hình bình hành ABCD: A(60, 180), B(160, 230), C(300, 210), D(200, 160)
      // AB (nét liền)
      { type: "line", x: 60, y: 180, width: 100, height: 50, points: [[0, 0], [100, 50]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // BC (nét liền)
      { type: "line", x: 160, y: 230, width: 140, height: -20, points: [[0, 0], [140, -20]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // CD (nét đứt)
      { type: "line", x: 300, y: 210, width: -100, height: -50, points: [[0, 0], [-100, -50]], strokeColor: "#64748b", strokeWidth: 1.8, strokeStyle: "dashed" },
      // DA (nét đứt)
      { type: "line", x: 200, y: 160, width: -140, height: 20, points: [[0, 0], [-140, 20]], strokeColor: "#64748b", strokeWidth: 1.8, strokeStyle: "dashed" },
      // Đỉnh S(180, 30)
      // Cạnh bên SA (nét liền)
      { type: "line", x: 180, y: 30, width: -120, height: 150, points: [[0, 0], [-120, 150]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Cạnh bên SB (nét liền)
      { type: "line", x: 180, y: 30, width: -20, height: 200, points: [[0, 0], [-20, 200]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Cạnh bên SC (nét liền)
      { type: "line", x: 180, y: 30, width: 120, height: 180, points: [[0, 0], [120, 180]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Cạnh bên SD (nét đứt khuất)
      { type: "line", x: 180, y: 30, width: 20, height: 130, points: [[0, 0], [20, 130]], strokeColor: "#64748b", strokeWidth: 1.8, strokeStyle: "dashed" },
      // Giao điểm 2 đường chéo đáy O(180, 195)
      { type: "line", x: 60, y: 180, width: 240, height: 30, points: [[0, 0], [240, 30]], strokeColor: "#94a3b8", strokeWidth: 1.2, strokeStyle: "dashed" },
      { type: "line", x: 160, y: 230, width: 40, height: -70, points: [[0, 0], [40, -70]], strokeColor: "#94a3b8", strokeWidth: 1.2, strokeStyle: "dashed" },
      // Đường cao SO (nét đứt đỏ)
      { type: "line", x: 180, y: 30, width: 0, height: 165, points: [[0, 0], [0, 165]], strokeColor: "#ef4444", strokeWidth: 1.8, strokeStyle: "dashed" },
      // Nhãn
      { type: "text", x: 175, y: 4, text: "S", fontSize: 19, fontFamily: 1, strokeColor: "#dc2626" },
      { type: "text", x: 40, y: 174, text: "A", fontSize: 18, fontFamily: 1 },
      { type: "text", x: 154, y: 236, text: "B", fontSize: 18, fontFamily: 1 },
      { type: "text", x: 308, y: 204, text: "C", fontSize: 18, fontFamily: 1 },
      { type: "text", x: 204, y: 148, text: "D", fontSize: 18, fontFamily: 1 },
      { type: "text", x: 184, y: 200, text: "O", fontSize: 15, fontFamily: 1, strokeColor: "#ef4444" },
    ],
  },

  // 7. Hình lăng trụ đứng tam giác ABC.A'B'C' (Toán 11, 12)
  {
    id: "stem-geom-prism",
    status: "published",
    name: "Hình lăng trụ đứng ABC.A'B'C'",
    category: "Hình học Không gian 3D",
    subjectGroup: "math",
    elements: [
      // Đáy trên A'B'C': A'(60, 40), B'(150, 75), C'(260, 35) (toàn nét liền)
      { type: "line", x: 60, y: 40, width: 90, height: 35, points: [[0, 0], [90, 35]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      { type: "line", x: 150, y: 75, width: 110, height: -40, points: [[0, 0], [110, -40]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      { type: "line", x: 60, y: 40, width: 200, height: -5, points: [[0, 0], [200, -5]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Đáy dưới ABC: A(60, 190), B(150, 225), C(260, 185)
      { type: "line", x: 60, y: 190, width: 90, height: 35, points: [[0, 0], [90, 35]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      { type: "line", x: 150, y: 225, width: 110, height: -40, points: [[0, 0], [110, -40]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      { type: "line", x: 60, y: 190, width: 200, height: -5, points: [[0, 0], [200, -5]], strokeColor: "#64748b", strokeWidth: 1.8, strokeStyle: "dashed" },
      // Các cạnh bên: AA', BB', CC'
      { type: "line", x: 60, y: 40, width: 0, height: 150, points: [[0, 0], [0, 150]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      { type: "line", x: 150, y: 75, width: 0, height: 150, points: [[0, 0], [0, 150]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      { type: "line", x: 260, y: 35, width: 0, height: 150, points: [[0, 0], [0, 150]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Nhãn
      { type: "text", x: 42, y: 25, text: "A'", fontSize: 17, fontFamily: 1 },
      { type: "text", x: 145, y: 82, text: "B'", fontSize: 17, fontFamily: 1 },
      { type: "text", x: 268, y: 25, text: "C'", fontSize: 17, fontFamily: 1 },
      { type: "text", x: 42, y: 190, text: "A", fontSize: 17, fontFamily: 1 },
      { type: "text", x: 145, y: 232, text: "B", fontSize: 17, fontFamily: 1 },
      { type: "text", x: 268, y: 185, text: "C", fontSize: 17, fontFamily: 1 },
    ],
  },

  // 8. Khối hộp chữ nhật ABCD.A'B'C'D' (Toán 11, 12)
  {
    id: "stem-geom-box",
    status: "published",
    name: "Khối hộp chữ nhật 3D",
    category: "Hình học Không gian 3D",
    subjectGroup: "math",
    elements: [
      // Mặt trước: ABB'A' A(60, 200), B(200, 200), B'(200, 90), A'(60, 90)
      { type: "rectangle", x: 60, y: 90, width: 140, height: 110, strokeColor: "#1e1e1e", strokeWidth: 2, fillStyle: "solid", backgroundColor: "transparent" },
      // Mặt trên: A'(60, 90), B'(200, 90), C'(260, 40), D'(120, 40)
      { type: "line", x: 200, y: 90, width: 60, height: -50, points: [[0, 0], [60, -50]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      { type: "line", x: 260, y: 40, width: -140, height: 0, points: [[0, 0], [-140, 0]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      { type: "line", x: 120, y: 40, width: -60, height: 50, points: [[0, 0], [-60, 50]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Cạnh bên phải C'C
      { type: "line", x: 260, y: 40, width: 0, height: 110, points: [[0, 0], [0, 110]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      { type: "line", x: 200, y: 200, width: 60, height: -50, points: [[0, 0], [60, -50]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // 3 cạnh khuất bên trong (D'D, DC, DA nét đứt)
      { type: "line", x: 120, y: 40, width: 0, height: 110, points: [[0, 0], [0, 110]], strokeColor: "#64748b", strokeWidth: 1.8, strokeStyle: "dashed" },
      { type: "line", x: 120, y: 150, width: 140, height: 0, points: [[0, 0], [140, 0]], strokeColor: "#64748b", strokeWidth: 1.8, strokeStyle: "dashed" },
      { type: "line", x: 120, y: 150, width: -60, height: 50, points: [[0, 0], [-60, 50]], strokeColor: "#64748b", strokeWidth: 1.8, strokeStyle: "dashed" },
      // Nhãn đỉnh
      { type: "text", x: 42, y: 80, text: "A'", fontSize: 16, fontFamily: 1 },
      { type: "text", x: 204, y: 80, text: "B'", fontSize: 16, fontFamily: 1 },
      { type: "text", x: 265, y: 30, text: "C'", fontSize: 16, fontFamily: 1 },
      { type: "text", x: 105, y: 26, text: "D'", fontSize: 16, fontFamily: 1 },
      { type: "text", x: 42, y: 204, text: "A", fontSize: 16, fontFamily: 1 },
      { type: "text", x: 204, y: 204, text: "B", fontSize: 16, fontFamily: 1 },
      { type: "text", x: 265, y: 152, text: "C", fontSize: 16, fontFamily: 1 },
      { type: "text", x: 125, y: 148, text: "D", fontSize: 16, fontFamily: 1 },
    ],
  },

  // 9. Khối nón tròn xoay (Toán 12)
  {
    id: "stem-geom-cone",
    status: "published",
    name: "Khối nón tròn xoay 3D",
    category: "Hình học Không gian 3D",
    subjectGroup: "math",
    elements: [
      // Đáy elip: tâm O(160, 200), rx=100, ry=25
      // Nửa trước elip (nét liền)
      {
        type: "line",
        x: 60,
        y: 200,
        width: 200,
        height: 25,
        points: [[0, 0], [40, 20], [100, 25], [160, 20], [200, 0]],
        strokeColor: "#1e1e1e",
        strokeWidth: 2,
        roundness: { type: 2 },
      },
      // Nửa sau elip (nét đứt)
      {
        type: "line",
        x: 60,
        y: 200,
        width: 200,
        height: -25,
        points: [[0, 0], [40, -20], [100, -25], [160, -20], [200, 0]],
        strokeColor: "#64748b",
        strokeWidth: 1.8,
        strokeStyle: "dashed",
        roundness: { type: 2 },
      },
      // 2 đường sinh bên SA và SB từ đỉnh S(160, 40)
      { type: "line", x: 160, y: 40, width: -100, height: 160, points: [[0, 0], [-100, 160]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      { type: "line", x: 160, y: 40, width: 100, height: 160, points: [[0, 0], [100, 160]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Đường cao h = SO (nét đứt đỏ)
      { type: "line", x: 160, y: 40, width: 0, height: 160, points: [[0, 0], [0, 160]], strokeColor: "#dc2626", strokeWidth: 1.8, strokeStyle: "dashed" },
      // Bán kính đáy R = OA (nét đứt)
      { type: "line", x: 160, y: 200, width: 100, height: 0, points: [[0, 0], [100, 0]], strokeColor: "#2563eb", strokeWidth: 1.8, strokeStyle: "dashed" },
      // Nhãn
      { type: "text", x: 155, y: 12, text: "S", fontSize: 18, fontFamily: 1, strokeColor: "#dc2626" },
      { type: "text", x: 164, y: 204, text: "O", fontSize: 15, fontFamily: 1 },
      { type: "text", x: 268, y: 195, text: "A", fontSize: 15, fontFamily: 1 },
      { type: "text", x: 205, y: 180, text: "R", fontSize: 15, fontFamily: 1, strokeColor: "#2563eb" },
      { type: "text", x: 140, y: 110, text: "h", fontSize: 15, fontFamily: 1, strokeColor: "#dc2626" },
      { type: "text", x: 218, y: 100, text: "l", fontSize: 15, fontFamily: 1 },
    ],
  },

  // 10. Khối trụ tròn xoay (Toán 12)
  {
    id: "stem-geom-cylinder",
    status: "published",
    name: "Khối trụ tròn xoay 3D",
    category: "Hình học Không gian 3D",
    subjectGroup: "math",
    elements: [
      // Đáy trên: Elip trọn vẹn nét liền tâm O'(160, 50), rx=90, ry=22
      { type: "ellipse", x: 70, y: 28, width: 180, height: 44, strokeColor: "#1e1e1e", strokeWidth: 2, fillStyle: "solid", backgroundColor: "#f8fafc" },
      // 2 đường sinh 2 bên
      { type: "line", x: 70, y: 50, width: 0, height: 150, points: [[0, 0], [0, 150]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      { type: "line", x: 250, y: 50, width: 0, height: 150, points: [[0, 0], [0, 150]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Đáy dưới: Nửa trước nét liền
      {
        type: "line",
        x: 70,
        y: 200,
        width: 180,
        height: 22,
        points: [[0, 0], [45, 18], [90, 22], [135, 18], [180, 0]],
        strokeColor: "#1e1e1e",
        strokeWidth: 2,
        roundness: { type: 2 },
      },
      // Đáy dưới: Nửa sau nét đứt
      {
        type: "line",
        x: 70,
        y: 200,
        width: 180,
        height: -22,
        points: [[0, 0], [45, -18], [90, -22], [135, -18], [180, 0]],
        strokeColor: "#64748b",
        strokeWidth: 1.8,
        strokeStyle: "dashed",
        roundness: { type: 2 },
      },
      // Trục OO' (nét đứt đỏ)
      { type: "line", x: 160, y: 50, width: 0, height: 150, points: [[0, 0], [0, 150]], strokeColor: "#dc2626", strokeWidth: 1.8, strokeStyle: "dashed" },
      // Bán kính đáy R
      { type: "line", x: 160, y: 50, width: 90, height: 0, points: [[0, 0], [90, 0]], strokeColor: "#2563eb", strokeWidth: 1.6, strokeStyle: "dashed" },
      // Nhãn
      { type: "text", x: 164, y: 32, text: "O'", fontSize: 16, fontFamily: 1 },
      { type: "text", x: 164, y: 204, text: "O", fontSize: 16, fontFamily: 1 },
      { type: "text", x: 195, y: 30, text: "R", fontSize: 14, fontFamily: 1, strokeColor: "#2563eb" },
      { type: "text", x: 140, y: 120, text: "h", fontSize: 15, fontFamily: 1, strokeColor: "#dc2626" },
    ],
  },

  // 11. Khối cầu 3D (Toán 12)
  {
    id: "stem-geom-sphere",
    status: "published",
    name: "Khối cầu 3D (Mặt cầu)",
    category: "Hình học Không gian 3D",
    subjectGroup: "math",
    elements: [
      // Đường tròn lớn ngoài
      {
        type: "ellipse",
        x: 60,
        y: 40,
        width: 200,
        height: 200,
        strokeColor: "#1e1e1e",
        strokeWidth: 2,
        fillStyle: "solid",
        backgroundColor: "transparent",
      },
      // Vĩ tuyến xích đạo: nửa trước nét liền
      {
        type: "line",
        x: 60,
        y: 140,
        width: 200,
        height: 35,
        points: [[0, 0], [50, 28], [100, 35], [150, 28], [200, 0]],
        strokeColor: "#0284c7",
        strokeWidth: 2,
        roundness: { type: 2 },
      },
      // Vĩ tuyến xích đạo: nửa sau nét đứt
      {
        type: "line",
        x: 60,
        y: 140,
        width: 200,
        height: -35,
        points: [[0, 0], [50, -28], [100, -35], [150, -28], [200, 0]],
        strokeColor: "#64748b",
        strokeWidth: 1.8,
        strokeStyle: "dashed",
        roundness: { type: 2 },
      },
      // Bán kính R từ tâm O(160, 140) đến mép phải
      {
        type: "arrow",
        x: 160,
        y: 140,
        width: 100,
        height: 0,
        points: [[0, 0], [100, 0]],
        strokeColor: "#dc2626",
        strokeWidth: 2,
        endArrowhead: "arrow",
      },
      { type: "text", x: 144, y: 132, text: "O", fontSize: 16, fontFamily: 1 },
      { type: "text", x: 205, y: 120, text: "R", fontSize: 16, fontFamily: 1, strokeColor: "#dc2626" },
    ],
  },

  // ==========================================
  // PHẦN 2: VẬT LÝ CƠ HỌC (LỚP 10, 12)
  // ==========================================

  // 12. Vector Hợp Lực F (Quy tắc hình bình hành)
  {
    id: "stem-force-vector",
    status: "published",
    name: "Quy tắc tổng hợp Lực (F)",
    category: "Vật lý Cơ học",
    subjectGroup: "physics",
    elements: [
      // Điểm đặt O
      // Lực thành phần F1 (trục x)
      {
        type: "arrow",
        x: 60,
        y: 180,
        width: 140,
        height: 0,
        points: [[0, 0], [140, 0]],
        strokeColor: "#2563eb",
        strokeWidth: 2.5,
        endArrowhead: "arrow",
      },
      // Lực thành phần F2 (xiên chéo)
      {
        type: "arrow",
        x: 60,
        y: 180,
        width: 80,
        height: -100,
        points: [[0, 0], [80, -100]],
        strokeColor: "#16a34a",
        strokeWidth: 2.5,
        endArrowhead: "arrow",
      },
      // 2 đường gióng nét đứt tạo hình bình hành
      { type: "line", x: 200, y: 180, width: 80, height: -100, points: [[0, 0], [80, -100]], strokeColor: "#94a3b8", strokeWidth: 1.5, strokeStyle: "dashed" },
      { type: "line", x: 140, y: 80, width: 140, height: 0, points: [[0, 0], [140, 0]], strokeColor: "#94a3b8", strokeWidth: 1.5, strokeStyle: "dashed" },
      // Hợp lực F (đường chéo màu đỏ dày)
      {
        type: "arrow",
        x: 60,
        y: 180,
        width: 220,
        height: -100,
        points: [[0, 0], [220, -100]],
        strokeColor: "#dc2626",
        strokeWidth: 3.5,
        endArrowhead: "arrow",
      },
      // Nhãn
      { type: "text", x: 45, y: 185, text: "O", fontSize: 16, fontFamily: 1 },
      { type: "text", x: 195, y: 185, text: "F₁", fontSize: 17, fontFamily: 1, strokeColor: "#2563eb" },
      { type: "text", x: 125, y: 60, text: "F₂", fontSize: 17, fontFamily: 1, strokeColor: "#16a34a" },
      { type: "text", x: 275, y: 62, text: "F = F₁ + F₂", fontSize: 17, fontFamily: 1, strokeColor: "#dc2626" },
    ],
  },

  // 13. Con lắc lò xo thẳng đứng (Vật lý 12)
  {
    id: "stem-spring",
    status: "published",
    name: "Con lắc lò xo thẳng đứng",
    category: "Vật lý Cơ học",
    subjectGroup: "physics",
    elements: [
      // Giá treo cố định
      { type: "line", x: 50, y: 30, width: 90, height: 0, points: [[0, 0], [90, 0]], strokeColor: "#1e1e1e", strokeWidth: 3 },
      { type: "line", x: 60, y: 30, width: -10, height: -10, points: [[0, 0], [-10, -10]], strokeColor: "#64748b", strokeWidth: 1.5 },
      { type: "line", x: 80, y: 30, width: -10, height: -10, points: [[0, 0], [-10, -10]], strokeColor: "#64748b", strokeWidth: 1.5 },
      { type: "line", x: 100, y: 30, width: -10, height: -10, points: [[0, 0], [-10, -10]], strokeColor: "#64748b", strokeWidth: 1.5 },
      { type: "line", x: 120, y: 30, width: -10, height: -10, points: [[0, 0], [-10, -10]], strokeColor: "#64748b", strokeWidth: 1.5 },
      // Lò xo xoắn zigzag
      {
        type: "line",
        x: 95,
        y: 30,
        width: 20,
        height: 120,
        points: [
          [0, 0],
          [0, 15],
          [10, 25],
          [-10, 40],
          [10, 55],
          [-10, 70],
          [10, 85],
          [-10, 100],
          [0, 110],
          [0, 120],
        ],
        strokeColor: "#16a34a",
        strokeWidth: 2.2,
      },
      // Quả nặng m
      {
        type: "rectangle",
        x: 77,
        y: 150,
        width: 36,
        height: 36,
        strokeColor: "#1d4ed8",
        backgroundColor: "#bfdbfe",
        fillStyle: "solid",
        strokeWidth: 2,
      },
      // Trục toạ độ Ox hướng xuống
      {
        type: "arrow",
        x: 145,
        y: 50,
        width: 0,
        height: 170,
        points: [[0, 0], [0, 170]],
        strokeColor: "#1e1e1e",
        strokeWidth: 1.8,
        endArrowhead: "arrow",
      },
      // Nhãn
      { type: "text", x: 86, y: 158, text: "m", fontSize: 16, fontFamily: 1, strokeColor: "#1d4ed8" },
      { type: "text", x: 62, y: 80, text: "k", fontSize: 16, fontFamily: 1, strokeColor: "#16a34a" },
      { type: "text", x: 155, y: 215, text: "+x", fontSize: 15, fontFamily: 1 },
      { type: "text", x: 155, y: 162, text: "O (VTCB)", fontSize: 13, fontFamily: 1, strokeColor: "#dc2626" },
      { type: "line", x: 115, y: 168, width: 30, height: 0, points: [[0, 0], [30, 0]], strokeColor: "#dc2626", strokeWidth: 1.2, strokeStyle: "dashed" },
    ],
  },

  // 14. Con lắc lò xo nằm ngang (Vật lý 12)
  {
    id: "stem-spring-horizontal",
    status: "published",
    name: "Con lắc lò xo nằm ngang",
    category: "Vật lý Cơ học",
    subjectGroup: "physics",
    elements: [
      // Giá chặn tường bên trái
      { type: "line", x: 50, y: 60, width: 0, height: 100, points: [[0, 0], [0, 100]], strokeColor: "#1e1e1e", strokeWidth: 3 },
      { type: "line", x: 50, y: 70, width: -10, height: 10, points: [[0, 0], [-10, 10]], strokeColor: "#94a3b8", strokeWidth: 1.5 },
      { type: "line", x: 50, y: 100, width: -10, height: 10, points: [[0, 0], [-10, 10]], strokeColor: "#94a3b8", strokeWidth: 1.5 },
      { type: "line", x: 50, y: 130, width: -10, height: 10, points: [[0, 0], [-10, 10]], strokeColor: "#94a3b8", strokeWidth: 1.5 },
      // Mặt sàn nằm ngang
      { type: "line", x: 40, y: 150, width: 280, height: 0, points: [[0, 0], [280, 0]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Lò xo nằm ngang
      {
        type: "line",
        x: 50,
        y: 125,
        width: 130,
        height: 20,
        points: [
          [0, 0],
          [15, 0],
          [25, 10],
          [40, -10],
          [55, 10],
          [70, -10],
          [85, 10],
          [100, -10],
          [115, 0],
          [130, 0],
        ],
        strokeColor: "#16a34a",
        strokeWidth: 2.2,
      },
      // Vật nặng m
      {
        type: "rectangle",
        x: 180,
        y: 105,
        width: 44,
        height: 44,
        strokeColor: "#1d4ed8",
        backgroundColor: "#bfdbfe",
        fillStyle: "solid",
        strokeWidth: 2,
      },
      // Trục toạ độ Ox nằm ngang
      {
        type: "arrow",
        x: 120,
        y: 180,
        width: 180,
        height: 0,
        points: [[0, 0], [180, 0]],
        strokeColor: "#1e1e1e",
        strokeWidth: 1.8,
        endArrowhead: "arrow",
      },
      // Nhãn
      { type: "text", x: 194, y: 117, text: "m", fontSize: 17, fontFamily: 1, strokeColor: "#1d4ed8" },
      { type: "text", x: 105, y: 92, text: "k", fontSize: 16, fontFamily: 1, strokeColor: "#16a34a" },
      { type: "text", x: 295, y: 172, text: "+x", fontSize: 15, fontFamily: 1 },
      { type: "text", x: 198, y: 185, text: "O", fontSize: 15, fontFamily: 1, strokeColor: "#dc2626" },
      { type: "text", x: 140, y: 185, text: "-A", fontSize: 13, fontFamily: 1 },
      { type: "text", x: 255, y: 185, text: "+A", fontSize: 13, fontFamily: 1 },
    ],
  },

  // 15. Con lắc đơn góc lệch alpha (Vật lý 12)
  {
    id: "stem-pendulum",
    status: "published",
    name: "Con lắc đơn (góc lệch α)",
    category: "Vật lý Cơ học",
    subjectGroup: "physics",
    elements: [
      // Giá treo
      { type: "line", x: 90, y: 30, width: 80, height: 0, points: [[0, 0], [80, 0]], strokeColor: "#1e1e1e", strokeWidth: 3 },
      // Phương thẳng đứng (nét đứt)
      { type: "line", x: 130, y: 30, width: 0, height: 160, points: [[0, 0], [0, 160]], strokeColor: "#94a3b8", strokeWidth: 1.5, strokeStyle: "dashed" },
      // Dây treo lệch góc alpha
      { type: "line", x: 130, y: 30, width: 70, height: 140, points: [[0, 0], [70, 140]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Quả cầu m
      {
        type: "ellipse",
        x: 188,
        y: 160,
        width: 26,
        height: 26,
        strokeColor: "#dc2626",
        backgroundColor: "#fecaca",
        fillStyle: "solid",
        strokeWidth: 2,
      },
      // Cung góc alpha
      {
        type: "line",
        x: 130,
        y: 70,
        width: 18,
        height: 10,
        points: [[0, 0], [10, 4], [18, 10]],
        strokeColor: "#2563eb",
        strokeWidth: 1.5,
        roundness: { type: 2 },
      },
      // Nhãn
      { type: "text", x: 138, y: 55, text: "α", fontSize: 16, fontFamily: 1, strokeColor: "#2563eb" },
      { type: "text", x: 172, y: 88, text: "ℓ", fontSize: 16, fontFamily: 1 },
      { type: "text", x: 218, y: 164, text: "m", fontSize: 16, fontFamily: 1, strokeColor: "#dc2626" },
      { type: "text", x: 125, y: 195, text: "O", fontSize: 15, fontFamily: 1 },
    ],
  },

  // ==========================================
  // PHẦN 3: VẬT LÝ ĐIỆN HỌC (LỚP 11, 12)
  // ==========================================

  // 16. Ký hiệu Điện trở (R)
  {
    id: "stem-resistor",
    status: "published",
    name: "Điện trở kỹ thuật (R)",
    category: "Vật lý Điện học",
    subjectGroup: "physics",
    elements: [
      { type: "line", x: 30, y: 60, width: 40, height: 0, points: [[0, 0], [40, 0]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      { type: "rectangle", x: 70, y: 48, width: 80, height: 24, strokeColor: "#1e1e1e", backgroundColor: "#ffffff", fillStyle: "solid", strokeWidth: 2 },
      { type: "line", x: 150, y: 60, width: 40, height: 0, points: [[0, 0], [40, 0]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      { type: "text", x: 103, y: 50, text: "R", fontSize: 17, fontFamily: 1 },
    ],
  },

  // 17. Ký hiệu Nguồn điện một chiều (E, r)
  {
    id: "stem-battery",
    status: "published",
    name: "Nguồn điện (E, r)",
    category: "Vật lý Điện học",
    subjectGroup: "physics",
    elements: [
      { type: "line", x: 30, y: 60, width: 40, height: 0, points: [[0, 0], [40, 0]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Bản cực dài dương (+)
      { type: "line", x: 70, y: 40, width: 0, height: 40, points: [[0, 0], [0, 40]], strokeColor: "#dc2626", strokeWidth: 3 },
      // Bản cực ngắn âm (-)
      { type: "line", x: 82, y: 48, width: 0, height: 24, points: [[0, 0], [0, 24]], strokeColor: "#1e1e1e", strokeWidth: 3.5 },
      { type: "line", x: 82, y: 60, width: 40, height: 0, points: [[0, 0], [40, 0]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      { type: "text", x: 62, y: 18, text: "+", fontSize: 18, fontFamily: 1, strokeColor: "#dc2626" },
      { type: "text", x: 82, y: 20, text: "-", fontSize: 18, fontFamily: 1 },
      { type: "text", x: 60, y: 84, text: "(E, r)", fontSize: 15, fontFamily: 1, strokeColor: "#dc2626" },
    ],
  },

  // 18. Sơ đồ mạch điện nối tiếp (Vật lý 11)
  {
    id: "stem-circuit-series",
    status: "published",
    name: "Sơ đồ mạch điện nối tiếp",
    category: "Vật lý Điện học",
    subjectGroup: "physics",
    elements: [
      // Dây bao ngoài hình chữ nhật (280x160)
      // Dây trên: có Nguồn (E, r) và Khóa K
      { type: "line", x: 60, y: 50, width: 50, height: 0, points: [[0, 0], [50, 0]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Nguồn (110 - 130)
      { type: "line", x: 110, y: 35, width: 0, height: 30, points: [[0, 0], [0, 30]], strokeColor: "#dc2626", strokeWidth: 3 },
      { type: "line", x: 122, y: 42, width: 0, height: 16, points: [[0, 0], [0, 16]], strokeColor: "#1e1e1e", strokeWidth: 3.5 },
      { type: "line", x: 122, y: 50, width: 40, height: 0, points: [[0, 0], [40, 0]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Khóa K (162 - 200)
      { type: "ellipse", x: 165, y: 47, width: 6, height: 6, strokeColor: "#1e1e1e", backgroundColor: "#1e1e1e", fillStyle: "solid" },
      { type: "line", x: 171, y: 50, width: 25, height: -12, points: [[0, 0], [25, -12]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      { type: "ellipse", x: 200, y: 47, width: 6, height: 6, strokeColor: "#1e1e1e", backgroundColor: "#1e1e1e", fillStyle: "solid" },
      { type: "line", x: 206, y: 50, width: 74, height: 0, points: [[0, 0], [74, 0]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Dây phải
      { type: "line", x: 280, y: 50, width: 0, height: 140, points: [[0, 0], [0, 140]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Dây dưới: có Điện trở R và Ampe kế (A)
      { type: "line", x: 280, y: 190, width: -60, height: 0, points: [[0, 0], [-60, 0]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Điện trở R (220 - 150)
      { type: "rectangle", x: 150, y: 178, width: 70, height: 24, strokeColor: "#1e1e1e", backgroundColor: "#ffffff", fillStyle: "solid", strokeWidth: 2 },
      { type: "line", x: 150, y: 190, width: -30, height: 0, points: [[0, 0], [-30, 0]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Ampe kế (A) tròn tại x=95
      { type: "ellipse", x: 95, y: 177, width: 26, height: 26, strokeColor: "#2563eb", backgroundColor: "#eff6ff", fillStyle: "solid", strokeWidth: 2 },
      { type: "text", x: 101, y: 180, text: "A", fontSize: 15, fontFamily: 1, strokeColor: "#2563eb" },
      { type: "line", x: 95, y: 190, width: -35, height: 0, points: [[0, 0], [-35, 0]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Dây trái khép kín
      { type: "line", x: 60, y: 190, width: 0, height: -140, points: [[0, 0], [0, -140]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Nhãn
      { type: "text", x: 104, y: 12, text: "E, r", fontSize: 15, fontFamily: 1, strokeColor: "#dc2626" },
      { type: "text", x: 178, y: 22, text: "K", fontSize: 15, fontFamily: 1 },
      { type: "text", x: 177, y: 180, text: "R", fontSize: 16, fontFamily: 1 },
      // Mũi tên dòng điện I
      { type: "arrow", x: 280, y: 110, width: 0, height: 30, points: [[0, 0], [0, 30]], strokeColor: "#dc2626", strokeWidth: 2, endArrowhead: "arrow" },
      { type: "text", x: 290, y: 115, text: "I", fontSize: 15, fontFamily: 1, strokeColor: "#dc2626" },
    ],
  },

  // 19. Mạch điện song song 2 nhánh R1 // R2 (Vật lý 11)
  {
    id: "stem-circuit-parallel",
    status: "published",
    name: "Mạch điện song song R₁ // R₂",
    category: "Vật lý Điện học",
    subjectGroup: "physics",
    elements: [
      // Dây chính vào nút A
      { type: "line", x: 40, y: 120, width: 50, height: 0, points: [[0, 0], [50, 0]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      { type: "ellipse", x: 88, y: 118, width: 5, height: 5, strokeColor: "#1e1e1e", backgroundColor: "#1e1e1e", fillStyle: "solid" },
      { type: "text", x: 78, y: 100, text: "A", fontSize: 15, fontFamily: 1 },
      // Nhánh rẽ lên trên
      { type: "line", x: 90, y: 120, width: 0, height: -50, points: [[0, 0], [0, -50]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      { type: "line", x: 90, y: 70, width: 30, height: 0, points: [[0, 0], [30, 0]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // R1 ở nhánh trên
      { type: "rectangle", x: 120, y: 58, width: 70, height: 24, strokeColor: "#1e1e1e", backgroundColor: "#ffffff", fillStyle: "solid", strokeWidth: 2 },
      { type: "line", x: 190, y: 70, width: 30, height: 0, points: [[0, 0], [30, 0]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      { type: "line", x: 220, y: 70, width: 0, height: 50, points: [[0, 0], [0, 50]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Nhánh rẽ xuống dưới
      { type: "line", x: 90, y: 120, width: 0, height: 50, points: [[0, 0], [0, 50]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      { type: "line", x: 90, y: 170, width: 30, height: 0, points: [[0, 0], [30, 0]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // R2 ở nhánh dưới
      { type: "rectangle", x: 120, y: 158, width: 70, height: 24, strokeColor: "#1e1e1e", backgroundColor: "#ffffff", fillStyle: "solid", strokeWidth: 2 },
      { type: "line", x: 190, y: 170, width: 30, height: 0, points: [[0, 0], [30, 0]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      { type: "line", x: 220, y: 170, width: 0, height: -50, points: [[0, 0], [0, -50]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Nút B tụ lại
      { type: "ellipse", x: 218, y: 118, width: 5, height: 5, strokeColor: "#1e1e1e", backgroundColor: "#1e1e1e", fillStyle: "solid" },
      { type: "text", x: 226, y: 100, text: "B", fontSize: 15, fontFamily: 1 },
      { type: "line", x: 220, y: 120, width: 50, height: 0, points: [[0, 0], [50, 0]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Nhãn
      { type: "text", x: 145, y: 60, text: "R₁", fontSize: 15, fontFamily: 1 },
      { type: "text", x: 145, y: 160, text: "R₂", fontSize: 15, fontFamily: 1 },
      // Dòng điện
      { type: "arrow", x: 50, y: 110, width: 25, height: 0, points: [[0, 0], [25, 0]], strokeColor: "#dc2626", strokeWidth: 1.8, endArrowhead: "arrow" },
      { type: "text", x: 55, y: 92, text: "I", fontSize: 14, fontFamily: 1, strokeColor: "#dc2626" },
    ],
  },

  // ==========================================
  // PHẦN 4: VẬT LÝ QUANG HỌC & SÓNG (LỚP 11, 12)
  // ==========================================

  // 20. Thấu kính hội tụ (Vật lý 11)
  {
    id: "stem-lens-convex",
    status: "published",
    name: "Thấu kính hội tụ (Tia sáng)",
    category: "Vật lý Quang học & Sóng",
    subjectGroup: "physics",
    elements: [
      // Trục chính Delta (ngang)
      { type: "line", x: 30, y: 120, width: 260, height: 0, points: [[0, 0], [260, 0]], strokeColor: "#64748b", strokeWidth: 1.5, strokeStyle: "dashed" },
      // Bản thân thấu kính (đứng, 2 mũi tên hướng ra ngoài)
      { type: "line", x: 160, y: 25, width: 0, height: 190, points: [[0, 0], [0, 190]], strokeColor: "#0284c7", strokeWidth: 2.5 },
      { type: "arrow", x: 160, y: 35, width: 0, height: -15, points: [[0, 0], [0, -15]], strokeColor: "#0284c7", strokeWidth: 2.5, endArrowhead: "arrow" },
      { type: "arrow", x: 160, y: 205, width: 0, height: 15, points: [[0, 0], [0, 15]], strokeColor: "#0284c7", strokeWidth: 2.5, endArrowhead: "arrow" },
      // Quang tâm O
      { type: "text", x: 164, y: 122, text: "O", fontSize: 16, fontFamily: 1 },
      // Tiêu điểm vật F(100, 120), tiêu điểm ảnh F'(220, 120)
      { type: "ellipse", x: 98, y: 118, width: 4, height: 4, strokeColor: "#dc2626", backgroundColor: "#dc2626", fillStyle: "solid" },
      { type: "text", x: 94, y: 125, text: "F", fontSize: 16, fontFamily: 1, strokeColor: "#dc2626" },
      { type: "ellipse", x: 218, y: 118, width: 4, height: 4, strokeColor: "#dc2626", backgroundColor: "#dc2626", fillStyle: "solid" },
      { type: "text", x: 214, y: 125, text: "F'", fontSize: 16, fontFamily: 1, strokeColor: "#dc2626" },
      // Vật sáng AB tại x=60
      { type: "arrow", x: 60, y: 120, width: 0, height: -50, points: [[0, 0], [0, -50]], strokeColor: "#16a34a", strokeWidth: 2.5, endArrowhead: "arrow" },
      { type: "text", x: 50, y: 122, text: "A", fontSize: 15, fontFamily: 1 },
      { type: "text", x: 48, y: 62, text: "B", fontSize: 15, fontFamily: 1, strokeColor: "#16a34a" },
      // Tia tới 1 song song trục chính -> tia ló qua F'
      { type: "arrow", x: 60, y: 70, width: 100, height: 0, points: [[0, 0], [100, 0]], strokeColor: "#eab308", strokeWidth: 1.8, endArrowhead: "arrow" },
      { type: "arrow", x: 160, y: 70, width: 100, height: 83, points: [[0, 0], [100, 83]], strokeColor: "#eab308", strokeWidth: 1.8, endArrowhead: "arrow" },
      // Nhãn trục chính
      { type: "text", x: 295, y: 112, text: "Δ", fontSize: 17, fontFamily: 1, strokeColor: "#64748b" },
    ],
  },

  // 21. Thấu kính phân kì (Vật lý 11)
  {
    id: "stem-lens-concave",
    status: "published",
    name: "Thấu kính phân kì",
    category: "Vật lý Quang học & Sóng",
    subjectGroup: "physics",
    elements: [
      // Trục chính Delta
      { type: "line", x: 30, y: 120, width: 260, height: 0, points: [[0, 0], [260, 0]], strokeColor: "#64748b", strokeWidth: 1.5, strokeStyle: "dashed" },
      // Thấu kính phân kì: 2 mũi tên hướng vào trong
      { type: "line", x: 160, y: 25, width: 0, height: 190, points: [[0, 0], [0, 190]], strokeColor: "#0284c7", strokeWidth: 2.5 },
      { type: "arrow", x: 160, y: 20, width: 0, height: 15, points: [[0, 0], [0, 15]], strokeColor: "#0284c7", strokeWidth: 2.5, endArrowhead: "arrow" },
      { type: "arrow", x: 160, y: 220, width: 0, height: -15, points: [[0, 0], [0, -15]], strokeColor: "#0284c7", strokeWidth: 2.5, endArrowhead: "arrow" },
      // Quang tâm O & Tiêu điểm F'(100, 120), F(220, 120)
      { type: "text", x: 164, y: 122, text: "O", fontSize: 16, fontFamily: 1 },
      { type: "ellipse", x: 98, y: 118, width: 4, height: 4, strokeColor: "#dc2626", backgroundColor: "#dc2626", fillStyle: "solid" },
      { type: "text", x: 94, y: 125, text: "F'", fontSize: 16, fontFamily: 1, strokeColor: "#dc2626" },
      { type: "ellipse", x: 218, y: 118, width: 4, height: 4, strokeColor: "#dc2626", backgroundColor: "#dc2626", fillStyle: "solid" },
      { type: "text", x: 214, y: 125, text: "F", fontSize: 16, fontFamily: 1, strokeColor: "#dc2626" },
      { type: "text", x: 295, y: 112, text: "Δ", fontSize: 17, fontFamily: 1, strokeColor: "#64748b" },
    ],
  },

  // 22. Định luật phản xạ ánh sáng (Vật lý 11)
  {
    id: "stem-optics-reflection",
    status: "published",
    name: "Định luật phản xạ ánh sáng",
    category: "Vật lý Quang học & Sóng",
    subjectGroup: "physics",
    elements: [
      // Gương phẳng nằm ngang (190px)
      { type: "line", x: 50, y: 180, width: 220, height: 0, points: [[0, 0], [220, 0]], strokeColor: "#1e1e1e", strokeWidth: 2.5 },
      // Gạch chéo mặt dưới gương
      { type: "line", x: 60, y: 180, width: -10, height: 10, points: [[0, 0], [-10, 10]], strokeColor: "#94a3b8", strokeWidth: 1.5 },
      { type: "line", x: 90, y: 180, width: -10, height: 10, points: [[0, 0], [-10, 10]], strokeColor: "#94a3b8", strokeWidth: 1.5 },
      { type: "line", x: 120, y: 180, width: -10, height: 10, points: [[0, 0], [-10, 10]], strokeColor: "#94a3b8", strokeWidth: 1.5 },
      { type: "line", x: 150, y: 180, width: -10, height: 10, points: [[0, 0], [-10, 10]], strokeColor: "#94a3b8", strokeWidth: 1.5 },
      { type: "line", x: 180, y: 180, width: -10, height: 10, points: [[0, 0], [-10, 10]], strokeColor: "#94a3b8", strokeWidth: 1.5 },
      { type: "line", x: 210, y: 180, width: -10, height: 10, points: [[0, 0], [-10, 10]], strokeColor: "#94a3b8", strokeWidth: 1.5 },
      { type: "line", x: 240, y: 180, width: -10, height: 10, points: [[0, 0], [-10, 10]], strokeColor: "#94a3b8", strokeWidth: 1.5 },
      // Điểm tới I(160, 180)
      // Pháp tuyến IN vuông góc mặt gương (nét đứt)
      { type: "line", x: 160, y: 180, width: 0, height: -140, points: [[0, 0], [0, -140]], strokeColor: "#64748b", strokeWidth: 1.8, strokeStyle: "dashed" },
      { type: "text", x: 155, y: 20, text: "N", fontSize: 16, fontFamily: 1, strokeColor: "#64748b" },
      // Tia tới SI (góc 45 độ)
      { type: "arrow", x: 80, y: 100, width: 80, height: 80, points: [[0, 0], [80, 80]], strokeColor: "#eab308", strokeWidth: 2.2, endArrowhead: "arrow" },
      { type: "text", x: 62, y: 88, text: "S", fontSize: 16, fontFamily: 1, strokeColor: "#eab308" },
      // Tia phản xạ IR
      { type: "arrow", x: 160, y: 180, width: 80, height: -80, points: [[0, 0], [80, -80]], strokeColor: "#dc2626", strokeWidth: 2.2, endArrowhead: "arrow" },
      { type: "text", x: 246, y: 88, text: "R", fontSize: 16, fontFamily: 1, strokeColor: "#dc2626" },
      // Điểm I
      { type: "text", x: 156, y: 190, text: "I", fontSize: 16, fontFamily: 1 },
      // Nhãn góc i = i'
      { type: "text", x: 125, y: 125, text: "i", fontSize: 15, fontFamily: 1, strokeColor: "#eab308" },
      { type: "text", x: 180, y: 125, text: "i'", fontSize: 15, fontFamily: 1, strokeColor: "#dc2626" },
      { type: "text", x: 135, y: 220, text: "i = i'", fontSize: 16, fontFamily: 1, strokeColor: "#16a34a" },
    ],
  },

  // 23. Lăng kính tán sắc ánh sáng (Vật lý 11, 12)
  {
    id: "stem-optics-prism",
    status: "published",
    name: "Lăng kính tán sắc ánh sáng",
    category: "Vật lý Quang học & Sóng",
    subjectGroup: "physics",
    elements: [
      // Tiết diện tam giác lăng kính ABC
      { type: "line", x: 150, y: 40, width: -80, height: 140, points: [[0, 0], [-80, 140]], strokeColor: "#0284c7", strokeWidth: 2.2 },
      { type: "line", x: 150, y: 40, width: 80, height: 140, points: [[0, 0], [80, 140]], strokeColor: "#0284c7", strokeWidth: 2.2 },
      { type: "line", x: 70, y: 180, width: 160, height: 0, points: [[0, 0], [160, 0]], strokeColor: "#0284c7", strokeWidth: 2.2 },
      // Tia sáng trắng tới mặt bên AB
      { type: "arrow", x: 20, y: 140, width: 75, height: -20, points: [[0, 0], [75, -20]], strokeColor: "#64748b", strokeWidth: 2.5, endArrowhead: "arrow" },
      { type: "text", x: 10, y: 145, text: "Ánh sáng trắng", fontSize: 12, fontFamily: 1 },
      // Khúc xạ & tán sắc bên trong: tia Đỏ lệch ít, tia Tím lệch nhiều
      { type: "line", x: 95, y: 120, width: 85, height: -10, points: [[0, 0], [85, -10]], strokeColor: "#dc2626", strokeWidth: 1.8 },
      { type: "line", x: 95, y: 120, width: 90, height: 8, points: [[0, 0], [90, 8]], strokeColor: "#7c3aed", strokeWidth: 1.8 },
      // Chùm tia ló ra khỏi mặt AC
      { type: "arrow", x: 180, y: 110, width: 70, height: 25, points: [[0, 0], [70, 25]], strokeColor: "#dc2626", strokeWidth: 2, endArrowhead: "arrow" },
      { type: "arrow", x: 185, y: 128, width: 65, height: 45, points: [[0, 0], [65, 45]], strokeColor: "#7c3aed", strokeWidth: 2, endArrowhead: "arrow" },
      // Nhãn quang phổ
      { type: "text", x: 256, y: 125, text: "Tia đỏ (lệch ít)", fontSize: 13, fontFamily: 1, strokeColor: "#dc2626" },
      { type: "text", x: 256, y: 165, text: "Tia tím (lệch nhiều)", fontSize: 13, fontFamily: 1, strokeColor: "#7c3aed" },
      { type: "text", x: 145, y: 15, text: "A", fontSize: 17, fontFamily: 1 },
    ],
  },

  // 24. Mô hình Sóng dừng trên dây (Vật lý 12)
  {
    id: "stem-wave-standing",
    status: "published",
    name: "Mô hình Sóng dừng trên dây",
    category: "Vật lý Quang học & Sóng",
    subjectGroup: "physics",
    elements: [
      // 2 giá giữ ở hai đầu dây P(40, 110) và Q(280, 110)
      { type: "line", x: 40, y: 60, width: 0, height: 100, points: [[0, 0], [0, 100]], strokeColor: "#1e1e1e", strokeWidth: 3 },
      { type: "line", x: 280, y: 60, width: 0, height: 100, points: [[0, 0], [0, 100]], strokeColor: "#1e1e1e", strokeWidth: 3 },
      // Bó sóng 1 (40 -> 120): đường cong trên và dưới
      {
        type: "line",
        x: 40,
        y: 110,
        width: 80,
        height: -35,
        points: [[0, 0], [20, -30], [40, -35], [60, -30], [80, 0]],
        strokeColor: "#0284c7",
        strokeWidth: 2,
        roundness: { type: 2 },
      },
      {
        type: "line",
        x: 40,
        y: 110,
        width: 80,
        height: 35,
        points: [[0, 0], [20, 30], [40, 35], [60, 30], [80, 0]],
        strokeColor: "#0284c7",
        strokeWidth: 1.8,
        strokeStyle: "dashed",
        roundness: { type: 2 },
      },
      // Bó sóng 2 (120 -> 200)
      {
        type: "line",
        x: 120,
        y: 110,
        width: 80,
        height: -35,
        points: [[0, 0], [20, -30], [40, -35], [60, -30], [80, 0]],
        strokeColor: "#0284c7",
        strokeWidth: 2,
        roundness: { type: 2 },
      },
      {
        type: "line",
        x: 120,
        y: 110,
        width: 80,
        height: 35,
        points: [[0, 0], [20, 30], [40, 35], [60, 30], [80, 0]],
        strokeColor: "#0284c7",
        strokeWidth: 1.8,
        strokeStyle: "dashed",
        roundness: { type: 2 },
      },
      // Bó sóng 3 (200 -> 280)
      {
        type: "line",
        x: 200,
        y: 110,
        width: 80,
        height: -35,
        points: [[0, 0], [20, -30], [40, -35], [60, -30], [80, 0]],
        strokeColor: "#0284c7",
        strokeWidth: 2,
        roundness: { type: 2 },
      },
      {
        type: "line",
        x: 200,
        y: 110,
        width: 80,
        height: 35,
        points: [[0, 0], [20, 30], [40, 35], [60, 30], [80, 0]],
        strokeColor: "#0284c7",
        strokeWidth: 1.8,
        strokeStyle: "dashed",
        roundness: { type: 2 },
      },
      // Nhãn Bụng sóng và Nút sóng
      { type: "text", x: 70, y: 55, text: "Bụng", fontSize: 13, fontFamily: 1, strokeColor: "#dc2626" },
      { type: "text", x: 150, y: 55, text: "Bụng", fontSize: 13, fontFamily: 1, strokeColor: "#dc2626" },
      { type: "text", x: 230, y: 55, text: "Bụng", fontSize: 13, fontFamily: 1, strokeColor: "#dc2626" },
      { type: "text", x: 112, y: 120, text: "Nút", fontSize: 13, fontFamily: 1 },
      { type: "text", x: 192, y: 120, text: "Nút", fontSize: 13, fontFamily: 1 },
      { type: "text", x: 135, y: 165, text: "λ / 2", fontSize: 15, fontFamily: 1, strokeColor: "#0284c7" },
    ],
  },

  // ==========================================
  // PHẦN 5: HÓA HỌC & SINH HỌC (LỚP 10, 11, 12)
  // ==========================================

  // 25. Vòng Benzen C6H6 (Hóa học 11, 12)
  {
    id: "stem-chem-benzene",
    status: "published",
    name: "Vòng Benzen (C₆H₆)",
    category: "Hóa học & Sinh học",
    subjectGroup: "chemistry",
    elements: [
      // Vòng lục giác đều 6 cạnh: tâm (150, 120), R=60
      // Đỉnh 1: (150, 60), Đỉnh 2: (202, 90), Đỉnh 3: (202, 150), Đỉnh 4: (150, 180), Đỉnh 5: (98, 150), Đỉnh 6: (98, 90)
      { type: "line", x: 150, y: 60, width: 52, height: 30, points: [[0, 0], [52, 30]], strokeColor: "#1e1e1e", strokeWidth: 2.5 },
      { type: "line", x: 202, y: 90, width: 0, height: 60, points: [[0, 0], [0, 60]], strokeColor: "#1e1e1e", strokeWidth: 2.5 },
      { type: "line", x: 202, y: 150, width: -52, height: 30, points: [[0, 0], [-52, 30]], strokeColor: "#1e1e1e", strokeWidth: 2.5 },
      { type: "line", x: 150, y: 180, width: -52, height: -30, points: [[0, 0], [-52, -30]], strokeColor: "#1e1e1e", strokeWidth: 2.5 },
      { type: "line", x: 98, y: 150, width: 0, height: -60, points: [[0, 0], [0, -60]], strokeColor: "#1e1e1e", strokeWidth: 2.5 },
      { type: "line", x: 98, y: 90, width: 52, height: -30, points: [[0, 0], [52, -30]], strokeColor: "#1e1e1e", strokeWidth: 2.5 },
      // Vòng tròn liên hợp pi ở giữa (R=36)
      {
        type: "ellipse",
        x: 114,
        y: 84,
        width: 72,
        height: 72,
        strokeColor: "#2563eb",
        strokeWidth: 2,
        fillStyle: "solid",
        backgroundColor: "transparent",
      },
      // Nhãn
      { type: "text", x: 115, y: 195, text: "Benzen (C₆H₆)", fontSize: 16, fontFamily: 1, strokeColor: "#2563eb" },
    ],
  },

  // 26. Bình tam giác (Erlenmeyer) & Chuẩn độ (Hóa học 11, 12)
  {
    id: "stem-chem-erlenmeyer",
    status: "published",
    name: "Bình tam giác & Chuẩn độ",
    category: "Hóa học & Sinh học",
    subjectGroup: "chemistry",
    elements: [
      // Miệng bình & Cổ bình
      { type: "line", x: 100, y: 50, width: 40, height: 0, points: [[0, 0], [40, 0]], strokeColor: "#059669", strokeWidth: 2.5 },
      { type: "line", x: 105, y: 50, width: 0, height: 40, points: [[0, 0], [0, 40]], strokeColor: "#059669", strokeWidth: 2 },
      { type: "line", x: 135, y: 50, width: 0, height: 40, points: [[0, 0], [0, 40]], strokeColor: "#059669", strokeWidth: 2 },
      // Thân bình hình nón loe
      { type: "line", x: 105, y: 90, width: -45, height: 90, points: [[0, 0], [-45, 90]], strokeColor: "#059669", strokeWidth: 2.5 },
      { type: "line", x: 135, y: 90, width: 45, height: 90, points: [[0, 0], [45, 90]], strokeColor: "#059669", strokeWidth: 2.5 },
      // Đáy bình bo tròn nhẹ
      { type: "line", x: 60, y: 180, width: 120, height: 0, points: [[0, 0], [120, 0]], strokeColor: "#059669", strokeWidth: 2.5 },
      // Dung dịch chất lỏng màu tím/hồng bên trong
      {
        type: "rectangle",
        x: 65,
        y: 145,
        width: 110,
        height: 34,
        strokeColor: "#ec4899",
        backgroundColor: "#fbcfe8",
        fillStyle: "solid",
        strokeWidth: 1.5,
      },
      // Buret nhỏ giọt phía trên
      { type: "line", x: 120, y: 5, width: 0, height: 35, points: [[0, 0], [0, 35]], strokeColor: "#1e1e1e", strokeWidth: 2 },
      // Giọt dung dịch rơi
      { type: "ellipse", x: 118, y: 44, width: 4, height: 6, strokeColor: "#ec4899", backgroundColor: "#ec4899", fillStyle: "solid" },
      { type: "text", x: 190, y: 145, text: "Điểm tương đương (đổi màu)", fontSize: 13, fontFamily: 1, strokeColor: "#ec4899" },
    ],
  },

  // 27. Ống nghiệm hóa chất & Giá đỡ (Hóa học 10, 11)
  {
    id: "stem-chem-testtube",
    status: "published",
    name: "Ống nghiệm & Giá đỡ",
    category: "Hóa học & Sinh học",
    subjectGroup: "chemistry",
    elements: [
      // Ống nghiệm 1
      { type: "line", x: 80, y: 40, width: 0, height: 120, points: [[0, 0], [0, 120]], strokeColor: "#0284c7", strokeWidth: 2 },
      { type: "line", x: 110, y: 40, width: 0, height: 120, points: [[0, 0], [0, 120]], strokeColor: "#0284c7", strokeWidth: 2 },
      // Đáy bán cầu
      {
        type: "line",
        x: 80,
        y: 160,
        width: 30,
        height: 15,
        points: [[0, 0], [8, 12], [15, 15], [22, 12], [30, 0]],
        strokeColor: "#0284c7",
        strokeWidth: 2,
        roundness: { type: 2 },
      },
      // Chất lỏng bên trong có kết tủa vàng
      {
        type: "rectangle",
        x: 82,
        y: 115,
        width: 26,
        height: 44,
        strokeColor: "#eab308",
        backgroundColor: "#fef08a",
        fillStyle: "solid",
        strokeWidth: 1,
      },
      // Kết tủa lắng ở đáy
      {
        type: "rectangle",
        x: 84,
        y: 150,
        width: 22,
        height: 10,
        strokeColor: "#ca8a04",
        backgroundColor: "#ca8a04",
        fillStyle: "solid",
        strokeWidth: 1,
      },
      // Giá kẹp gỗ/kim loại
      { type: "line", x: 60, y: 90, width: 70, height: 0, points: [[0, 0], [70, 0]], strokeColor: "#b45309", strokeWidth: 4 },
      { type: "line", x: 60, y: 90, width: 0, height: 110, points: [[0, 0], [0, 110]], strokeColor: "#b45309", strokeWidth: 4 },
      { type: "line", x: 40, y: 200, width: 40, height: 0, points: [[0, 0], [40, 0]], strokeColor: "#b45309", strokeWidth: 4 },
      // Nhãn
      { type: "text", x: 125, y: 135, text: "↓ Kết tủa vàng", fontSize: 13, fontFamily: 1, strokeColor: "#ca8a04" },
    ],
  },

  // 28. Mô hình phân tử Nước H2O (Hóa học 10)
  {
    id: "stem-chem-water",
    status: "published",
    name: "Mô hình phân tử Nước (H₂O)",
    category: "Hóa học & Sinh học",
    subjectGroup: "chemistry",
    elements: [
      // Nguyên tử Oxy lớn ở giữa (đỏ)
      {
        type: "ellipse",
        x: 130,
        y: 60,
        width: 60,
        height: 60,
        strokeColor: "#dc2626",
        backgroundColor: "#f87171",
        fillStyle: "solid",
        strokeWidth: 2.5,
      },
      { type: "text", x: 150, y: 76, text: "O", fontSize: 24, fontFamily: 1, strokeColor: "#ffffff" },
      // Liên kết O-H trái (góc 104.5 độ)
      { type: "line", x: 140, y: 110, width: -40, height: 40, points: [[0, 0], [-40, 40]], strokeColor: "#64748b", strokeWidth: 4 },
      // Nguyên tử Hydro 1 (xám)
      {
        type: "ellipse",
        x: 80,
        y: 135,
        width: 36,
        height: 36,
        strokeColor: "#64748b",
        backgroundColor: "#e2e8f0",
        fillStyle: "solid",
        strokeWidth: 2,
      },
      { type: "text", x: 91, y: 142, text: "H", fontSize: 17, fontFamily: 1, strokeColor: "#1e1e1e" },
      // Liên kết O-H phải
      { type: "line", x: 180, y: 110, width: 40, height: 40, points: [[0, 0], [40, 40]], strokeColor: "#64748b", strokeWidth: 4 },
      // Nguyên tử Hydro 2 (xám)
      {
        type: "ellipse",
        x: 204,
        y: 135,
        width: 36,
        height: 36,
        strokeColor: "#64748b",
        backgroundColor: "#e2e8f0",
        fillStyle: "solid",
        strokeWidth: 2,
      },
      { type: "text", x: 215, y: 142, text: "H", fontSize: 17, fontFamily: 1, strokeColor: "#1e1e1e" },
      // Góc liên kết 104.5 độ
      { type: "text", x: 132, y: 125, text: "104.5°", fontSize: 14, fontFamily: 1, strokeColor: "#2563eb" },
    ],
  },

  // 29. Mô hình phân tử Metan CH4 (Tứ diện đều) (Hóa học 11)
  {
    id: "stem-chem-methane",
    status: "published",
    name: "Mô hình phân tử Metan (CH₄)",
    category: "Hóa học & Sinh học",
    subjectGroup: "chemistry",
    elements: [
      // Nguyên tử Carbon trung tâm (đen)
      {
        type: "ellipse",
        x: 130,
        y: 90,
        width: 50,
        height: 50,
        strokeColor: "#1e1e1e",
        backgroundColor: "#334155",
        fillStyle: "solid",
        strokeWidth: 2.5,
      },
      { type: "text", x: 147, y: 102, text: "C", fontSize: 22, fontFamily: 1, strokeColor: "#ffffff" },
      // 4 liên kết C-H dạng tứ diện
      // H trên đỉnh
      { type: "line", x: 155, y: 90, width: 0, height: -45, points: [[0, 0], [0, -45]], strokeColor: "#64748b", strokeWidth: 3 },
      { type: "ellipse", x: 140, y: 20, width: 30, height: 30, strokeColor: "#64748b", backgroundColor: "#e2e8f0", fillStyle: "solid", strokeWidth: 2 },
      { type: "text", x: 149, y: 25, text: "H", fontSize: 15, fontFamily: 1 },
      // H trái dưới
      { type: "line", x: 135, y: 130, width: -45, height: 35, points: [[0, 0], [-45, 35]], strokeColor: "#64748b", strokeWidth: 3 },
      { type: "ellipse", x: 70, y: 155, width: 30, height: 30, strokeColor: "#64748b", backgroundColor: "#e2e8f0", fillStyle: "solid", strokeWidth: 2 },
      { type: "text", x: 79, y: 160, text: "H", fontSize: 15, fontFamily: 1 },
      // H phải dưới
      { type: "line", x: 175, y: 130, width: 45, height: 35, points: [[0, 0], [45, 35]], strokeColor: "#64748b", strokeWidth: 3 },
      { type: "ellipse", x: 210, y: 155, width: 30, height: 30, strokeColor: "#64748b", backgroundColor: "#e2e8f0", fillStyle: "solid", strokeWidth: 2 },
      { type: "text", x: 219, y: 160, text: "H", fontSize: 15, fontFamily: 1 },
      // H xiên sau (nét đứt)
      { type: "line", x: 165, y: 100, width: 40, height: -20, points: [[0, 0], [40, -20]], strokeColor: "#94a3b8", strokeWidth: 2.5, strokeStyle: "dashed" },
      { type: "ellipse", x: 200, y: 65, width: 28, height: 28, strokeColor: "#64748b", backgroundColor: "#f1f5f9", fillStyle: "solid", strokeWidth: 1.8 },
      { type: "text", x: 208, y: 70, text: "H", fontSize: 14, fontFamily: 1 },
      // Nhãn góc 109.5 độ
      { type: "text", x: 122, y: 195, text: "Góc liên kết 109.5°", fontSize: 14, fontFamily: 1, strokeColor: "#0284c7" },
    ],
  },
];

export const STEM_LIBRARY_ITEMS: ExcalidrawLibraryItem[] = RAW_STEM_LIBRARY_ITEMS.map((item) => ({
  ...item,
  elements: sanitizeExcalidrawElements(item.elements),
}));

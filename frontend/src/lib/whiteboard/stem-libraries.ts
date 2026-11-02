import { sanitizeExcalidrawElements } from "@/lib/whiteboard/sanitize-elements";

/**
 * Thư viện các hình vẽ STEM & Giáo dục (Vật lý, Toán học, Sơ đồ)
 * Dành riêng cho gói Pro của EdTeach
 */

export interface ExcalidrawLibraryItem {
  id: string;
  status: "published";
  elements: Record<string, unknown>[];
  name?: string;
  category?: string;
}

const RAW_STEM_LIBRARY_ITEMS: ExcalidrawLibraryItem[] = [
  // 1. Hệ trục toạ độ Oxy
  {
    id: "stem-coord-oxy",
    status: "published",
    name: "Hệ trục toạ độ Oxy",
    category: "Toán học & Đồ thị",
    elements: [
      {
        type: "arrow",
        x: 50,
        y: 200,
        width: 300,
        height: 0,
        points: [[0, 0], [300, 0]],
        strokeColor: "#1e1e1e",
        strokeWidth: 2,
        endArrowhead: "arrow",
        roundness: null
      },
      {
        type: "arrow",
        x: 50,
        y: 200,
        width: 0,
        height: -180,
        points: [[0, 0], [0, -180]],
        strokeColor: "#1e1e1e",
        strokeWidth: 2,
        endArrowhead: "arrow",
        roundness: null
      },
      {
        type: "text",
        x: 355,
        y: 190,
        text: "x",
        fontSize: 20,
        fontFamily: 1,
        textAlign: "left",
        verticalAlign: "top"
      },
      {
        type: "text",
        x: 42,
        y: 5,
        text: "y",
        fontSize: 20,
        fontFamily: 1,
        textAlign: "left",
        verticalAlign: "top"
      },
      {
        type: "text",
        x: 35,
        y: 205,
        text: "O",
        fontSize: 18,
        fontFamily: 1,
        textAlign: "left",
        verticalAlign: "top"
      }
    ]
  },

  // 2. Vector Lực F (Mũi tên đỏ kèm nhãn)
  {
    id: "stem-force-vector",
    status: "published",
    name: "Vector Lực (F)",
    category: "Vật lý Cơ học",
    elements: [
      {
        type: "arrow",
        x: 50,
        y: 100,
        width: 150,
        height: -60,
        points: [[0, 0], [150, -60]],
        strokeColor: "#e03131",
        strokeWidth: 3,
        endArrowhead: "arrow",
        roundness: null
      },
      {
        type: "text",
        x: 130,
        y: 50,
        text: "F",
        fontSize: 22,
        fontFamily: 1,
        strokeColor: "#e03131",
        textAlign: "left",
        verticalAlign: "top"
      }
    ]
  },

  // 3. Con lắc lò xo treo thẳng đứng
  {
    id: "stem-spring",
    status: "published",
    name: "Lò xo dao động (k)",
    category: "Vật lý Cơ học",
    elements: [
      {
        type: "line",
        x: 50,
        y: 50,
        width: 80,
        height: 0,
        points: [[0, 0], [80, 0]],
        strokeColor: "#1e1e1e",
        strokeWidth: 3
      },
      {
        type: "line",
        x: 90,
        y: 50,
        width: 20,
        height: 120,
        points: [
          [0, 0],
          [10, 15],
          [-10, 30],
          [10, 45],
          [-10, 60],
          [10, 75],
          [-10, 90],
          [0, 105],
          [0, 120]
        ],
        strokeColor: "#2f9e44",
        strokeWidth: 2,
        roughness: 1
      },
      {
        type: "rectangle",
        x: 75,
        y: 170,
        width: 30,
        height: 30,
        strokeColor: "#1971c2",
        backgroundColor: "#a5d8ff",
        fillStyle: "solid",
        strokeWidth: 2
      },
      {
        type: "text",
        x: 82,
        y: 175,
        text: "m",
        fontSize: 16,
        fontFamily: 1
      }
    ]
  },

  // 4. Điện trở R
  {
    id: "stem-resistor",
    status: "published",
    name: "Điện trở (R)",
    category: "Vật lý Điện học",
    elements: [
      {
        type: "line",
        x: 20,
        y: 50,
        width: 30,
        height: 0,
        points: [[0, 0], [30, 0]],
        strokeColor: "#1e1e1e",
        strokeWidth: 2
      },
      {
        type: "rectangle",
        x: 50,
        y: 40,
        width: 60,
        height: 20,
        strokeColor: "#1e1e1e",
        backgroundColor: "#ffffff",
        fillStyle: "solid",
        strokeWidth: 2
      },
      {
        type: "line",
        x: 110,
        y: 50,
        width: 30,
        height: 0,
        points: [[0, 0], [30, 0]],
        strokeColor: "#1e1e1e",
        strokeWidth: 2
      },
      {
        type: "text",
        x: 73,
        y: 42,
        text: "R",
        fontSize: 16,
        fontFamily: 1
      }
    ]
  },

  // 5. Nguồn điện (Pin / Ắc quy)
  {
    id: "stem-battery",
    status: "published",
    name: "Nguồn điện (E, r)",
    category: "Vật lý Điện học",
    elements: [
      {
        type: "line",
        x: 20,
        y: 50,
        width: 30,
        height: 0,
        points: [[0, 0], [30, 0]],
        strokeColor: "#1e1e1e",
        strokeWidth: 2
      },
      {
        type: "line",
        x: 50,
        y: 35,
        width: 0,
        height: 30,
        points: [[0, 0], [0, 30]],
        strokeColor: "#e03131",
        strokeWidth: 3
      },
      {
        type: "line",
        x: 60,
        y: 42,
        width: 0,
        height: 16,
        points: [[0, 0], [0, 16]],
        strokeColor: "#1e1e1e",
        strokeWidth: 3
      },
      {
        type: "line",
        x: 60,
        y: 50,
        width: 30,
        height: 0,
        points: [[0, 0], [30, 0]],
        strokeColor: "#1e1e1e",
        strokeWidth: 2
      },
      {
        type: "text",
        x: 43,
        y: 18,
        text: "+",
        fontSize: 16,
        fontFamily: 1,
        strokeColor: "#e03131"
      },
      {
        type: "text",
        x: 60,
        y: 20,
        text: "-",
        fontSize: 16,
        fontFamily: 1
      }
    ]
  },

  // 6. Thấu kính hội tụ
  {
    id: "stem-lens",
    status: "published",
    name: "Thấu kính hội tụ",
    category: "Vật lý Quang học",
    elements: [
      {
        type: "line",
        x: 100,
        y: 20,
        width: 0,
        height: 160,
        points: [[0, 0], [0, 160]],
        strokeColor: "#1971c2",
        strokeWidth: 2
      },
      {
        type: "arrow",
        x: 100,
        y: 30,
        width: 0,
        height: -15,
        points: [[0, 0], [0, -15]],
        strokeColor: "#1971c2",
        strokeWidth: 2,
        endArrowhead: "arrow"
      },
      {
        type: "arrow",
        x: 100,
        y: 170,
        width: 0,
        height: 15,
        points: [[0, 0], [0, 15]],
        strokeColor: "#1971c2",
        strokeWidth: 2,
        endArrowhead: "arrow"
      },
      {
        type: "line",
        x: 20,
        y: 100,
        width: 160,
        height: 0,
        points: [[0, 0], [160, 0]],
        strokeColor: "#868e96",
        strokeWidth: 1,
        strokeStyle: "dashed"
      },
      {
        type: "text",
        x: 105,
        y: 103,
        text: "O",
        fontSize: 14,
        fontFamily: 1
      }
    ]
  }
];

export const STEM_LIBRARY_ITEMS: ExcalidrawLibraryItem[] = RAW_STEM_LIBRARY_ITEMS.map((item) => ({
  ...item,
  elements: sanitizeExcalidrawElements(item.elements),
}));

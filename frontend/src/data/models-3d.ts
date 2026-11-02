import * as THREE from "three";

export type Model3DSubject = "math" | "chem" | "bio" | "geo";

export interface Model3DItem {
  id: string;
  nameVi: string;
  subject: Model3DSubject;
  categoryVi: string;
  descriptionVi: string;
  gdpt?: string;
  createMesh: () => THREE.Object3D;
  cameraPosition?: [number, number, number];
}

export const MODEL_SUBJECT_LABEL: Record<Model3DSubject, string> = {
  math: "Toán & 3D",
  chem: "Hóa học",
  bio: "Sinh học",
  geo: "Địa lý & Lý",
};

export const MODEL_SUBJECT_BADGE: Record<Model3DSubject, string> = {
  math: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200",
  chem: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200",
  bio: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200",
  geo: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200",
};

// Helper tạo ống nối liên kết giữa 2 điểm (cho phân tử hóa học & khung hình học)
function createBond(p1: THREE.Vector3, p2: THREE.Vector3, radius = 0.05, color = 0x94a3b8): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const length = dir.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 12);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.3,
    metalness: 0.2,
  });
  const mesh = new THREE.Mesh(geometry, material);

  // Căn chỉnh trục xilanh theo vector p1 -> p2
  const orientation = new THREE.Matrix4();
  orientation.lookAt(p1, p2, new THREE.Vector3(0, 1, 0));
  const rot = new THREE.Matrix4().makeRotationX(Math.PI / 2);
  orientation.multiply(rot);
  mesh.applyMatrix4(orientation);
  mesh.position.copy(new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5));
  return mesh;
}

// Helper tạo nguyên tử (sphere)
function createAtom(pos: THREE.Vector3, radius: number, color: number, name?: string): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 24, 20);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.25,
    metalness: 0.15,
  });
  const atom = new THREE.Mesh(geometry, material);
  atom.position.copy(pos);
  if (name) atom.name = name;
  return atom;
}

export const EDUCATIONAL_3D_MODELS: Model3DItem[] = [
  // ==========================================
  // 1. TOÁN HỌC & HÌNH HỌC KHÔNG GIAN 3D
  // ==========================================

  // 1.1 Hình chóp tứ giác S.ABCD
  {
    id: "geom-pyramid-quad",
    nameVi: "Hình chóp tứ giác S.ABCD",
    subject: "math",
    categoryVi: "Hình học Không gian",
    descriptionVi: "Hình chóp tứ giác có đáy hình vuông ABCD, đường cao SO vuông góc với mặt đáy.",
    gdpt: "Toán 11 & 12 — Góc, khoảng cách, thể tích khối đa diện",
    cameraPosition: [3.2, 2.5, 3.5],
    createMesh: () => {
      const group = new THREE.Group();
      // Khối chóp 4 mặt bên
      const S = new THREE.Vector3(0, 1.8, 0);
      const A = new THREE.Vector3(-1.1, 0, 1.1);
      const B = new THREE.Vector3(1.1, 0, 1.1);
      const C = new THREE.Vector3(1.1, 0, -1.1);
      const D = new THREE.Vector3(-1.1, 0, -1.1);
      const O = new THREE.Vector3(0, 0, 0);

      const positions = [
        // Tam giác SAB
        S.x, S.y, S.z, A.x, A.y, A.z, B.x, B.y, B.z,
        // Tam giác SBC
        S.x, S.y, S.z, B.x, B.y, B.z, C.x, C.y, C.z,
        // Tam giác SCD
        S.x, S.y, S.z, C.x, C.y, C.z, D.x, D.y, D.z,
        // Tam giác SDA
        S.x, S.y, S.z, D.x, D.y, D.z, A.x, A.y, A.z,
        // Đáy ABCD (2 tam giác)
        A.x, A.y, A.z, C.x, C.y, C.z, B.x, B.y, B.z,
        A.x, A.y, A.z, D.x, D.y, D.z, C.x, C.y, C.z,
      ];

      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geom.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        roughness: 0.3,
        metalness: 0.1,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geom, mat);
      group.add(mesh);

      // Cạnh viền khung dây (Wireframe outline sắc nét)
      const wireMat = new THREE.LineBasicMaterial({ color: 0x1d4ed8, linewidth: 2 });
      const wireGeom = new THREE.EdgesGeometry(geom, 20);
      const wireframe = new THREE.LineSegments(wireGeom, wireMat);
      group.add(wireframe);

      // Đường cao SO (màu đỏ nổi bật)
      group.add(createBond(S, O, 0.035, 0xef4444));
      // Đường chéo đáy AC, BD
      group.add(createBond(A, C, 0.02, 0x64748b));
      group.add(createBond(B, D, 0.02, 0x64748b));

      // Đỉnh cầu các điểm S, A, B, C, D, O
      [S, A, B, C, D].forEach((p) => group.add(createAtom(p, 0.07, 0x1e293b)));
      group.add(createAtom(O, 0.06, 0xef4444));

      return group;
    },
  },

  // 1.2 Hình chóp tam giác đều S.ABC (Tứ diện)
  {
    id: "geom-pyramid-triangle",
    nameVi: "Hình chóp tam giác S.ABC (Tứ diện)",
    subject: "math",
    categoryVi: "Hình học Không gian",
    descriptionVi: "Tứ diện đều S.ABC với 4 mặt tam giác đều, trực quan hóa trọng tâm và chiều cao.",
    gdpt: "Toán 11 & 12 — Thiết diện và thể tích tứ diện",
    cameraPosition: [2.8, 2.2, 3.2],
    createMesh: () => {
      const group = new THREE.Group();
      const geom = new THREE.TetrahedronGeometry(1.5);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        roughness: 0.3,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geom, mat);
      group.add(mesh);

      const wireGeom = new THREE.EdgesGeometry(geom);
      const wireMat = new THREE.LineBasicMaterial({ color: 0x5b21b6 });
      group.add(new THREE.LineSegments(wireGeom, wireMat));

      return group;
    },
  },

  // 1.3 Hình lăng trụ đứng tam giác ABC.A'B'C'
  {
    id: "geom-prism",
    nameVi: "Lăng trụ đứng tam giác ABC.A'B'C'",
    subject: "math",
    categoryVi: "Hình học Không gian",
    descriptionVi: "Hình lăng trụ đứng có 2 đáy tam giác bằng nhau, các mặt bên là hình chữ nhật.",
    gdpt: "Toán 11 & 12 — Khối lăng trụ đứng, diện tích xung quanh",
    cameraPosition: [3.2, 2.4, 3.2],
    createMesh: () => {
      const group = new THREE.Group();
      const geom = new THREE.CylinderGeometry(1.2, 1.2, 2.2, 3);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        roughness: 0.3,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geom, mat);
      group.add(mesh);

      const wireGeom = new THREE.EdgesGeometry(geom);
      const wireMat = new THREE.LineBasicMaterial({ color: 0x0e7490 });
      group.add(new THREE.LineSegments(wireGeom, wireMat));

      return group;
    },
  },

  // 1.4 Khối hộp chữ nhật / Khối lập phương
  {
    id: "geom-box",
    nameVi: "Khối lập phương ABCD.A'B'C'D'",
    subject: "math",
    categoryVi: "Hình học Không gian",
    descriptionVi: "Khối đa diện đều 6 mặt vuông, 12 cạnh bằng nhau, 8 đỉnh.",
    gdpt: "Toán 11 & 12 — Thiết diện qua khối lập phương",
    cameraPosition: [2.8, 2.2, 2.8],
    createMesh: () => {
      const group = new THREE.Group();
      const geom = new THREE.BoxGeometry(1.7, 1.7, 1.7);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        roughness: 0.3,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geom, mat);
      group.add(mesh);

      const wireGeom = new THREE.EdgesGeometry(geom);
      const wireMat = new THREE.LineBasicMaterial({ color: 0x047857 });
      group.add(new THREE.LineSegments(wireGeom, wireMat));

      return group;
    },
  },

  // 1.5 Khối nón tròn xoay
  {
    id: "geom-cone",
    nameVi: "Khối nón tròn xoay 3D",
    subject: "math",
    categoryVi: "Hình học Không gian",
    descriptionVi: "Khối nón gồm đỉnh S, đường cao h, bán kính đáy R và các đường sinh l.",
    gdpt: "Toán 12 — Khối nón tròn xoay: Stp = πR(R + l), V = 1/3 πR²h",
    cameraPosition: [3.0, 2.0, 3.0],
    createMesh: () => {
      const group = new THREE.Group();
      const geom = new THREE.ConeGeometry(1.2, 2.4, 36);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.35,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geom, mat);
      group.add(mesh);

      // Trục nón đường cao h
      group.add(createBond(new THREE.Vector3(0, 1.2, 0), new THREE.Vector3(0, -1.2, 0), 0.03, 0xef4444));
      // Bán kính đáy R
      group.add(createBond(new THREE.Vector3(0, -1.2, 0), new THREE.Vector3(1.2, -1.2, 0), 0.025, 0x2563eb));

      return group;
    },
  },

  // 1.6 Khối trụ tròn xoay
  {
    id: "geom-cylinder",
    nameVi: "Khối trụ tròn xoay 3D",
    subject: "math",
    categoryVi: "Hình học Không gian",
    descriptionVi: "Khối trụ gồm 2 đáy tròn song song bán kính R và trục đối xứng OO'.",
    gdpt: "Toán 12 — Khối trụ tròn xoay: Sxq = 2πRh, V = πR²h",
    cameraPosition: [3.0, 2.0, 3.0],
    createMesh: () => {
      const group = new THREE.Group();
      const geom = new THREE.CylinderGeometry(1.0, 1.0, 2.2, 36);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xec4899,
        roughness: 0.35,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
      });
      group.add(new THREE.Mesh(geom, mat));

      // Trục OO'
      group.add(createBond(new THREE.Vector3(0, 1.1, 0), new THREE.Vector3(0, -1.1, 0), 0.03, 0xef4444));
      // Bán kính đáy R
      group.add(createBond(new THREE.Vector3(0, 1.1, 0), new THREE.Vector3(1.0, 1.1, 0), 0.025, 0x2563eb));

      return group;
    },
  },

  // 1.7 Khối cầu 3D (Mặt cầu)
  {
    id: "geom-sphere",
    nameVi: "Khối cầu 3D (Mặt cầu)",
    subject: "math",
    categoryVi: "Hình học Không gian",
    descriptionVi: "Tập hợp các điểm cách đều tâm O một khoảng bằng R. Thể tích V = 4/3 πR³.",
    gdpt: "Toán 12 — Mặt cầu, kinh tuyến, vĩ tuyến và thiết diện phẳng",
    cameraPosition: [2.8, 1.8, 2.8],
    createMesh: () => {
      const group = new THREE.Group();
      const geom = new THREE.SphereGeometry(1.3, 36, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.25,
        transparent: true,
        opacity: 0.7,
      });
      group.add(new THREE.Mesh(geom, mat));

      // Vòng xích đạo nổi bật
      const ringGeom = new THREE.TorusGeometry(1.31, 0.025, 12, 48);
      ringGeom.rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      group.add(new THREE.Mesh(ringGeom, ringMat));

      // Bán kính R
      group.add(createBond(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1.3, 0, 0), 0.03, 0xef4444));
      group.add(createAtom(new THREE.Vector3(0, 0, 0), 0.07, 0xef4444));

      return group;
    },
  },

  // ==========================================
  // 2. HÓA HỌC: CẤU TRÚC PHÂN TỬ 3D
  // ==========================================

  // 2.1 Phân tử Nước H2O
  {
    id: "chem-water",
    nameVi: "Mô hình phân tử Nước (H₂O)",
    subject: "chem",
    categoryVi: "Hóa học Phân tử",
    descriptionVi: "Nguyên tử Oxy ở giữa liên kết với 2 nguyên tử Hydro, góc liên kết đo thực tế 104.5°.",
    gdpt: "Hóa học 10 — Liên kết cộng hóa trị có cực, góc lai hóa sp³",
    cameraPosition: [0, 0, 3.2],
    createMesh: () => {
      const group = new THREE.Group();
      // Oxy ở giữa (đỏ)
      const O = new THREE.Vector3(0, 0.35, 0);
      // Góc 104.5 độ
      const angle = (104.5 * Math.PI) / 180 / 2;
      const dist = 1.0;
      const H1 = new THREE.Vector3(-Math.sin(angle) * dist, 0.35 - Math.cos(angle) * dist, 0);
      const H2 = new THREE.Vector3(Math.sin(angle) * dist, 0.35 - Math.cos(angle) * dist, 0);

      group.add(createAtom(O, 0.52, 0xef4444, "Oxy"));
      group.add(createAtom(H1, 0.32, 0xf1f5f9, "Hydro 1"));
      group.add(createAtom(H2, 0.32, 0xf1f5f9, "Hydro 2"));

      group.add(createBond(O, H1, 0.08, 0x94a3b8));
      group.add(createBond(O, H2, 0.08, 0x94a3b8));

      return group;
    },
  },

  // 2.2 Phân tử Metan CH4
  {
    id: "chem-methane",
    nameVi: "Mô hình phân tử Metan (CH₄)",
    subject: "chem",
    categoryVi: "Hóa học Hữu cơ",
    descriptionVi: "Cấu trúc tứ diện đều đối xứng, nguyên tử Carbon lai hóa sp³ ở tâm, góc liên kết 109.5°.",
    gdpt: "Hóa học 11 — Ankan, cấu trúc không gian của hydrocacbon",
    cameraPosition: [2.5, 2.0, 2.5],
    createMesh: () => {
      const group = new THREE.Group();
      const C = new THREE.Vector3(0, 0, 0);
      group.add(createAtom(C, 0.48, 0x334155, "Carbon"));

      // 4 đỉnh tứ diện đều
      const r = 1.1;
      const hPositions = [
        new THREE.Vector3(r / Math.sqrt(3), r / Math.sqrt(3), r / Math.sqrt(3)),
        new THREE.Vector3(-r / Math.sqrt(3), -r / Math.sqrt(3), r / Math.sqrt(3)),
        new THREE.Vector3(-r / Math.sqrt(3), r / Math.sqrt(3), -r / Math.sqrt(3)),
        new THREE.Vector3(r / Math.sqrt(3), -r / Math.sqrt(3), -r / Math.sqrt(3)),
      ];

      hPositions.forEach((hPos) => {
        group.add(createAtom(hPos, 0.3, 0xf1f5f9, "Hydro"));
        group.add(createBond(C, hPos, 0.07, 0x94a3b8));
      });

      return group;
    },
  },

  // 2.3 Vòng Benzen C6H6
  {
    id: "chem-benzene",
    nameVi: "Mô hình Vòng Benzen (C₆H₆)",
    subject: "chem",
    categoryVi: "Hóa học Hữu cơ",
    descriptionVi: "Khung 6 nguyên tử Carbon phẳng lục giác đều với hệ liên kết pi liên hợp bền vững.",
    gdpt: "Hóa học 11 — Aren (Hydrocacbon thơm) và đồng đẳng",
    cameraPosition: [0, 2.8, 3.5],
    createMesh: () => {
      const group = new THREE.Group();
      const radiusC = 1.1;
      const radiusH = 1.8;
      const cPositions: THREE.Vector3[] = [];

      for (let i = 0; i < 6; i++) {
        const theta = (i * Math.PI) / 3;
        const cPos = new THREE.Vector3(Math.cos(theta) * radiusC, 0, Math.sin(theta) * radiusC);
        const hPos = new THREE.Vector3(Math.cos(theta) * radiusH, 0, Math.sin(theta) * radiusH);
        cPositions.push(cPos);

        group.add(createAtom(cPos, 0.35, 0x334155, `C${i + 1}`));
        group.add(createAtom(hPos, 0.22, 0xf1f5f9, `H${i + 1}`));
        group.add(createBond(cPos, hPos, 0.05, 0x94a3b8));
      }

      // Nối vòng lục giác
      for (let i = 0; i < 6; i++) {
        const next = (i + 1) % 6;
        group.add(createBond(cPositions[i], cPositions[next], 0.07, 0x475569));
      }

      // Vòng tròn pi liên hợp ở giữa
      const ringGeom = new THREE.TorusGeometry(0.68, 0.035, 12, 48);
      ringGeom.rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        roughness: 0.3,
        transparent: true,
        opacity: 0.85,
      });
      group.add(new THREE.Mesh(ringGeom, ringMat));

      return group;
    },
  },

  // 2.4 Tinh thể muối ăn NaCl
  {
    id: "chem-nacl",
    nameVi: "Mạng tinh thể Muối ăn (NaCl)",
    subject: "chem",
    categoryVi: "Hóa học Đại cương",
    descriptionVi: "Mạng lập phương tâm diện: ion Na+ (tím) và ion Cl- (xanh lá) xen kẽ nhau trong không gian.",
    gdpt: "Hóa học 10 — Liên kết ion và cấu trúc tinh thể ion",
    cameraPosition: [3.8, 3.2, 3.8],
    createMesh: () => {
      const group = new THREE.Group();
      const step = 0.8;
      const start = -step;

      // 3x3x3 mạng tinh thể
      for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
          for (let z = 0; z < 3; z++) {
            const pos = new THREE.Vector3(start + x * step, start + y * step, start + z * step);
            const isNa = (x + y + z) % 2 === 0;
            // Na+ nhỏ màu tím, Cl- lớn màu xanh lục
            if (isNa) {
              group.add(createAtom(pos, 0.16, 0x8b5cf6, "Na+"));
            } else {
              group.add(createAtom(pos, 0.25, 0x10b981, "Cl-"));
            }
          }
        }
      }

      // Khung liên kết tinh thể
      const frameGeom = new THREE.BoxGeometry(step * 2, step * 2, step * 2);
      const frameMat = new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.5 });
      group.add(new THREE.LineSegments(new THREE.EdgesGeometry(frameGeom), frameMat));

      return group;
    },
  },

  // ==========================================
  // 3. SINH HỌC & GIẢI PHẪU 3D
  // ==========================================

  // 3.1 Chuỗi xoắn kép ADN
  {
    id: "bio-dna",
    nameVi: "Chuỗi xoắn kép ADN (DNA Double Helix)",
    subject: "bio",
    categoryVi: "Sinh học Di truyền",
    descriptionVi: "Mô hình chuỗi xoắn kép xoay quanh một trục, với các cặp bazo nito bổ sung A-T và G-C.",
    gdpt: "Sinh học 10 & 12 — Cấu trúc hóa học và chức năng của ADN",
    cameraPosition: [0, 1.2, 4.2],
    createMesh: () => {
      const group = new THREE.Group();
      const turns = 2.5;
      const pointsCount = 48;
      const radius = 0.9;
      const height = 3.6;

      for (let i = 0; i < pointsCount; i++) {
        const t = i / pointsCount;
        const angle = t * turns * Math.PI * 2;
        const y = (t - 0.5) * height;

        const p1 = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
        const p2 = new THREE.Vector3(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius);

        // Khung đường photphat
        group.add(createAtom(p1, 0.09, 0x0284c7));
        group.add(createAtom(p2, 0.09, 0x0284c7));

        // Bậc thang cặp bazo nito (A-T: đỏ-xanh, G-C: vàng-tím)
        const isAT = i % 2 === 0;
        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        group.add(createBond(p1, mid, 0.035, isAT ? 0xef4444 : 0xeab308));
        group.add(createBond(mid, p2, 0.035, isAT ? 0x3b82f6 : 0x8b5cf6));
      }

      return group;
    },
  },

  // 3.2 Cấu trúc Tế bào nhân thực (Cell Anatomy)
  {
    id: "bio-cell",
    nameVi: "Cấu trúc Tế bào nhân thực (Cell)",
    subject: "bio",
    categoryVi: "Sinh học Tế bào",
    descriptionVi: "Màng tế bào cắt góc hiển thị tế bào chất, nhân tế bào, ti thể và các bào quan.",
    gdpt: "Sinh học 10 — Cấu trúc tế bào nhân thực",
    cameraPosition: [2.5, 2.0, 2.8],
    createMesh: () => {
      const group = new THREE.Group();
      // Màng sinh chất bán trong suốt
      const cellGeom = new THREE.SphereGeometry(1.5, 32, 24);
      const cellMat = new THREE.MeshStandardMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.35,
        roughness: 0.4,
      });
      group.add(new THREE.Mesh(cellGeom, cellMat));

      // Nhân tế bào (Nucleus tím)
      const nucleusGeom = new THREE.SphereGeometry(0.55, 24, 18);
      const nucleusMat = new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.3 });
      const nucleus = new THREE.Mesh(nucleusGeom, nucleusMat);
      nucleus.position.set(-0.3, 0.2, 0);
      group.add(nucleus);

      // Ti thể (Mitochondria màu cam)
      for (let i = 0; i < 3; i++) {
        const mitoGeom = new THREE.CapsuleGeometry(0.12, 0.35, 8, 12);
        const mitoMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
        const mito = new THREE.Mesh(mitoGeom, mitoMat);
        mito.position.set(0.6 + i * 0.2, -0.4 + i * 0.3, i * 0.3);
        mito.rotation.z = Math.PI / 4 + i;
        group.add(mito);
      }

      return group;
    },
  },

  // 3.3 Trái tim người 4 ngăn (Human Heart)
  {
    id: "bio-heart",
    nameVi: "Mô hình Trái tim người 4 ngăn",
    subject: "bio",
    categoryVi: "Giải phẫu & Sinh học Người",
    descriptionVi: "Cấu tạo tim: tâm nhĩ trái/phải, tâm thất trái/phải, cung động mạch chủ và tĩnh mạch chủ.",
    gdpt: "Sinh học 11 — Hệ tuần hoàn ở động vật",
    cameraPosition: [0, 0, 3.2],
    createMesh: () => {
      const group = new THREE.Group();
      // Khối tâm thất (tạo dáng quả tim)
      const heartShape = new THREE.Shape();
      const x = 0, y = 0;
      heartShape.moveTo(x + 0.25, y + 0.25);
      heartShape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.2, y, x, y);
      heartShape.bezierCurveTo(x - 0.3, y, x - 0.3, y + 0.35, x - 0.3, y + 0.35);
      heartShape.bezierCurveTo(x - 0.3, y + 0.55, x - 0.1, y + 0.77, x + 0.25, y + 0.95);
      heartShape.bezierCurveTo(x + 0.6, y + 0.77, x + 0.8, y + 0.55, x + 0.8, y + 0.35);
      heartShape.bezierCurveTo(x + 0.8, y + 0.35, x + 0.8, y, x + 0.5, y);
      heartShape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);

      const extrudeSettings = { depth: 0.6, bevelEnabled: true, bevelSegments: 6, steps: 2, bevelSize: 0.18, bevelThickness: 0.18 };
      const heartGeom = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
      heartGeom.center();
      heartGeom.rotateZ(Math.PI);

      const heartMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        roughness: 0.35,
        metalness: 0.1,
      });
      group.add(new THREE.Mesh(heartGeom, heartMat));

      // Quai động mạch chủ (màu đỏ tươi uốn vòng lên trên)
      const aortaGeom = new THREE.TorusGeometry(0.45, 0.12, 12, 24, Math.PI);
      const aortaMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
      const aorta = new THREE.Mesh(aortaGeom, aortaMat);
      aorta.position.set(-0.1, 0.75, 0);
      group.add(aorta);

      // Tĩnh mạch chủ (màu xanh dương)
      const veinGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 16);
      const veinMat = new THREE.MeshStandardMaterial({ color: 0x2563eb });
      const vein = new THREE.Mesh(veinGeom, veinMat);
      vein.position.set(0.5, 0.65, 0.1);
      group.add(vein);

      return group;
    },
  },

  // ==========================================
  // 4. ĐỊA LÝ & THIÊN VĂN & VẬT LÝ 3D
  // ==========================================

  // 4.1 Quả Địa Cầu Trái Đất (Earth Globe)
  {
    id: "geo-earth",
    nameVi: "Quả Địa Cầu Trái Đất (Trục nghiêng 23.5°)",
    subject: "geo",
    categoryVi: "Thiên văn & Địa lý",
    descriptionVi: "Trái Đất với trục quay nghiêng 23.5° so với mặt phẳng xích đạo, minh họa ngày đêm và các mùa.",
    gdpt: "Địa lý 10 — Chuyển động tự quay và chuyển động quanh Mặt Trời",
    cameraPosition: [2.8, 1.8, 2.8],
    createMesh: () => {
      const group = new THREE.Group();
      // Quả cầu đại dương xanh
      const globeGeom = new THREE.SphereGeometry(1.3, 36, 24);
      const globeMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.4,
      });
      const globe = new THREE.Mesh(globeGeom, globeMat);
      group.add(globe);

      // Đường xích đạo đỏ
      const eqGeom = new THREE.TorusGeometry(1.32, 0.02, 12, 48);
      eqGeom.rotateX(Math.PI / 2);
      group.add(new THREE.Mesh(eqGeom, new THREE.MeshBasicMaterial({ color: 0xef4444 })));

      // Trục tự quay Bắc - Nam nghiêng 23.5 độ
      const axisPole = createBond(new THREE.Vector3(0, 1.8, 0), new THREE.Vector3(0, -1.8, 0), 0.035, 0xf59e0b);
      group.add(axisPole);

      // Chân đế đỡ địa cầu
      const standGeom = new THREE.CylinderGeometry(0.6, 0.7, 0.1, 24);
      const standMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5 });
      const stand = new THREE.Mesh(standGeom, standMat);
      stand.position.set(0, -1.85, 0);
      group.add(stand);

      // Nghiêng cả khối quả địa cầu đúng 23.5 độ
      group.rotation.z = (-23.5 * Math.PI) / 180;

      return group;
    },
  },

  // 4.2 Hệ Mặt Trời 3D (Solar System)
  {
    id: "geo-solarsystem",
    nameVi: "Hệ Mặt Trời 3D (Solar System)",
    subject: "geo",
    categoryVi: "Thiên văn & Vũ trụ",
    descriptionVi: "Mặt Trời phát sáng ở tâm và các hành tinh (Thủy, Kim, Trái Đất, Hỏa, Mộc, Thổ) trên quỹ đạo.",
    gdpt: "Địa lý 10 & Vật lý 10 — Trái Đất trong Hệ Mặt Trời",
    cameraPosition: [0, 4.5, 4.5],
    createMesh: () => {
      const group = new THREE.Group();
      // Mặt trời vàng rực ở tâm
      const sunGeom = new THREE.SphereGeometry(0.65, 24, 20);
      const sunMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      group.add(new THREE.Mesh(sunGeom, sunMat));

      // 4 hành tinh gần + quỹ đạo
      const planets = [
        { name: "Thủy Tinh", r: 1.1, size: 0.1, color: 0x94a3b8 },
        { name: "Kim Tinh", r: 1.6, size: 0.14, color: 0xf59e0b },
        { name: "Trái Đất", r: 2.2, size: 0.16, color: 0x38bdf8 },
        { name: "Hỏa Tinh", r: 2.8, size: 0.12, color: 0xef4444 },
      ];

      planets.forEach((p) => {
        // Đường tròn quỹ đạo
        const orbitGeom = new THREE.RingGeometry(p.r - 0.015, p.r + 0.015, 64);
        orbitGeom.rotateX(Math.PI / 2);
        const orbitMat = new THREE.MeshBasicMaterial({ color: 0x475569, side: THREE.DoubleSide });
        group.add(new THREE.Mesh(orbitGeom, orbitMat));

        // Quả cầu hành tinh
        const pGeom = new THREE.SphereGeometry(p.size, 16, 12);
        const pMat = new THREE.MeshStandardMaterial({ color: p.color });
        const pMesh = new THREE.Mesh(pGeom, pMat);
        pMesh.position.set(p.r, 0, 0);
        group.add(pMesh);
      });

      return group;
    },
  },

  // 4.3 Nam châm chữ U & Từ trường (Physics)
  {
    id: "phys-magnet",
    nameVi: "Nam châm chữ U & Đường sức từ",
    subject: "geo",
    categoryVi: "Vật lý Điện từ",
    descriptionVi: "Cực Bắc (N - đỏ) và Cực Nam (S - xanh) với các đường sức từ hướng từ Bắc sang Nam.",
    gdpt: "Vật lý 11 & 12 — Từ trường và cảm ứng điện từ",
    cameraPosition: [2.5, 2.0, 3.2],
    createMesh: () => {
      const group = new THREE.Group();
      // Nhánh trái cực Bắc N (Đỏ)
      const nGeom = new THREE.BoxGeometry(0.35, 1.4, 0.4);
      const nMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
      const nPole = new THREE.Mesh(nGeom, nMat);
      nPole.position.set(-0.8, 0, 0);
      group.add(nPole);

      // Nhánh phải cực Nam S (Xanh)
      const sGeom = new THREE.BoxGeometry(0.35, 1.4, 0.4);
      const sMat = new THREE.MeshStandardMaterial({ color: 0x2563eb });
      const sPole = new THREE.Mesh(sGeom, sMat);
      sPole.position.set(0.8, 0, 0);
      group.add(sPole);

      // Đáy nối chữ U
      const bottomGeom = new THREE.BoxGeometry(1.95, 0.35, 0.4);
      const bottomMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
      const bottom = new THREE.Mesh(bottomGeom, bottomMat);
      bottom.position.set(0, -0.7, 0);
      group.add(bottom);

      // Các đường sức từ (Magnetic field lines từ N sang S)
      for (let i = -2; i <= 2; i++) {
        const yOffset = i * 0.25;
        group.add(createBond(new THREE.Vector3(-0.6, yOffset, 0), new THREE.Vector3(0.6, yOffset, 0), 0.02, 0x10b981));
      }

      return group;
    },
  },
];

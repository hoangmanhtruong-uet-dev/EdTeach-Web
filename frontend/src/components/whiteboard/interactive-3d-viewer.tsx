"use client";
import { useToast } from "@/context/toast-context";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  RotateCcw,
  Camera,
  Play,
  Pause,
  Layers,
  Box,
  Eye,
  Check,
  Upload,
  Sparkles,
} from "lucide-react";
import { Model3DItem } from "@/data/models-3d";

interface Interactive3DViewerProps {
  modelItem: Model3DItem | null;
  customFileBuffer?: ArrayBuffer | null;
  customFileName?: string;
  onSnapshotToCanvas?: (snapshot: { dataUrl: string; modelName: string; subject: string }) => void;
}

export function Interactive3DViewer({
  modelItem,
  customFileBuffer,
  customFileName,
  onSnapshotToCanvas,
}: Interactive3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentMeshRef = useRef<THREE.Object3D | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // States
  const [viewMode, setViewMode] = useState<"solid" | "wireframe" | "xray">("solid");
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [snapshotSuccess, setSnapshotSuccess] = useState<boolean>(false);
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(false);

  // Khởi tạo Three.js Scene, Camera, Renderer và OrbitControls một lần duy nhất
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    const initialCamPos = modelItem?.cameraPosition || [3, 2.2, 3.5];
    camera.position.set(initialCamPos[0], initialCamPos[1], initialCamPos[2]);
    cameraRef.current = camera;

    // 3. Renderer (alpha: true để ảnh chụp màn hình trong suốt 100% không nền)
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true, // Bắt buộc để canvas.toDataURL() không bị đen
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Trong suốt
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = isAutoRotate;
    controls.autoRotateSpeed = 2.0;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x93c5fd, 1.0);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // 6. Animation Render Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 7. Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Cập nhật Auto-rotate khi state thay đổi
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotate;
    }
  }, [isAutoRotate]);

  // Nạp mô hình 3D (từ Model3DItem hoặc tệp custom GLTF/GLB)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Dọn dẹp mô hình cũ
    if (currentMeshRef.current) {
      scene.remove(currentMeshRef.current);
      currentMeshRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else if (m.material) {
            m.material.dispose();
          }
        }
      });
      currentMeshRef.current = null;
    }

    // Trường hợp 1: Tệp GLB / GLTF tùy chỉnh do Thầy Cô upload
    if (customFileBuffer) {
      setIsLoadingModel(true);
      const loader = new GLTFLoader();
      loader.parse(
        customFileBuffer,
        "",
        (gltf) => {
          const root = gltf.scene;
          // Tự động căn giữa và co giãn vật thể vừa vặn khung nhìn
          const box = new THREE.Box3().setFromObject(root);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const scale = 2.4 / maxDim;

          root.scale.setScalar(scale);
          root.position.sub(center.multiplyScalar(scale));

          scene.add(root);
          currentMeshRef.current = root;
          setIsLoadingModel(false);
          applyViewMode(root, viewMode);
        },
        (error) => {
          console.error("Lỗi nạp tệp GLTF:", error);
          setIsLoadingModel(false);
          showToast("Không thể đọc tệp 3D này. Vui lòng kiểm tra định dạng .glb hoặc .gltf!", "error");
        }
      );
      return;
    }

    // Trường hợp 2: Mô hình mẫu chuẩn GDPT
    if (modelItem) {
      const mesh = modelItem.createMesh();
      scene.add(mesh);
      currentMeshRef.current = mesh;

      if (cameraRef.current && controlsRef.current) {
        const camPos = modelItem.cameraPosition || [3, 2.2, 3.5];
        cameraRef.current.position.set(camPos[0], camPos[1], camPos[2]);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }

      applyViewMode(mesh, viewMode);
    }
  }, [modelItem, customFileBuffer]);

  // Áp dụng chế độ hiển thị: Solid, Wireframe, X-ray
  const applyViewMode = (object: THREE.Object3D, mode: "solid" | "wireframe" | "xray") => {
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        if (m.material) {
          const materials = Array.isArray(m.material) ? m.material : [m.material];
          materials.forEach((mat: any) => {
            if (mode === "wireframe") {
              mat.wireframe = true;
              mat.transparent = false;
              mat.opacity = 1.0;
            } else if (mode === "xray") {
              mat.wireframe = false;
              mat.transparent = true;
              mat.opacity = 0.28;
            } else {
              // Solid
              mat.wireframe = false;
              mat.transparent = mat._origTransparent ?? (mat.opacity < 0.9);
              mat.opacity = mat._origOpacity ?? 0.85;
            }
          });
        }
      }
    });
  };

  const handleSetViewMode = (mode: "solid" | "wireframe" | "xray") => {
    setViewMode(mode);
    if (currentMeshRef.current) {
      applyViewMode(currentMeshRef.current, mode);
    }
  };

  // Đổi góc nhìn máy quay chuẩn
  const setCameraView = (type: "front" | "top" | "perspective") => {
    if (!cameraRef.current || !controlsRef.current) return;
    if (type === "front") {
      cameraRef.current.position.set(0, 0, 4.2);
    } else if (type === "top") {
      cameraRef.current.position.set(0, 4.5, 0.01);
    } else {
      const p = modelItem?.cameraPosition || [3, 2.2, 3.5];
      cameraRef.current.position.set(p[0], p[1], p[2]);
    }
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  // Chụp góc nhìn 3D dán vào Bảng vẽ
  const handleCaptureSnapshot = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera || !onSnapshotToCanvas) return;

    // Ép render một frame trong suốt
    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL("image/png");

    const name = customFileName || modelItem?.nameVi || "Mô hình 3D";
    const sub = modelItem?.subject || "math";

    onSnapshotToCanvas({
      dataUrl,
      modelName: name,
      subject: sub,
    });

    setSnapshotSuccess(true);
    setTimeout(() => setSnapshotSuccess(false), 2400);
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-slate-950 relative overflow-hidden select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Indicator */}
      {isLoadingModel && (
        <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center gap-2 text-white text-xs font-semibold">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Đang tải mô hình 3D...</span>
        </div>
      )}

      {/* Tên mô hình & Mô tả sư phạm trên đầu canvas */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 text-white max-w-[70%] shadow-lg">
          <h3 className="text-xs font-bold flex items-center gap-1.5 text-sky-400">
            <Box className="w-3.5 h-3.5 text-sky-400" />
            <span>{customFileName ? `Tệp 3D: ${customFileName}` : modelItem?.nameVi}</span>
          </h3>
          {modelItem?.descriptionVi && (
            <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">{modelItem.descriptionVi}</p>
          )}
        </div>

        {/* Nút chụp góc nhìn dán lên bảng */}
        <button
          onClick={handleCaptureSnapshot}
          className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition cursor-pointer active:scale-95 shrink-0"
          title="Chụp góc nhìn 3D hiện tại nền trong suốt đưa thẳng vào bảng vẽ để viết lời giải"
        >
          {snapshotSuccess ? <Check className="w-4 h-4 text-white" /> : <Camera className="w-4 h-4 text-white" />}
          <span>{snapshotSuccess ? "Đã dán vào Bảng!" : "Chụp dán lên Bảng"}</span>
        </button>
      </div>

      {/* Thanh công cụ Sư phạm dưới đáy Canvas */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Nhóm điều khiển chế độ hiển thị & Camera */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1 rounded-xl shadow-lg text-xs">
          {/* Solid */}
          <button
            onClick={() => handleSetViewMode("solid")}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              viewMode === "solid" ? "bg-sky-600 text-white font-bold" : "text-slate-400 hover:text-white"
            }`}
            title="Khối đặc đổ bóng"
          >
            Khối đặc
          </button>

          {/* Wireframe */}
          <button
            onClick={() => handleSetViewMode("wireframe")}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              viewMode === "wireframe" ? "bg-sky-600 text-white font-bold" : "text-slate-400 hover:text-white"
            }`}
            title="Khung dây đường viền"
          >
            Khung dây
          </button>

          {/* X-Ray */}
          <button
            onClick={() => handleSetViewMode("xray")}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              viewMode === "xray" ? "bg-sky-600 text-white font-bold" : "text-slate-400 hover:text-white"
            }`}
            title="Bán trong suốt thấy cấu trúc bên trong"
          >
            X-Ray
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Góc nhìn nhanh */}
          <button
            onClick={() => setCameraView("front")}
            className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white text-[11px]"
            title="Góc nhìn chính diện"
          >
            Mặt trước
          </button>
          <button
            onClick={() => setCameraView("top")}
            className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white text-[11px]"
            title="Góc nhìn từ trên xuống"
          >
            Mặt trên
          </button>
          <button
            onClick={() => setCameraView("perspective")}
            className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white text-[11px]"
            title="Góc nhìn phối cảnh chuẩn"
          >
            Phối cảnh
          </button>
        </div>

        {/* Nút bật/tắt Tự động quay 360° */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1 rounded-xl shadow-lg text-xs">
          <button
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
              isAutoRotate ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-slate-400 hover:text-white"
            }`}
            title="Tự động quay 360 độ để trình chiếu máy chiếu"
          >
            {isAutoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoRotate ? "Tự quay 360°" : "Dừng quay"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

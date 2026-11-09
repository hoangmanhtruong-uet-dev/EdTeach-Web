"use client";

import React, { useState, useEffect, useRef, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  Zap,
  ZapOff,
  SwitchCamera,
  Wifi,
  WifiOff,
  Layers,
  X,
  RefreshCw,
  AlertCircle,
  Clock,
  Trash2,
  CheckCircle2,
  ChevronUp,
} from "lucide-react";

interface ScanPageProps {
  params: Promise<{ token: string }>;
}

interface QueuedSheet {
  id: string; // clientSubmissionId
  imageBase64: string;
  timestamp: number;
  status: "queued" | "uploading" | "graded" | "needs_review" | "failed";
  retryCount: number;
  detectedSbd?: string;
  detectedName?: string;
  score?: number;
  error?: string;
}

const DB_NAME = "edteach_scan_db";
const STORE_NAME = "queued_sheets";

// 1. IndexedDB Helper (Vanilla)
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not supported"));
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveSheetToIDB(sheet: QueuedSheet): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(sheet);
  } catch (err) {
    console.warn("IDB Save error:", err);
  }
}

async function updateSheetInIDB(sheet: QueuedSheet): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(sheet);
  } catch (err) {
    console.warn("IDB Update error:", err);
  }
}

async function removeSheetFromIDB(id: string): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
  } catch (err) {
    console.warn("IDB Delete error:", err);
  }
}

async function loadSheetsFromIDB(): Promise<QueuedSheet[]> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve((req.result || []) as QueuedSheet[]);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export default function MobileScanPage({ params }: ScanPageProps) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;
  const router = useRouter();

  // Session states
  const [sessionData, setSessionData] = useState<any>(null);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Network & Wake Lock
  const [isOnline, setIsOnline] = useState(true);
  const wakeLockRef = useRef<any>(null);

  // Camera states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Auto-capture & Vision states
  const [isAutoCaptureEnabled, setIsAutoCaptureEnabled] = useState(true);
  const [isPaperStill, setIsPaperStill] = useState(false);
  const [stillProgress, setStillProgress] = useState(0); // 0 to 100%
  const lastFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  const stillStartTimeRef = useRef<number | null>(null);
  const lastCaptureTimeRef = useRef<number>(0);

  // Feedback states
  const [screenFlash, setScreenFlash] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [recentResultHud, setRecentResultHud] = useState<{
    sbd: string;
    score: number;
    status: string;
  } | null>(null);

  // Queue states
  const [capturedSheets, setCapturedSheets] = useState<QueuedSheet[]>([]);
  const [showQueueDrawer, setShowQueueDrawer] = useState(false);
  const isProcessingQueueRef = useRef(false);

  // Device ID for heartbeat
  const deviceIdRef = useRef<string>("");

  useEffect(() => {
    let savedDeviceId = localStorage.getItem("edteach_device_id");
    if (!savedDeviceId) {
      savedDeviceId = "dev_" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("edteach_device_id", savedDeviceId);
    }
    deviceIdRef.current = savedDeviceId;
  }, []);

  // Synthetic shutter audio
  const playShutterSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);

  // 1. Fetch Session Info
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/grading/continuous-session?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (res.ok && data.success && data.session) {
        setSessionData(data.session);
        setIsSessionLoaded(true);
        if (data.session.status === "ended") {
          setSessionError("Phiên chấm này đã được kết thúc bởi giáo viên.");
        }
      } else {
        // Fallback to legacy remote session check
        const legacyRes = await fetch(`/api/grading/remote-session/connect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, pin: token }),
        });
        const legacyData = await legacyRes.json();
        if (legacyRes.ok && legacyData.success && legacyData.session) {
          setSessionData({
            id: legacyData.session.sessionId || legacyData.session.token,
            sessionToken: legacyData.session.token,
            name: legacyData.session.sessionName,
            status: "active",
          });
          setIsSessionLoaded(true);
        } else {
          setSessionError(data.error || "Không tìm thấy phiên chấm hoặc phiên đã hết hạn.");
        }
      }
    } catch (e: any) {
      setSessionError("Lỗi kết nối máy chủ: " + e.message);
    }
  }, [token]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // 2. Heartbeat to Desktop
  useEffect(() => {
    if (!sessionData || sessionData.status === "ended") return;

    const sendHeartbeat = async () => {
      try {
        await fetch("/api/grading/continuous-session/device-heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionData.id,
            sessionToken: token,
            deviceId: deviceIdRef.current,
            action: "ping",
          }),
        });
      } catch {
        // silent
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 15000);
    return () => clearInterval(interval);
  }, [sessionData, token]);

  // 3. Screen Wake Lock API
  useEffect(() => {
    const requestWakeLock = async () => {
      if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        } catch {
          // Wake lock rejected (battery saver, etc.)
        }
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  // 4. Online / Offline Listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerQueueProcessing();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 5. Load Initial IDB Queue
  useEffect(() => {
    loadSheetsFromIDB().then((sheets) => {
      if (sheets.length > 0) {
        setCapturedSheets(sheets);
        triggerQueueProcessing();
      }
    });
  }, []);

  // 6. Camera Stream Initialization
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Check flashlight (torch) capability
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities?.() as any) || {};
        setHasTorch(Boolean(capabilities.torch));
      }
    } catch (err: any) {
      setCameraError("Không thể truy cập camera. Vui lòng cho phép cấp quyền trên trình duyệt.");
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        await (track as any).applyConstraints({
          advanced: [{ torch: !isTorchOn }],
        });
        setIsTorchOn(!isTorchOn);
      } catch (e) {
        console.warn("Torch error:", e);
      }
    }
  };

  // Toggle Camera Facing
  const toggleFacing = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // 7. Background Queue Worker (Compress & Upload)
  const triggerQueueProcessing = useCallback(async () => {
    if (isProcessingQueueRef.current || !navigator.onLine) return;
    isProcessingQueueRef.current = true;

    try {
      const dbSheets = await loadSheetsFromIDB();
      const pendingSheets = dbSheets.filter(
        (s) => s.status === "queued" || s.status === "uploading" || s.status === "failed"
      );

      for (const item of pendingSheets) {
        if (!navigator.onLine) break;

        // Mark uploading
        item.status = "uploading";
        await updateSheetInIDB(item);
        setCapturedSheets((prev) =>
          prev.map((s) => (s.id === item.id ? { ...s, status: "uploading" } : s))
        );

        try {
          // Upload to continuous session API
          const targetSessionId = sessionData?.id || token;
          const res = await fetch(
            `/api/grading/continuous-session/${encodeURIComponent(targetSessionId)}/submissions`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                clientSubmissionId: item.id,
                imageBase64: item.imageBase64,
              }),
            }
          );

          const data = await res.json();
          if (res.ok && data.success && data.submission) {
            const sub = data.submission;
            item.status = sub.status === "needs_review" ? "needs_review" : "graded";
            item.detectedSbd = sub.detectedSbd;
            item.detectedName = sub.detectedName;
            item.score = sub.score;
            await updateSheetInIDB(item);

            setCapturedSheets((prev) =>
              prev.map((s) =>
                s.id === item.id
                  ? {
                      ...s,
                      status: item.status,
                      detectedSbd: sub.detectedSbd,
                      detectedName: sub.detectedName,
                      score: sub.score,
                    }
                  : s
              )
            );

            // Trigger floating HUD for 1.5s
            setRecentResultHud({
              sbd: sub.detectedSbd || "Bài thi",
              score: sub.score,
              status: sub.status,
            });
            setTimeout(() => {
              setRecentResultHud(null);
            }, 1500);
          } else {
            throw new Error(data.error || "Lỗi phản hồi máy chủ");
          }
        } catch (uploadErr: any) {
          item.status = "failed";
          item.retryCount = (item.retryCount || 0) + 1;
          item.error = uploadErr.message;
          await updateSheetInIDB(item);

          setCapturedSheets((prev) =>
            prev.map((s) =>
              s.id === item.id ? { ...s, status: "failed", error: uploadErr.message } : s
            )
          );
        }
      }
    } finally {
      isProcessingQueueRef.current = false;
    }
  }, [sessionData, token]);

  // 8. Capture Paper Function (Non-blocking)
  const handleCapturePaper = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    // Throttle captures: minimum 1.2s between captures
    const now = Date.now();
    if (now - lastCaptureTimeRef.current < 1200) return;
    lastCaptureTimeRef.current = now;

    // Visual & Haptic feedback
    playShutterSound();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(50);
      } catch {
        // silent
      }
    }
    setScreenFlash(true);
    setShowCheckmark(true);
    setTimeout(() => setScreenFlash(false), 120);
    setTimeout(() => setShowCheckmark(false), 700);

    // Draw full frame to offscreen canvas and compress
    const canvas = document.createElement("canvas");
    const maxDim = 1600;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const compressedBase64 = canvas.toDataURL("image/jpeg", 0.82);

    const clientSubmissionId = "csub_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
    const newSheet: QueuedSheet = {
      id: clientSubmissionId,
      imageBase64: compressedBase64,
      timestamp: Date.now(),
      status: "queued",
      retryCount: 0,
    };

    // Save to IDB immediately to prevent loss
    saveSheetToIDB(newSheet);

    // Prepend to React state
    setCapturedSheets((prev) => [newSheet, ...prev]);

    // Reset auto-capture timer
    stillStartTimeRef.current = null;
    setIsPaperStill(false);
    setStillProgress(0);

    // Trigger upload in background
    setTimeout(() => triggerQueueProcessing(), 50);
  }, [playShutterSound, triggerQueueProcessing]);

  // 9. Frame-by-Frame Auto-capture Engine (Detect stillness & sharpness)
  useEffect(() => {
    if (!isAutoCaptureEnabled) return;

    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = 160;
    sampleCanvas.height = 120;
    const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });

    let animationFrameId: number;

    const checkFrame = () => {
      const video = videoRef.current;
      if (
        video &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        sampleCtx &&
        video.videoWidth > 0
      ) {
        sampleCtx.drawImage(video, 0, 0, 160, 120);
        const frame = sampleCtx.getImageData(0, 0, 160, 120);
        const data = frame.data;

        // Calculate motion diff against previous frame
        let motionDiff = 0;
        let sharpnessScore = 0;

        if (lastFrameDataRef.current) {
          const prev = lastFrameDataRef.current;
          let diffSum = 0;
          for (let i = 0; i < data.length; i += 4) {
            // Grayscale diff
            const d = Math.abs(data[i] - prev[i]);
            diffSum += d;

            // Simple edge gradient sharpness
            if (i > 4) {
              sharpnessScore += Math.abs(data[i] - data[i - 4]);
            }
          }
          motionDiff = diffSum / (data.length / 4);
        }

        lastFrameDataRef.current = new Uint8ClampedArray(data);

        // Stillness thresholds: motionDiff < 6.5
        const isStill = motionDiff < 6.5 && sharpnessScore > 150000;
        const now = Date.now();

        if (isStill) {
          if (!stillStartTimeRef.current) {
            stillStartTimeRef.current = now;
          }
          const elapsed = now - stillStartTimeRef.current;
          const progress = Math.min(100, Math.round((elapsed / 800) * 100));
          setIsPaperStill(true);
          setStillProgress(progress);

          // Threshold: held still for >= 0.8s (800ms) and last capture was > 2.5s ago
          if (elapsed >= 800 && now - lastCaptureTimeRef.current > 2500) {
            handleCapturePaper();
          }
        } else {
          stillStartTimeRef.current = null;
          setIsPaperStill(false);
          setStillProgress(0);
        }
      }

      animationFrameId = requestAnimationFrame(checkFrame);
    };

    animationFrameId = requestAnimationFrame(checkFrame);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isAutoCaptureEnabled, handleCapturePaper]);

  // Remove sheet from queue
  const handleDeleteSheet = async (id: string) => {
    await removeSheetFromIDB(id);
    setCapturedSheets((prev) => prev.filter((s) => s.id !== id));
  };

  const gradedCount = capturedSheets.filter(
    (s) => s.status === "graded" || s.status === "needs_review"
  ).length;

  return (
    <div className="fixed inset-0 bg-neutral-950 text-white flex flex-col z-50 overflow-hidden select-none font-sans">
      {/* Flash overlay upon capture */}
      {screenFlash && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150 opacity-90" />
      )}

      {/* Big Green Checkmark on capture */}
      {showCheckmark && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none animate-in zoom-in-75 duration-200">
          <div className="w-24 h-24 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-md">
            <Check className="w-14 h-14 stroke-[3.5]" />
          </div>
        </div>
      )}

      {/* Floating Result HUD Toast (Slides in for 1.5s then retracts) */}
      {recentResultHud && (
        <div className="absolute top-16 inset-x-4 z-40 flex justify-center pointer-events-none animate-in slide-in-from-top-4 duration-200">
          <div
            className={`px-5 py-2.5 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center gap-3 ${
              recentResultHud.status === "needs_review"
                ? "bg-amber-900/90 border-amber-500/50 text-amber-200"
                : "bg-emerald-900/90 border-emerald-500/50 text-emerald-100"
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs font-semibold">
              <span className="font-bold text-white tracking-wide">
                {recentResultHud.sbd}
              </span>
              :{" "}
              <span className="text-sm font-black text-emerald-300">
                {recentResultHud.score} điểm
              </span>
              {recentResultHud.status === "needs_review" && (
                <span className="ml-2 text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded font-medium">
                  Cần xem lại
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="relative z-30 flex items-center justify-between px-4 py-3 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-neutral-100 tracking-tight truncate max-w-[180px]">
              {sessionData?.name || "Phiên Chấm Liên Tục"}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-medium">
              <span className="inline-flex items-center gap-1">
                {isOnline ? (
                  <Wifi className="w-3 h-3 text-emerald-400" />
                ) : (
                  <WifiOff className="w-3 h-3 text-rose-400" />
                )}
                {isOnline ? "Đã nối máy tính" : "Mất mạng (Đã lưu bộ nhớ)"}
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">
                {capturedSheets.length} bài
              </span>
            </div>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2">
          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-xl border transition active:scale-95 ${
                isTorchOn
                  ? "bg-amber-400 text-neutral-950 border-amber-300 shadow-lg shadow-amber-400/20"
                  : "bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white"
              }`}
              title="Bật/Tắt đèn Flash"
              aria-label="Bật/Tắt đèn Flash"
            >
              {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={toggleFacing}
            className="p-2 rounded-xl bg-neutral-800 text-neutral-300 border border-neutral-700 hover:text-white transition active:scale-95"
            title="Đổi camera trước/sau"
            aria-label="Đổi camera"
          >
            <SwitchCamera className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Viewfinder (Camera Feed & Guidelines) */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        {cameraError ? (
          <div className="p-6 text-center space-y-4 max-w-xs">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <p className="text-xs text-rose-300 font-medium">{cameraError}</p>
            <button
              onClick={() => startCamera()}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition"
            >
              Cấp quyền lại
            </button>
          </div>
        ) : (
          <>
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Darkened Mask with Framing Guide Cutout */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              {/* Rectangular A4-ratio Frame */}
              <div
                className={`relative w-full max-w-sm aspect-[1/1.4] rounded-2xl transition-all duration-300 flex flex-col justify-between p-3 ${
                  isPaperStill && stillProgress > 60
                    ? "border-2 border-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.6)]"
                    : "border-2 border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
                }`}
              >
                {/* 4 Corner Accents */}
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <div className="w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                </div>

                {/* Laser scan line if still */}
                {isPaperStill && (
                  <div
                    className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] transition-all"
                    style={{ top: `${stillProgress}%` }}
                  />
                )}

                {/* Framing Helper Text */}
                <div className="text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-md transition ${
                      isPaperStill
                        ? "bg-emerald-500/80 text-white"
                        : "bg-black/60 text-neutral-300 border border-white/20"
                    }`}
                  >
                    {isPaperStill ? `Giữ yên phiếu... ${stillProgress}%` : "Căn tờ phiếu vào khung"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <div className="w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="relative z-30 px-6 py-4 bg-neutral-900/90 backdrop-blur-md border-t border-neutral-800 flex items-center justify-between">
        {/* Counter & Drawer Opener */}
        <button
          onClick={() => setShowQueueDrawer(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 border border-neutral-700 transition active:scale-95"
          title="Mở danh sách bài đã chụp"
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <div className="text-left">
            <span className="block font-bold leading-none">{capturedSheets.length} bài</span>
            <span className="text-[10px] text-neutral-400">Xem danh sách</span>
          </div>
          <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
        </button>

        {/* Large Shutter Button */}
        <button
          onClick={handleCapturePaper}
          className="relative w-18 h-18 rounded-full border-4 border-white p-1 flex items-center justify-center transition active:scale-90 shadow-2xl"
          title="Bấm chụp thủ công"
          aria-label="Chụp phiếu"
        >
          <div className="w-full h-full rounded-full bg-emerald-500 hover:bg-emerald-400 transition" />
        </button>

        {/* Auto-capture Switch */}
        <button
          onClick={() => setIsAutoCaptureEnabled(!isAutoCaptureEnabled)}
          className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-2xl text-[10px] font-bold border transition ${
            isAutoCaptureEnabled
              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
              : "bg-neutral-800 border-neutral-700 text-neutral-400"
          }`}
          title="Bật/Tắt tự động chụp khi giữ yên phiếu"
        >
          <span>Tự động chụp</span>
          <span className="text-[9px] uppercase font-mono tracking-wider">
            {isAutoCaptureEnabled ? "BẬT (0.8s)" : "TẮT"}
          </span>
        </button>
      </div>

      {/* Slide-up Drawer: Danh Sách Bài Đã Chụp */}
      {showQueueDrawer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-neutral-900 border-t border-neutral-800 rounded-t-3xl max-h-[80vh] flex flex-col shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-sm text-neutral-100">
                  Danh sách bài đã chụp ({capturedSheets.length})
                </h2>
              </div>
              <button
                onClick={() => setShowQueueDrawer(false)}
                className="p-1.5 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {capturedSheets.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500">
                  Chưa có bài thi nào được chụp. Thầy/Cô hãy hướng camera vào tờ phiếu để bắt đầu.
                </div>
              ) : (
                capturedSheets.map((sheet, index) => (
                  <div
                    key={sheet.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={sheet.imageBase64}
                          alt={sheet.detectedSbd ? `Ảnh chụp bài thi học sinh SBD ${sheet.detectedSbd}` : "Ảnh chụp bài thi học sinh cần quét điểm"}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div>
                        <div className="font-bold text-neutral-200">
                          Bài #{capturedSheets.length - index}:{" "}
                          <span className="text-emerald-400 font-mono">
                            {sheet.detectedSbd ? `SBD ${sheet.detectedSbd}` : "Đang phân tích SBD"}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          {sheet.score !== undefined ? (
                            <span className="text-emerald-400 font-bold">
                              {sheet.score} điểm • {sheet.detectedName || "Học sinh"}
                            </span>
                          ) : sheet.status === "uploading" ? (
                            <span className="text-cyan-400 flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin" /> Đang tải lên...
                            </span>
                          ) : sheet.status === "failed" ? (
                            <span className="text-rose-400">Chờ kết nối lại để tải</span>
                          ) : (
                            <span className="text-neutral-500">Đã lưu bộ đệm điện thoại</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {sheet.status === "failed" && (
                        <button
                          onClick={() => triggerQueueProcessing()}
                          className="p-2 rounded-xl bg-neutral-800 text-amber-400 hover:text-amber-300"
                          title="Thử tải lại"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSheet(sheet.id)}
                        className="p-2 rounded-xl bg-neutral-800 text-neutral-500 hover:text-rose-400"
                        title="Xóa bài này để chụp lại"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 bg-neutral-950/60">
              <span>Đã lưu offline trong IndexedDB</span>
              <button
                onClick={() => triggerQueueProcessing()}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" /> Đồng bộ ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

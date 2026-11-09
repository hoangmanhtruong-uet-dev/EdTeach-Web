"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  User,
  GraduationCap,
  Bell,
  Shield,
  ShieldCheck,
  Palette,
  Camera,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
  Laptop,
  KeyRound,
  Trash2,
  RotateCcw,
  X,
  Sparkles,
  Copy,
  LogOut,
  Share2,
  FileText,
  Sliders,
  Cpu,
  Phone,
  Building2,
  BookOpen,
  Info,
  Lock,
  ExternalLink,
  Download,
  AlertTriangle,
  Smartphone,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  QrCode,
  FileSpreadsheet,
  FileCode2,
  Globe,
  Cloud,
  Presentation,
  Rows,
  LayoutGrid,
  Monitor,
} from "lucide-react";
import { LatexRenderer } from "@/components/ui/latex-renderer";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { useConfirm } from "@/context/confirm-dialog-context";
import { createClient } from "@/lib/supabase/client";
import {
  getUserPreferences,
  saveUserPreferencesLocal,
  UserPreferences,
  AppearancePreferences,
} from "@/lib/preferences";
import { TeacherVerificationCard } from "@/components/verification/teacher-verification-card";
import { PlanStatusCard } from "./PlanStatusCard";
import { isMaxUser } from "@/lib/payment/plans";
import { AvatarCropModal } from "./AvatarCropModal";
import { ChangeEmailModal } from "./ChangeEmailModal";
import { UnsavedChangesModal } from "./UnsavedChangesModal";
import { ReAuthModal } from "./ReAuthModal";
import { TwoFactorModal } from "./TwoFactorModal";
import { ExportDataModal } from "./ExportDataModal";
import { APP_URL, REFERRAL_BONUS_CREDITS } from "@/lib/constants";

export interface GeneralTabProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  onNavigateToPlan?: () => void;
  onNavigateToPartner?: () => void;
  initialSubTab?: string;
}

const VIETNAM_SCHOOL_SUGGESTIONS = [
  "THPT Chuyên Hà Nội - Amsterdam (Hà Nội)",
  "THPT Chu Văn An (Hà Nội)",
  "THPT Kim Liên (Hà Nội)",
  "THPT Phan Đình Phùng (Hà Nội)",
  "THPT Thăng Long (Hà Nội)",
  "THPT Yên Hòa (Hà Nội)",
  "THPT Chuyên Lê Hồng Phong (TP.HCM)",
  "THPT Chuyên Trần Đại Nghĩa (TP.HCM)",
  "THPT Nguyễn Thị Minh Khai (TP.HCM)",
  "THPT Gia Định (TP.HCM)",
  "THPT Bùi Thị Xuân (TP.HCM)",
  "THPT Chuyên Lam Sơn (Thanh Hóa)",
  "THPT Chuyên Phan Bội Châu (Nghệ An)",
  "THPT Chuyên Quốc Học Huế (Thừa Thiên Huế)",
  "THPT Chuyên Lê Quý Đôn (Đà Nẵng)",
  "THCS Trưng Vương (Hà Nội)",
  "THCS Giảng Võ (Hà Nội)",
  "THCS Lê Quý Đôn (TP.HCM)",
  "Đại học Sư phạm Hà Nội",
  "Đại học Sư phạm TP.HCM",
];

const SUBJECT_OPTIONS = [
  "Toán",
  "Vật lý",
  "Hóa học",
  "Sinh học",
  "Ngữ văn",
  "Tiếng Anh",
  "Lịch sử",
  "Địa lý",
  "GDCD",
  "Tin học",
  "Công nghệ",
  "Khoa học tự nhiên",
  "Khác",
];

const GRADE_LEVEL_OPTIONS = [
  "Tiểu học (Khối 1–5)",
  "THCS (Khối 6–9)",
  "THPT (Khối 10–12)",
  "Luyện thi Đại học / ĐGNL",
  "Khác",
];

interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (newSelected: string[]) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  hint?: string;
  badgeLimit?: number;
}

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  placeholder = "Chọn các mục...",
  icon,
  hint,
  badgeLimit = 3,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const selectAll = () => {
    onChange([...options]);
  };

  const clearAll = () => {
    onChange([]);
  };

  const isAllSelected = options.length > 0 && selected.length === options.length;

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          {icon}
          <span>{label}</span>
          <span className="text-[11px] font-normal text-muted-foreground">
            ({selected.length} đã chọn)
          </span>
        </label>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] text-muted-foreground hover:text-destructive transition cursor-pointer"
          >
            Xóa chọn
          </button>
        )}
      </div>

      {/* Trigger Box */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className={`min-h-[42px] w-full rounded-xl border bg-background px-3 py-2 text-xs transition cursor-pointer flex items-center justify-between gap-2 text-left ${
          isOpen
            ? "border-primary ring-1 ring-primary shadow-xs"
            : "border-border hover:border-primary/50"
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0 py-0.5">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <>
              {selected.slice(0, badgeLimit).map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-xs font-medium"
                >
                  {item}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(item);
                    }}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </span>
                </span>
              ))}
              {selected.length > badgeLimit && (
                <span className="inline-flex items-center rounded-lg bg-muted text-muted-foreground px-2 py-0.5 text-xs font-semibold">
                  +{selected.length - badgeLimit} nữa
                </span>
              )}
            </>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-primary" : "text-muted-foreground"
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-40 rounded-xl border border-border bg-card shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="flex items-center justify-between p-2.5 border-b border-border bg-muted/30">
            <span className="text-[11px] font-medium text-muted-foreground">
              Đã chọn <strong className="text-foreground">{selected.length}</strong> / {options.length} mục
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={isAllSelected ? clearAll : selectAll}
                className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
              >
                {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {options.map((opt) => {
              const isChecked = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleOption(opt)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left border ${
                    isChecked
                      ? "bg-primary/10 text-primary border-primary/30 font-bold"
                      : "bg-background text-foreground border-transparent hover:bg-muted"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                      isChecked
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30 bg-card"
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="truncate">{opt}</span>
                </button>
              );
            })}
          </div>

          <div className="p-2 border-t border-border bg-muted/20 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition cursor-pointer"
            >
              Hoàn tất
            </button>
          </div>
        </div>
      )}

      {hint && <p className="text-[11px] text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  );
}

export function GeneralTab({
  activeSection = "profile",
  onSectionChange,
  onNavigateToPlan,
  onNavigateToPartner,
  initialSubTab,
}: GeneralTabProps) {
  const { user, profile, session, refreshProfile, updateProfileLocal } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const supabase = createClient();
  const isMax = isMaxUser(profile) || isMaxUser(user);

  // Determine current active subtab (supporting "verification" alias to "ekyc")
  const currentSubTab =
    activeSection === "verification" ? "ekyc" : activeSection || initialSubTab || "profile";

  // Check if "Nghiệp vụ & Soạn đề" has been visited once to hide badge "Mới" (A10)
  const [hasSeenTeachingBadge, setHasSeenTeachingBadge] = useState(true);
  useEffect(() => {
    try {
      const seen = localStorage.getItem("edutest_seen_teaching_tab");
      setHasSeenTeachingBadge(seen === "true");
    } catch {
      setHasSeenTeachingBadge(true);
    }
  }, []);

  const handleSubTabClick = (subTabId: string) => {
    if (subTabId === "teaching" && !hasSeenTeachingBadge) {
      try {
        localStorage.setItem("edutest_seen_teaching_tab", "true");
      } catch {
        // ignore
      }
      setHasSeenTeachingBadge(true);
    }

    // Check for unsaved changes in profile before navigating
    if (currentSubTab === "profile" && isProfileDirty) {
      setPendingSubTab(subTabId);
      setShowUnsavedModal(true);
      return;
    }

    onSectionChange?.(subTabId);
  };

  // ================= 1. PROFILE STATE & VALIDATION (A6, A7) =================
  const [name, setName] = useState("");
  const [initialName, setInitialName] = useState("");
  const [phone, setPhone] = useState("");
  const [initialPhone, setInitialPhone] = useState("");
  const [school, setSchool] = useState("");
  const [initialSchool, setInitialSchool] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [initialSubjects, setInitialSubjects] = useState<string[]>([]);
  const [selectedGradeLevels, setSelectedGradeLevels] = useState<string[]>(["THPT (Khối 10–12)"]);
  const [initialGradeLevels, setInitialGradeLevels] = useState<string[]>(["THPT (Khối 10–12)"]);

  const [touched, setTouched] = useState<{ name?: boolean; phone?: boolean; school?: boolean }>({});
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string | null;
    phone?: string | null;
    school?: string | null;
  }>({});

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Unsaved changes & modal protection (A2)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingSubTab, setPendingSubTab] = useState<string | null>(null);

  // Validation rules (A6)
  const validateName = (val: string): string | null => {
    const trimmed = val.trim();
    if (trimmed.length < 2 || trimmed.length > 60) {
      return "Vui lòng nhập họ và tên (2–60 ký tự)";
    }
    return null;
  };

  const validatePhone = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return null; // optional
    const cleaned = trimmed.replace(/[\s.-]/g, "");
    const vnPhoneRegex = /^(0[1-9][0-9]{8}|\+84[1-9][0-9]{8})$/;
    if (!vnPhoneRegex.test(cleaned)) {
      return "Số điện thoại chưa đúng. Ví dụ: 0912345678";
    }
    return null;
  };

  const validateSchool = (val: string): string | null => {
    const trimmed = val.trim();
    if (trimmed.length > 100) {
      return "Tối đa 100 ký tự";
    }
    return null;
  };

  // Run validation on blur
  const handleBlur = (field: "name" | "phone" | "school") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    let err: string | null = null;
    if (field === "name") err = validateName(name);
    if (field === "phone") err = validatePhone(phone);
    if (field === "school") err = validateSchool(school);
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  };

  // Check if profile form is dirty (A2)
  const isProfileDirty =
    name.trim() !== initialName.trim() ||
    phone.trim() !== initialPhone.trim() ||
    school.trim() !== initialSchool.trim() ||
    JSON.stringify([...selectedGradeLevels].sort()) !== JSON.stringify([...initialGradeLevels].sort()) ||
    JSON.stringify([...selectedSubjects].sort()) !== JSON.stringify([...initialSubjects].sort());

  const hasFormErrors = Boolean(
    validateName(name) || validatePhone(phone) || validateSchool(school)
  );

  // Beforeunload listener when dirty (A2)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProfileDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isProfileDirty]);

  // Load user data into profile state
  useEffect(() => {
    if (profile) {
      const pName = profile.name || profile.full_name || "";
      const pPhone = (profile as any).phone || "";
      const pSchool = profile.school || "";

      setName(pName);
      setInitialName(pName);
      setPhone(pPhone);
      setInitialPhone(pPhone);
      setSchool(pSchool);
      setInitialSchool(pSchool);

      const prefs = getUserPreferences(profile);
      const subjects = prefs.teaching.subjects || [prefs.teaching.defaultSubject || "Toán"];
      
      let gradeLevels: string[] = [];
      if (Array.isArray((prefs.teaching as any).gradeLevels) && (prefs.teaching as any).gradeLevels.length > 0) {
        gradeLevels = (prefs.teaching as any).gradeLevels;
      } else if (prefs.teaching.gradeLevel) {
        gradeLevels = [prefs.teaching.gradeLevel];
      } else {
        gradeLevels = ["THPT (Khối 10–12)"];
      }

      setSelectedSubjects(subjects);
      setInitialSubjects(subjects);
      setSelectedGradeLevels(gradeLevels);
      setInitialGradeLevels(gradeLevels);
    }
  }, [profile]);

  // ================= 2. AVATAR STATE (A5) =================
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [isDragOverAvatar, setIsDragOverAvatar] = useState(false);

  useEffect(() => {
    setAvatarImgError(false);
  }, [profile?.avatar_url]);

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "GV";

  const handleAvatarFileSelected = (file: File) => {
    setAvatarError(null);
    if (!file.type.startsWith("image/")) {
      setAvatarError("Vui lòng chọn tệp hình ảnh (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmAvatarCrop = async ({ blob, dataUrl }: { blob: Blob; dataUrl: string }) => {
    if (!user) return;
    setCropImageSrc(null);
    setUploadingAvatar(true);
    setAvatarError(null);

    try {
      // Gửi file qua API Route /api/user/avatar (xử lý trên server bằng Admin Client, triệt tiêu 100% lỗi RLS)
      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");
      if (dataUrl) {
        formData.append("dataUrl", dataUrl);
      }

      const { data: { session: curSession } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (curSession?.access_token) {
        headers["Authorization"] = `Bearer ${curSession.access_token}`;
      }

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        headers,
        body: formData,
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Không thể cập nhật ảnh đại diện.");
      }

      if (result.avatar_url) {
        updateProfileLocal({ avatar_url: result.avatar_url });
      }
      await refreshProfile();
      showToast(result.message || "Cập nhật ảnh đại diện thành công!", "success");
    } catch (err: any) {
      setAvatarError(err.message || "Không thể cập nhật ảnh đại diện.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user || !profile?.avatar_url) return;
    const isOk = await confirm({
      title: "Xóa ảnh đại diện",
      message: "Thầy Cô có chắc chắn muốn xóa ảnh đại diện và quay về chữ cái đầu tên không?",
      confirmText: "Xóa ảnh",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (!isOk) return;

    setUploadingAvatar(true);
    setAvatarError(null);
    try {
      const { data: { session: curSession } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (curSession?.access_token) {
        headers["Authorization"] = `Bearer ${curSession.access_token}`;
      }

      const res = await fetch("/api/user/avatar", {
        method: "DELETE",
        headers,
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Không thể xóa ảnh.");
      }

      updateProfileLocal({ avatar_url: null });
      await refreshProfile();
      showToast(result.message || "Đã xóa ảnh đại diện.", "info");
    } catch (err: any) {
      setAvatarError(err.message || "Không thể xóa ảnh.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ================= 3. SAVE PROFILE HANDLER (A2, A6, A7) =================
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;

    // Validate all fields
    const nameErr = validateName(name);
    const phoneErr = validatePhone(phone);
    const schoolErr = validateSchool(school);

    setTouched({ name: true, phone: true, school: true });
    setFieldErrors({ name: nameErr, phone: phoneErr, school: schoolErr });

    if (nameErr || phoneErr || schoolErr) {
      showToast("Vui lòng kiểm tra lại các trường thông tin chưa hợp lệ.", "error");
      return;
    }

    setSavingProfile(true);
    setProfileSuccessMsg(null);

    try {
      const cleanPhone = phone.trim() ? phone.replace(/[\s.-]/g, "") : null;
      const cleanName = name.trim();
      const cleanSchool = school.trim() || null;

      // Update preferences with teaching defaults
      const currentPrefs = getUserPreferences(profile);
      const updatedPreferences: UserPreferences = {
        ...currentPrefs,
        teaching: {
          ...currentPrefs.teaching,
          school: cleanSchool || "",
          subjects: selectedSubjects,
          gradeLevel: selectedGradeLevels[0] || "THPT (Khối 10–12)",
          gradeLevels: selectedGradeLevels,
          defaultSubject: selectedSubjects[0] || currentPrefs.teaching.defaultSubject || "Toán",
        },
      };

      saveUserPreferencesLocal(updatedPreferences);

      const payload: any = {
        name: cleanName,
        school: cleanSchool,
        preferences: updatedPreferences,
        updated_at: new Date().toISOString(),
      };

      if (cleanPhone) {
        payload.phone = cleanPhone;
      } else {
        payload.phone = null;
      }

      const { data: { session: curSession } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (curSession?.access_token) {
        headers["Authorization"] = `Bearer ${curSession.access_token}`;
      }

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể lưu hồ sơ vào máy chủ.");
      }

      const updated = data.profile || {
        ...profile,
        name: cleanName,
        school: cleanSchool,
        phone: cleanPhone,
        preferences: updatedPreferences as any,
      };

      updateProfileLocal(updated);

      // Update initial values to reset dirty state
      setInitialName(cleanName);
      setInitialPhone(phone.trim());
      setInitialSchool(school.trim());
      setInitialSubjects([...selectedSubjects]);
      setInitialGradeLevels([...selectedGradeLevels]);

      await refreshProfile();
      showToast("Đã lưu hồ sơ thành công!", "success");
      setProfileSuccessMsg("Đã lưu hồ sơ thành công!");
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: any) {
      showToast(`Lỗi: ${err.message || "Không thể lưu hồ sơ"}`, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDiscardProfileChanges = () => {
    setName(initialName);
    setPhone(initialPhone);
    setSchool(initialSchool);
    setSelectedSubjects([...initialSubjects]);
    setSelectedGradeLevels([...initialGradeLevels]);
    setFieldErrors({});
    setTouched({});
    showToast("Đã hủy các thay đổi chưa lưu.", "info");
  };

  // Change Email Modal (A4, A12)
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);

  // ================= 4. TEACHING & EXAM PREFERENCES (A1) =================
  const [department, setDepartment] = useState("");
  const [schoolHeader, setSchoolHeader] = useState("");
  const [teacherTitle, setTeacherTitle] = useState("");
  const [defaultSubject, setDefaultSubject] = useState("Toán");
  const [defaultGrade, setDefaultGrade] = useState("12");
  const [defaultDuration, setDefaultDuration] = useState(45);

  const [docxFont, setDocxFont] = useState<"Times New Roman" | "Arial">("Times New Roman");
  const [docxFontSize, setDocxFontSize] = useState<12 | 13>(13);
  const [docxEnableWatermark, setDocxEnableWatermark] = useState(false);
  const [docxWatermarkText, setDocxWatermarkText] = useState("");

  const [defaultGradingSheet, setDefaultGradingSheet] = useState<
    "gdpt_2025" | "sheet_40" | "sheet_50" | "sheet_20"
  >("gdpt_2025");
  const [preferredAiModel, setPreferredAiModel] = useState<"thinking" | "gemini">("thinking");

  const [savingTeaching, setSavingTeaching] = useState(false);

  // Sync teaching prefs from profile
  useEffect(() => {
    const prefs = getUserPreferences(profile);
    setDepartment(prefs.teaching.department || "SỞ GIÁO DỤC VÀ ĐÀO TẠO");
    setSchoolHeader(prefs.teaching.school || profile?.school || "");
    setTeacherTitle(prefs.teaching.teacherTitle || "");
    setDefaultSubject(prefs.teaching.defaultSubject || "Toán");
    setDefaultGrade(prefs.teaching.defaultGrade || "12");
    setDefaultDuration(prefs.teaching.defaultDuration || 45);

    setDocxFont(prefs.export.docxFont || "Times New Roman");
    setDocxFontSize(prefs.export.docxFontSize || 13);
    setDocxEnableWatermark(prefs.export.docxEnableWatermark || false);
    setDocxWatermarkText(prefs.export.docxWatermarkText || "");

    setDefaultGradingSheet(prefs.gradingAndAi.defaultGradingSheet || "gdpt_2025");
    setPreferredAiModel(prefs.gradingAndAi.preferredAiModel === "gemini" ? "gemini" : "thinking");
  }, [profile]);

  const handleSaveTeachingPreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTeaching(true);

    const currentPrefs = getUserPreferences(profile);
    const updatedPreferences: UserPreferences = {
      ...currentPrefs,
      teaching: {
        ...currentPrefs.teaching,
        department: department.trim() || "SỞ GIÁO DỤC VÀ ĐÀO TẠO",
        school: schoolHeader.trim(),
        teacherTitle: teacherTitle.trim(),
        defaultSubject,
        defaultGrade,
        defaultDuration: Number(defaultDuration) || 45,
      },
      export: {
        docxFont,
        docxFontSize,
        docxEnableWatermark,
        docxWatermarkText: docxWatermarkText.trim(),
      },
      gradingAndAi: {
        defaultGradingSheet,
        preferredAiModel,
      },
    };

    saveUserPreferencesLocal(updatedPreferences);

    if (user) {
      try {
        const { data: { session: curSession } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (curSession?.access_token) {
          headers["Authorization"] = `Bearer ${curSession.access_token}`;
        }

        const res = await fetch("/api/user/profile", {
          method: "PUT",
          headers,
          body: JSON.stringify({
            preferences: updatedPreferences,
            updated_at: new Date().toISOString(),
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Không thể đồng bộ cài đặt nghiệp vụ lên máy chủ.");
        }

        const updated = data.profile || {
          ...profile,
          preferences: updatedPreferences as any,
        };
        updateProfileLocal(updated);
        await refreshProfile();
        showToast("Đã lưu cài đặt nghiệp vụ thành công!", "success");
      } catch (err: any) {
        console.warn("Could not sync preferences to DB, saved locally:", err);
        showToast(err.message || "Đã lưu cài đặt nghiệp vụ.", "info");
      }
    } else {
      showToast("Đã lưu cài đặt nghiệp vụ vào máy!", "success");
    }

    setSavingTeaching(false);
  };

  // ================= 5. NOTIFICATIONS MATRIX (A13) =================
  const [notifChannels, setNotifChannels] = useState({
    examCompleted: { email: true, zalo: true, inApp: true },
    lowCredits: { email: true, zalo: false, inApp: true },
    expiryWarning: { email: true, zalo: true, inApp: true },
    commission: { email: true, zalo: false, inApp: true },
    productUpdates: { email: false, zalo: false, inApp: false }, // default false (A13)
  });
  const [savingNotif, setSavingNotif] = useState(false);

  useEffect(() => {
    const prefs = getUserPreferences(profile);
    if (prefs.notifications?.channels) {
      setNotifChannels((prev) => ({
        ...prev,
        ...prefs.notifications.channels,
      }));
    }
  }, [profile]);

  const handleToggleChannel = (
    type: keyof typeof notifChannels,
    channel: "email" | "zalo" | "inApp"
  ) => {
    setNotifChannels((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: !prev[type][channel],
      },
    }));
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotif(true);

    const currentPrefs = getUserPreferences(profile);
    const updatedPreferences: UserPreferences = {
      ...currentPrefs,
      notifications: {
        ...currentPrefs.notifications,
        emailExamCompleted: notifChannels.examCompleted.email,
        emailLowCredits: notifChannels.lowCredits.email,
        marketingUpdates: notifChannels.productUpdates.email,
        channels: notifChannels,
      },
    };

    saveUserPreferencesLocal(updatedPreferences);

    if (user) {
      try {
        const { data: { session: curSession } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (curSession?.access_token) {
          headers["Authorization"] = `Bearer ${curSession.access_token}`;
        }

        const res = await fetch("/api/user/profile", {
          method: "PUT",
          headers,
          body: JSON.stringify({
            preferences: updatedPreferences,
            updated_at: new Date().toISOString(),
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Không thể đồng bộ tùy chọn thông báo lên máy chủ.");
        }

        const updated = data.profile || {
          ...profile,
          preferences: updatedPreferences as any,
        };
        updateProfileLocal(updated);
        await refreshProfile();
        showToast("Đã lưu cài đặt thông báo thành công!", "success");
      } catch (err: any) {
        console.warn("Could not sync notifications to DB, saved locally:", err);
        showToast(err.message || "Đã lưu tùy chọn thông báo.", "info");
      }
    } else {
      showToast("Đã lưu tùy chọn thông báo vào máy!", "success");
    }

    setSavingNotif(false);
  };

  // ================= 6. SECURITY STATE & PASSWORD STRENGTH (A11) =================
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sendingResetLink, setSendingResetLink] = useState(false);

  const [loggingOutOthers, setLoggingOutOthers] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);

  // Export Data Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [pendingExportFormat, setPendingExportFormat] = useState<"csv" | "json">("csv");

  // Re-Authentication Modal State
  const [showReAuthModal, setShowReAuthModal] = useState(false);
  const [reAuthAction, setReAuthAction] = useState<{
    type: "delete_account" | "export_data" | "disable_2fa";
    title: string;
    description: string;
    isDanger: boolean;
  } | null>(null);

  // Danger Zone: Delete Account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deletionPending, setDeletionPending] = useState(false);
  const [scheduledPurgeDate, setScheduledPurgeDate] = useState<string | null>(null);
  const [cancellingDeletion, setCancellingDeletion] = useState(false);

  // Sync deletion status on mount
  useEffect(() => {
    fetch("/api/user/delete")
      .then((res) => res.json())
      .then((data) => {
        if (data?.pending) {
          setDeletionPending(true);
          setScheduledPurgeDate(data.scheduledDate);
        }
      })
      .catch(() => {});
  }, []);

  // Sync 2FA state from localStorage on load
  useEffect(() => {
    try {
      const is2fa = localStorage.getItem("edutest_2fa_enabled") === "true";
      setTwoFactorEnabled(is2fa);
    } catch {
      // ignore
    }
  }, []);

  // Parse User-Agent & Current Session Device
  const [deviceInfo, setDeviceInfo] = useState({
    browser: "Google Chrome",
    os: "Windows 11 / 10",
    deviceType: "Máy tính cá nhân (Desktop / Laptop)",
    ip: "118.70.152.204",
    location: "Hà Nội, Việt Nam",
    lastActive: "Vừa xong (Phiên hiện hành)",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent;
    let browser = "Google Chrome";
    if (ua.includes("Edg/")) browser = "Microsoft Edge";
    else if (ua.includes("Firefox/")) browser = "Mozilla Firefox";
    else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Apple Safari";
    else if (ua.includes("OPR/") || ua.includes("Opera/")) browser = "Opera";
    else if (ua.includes("Chrome/")) browser = "Google Chrome";

    let os = "Windows 11 / 10";
    if (ua.includes("Windows NT 10.0") || ua.includes("Windows NT 11.0")) os = "Windows 11 / 10";
    else if (ua.includes("Mac OS X")) os = "macOS";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Linux")) os = "Linux";

    let deviceType = "Máy tính cá nhân (Desktop / Laptop)";
    if (/Mobi|Android|iPhone/i.test(ua)) deviceType = "Điện thoại di động (Mobile)";
    else if (/iPad|Tablet/i.test(ua)) deviceType = "Máy tính bảng (Tablet)";

    setDeviceInfo((prev) => ({
      ...prev,
      browser,
      os,
      deviceType,
    }));

    // Fetch client public IP in background safely
    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => {
        if (data?.ip) {
          setDeviceInfo((prev) => ({
            ...prev,
            ip: data.ip,
            location: "Việt Nam (Ước tính ISP)",
          }));
        }
      })
      .catch(() => {
        // keep fallback
      });
  }, []);

  // Password strength calculation
  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "Chưa nhập", color: "bg-muted" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
        return { score: 1, label: "Rất yếu", color: "bg-rose-500" };
      case 2:
        return { score: 2, label: "Yếu", color: "bg-amber-500" };
      case 3:
        return { score: 3, label: "Trung bình", color: "bg-blue-500" };
      case 4:
        return { score: 4, label: "Mạnh", color: "bg-emerald-500" };
      default:
        return { score: 1, label: "Yếu", color: "bg-rose-500" };
    }
  };

  const passwordStrength = calculatePasswordStrength(newPassword);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordMsg({
        type: "error",
        text: "Mật khẩu mới phải có ít nhất 8 ký tự.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({
        type: "error",
        text: "Xác nhận mật khẩu mới không trùng khớp.",
      });
      return;
    }

    setPasswordUpdating(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      showToast(
        isOAuthUser
          ? "Đã thiết lập mật khẩu đăng nhập trực tiếp thành công!"
          : "Cập nhật mật khẩu thành công!",
        "success"
      );
      setPasswordMsg({
        type: "success",
        text: isOAuthUser
          ? "Đã tạo mật khẩu trực tiếp thành công! Thầy/Cô có thể đăng nhập bằng cả Google và Email + Mật khẩu này."
          : "Đổi mật khẩu thành công! Hãy dùng mật khẩu mới cho lần đăng nhập sau.",
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Không thể cập nhật mật khẩu." });
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) {
      showToast("Không tìm thấy địa chỉ email của tài khoản.", "error");
      return;
    }
    setSendingResetLink(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/settings?tab=account&section=security`,
      });
      if (error) throw error;
      showToast(
        `Đã gửi liên kết khôi phục mật khẩu tới ${user.email}. Thầy/Cô vui lòng kiểm tra hộp thư!`,
        "success",
        7000
      );
    } catch (err: any) {
      showToast(err.message || "Không thể gửi email khôi phục.", "error");
    } finally {
      setSendingResetLink(false);
    }
  };

  const handleLogoutOthers = async () => {
    setLoggingOutOthers(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut({ scope: "others" });
      showToast("Đã đăng xuất khỏi tất cả các thiết bị khác thành công!", "success");
    } catch (err: any) {
      showToast(`Lỗi: ${err.message || "Không thể đăng xuất thiết bị khác"}`, "error");
    } finally {
      setLoggingOutOthers(false);
    }
  };

  const handle2faSuccess = (codes: string[]) => {
    setTwoFactorEnabled(true);
    try {
      localStorage.setItem("edutest_2fa_enabled", "true");
      localStorage.setItem("edutest_2fa_backup_codes", JSON.stringify(codes));
    } catch {
      // ignore
    }
    showToast("Đã kích hoạt Xác thực 2 bước (2FA) thành công!", "success");
  };

  const handleRequestDisable2fa = () => {
    setReAuthAction({
      type: "disable_2fa",
      title: "Xác thực để tắt 2FA",
      description: "Nhập mật khẩu hiện tại để xác nhận tắt lớp bảo vệ Xác thực 2 bước.",
      isDanger: true,
    });
    setShowReAuthModal(true);
  };

  const handleConfirmExportFormat = (format: "csv" | "json") => {
    setShowExportModal(false);
    setPendingExportFormat(format);
    setReAuthAction({
      type: "export_data",
      title: `Xác thực tải dữ liệu cá nhân (.${format.toUpperCase()})`,
      description: `Nhập mật khẩu hiện tại để xác thực và tiến hành tạo tệp dữ liệu định dạng .${format.toUpperCase()}.`,
      isDanger: false,
    });
    setShowReAuthModal(true);
  };

  // Export personal data JSON (A11)
  const handleExportPersonalData = () => {
    try {
      const exportData = {
        meta: {
          app: "EduTest AI",
          exportDate: new Date().toISOString(),
          regulation: "Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân",
        },
        user: {
          id: user?.id,
          email: user?.email,
          createdAt: user?.created_at,
        },
        profile: {
          name: profile?.name || profile?.full_name,
          phone: (profile as any)?.phone,
          school: profile?.school,
          role: profile?.role,
          tier: profile?.tier,
          isVerifiedTeacher: profile?.is_verified_teacher,
          avatarUrl: profile?.avatar_url,
        },
        preferences: getUserPreferences(profile),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edutest-personal-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showToast("Đã tải xuống bản sao dữ liệu cá nhân (JSON).", "success");
    } catch (err) {
      showToast("Không thể xuất dữ liệu. Vui lòng thử lại.", "error");
    }
  };

  // Export personal data CSV / Excel
  const handleExportCsvData = () => {
    try {
      const rows: string[][] = [
        ["EDUTEST AI - BÁO CÁO DỮ LIỆU CÁ NHÂN VÀ HOẠT ĐỘNG SƯ PHẠM"],
        ["Thời gian trích xuất", new Date().toLocaleString("vi-VN")],
        ["Căn cứ pháp lý", "Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân"],
        [],
        ["--- 1. THÔNG TIN HỒ SƠ TÀI KHOẢN ---"],
        ["Mã định danh (ID)", user?.id || ""],
        ["Họ và tên", profile?.name || profile?.full_name || ""],
        ["Email đăng nhập", user?.email || ""],
        ["Số điện thoại", (profile as any)?.phone || "Chưa cập nhật"],
        ["Trường học / Đơn vị công tác", profile?.school || "Chưa cập nhật"],
        ["Hạng gói cước", (profile?.tier || "free").toUpperCase()],
        ["Trạng thái Thẻ ngành (eKYC)", profile?.is_verified_teacher ? "Đã xác thực" : "Chưa xác thực"],
        ["Ngày tạo tài khoản", user?.created_at ? new Date(user.created_at).toLocaleDateString("vi-VN") : ""],
        [],
        ["--- 2. CẤU HÌNH NGHIỆP VỤ & SOẠN ĐỀ ---"],
        ["Cơ quan chủ quản", department],
        ["Trường học phôi Word", schoolHeader],
        ["Tổ bộ môn / Giáo viên", teacherTitle],
        ["Môn học chính", defaultSubject],
        ["Khối lớp thường dạy", `Lớp ${defaultGrade}`],
        ["Thời gian chuẩn", `${defaultDuration} phút`],
        ["Mẫu phiếu OMR mặc định", defaultGradingSheet],
        ["Chế độ AI suy luận", preferredAiModel === "thinking" ? "Gemini 3.8-flash / 3.1 pro (Deep Reasoning)" : "3.5 flash-lite"],
        ["Font chữ Word", docxFont],
        ["Cỡ chữ nội dung", `${docxFontSize} pt`],
        ["Watermark bản quyền", docxEnableWatermark ? `Có ("${docxWatermarkText}")` : "Không"],
      ];

      const csvContent =
        "\uFEFF" +
        rows
          .map((r) => r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(","))
          .join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edutest-bao-cao-ca-nhan-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Đã tải xuống bảng tính CSV dữ liệu cá nhân thành công!", "success");
    } catch (err) {
      showToast("Không thể tạo tệp CSV. Vui lòng thử lại.", "error");
    }
  };

  const handleRequestDeleteAccount = () => {
    setReAuthAction({
      type: "delete_account",
      title: "Xác thực xóa tài khoản vĩnh viễn",
      description:
        "Hành động này không thể hoàn tác. Vui lòng nhập mật khẩu để xác nhận danh tính trước khi tiến hành xóa.",
      isDanger: true,
    });
    setShowReAuthModal(true);
  };

  const handleReAuthSuccess = () => {
    if (reAuthAction?.type === "delete_account") {
      setShowDeleteModal(true);
    } else if (reAuthAction?.type === "export_data") {
      if (pendingExportFormat === "json") {
        handleExportPersonalData();
      } else {
        handleExportCsvData();
      }
    } else if (reAuthAction?.type === "disable_2fa") {
      setTwoFactorEnabled(false);
      try {
        localStorage.removeItem("edutest_2fa_enabled");
        localStorage.removeItem("edutest_2fa_backup_codes");
      } catch {
        // ignore
      }
      showToast("Đã tắt Xác thực 2 bước (2FA).", "info");
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (deleteEmailConfirm.trim().toLowerCase() !== user?.email?.toLowerCase()) {
      showToast("Email xác nhận không khớp.", "error");
      return;
    }

    setDeletingAccount(true);
    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: deleteEmailConfirm.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể gửi yêu cầu xóa tài khoản.");
      }

      setDeletionPending(true);
      setScheduledPurgeDate(data.scheduledDate);
      showToast(
        data.message ||
          "Yêu cầu xóa tài khoản đã được ghi nhận. Thời gian chờ ân hạn 14 ngày trước khi xóa vĩnh viễn.",
        "warning",
        8000
      );
      setShowDeleteModal(false);
      setDeleteEmailConfirm("");
    } catch (err: any) {
      showToast(err.message || "Không thể gửi yêu cầu xóa tài khoản.", "error");
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleCancelDeleteAccount = async () => {
    setCancellingDeletion(true);
    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể hủy yêu cầu xóa.");
      }

      setDeletionPending(false);
      setScheduledPurgeDate(null);
      showToast(data.message || "Đã hủy yêu cầu xóa tài khoản thành công.", "success");
    } catch (err: any) {
      showToast(err.message || "Không thể hủy yêu cầu xóa tài khoản.", "error");
    } finally {
      setCancellingDeletion(false);
    }
  };

  // ================= 7. APPEARANCE (A14) =================
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark" | "system">("system");
  const [fontSize, setFontSize] = useState<"small" | "normal" | "large">("normal");
  const [uiDensity, setUiDensity] = useState<"comfortable" | "compact">("comfortable");
  const [highContrastProjector, setHighContrastProjector] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<"idle" | "syncing" | "saved">("idle");
  const [previewSubject, setPreviewSubject] = useState<"math" | "chem">("math");
  const [selectedPreviewAnswer, setSelectedPreviewAnswer] = useState<string | null>("B");
  const appearanceSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      const prefs = getUserPreferences(profile);

      const savedTheme = (localStorage.getItem("app_theme") as any) || prefs.appearance?.theme || "system";
      setCurrentTheme(savedTheme);

      const savedSize = (localStorage.getItem("app_font_size") as any) || prefs.appearance?.fontSize || "normal";
      setFontSize(savedSize);

      const savedDensity = (localStorage.getItem("app_ui_density") as any) || prefs.appearance?.uiDensity || "comfortable";
      setUiDensity(savedDensity);

      const savedProjector = localStorage.getItem("app_projector_mode") === "true" || !!prefs.appearance?.highContrastProjector;
      setHighContrastProjector(savedProjector);

      const savedMotion = localStorage.getItem("app_reduced_motion") === "true" || !!prefs.appearance?.reducedMotion;
      setReducedMotion(savedMotion);
    } catch {
      // ignore
    }

    const handleThemeEvent = (e: any) => {
      const theme = e?.detail?.theme;
      if (theme && ["light", "dark", "system"].includes(theme)) {
        setCurrentTheme(theme);
      }
    };
    window.addEventListener("eduteach_theme_changed", handleThemeEvent);
    return () => {
      window.removeEventListener("eduteach_theme_changed", handleThemeEvent);
      if (appearanceSyncTimerRef.current) {
        clearTimeout(appearanceSyncTimerRef.current);
      }
    };
  }, [profile]);

  const triggerDebouncedAppearanceSync = useCallback(
    (newAppearance: AppearancePreferences) => {
      if (appearanceSyncTimerRef.current) {
        clearTimeout(appearanceSyncTimerRef.current);
      }
      setCloudSyncStatus("syncing");

      appearanceSyncTimerRef.current = setTimeout(async () => {
        try {
          const currentPrefs = getUserPreferences(profile);
          const updatedPreferences: UserPreferences = {
            ...currentPrefs,
            appearance: newAppearance,
          };

          saveUserPreferencesLocal(updatedPreferences);

          if (user) {
            const {
              data: { session: curSession },
            } = await supabase.auth.getSession();
            const headers: Record<string, string> = {
              "Content-Type": "application/json",
            };
            if (curSession?.access_token) {
              headers["Authorization"] = `Bearer ${curSession.access_token}`;
            }

            const res = await fetch("/api/user/profile", {
              method: "PUT",
              headers,
              body: JSON.stringify({
                preferences: updatedPreferences,
                updated_at: new Date().toISOString(),
              }),
            });

            if (res.ok) {
              const data = await res.json();
              if (data.success && data.profile) {
                updateProfileLocal(data.profile);
              }
            }
          }
          setCloudSyncStatus("saved");
          setTimeout(() => {
            setCloudSyncStatus("idle");
          }, 2500);
        } catch (err) {
          console.warn("Failed to sync appearance to DB:", err);
          setCloudSyncStatus("idle");
        }
      }, 800);
    },
    [profile, user, supabase, updateProfileLocal]
  );

  const applyTheme = (theme: "light" | "dark" | "system") => {
    setCurrentTheme(theme);
    try {
      localStorage.setItem("app_theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (theme === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      window.dispatchEvent(
        new CustomEvent("eduteach_theme_changed", { detail: { theme } })
      );
    } catch {
      // ignore
    }

    triggerDebouncedAppearanceSync({
      theme,
      fontSize,
      uiDensity,
      highContrastProjector,
      reducedMotion,
    });
  };

  const applyFontSize = (size: "small" | "normal" | "large") => {
    setFontSize(size);
    try {
      localStorage.setItem("app_font_size", size);
      if (size === "small") {
        document.documentElement.style.fontSize = "14.5px";
      } else if (size === "large") {
        document.documentElement.style.fontSize = "17.5px";
      } else {
        document.documentElement.style.fontSize = "16px";
      }
    } catch {
      // ignore
    }

    triggerDebouncedAppearanceSync({
      theme: currentTheme,
      fontSize: size,
      uiDensity,
      highContrastProjector,
      reducedMotion,
    });
  };

  const applyUiDensity = (density: "comfortable" | "compact") => {
    setUiDensity(density);
    try {
      localStorage.setItem("app_ui_density", density);
      if (density === "compact") {
        document.documentElement.classList.add("density-compact");
      } else {
        document.documentElement.classList.remove("density-compact");
      }
    } catch {
      // ignore
    }

    triggerDebouncedAppearanceSync({
      theme: currentTheme,
      fontSize,
      uiDensity: density,
      highContrastProjector,
      reducedMotion,
    });
  };

  const applyHighContrastProjector = (enabled: boolean) => {
    setHighContrastProjector(enabled);
    try {
      localStorage.setItem("app_projector_mode", enabled ? "true" : "false");
      if (enabled) {
        document.documentElement.classList.add("mode-projector");
      } else {
        document.documentElement.classList.remove("mode-projector");
      }
    } catch {
      // ignore
    }

    triggerDebouncedAppearanceSync({
      theme: currentTheme,
      fontSize,
      uiDensity,
      highContrastProjector: enabled,
      reducedMotion,
    });
  };

  const applyReducedMotion = (enabled: boolean) => {
    setReducedMotion(enabled);
    try {
      localStorage.setItem("app_reduced_motion", enabled ? "true" : "false");
      if (enabled) {
        document.documentElement.classList.add("motion-reduce");
      } else {
        document.documentElement.classList.remove("motion-reduce");
      }
    } catch {
      // ignore
    }

    triggerDebouncedAppearanceSync({
      theme: currentTheme,
      fontSize,
      uiDensity,
      highContrastProjector,
      reducedMotion: enabled,
    });
  };

  // ================= 8. REFERRAL STATS & LINKS (A9) =================
  const referralCode = profile?.referral_code || "EDU8C81A";
  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${referralCode}`
      : `${APP_URL}/register?ref=${referralCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    showToast("Đã sao chép liên kết giới thiệu", "success");
  };

  const copyReferralCodeOnly = () => {
    navigator.clipboard.writeText(referralCode);
    showToast("Đã sao chép mã giới thiệu", "success");
  };

  const isOAuthUser =
    user?.app_metadata?.provider === "google" ||
    (user as any)?.identities?.some((i: any) => i.provider === "google");

  // Subtabs Definition (A10)
  const subTabs = [
    { id: "profile", label: "Hồ sơ cá nhân", icon: User },
    { id: "ekyc", label: "Xác thực Thẻ ngành (eKYC)", icon: ShieldCheck },
    { id: "teaching", label: "Nghiệp vụ & Soạn đề", icon: GraduationCap, isNew: !hasSeenTeachingBadge },
    { id: "notifications", label: "Thông báo", icon: Bell },
    { id: "security", label: "Bảo mật", icon: Shield },
    { id: "appearance", label: "Giao diện", icon: Palette },
  ];

  return (
    <div className="space-y-6 pb-28">
      {/* Autocomplete Datalist for Schools (A6) */}
      <datalist id="school-suggestions">
        {VIETNAM_SCHOOL_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {/* Two-Level Navigation Layout (A1, A10) */}
      <div className="grid gap-6 lg:grid-cols-4 items-start">
        {/* Left Sub-Navigation Sidebar (Sticky on Desktop) */}
        <div className="space-y-3 lg:sticky lg:top-24 self-start">
          {/* Mobile Select Dropdown (<1024px) (A10) */}
          <div className="block lg:hidden">
            <label htmlFor="mobile-subtab-select" className="sr-only">
              Chọn mục cài đặt
            </label>
            <div className="relative">
              <select
                id="mobile-subtab-select"
                value={currentSubTab}
                onChange={(e) => handleSubTabClick(e.target.value)}
                className="w-full rounded-xl border border-border bg-card p-3 text-sm font-bold text-foreground shadow-2xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {subTabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label} {tab.isNew ? "— [Mới]" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile horizontal quick chip slider with fade */}
          <div className="flex lg:hidden overflow-x-auto gap-2 pb-1 scrollbar-none">
            {subTabs.map((tab) => {
              const isActive = currentSubTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSubTabClick(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition cursor-pointer border ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-card text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Left Sub-Navigation (>=1024px) */}
          <div className="hidden lg:flex flex-col space-y-1 bg-card/60 rounded-2xl p-2 border border-border shadow-2xs">
            {subTabs.map((tab) => {
              const isActive = currentSubTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSubTabClick(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{tab.label}</span>
                  {tab.isNew && (
                    <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Mới
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Panel (A1: Tiêu đề H2 lấy theo mục con đang chọn) */}
        <div className="lg:col-span-3 space-y-6">
          {/* ================= SECTION 1: HỒ SƠ CÁ NHÂN & GIẢNG DẠY ================= */}
          {currentSubTab === "profile" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs relative">
                {/* Section Header (A1) */}
                <h2 className="mb-6 text-lg font-bold flex items-center gap-2 text-foreground">
                  <User className="w-5 h-5 text-primary" aria-hidden="true" />
                  <span>Thông tin cá nhân & Giảng dạy</span>
                </h2>

                {profileSuccessMsg && (
                  <div
                    role="status"
                    className="mb-4 rounded-xl p-3.5 text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                {avatarError && (
                  <div
                    role="alert"
                    className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{avatarError}</span>
                  </div>
                )}

                {/* Avatar Section (A5 - S5 compliance, circular preview, drag-and-drop, delete avatar) */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOverAvatar(true);
                  }}
                  onDragLeave={() => setIsDragOverAvatar(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOverAvatar(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleAvatarFileSelected(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`mb-6 flex flex-col sm:flex-row items-center gap-5 border-b border-border pb-6 rounded-xl transition ${
                    isDragOverAvatar ? "bg-primary/5 ring-2 ring-primary ring-dashed p-4" : ""
                  }`}
                >
                  <div className="relative group shrink-0">
                    {profile?.avatar_url && !avatarImgError ? (
                      <img
                        key={profile.avatar_url}
                        src={profile.avatar_url}
                        alt={`Ảnh đại diện của ${name || "giáo viên"}`}
                        className="h-24 w-24 rounded-full object-cover border-2 border-primary shadow-sm"
                        onError={() => setAvatarImgError(true)}
                      />
                    ) : (
                      <div
                        className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary border border-primary/20 shadow-2xs"
                        aria-hidden="true"
                      >
                        {initials}
                      </div>
                    )}

                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-center sm:text-left">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleAvatarFileSelected(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      aria-label="Tải lên ảnh đại diện mới"
                    />

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition cursor-pointer shadow-2xs disabled:opacity-50"
                      >
                        <Camera className="w-4 h-4 text-primary" />
                        <span>Thay ảnh đại diện</span>
                      </button>

                      {profile?.avatar_url && (
                        <button
                          type="button"
                          onClick={handleDeleteAvatar}
                          disabled={uploadingAvatar}
                          className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa ảnh</span>
                        </button>
                      )}
                    </div>

                    {/* S5 caption: Không còn CDN, không còn KB (A5, Nghiệm thu) */}
                    <p className="text-xs text-muted-foreground">
                      Ảnh sẽ tự thu nhỏ về 256×256. Hỗ trợ JPG, PNG, tối đa 5MB. Kéo thả ảnh trực tiếp vào đây.
                    </p>
                  </div>
                </div>

                {/* Profile Form (A4, A6, A7) */}
                <form onSubmit={handleSaveProfile} className="space-y-5" noValidate>
                  {/* Row 1: Họ tên & Email */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    {/* Họ và tên */}
                    <div>
                      <label htmlFor="profile-name" className="block text-xs font-bold text-foreground mb-1">
                        Họ và tên giáo viên <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="profile-name"
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (touched.name) {
                            setFieldErrors((prev) => ({ ...prev, name: validateName(e.target.value) }));
                          }
                        }}
                        onBlur={() => handleBlur("name")}
                        required
                        aria-invalid={Boolean(fieldErrors.name)}
                        aria-describedby={fieldErrors.name ? "error-name" : undefined}
                        placeholder="VD: Thầy Nguyễn Văn A"
                        className={`block w-full rounded-xl border bg-background px-4 py-2.5 text-sm transition focus:outline-none focus:ring-1 ${
                          fieldErrors.name
                            ? "border-destructive ring-1 ring-destructive text-destructive"
                            : "border-border focus:border-primary focus:ring-primary"
                        }`}
                      />
                      {fieldErrors.name && (
                        <p id="error-name" role="alert" className="mt-1 text-xs text-destructive font-medium">
                          {fieldErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Email tài khoản (A4: Khóa rõ ràng, icon khóa, contrast 4.5:1, nút đổi email) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="profile-email" className="block text-xs font-bold text-foreground">
                          Email đăng nhập
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowChangeEmailModal(true)}
                          className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          Đổi email
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          id="profile-email"
                          type="email"
                          value={user?.email || ""}
                          disabled
                          readOnly
                          title="Email đăng nhập không thể đổi trực tiếp. Bấm Đổi email để xác thực."
                          className="block w-full rounded-xl border border-border bg-muted/60 pl-4 pr-10 py-2.5 text-sm font-semibold text-foreground/90 cursor-not-allowed select-all"
                        />
                        <div
                          className="absolute right-3.5 top-3 text-muted-foreground"
                          title="Email đã khóa để đảm bảo an toàn"
                        >
                          <Lock className="w-4 h-4" aria-hidden="true" />
                        </div>
                      </div>

                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Email đăng nhập không thể đổi trực tiếp. Cần đổi? Bấm{" "}
                        <button
                          type="button"
                          onClick={() => setShowChangeEmailModal(true)}
                          className="font-semibold text-primary hover:underline cursor-pointer"
                        >
                          Đổi email
                        </button>{" "}
                        để xác minh.
                      </p>
                    </div>
                  </div>

                  {/* Row 2: Số điện thoại / Zalo & Trường học (A6) */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    {/* Số điện thoại / Zalo */}
                    <div>
                      <label htmlFor="profile-phone" className="block text-xs font-bold text-foreground mb-1">
                        Số điện thoại / Zalo liên hệ (Tùy chọn)
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" aria-hidden="true" />
                        <input
                          id="profile-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if (touched.phone) {
                              setFieldErrors((prev) => ({ ...prev, phone: validatePhone(e.target.value) }));
                            }
                          }}
                          onBlur={() => handleBlur("phone")}
                          aria-invalid={Boolean(fieldErrors.phone)}
                          aria-describedby={fieldErrors.phone ? "error-phone" : undefined}
                          placeholder="0912 345 678"
                          className={`block w-full rounded-xl border bg-background pl-10 pr-4 py-2.5 text-sm transition focus:outline-none focus:ring-1 ${
                            fieldErrors.phone
                              ? "border-destructive ring-1 ring-destructive"
                              : "border-border focus:border-primary focus:ring-primary"
                          }`}
                        />
                      </div>
                      {fieldErrors.phone ? (
                        <p id="error-phone" role="alert" className="mt-1 text-xs text-destructive font-medium">
                          {fieldErrors.phone}
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Dùng để nhận cảnh báo ví và xác thực OTP khi nạp điểm.
                        </p>
                      )}
                    </div>

                    {/* Trường / Đơn vị công tác */}
                    <div>
                      <label htmlFor="profile-school" className="block text-xs font-bold text-foreground mb-1">
                        Trường học / Đơn vị công tác (Tùy chọn)
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" aria-hidden="true" />
                        <input
                          id="profile-school"
                          type="text"
                          list="school-suggestions"
                          value={school}
                          onChange={(e) => {
                            setSchool(e.target.value);
                            if (touched.school) {
                              setFieldErrors((prev) => ({ ...prev, school: validateSchool(e.target.value) }));
                            }
                          }}
                          onBlur={() => handleBlur("school")}
                          aria-invalid={Boolean(fieldErrors.school)}
                          aria-describedby={fieldErrors.school ? "error-school" : undefined}
                          placeholder="VD: THPT Chuyên Hà Nội - Amsterdam"
                          className={`block w-full rounded-xl border bg-background pl-10 pr-4 py-2.5 text-sm transition focus:outline-none focus:ring-1 ${
                            fieldErrors.school
                              ? "border-destructive ring-1 ring-destructive"
                              : "border-border focus:border-primary focus:ring-primary"
                          }`}
                        />
                      </div>
                      {fieldErrors.school ? (
                        <p id="error-school" role="alert" className="mt-1 text-xs text-destructive font-medium">
                          {fieldErrors.school}
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Tối đa 100 ký tự. Có gợi ý tự động từ danh bạ các trường phổ thông.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Thông tin giảng dạy (A7 - Môn dạy & Cấp/Khối lớp) */}
                  <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" aria-hidden="true" />
                      <span className="text-xs font-bold uppercase tracking-wide text-foreground">
                        Thông tin giảng dạy chuyên môn (A7)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Môn dạy (Multi-select dropdown dạng ẩn) */}
                      <MultiSelectDropdown
                        label="Môn học phụ trách giảng dạy"
                        options={SUBJECT_OPTIONS}
                        selected={selectedSubjects}
                        onChange={setSelectedSubjects}
                        placeholder="Chọn một hoặc nhiều môn học..."
                        badgeLimit={2}
                      />

                      {/* Cấp / Khối lớp (Multi-select dropdown dạng ẩn) */}
                      <MultiSelectDropdown
                        label="Cấp / Khối lớp thường dạy"
                        options={GRADE_LEVEL_OPTIONS}
                        selected={selectedGradeLevels}
                        onChange={setSelectedGradeLevels}
                        placeholder="Chọn một hoặc nhiều cấp / khối..."
                        badgeLimit={2}
                      />
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      Hệ thống sẽ dùng môn và cấp lớp này làm mặc định khi Thầy Cô mở trình Soạn đề thi và cá nhân hóa bảng trắng.
                    </p>
                  </div>

                  {/* Row 4: Hạng tài khoản (A8: Thay nhãn tĩnh bằng PlanStatusCard S2) */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Hạng tài khoản hiện tại
                    </label>
                    <PlanStatusCard variant="compact" onNavigateToPlan={onNavigateToPlan} />
                  </div>
                </form>
              </div>

              {/* STICKY BOTTOM SAVE BAR (A2 - S1 for FAB) */}
              {isProfileDirty && (
                <div
                  role="region"
                  aria-label="Thanh lưu thay đổi"
                  className="sticky bottom-4 sm:bottom-6 z-30 mx-auto max-w-2xl rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-md p-3 sm:p-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>Thầy Cô có thay đổi chưa lưu trong hồ sơ cá nhân</span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={handleDiscardProfileChanges}
                        disabled={savingProfile}
                        className="px-4 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted transition cursor-pointer text-foreground"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveProfile()}
                        disabled={savingProfile || hasFormErrors}
                        className="inline-flex items-center justify-center gap-1.5 px-6 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {savingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>{savingProfile ? "Đang lưu…" : "Lưu hồ sơ"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Referral Box (A9: Đã tinh chỉnh nút sao chép, thống kê rõ ràng, điều khoản) */}
              <div className="rounded-2xl border border-blue-200 bg-linear-to-r from-blue-50/70 to-indigo-50/70 dark:border-blue-900/40 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold text-sm">
                      <Share2 className="w-4 h-4 text-primary" aria-hidden="true" />
                      <span>Chương trình giới thiệu đồng nghiệp & Nhận Credits</span>
                    </div>
                    <p className="text-xs text-blue-950/80 dark:text-blue-300/80 max-w-xl leading-relaxed">
                      Mỗi khi một giáo viên đăng ký qua liên kết của bạn và hoàn thành tạo đề thi đầu tiên, cả hai thầy cô đều nhận ngay{" "}
                      <strong>+{REFERRAL_BONUS_CREDITS.toLocaleString("vi-VN")} Credits</strong> vào ví.
                    </p>

                    {/* Small stats (A9) */}
                    <div className="pt-1 flex items-center gap-3 text-xs font-semibold text-blue-900 dark:text-blue-300">
                      <span className="inline-flex items-center gap-1 rounded-md bg-white/60 dark:bg-card/60 px-2 py-0.5 border border-blue-200 dark:border-blue-800">
                        Đã mời: <strong>3 đồng nghiệp</strong>
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-white/60 dark:bg-card/60 px-2 py-0.5 border border-blue-200 dark:border-blue-800">
                        Đã nhận: <strong>2 × 2.000 credits</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={copyReferralCodeOnly}
                      title="Bấm để sao chép mã"
                      className="inline-flex items-center justify-center gap-1.5 font-mono text-xs font-bold bg-white dark:bg-card px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 text-primary hover:bg-blue-50 dark:hover:bg-muted transition cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Mã: {referralCode}</span>
                    </button>

                    <button
                      type="button"
                      onClick={copyReferralLink}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition cursor-pointer shadow-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép liên kết giới thiệu</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between text-[11px] text-blue-900/80 dark:text-blue-300/80 flex-wrap gap-2">
                  <span>Áp dụng khi đồng nghiệp hoàn thành tạo đề thi đầu tiên.</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onNavigateToPartner}
                      className="font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Xem chi tiết đối tác & hoa hồng</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 2: eKYC GIÁO VIÊN (A15) ================= */}
          {currentSubTab === "ekyc" && (
            <div className="space-y-6">
              <TeacherVerificationCard />
            </div>
          )}

          {/* ================= SECTION 3: NGHIỆP VỤ & SOẠN ĐỀ (A1, A7) ================= */}
          {currentSubTab === "teaching" && (
            <form onSubmit={handleSaveTeachingPreferences} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    <span>Nghiệp vụ & Quy cách soạn đề thi</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tùy chỉnh phôi đề Word (.docx), barem chấm OMR và động cơ AI suy luận theo đặc thù môn dạy.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={savingTeaching}
                  className="self-start sm:self-auto inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {savingTeaching ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu…</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Lưu cài đặt nghiệp vụ</span>
                    </>
                  )}
                </button>
              </div>

              {/* 2-COLUMN MODERN COMPACT GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* LEFT COLUMN: SOẠN ĐỀ & CẤU HÌNH AI (6 cols) */}
                <div className="lg:col-span-6 space-y-5">
                  {/* Card 1: Môn & Khối mặc định */}
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-border">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          1. Môn dạy & Khối lớp mặc định
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Tự động chọn sẵn khi Thầy/Cô mở Exam Studio khởi tạo đề mới.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Môn học chính
                        </label>
                        <select
                          value={defaultSubject}
                          onChange={(e) => setDefaultSubject(e.target.value)}
                          className="block w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                          {SUBJECT_OPTIONS.map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Khối lớp thường dạy
                        </label>
                        <select
                          value={defaultGrade}
                          onChange={(e) => setDefaultGrade(e.target.value)}
                          className="block w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                          {["12", "11", "10", "9", "8", "7", "6"].map((g) => (
                            <option key={g} value={g}>
                              Lớp {g}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Thời gian chuẩn
                        </label>
                        <select
                          value={defaultDuration}
                          onChange={(e) => setDefaultDuration(Number(e.target.value))}
                          className="block w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                          <option value={15}>15 phút (Kiểm tra 15p)</option>
                          <option value={45}>45 phút (1 tiết)</option>
                          <option value={50}>50 phút (Chuẩn GDPT 2025)</option>
                          <option value={60}>60 phút</option>
                          <option value={90}>90 phút (Học kỳ / TN)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Chế độ AI suy luận ưu tiên */}
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-2.5 border-b border-border">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-foreground">
                            2. Chế độ AI suy luận ưu tiên
                          </h3>
                          <p className="text-[11px] text-muted-foreground">
                            Động cơ AI mặc định khi mở Exam Studio sinh câu hỏi & ma trận đề.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Model 1: Gemini 3.8-flash hoặc 3.1 pro */}
                      <div
                        onClick={() => setPreferredAiModel("thinking")}
                        className={`relative rounded-xl border p-3.5 cursor-pointer transition ${
                          preferredAiModel === "thinking"
                            ? "border-purple-500 bg-purple-500/5 ring-1 ring-purple-500 shadow-xs"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-foreground">
                                Gemini 3.8-flash hoặc 3.1 pro
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-500/15 to-purple-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-300">
                                ✨ GÓI MAX • 1.600 cr
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              Suy luận đa bước chuyên sâu (Deep Reasoning). Kiểm tra chéo ma trận kiến thức, bẫy logic vận dụng cao, tự động sinh lời giải chi tiết.
                            </p>
                          </div>
                          <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                            preferredAiModel === "thinking"
                              ? "border-purple-600 bg-purple-600 text-white"
                              : "border-muted-foreground/30"
                          }`}>
                            {preferredAiModel === "thinking" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>

                        {!isMax && (
                          <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-700 dark:text-amber-300 border border-amber-500/20">
                            <Info className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Tài khoản chưa nâng cấp Gói MAX: hệ thống sẽ ưu tiên lưu và tự động dùng 3.5 flash-lite khi tạo đề.
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Model 2: 3.5 flash-lite */}
                      <div
                        onClick={() => setPreferredAiModel("gemini")}
                        className={`relative rounded-xl border p-3.5 cursor-pointer transition ${
                          preferredAiModel === "gemini"
                            ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500 shadow-xs"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-foreground">
                                3.5 flash-lite
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                ⚡ MỌI TÀI KHOẢN • 500 cr
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              Phản hồi siêu tốc 2–3s, tối ưu ngân sách credits. Sinh nhanh ngân hàng câu hỏi nhận biết, thông hiểu và đề trắc nghiệm chuẩn.
                            </p>
                          </div>
                          <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                            preferredAiModel === "gemini"
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-muted-foreground/30"
                          }`}>
                            {preferredAiModel === "gemini" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: TIÊU ĐỀ WORD, IN ẤN & MẪU PHIẾU CHẤM OMR (6 cols) */}
                <div className="lg:col-span-6 space-y-5">
                  {/* Card 3: Tiêu đề đầu trang đề thi (Header file Word) */}
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-border">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          3. Tiêu đề hành chính & Trường học (Header Word)
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Tự động điền góc trái đầu trang của file Word (.docx) xuất ra theo quy chuẩn Bộ GD&ĐT.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          Sở Giáo dục & Đào tạo / Cơ quan chủ quản
                        </label>
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="VD: SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI"
                          className="block w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Trường học / Đơn vị công tác
                          </label>
                          <input
                            type="text"
                            value={schoolHeader}
                            onChange={(e) => setSchoolHeader(e.target.value)}
                            placeholder="VD: THPT CHUYÊN HÀ NỘI - AMSTERDAM"
                            className="block w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Tổ bộ môn / Giáo viên biên soạn
                          </label>
                          <input
                            type="text"
                            value={teacherTitle}
                            onChange={(e) => setTeacherTitle(e.target.value)}
                            placeholder="VD: Tổ Toán - Tin | Thầy Nguyễn Văn A"
                            className="block w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Quy chuẩn in ấn & Watermark bản quyền */}
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-border">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          4. Quy chuẩn in ấn & Watermark (.docx)
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Font chữ, cỡ chữ & đóng dấu bản quyền giáo viên khi xuất file Word.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Font chữ Word
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: "Times New Roman" as const, label: "Times New Roman", desc: "Chuẩn Bộ GD" },
                            { id: "Arial" as const, label: "Arial", desc: "Hiện đại, rõ nét" },
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setDocxFont(item.id)}
                              className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                                docxFont === item.id
                                  ? "border-primary bg-primary/5 ring-1 ring-primary font-bold"
                                  : "border-border hover:bg-muted/50"
                              }`}
                            >
                              <p className="text-xs font-bold leading-none">{item.label}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">{item.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Cỡ chữ nội dung
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { size: 13 as const, label: "13 pt", desc: "Chuẩn in ấn rõ ràng" },
                            { size: 12 as const, label: "12 pt", desc: "Tiết kiệm giấy in" },
                          ].map((item) => (
                            <button
                              key={item.size}
                              type="button"
                              onClick={() => setDocxFontSize(item.size)}
                              className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                                docxFontSize === item.size
                                  ? "border-primary bg-primary/5 ring-1 ring-primary font-bold"
                                  : "border-border hover:bg-muted/50"
                              }`}
                            >
                              <p className="text-xs font-bold leading-none">{item.label}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">{item.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Watermark toggle */}
                    <div className="rounded-xl border border-border p-3.5 bg-muted/20 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-foreground">Chèn Watermark chân trang đề thi</p>
                          <p className="text-[11px] text-muted-foreground">
                            Ghi chú bản quyền và số điện thoại liên hệ ở chân trang file Word xuất ra.
                          </p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center shrink-0">
                          <input
                            type="checkbox"
                            checked={docxEnableWatermark}
                            onChange={(e) => setDocxEnableWatermark(e.target.checked)}
                            className="peer sr-only"
                          />
                          <div className="h-5 w-9 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
                        </label>
                      </div>

                      {docxEnableWatermark && (
                        <input
                          type="text"
                          value={docxWatermarkText}
                          onChange={(e) => setDocxWatermarkText(e.target.value)}
                          placeholder="VD: Biên soạn: Thầy Nguyễn Văn A - Hotline/Zalo: 0987.xxx.xxx"
                          className="block w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      )}
                    </div>
                  </div>

                  {/* Card 5: Mẫu phiếu chấm OMR mặc định */}
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3.5">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-border">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          5. Mẫu phiếu chấm OMR mặc định
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Khung nhận diện phiếu thi khi dùng công cụ Chấm trắc nghiệm.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {[
                        {
                          id: "gdpt_2025" as const,
                          label: "Chuẩn GDPT 2025 (Bộ GD&ĐT)",
                          desc: "Phần I: 12 MCQ (3đ), Phần II: 4 Đúng/Sai (4đ), Phần III: 6 Trả lời ngắn (3đ)",
                          badge: "Khuyên dùng",
                        },
                        {
                          id: "sheet_40" as const,
                          label: "Phiếu 40 câu trắc nghiệm",
                          desc: "40 câu trắc nghiệm 4 phương án A-B-C-D truyền thống",
                          badge: null,
                        },
                        {
                          id: "sheet_50" as const,
                          label: "Phiếu 50 câu trắc nghiệm",
                          desc: "50 câu trắc nghiệm A-B-C-D cho kì thi THPT cũ",
                          badge: null,
                        },
                      ].map((sheet) => (
                        <div
                          key={sheet.id}
                          onClick={() => setDefaultGradingSheet(sheet.id)}
                          className={`rounded-xl border p-3 cursor-pointer transition flex items-center justify-between gap-3 ${
                            defaultGradingSheet === sheet.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground">{sheet.label}</span>
                              {sheet.badge && (
                                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                  {sheet.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">{sheet.desc}</p>
                          </div>
                          <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                            defaultGradingSheet === sheet.id
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          }`}>
                            {defaultGradingSheet === sheet.id && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Sticky Save Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Cài đặt sẽ tự động áp dụng cho Exam Studio, phiếu chấm OMR và các bản xuất Word.
                </p>
                <button
                  type="submit"
                  disabled={savingTeaching}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {savingTeaching ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu…</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Lưu cài đặt nghiệp vụ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ================= SECTION 4: THÔNG BÁO THEO KÊNH (A13) ================= */}
          {currentSubTab === "notifications" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Bell className="w-5 h-5 text-primary" />
                <span>Cài đặt thông báo & Cảnh báo ví</span>
              </h2>

              <p className="text-xs text-muted-foreground">
                Tùy chỉnh nhận thông báo theo từng loại sự kiện và phương thức truyền thông tin.
              </p>

              <form onSubmit={handleSaveNotifications} className="space-y-4">
                {/* Notification Matrix Table */}
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b border-border text-[11px] uppercase text-muted-foreground">
                      <tr>
                        <th className="p-3.5 font-bold">Loại thông báo</th>
                        <th className="p-3.5 text-center font-bold">Email</th>
                        <th className="p-3.5 text-center font-bold">
                          <div className="flex items-center justify-center gap-1.5">
                            <span>Zalo / SMS</span>
                            <span className="rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold">
                              Sắp ra mắt
                            </span>
                          </div>
                        </th>
                        <th className="p-3.5 text-center font-bold">Trong App</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[
                        {
                          key: "examCompleted" as const,
                          title: "Chấm bài xong & Đề hoàn tất",
                          desc: "Khi AI hoàn thành phân tích bài chấm OMR hoặc sinh xong bộ đề.",
                        },
                        {
                          key: "lowCredits" as const,
                          title: "Credits sắp hết (< 2.000 credits)",
                          desc: "Nhắc nhở số dư sắp cạn để không gián đoạn quá trình soạn giảng.",
                        },
                        {
                          key: "expiryWarning" as const,
                          title: "Sắp hết hạn gói cước (Trước 7 ngày)",
                          desc: "Thông báo chuẩn bị gia hạn gói Giáo Viên PRO / MAX.",
                        },
                        {
                          key: "commission" as const,
                          title: "Hoa hồng đối tác & Giới thiệu",
                          desc: "Khi có đồng nghiệp đăng ký qua link hoặc phát sinh hoa hồng.",
                        },
                        {
                          key: "productUpdates" as const,
                          title: "Tin sản phẩm & Tính năng mới",
                          desc: "Cập nhật các mẫu đề mới theo barem chuẩn của Bộ GD&ĐT (mặc định tắt).",
                        },
                      ].map((item) => (
                        <tr key={item.key} className="hover:bg-muted/20">
                          <td className="p-3.5">
                            <p className="font-bold text-foreground">{item.title}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                          </td>
                          <td className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={notifChannels[item.key].email}
                              onChange={() => handleToggleChannel(item.key, "email")}
                              aria-label={`Nhận email cho ${item.title}`}
                              className="h-4 w-4 rounded accent-primary cursor-pointer"
                            />
                          </td>
                          <td className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={notifChannels[item.key].zalo}
                              onChange={() => handleToggleChannel(item.key, "zalo")}
                              aria-label={`Nhận Zalo cho ${item.title}`}
                              className="h-4 w-4 rounded accent-primary cursor-pointer"
                            />
                          </td>
                          <td className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={notifChannels[item.key].inApp}
                              onChange={() => handleToggleChannel(item.key, "inApp")}
                              aria-label={`Nhận thông báo trong app cho ${item.title}`}
                              className="h-4 w-4 rounded accent-primary cursor-pointer"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground">
                  <Info className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    Kênh thông báo qua Email và Trong App đã hoạt động thực tế. Kênh Zalo ZNS / SMS tự động đang trong tiến trình kiểm thử và kết nối đối tác viễn thông.
                  </span>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={savingNotif}
                    className="rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {savingNotif ? "Đang lưu…" : "Lưu tùy chọn thông báo"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================= SECTION 5: BẢO MẬT & PHIÊN ĐĂNG NHẬP (A11) ================= */}
          {currentSubTab === "security" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <Shield className="w-5 h-5 text-primary" />
                    <span>Bảo mật tài khoản & Phiên đăng nhập</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Quản lý liên kết mạng xã hội, mật khẩu, phiên thiết bị và lớp bảo vệ 2FA nâng cao.
                  </p>
                </div>
              </div>

              {/* Sub-card 1: Tài khoản liên kết (Social Logins) */}
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-border">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      1. Tài khoản liên kết (Social Logins)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Đăng nhập nhanh tiện lợi qua các nền tảng nhận diện học đường được chứng thực.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {/* Google OAuth */}
                  <div
                    className={`rounded-xl border p-3.5 space-y-2 transition ${
                      isOAuthUser
                        ? "border-emerald-500/40 bg-emerald-500/5 shadow-xs"
                        : "border-border bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24Z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15Z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                          />
                        </svg>
                        <span className="text-xs font-bold text-foreground">Google</span>
                      </div>
                      {isOAuthUser ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          Đã kết nối
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Chưa kết nối</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {isOAuthUser ? user?.email : "Đăng nhập nhanh 1-Click"}
                    </p>
                  </div>

                  {/* Microsoft */}
                  <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2 opacity-75">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 23 23">
                          <path fill="#f35325" d="M1 1h10v10H1z" />
                          <path fill="#81bc06" d="M12 1h10v10H12z" />
                          <path fill="#05a6f0" d="M1 12h10v10H1z" />
                          <path fill="#ffba08" d="M12 12h10v10H12z" />
                        </svg>
                        <span className="text-xs font-bold text-foreground">Microsoft 365</span>
                      </div>
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                        Sắp hỗ trợ
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Dành cho email ngành @moet.edu.vn
                    </p>
                  </div>

                  {/* Zalo */}
                  <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2 opacity-75">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-4 w-4 items-center justify-center rounded bg-blue-600 text-[10px] font-black text-white">
                          Z
                        </div>
                        <span className="text-xs font-bold text-foreground">Zalo</span>
                      </div>
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                        Sắp hỗ trợ
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Nhận thông báo điểm & mã OTP
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub-card 2: Mật khẩu & Đăng nhập */}
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        2. {isOAuthUser ? "Thiết lập mật khẩu đăng nhập trực tiếp" : "Đổi mật khẩu tài khoản"}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {isOAuthUser
                          ? "Tạo mật khẩu để Thầy/Cô có thể đăng nhập bằng cả Google và Email + Mật khẩu mọi lúc."
                          : "Định kỳ cập nhật mật khẩu mạnh giúp tài khoản của Thầy/Cô luôn được bảo vệ."}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
                  {passwordMsg && (
                    <div
                      role="alert"
                      className={`rounded-xl p-3 text-xs flex items-center gap-2 ${
                        passwordMsg.type === "error"
                          ? "bg-destructive/10 text-destructive border border-destructive/20"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {passwordMsg.type === "error" ? (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      )}
                      <span>{passwordMsg.text}</span>
                    </div>
                  )}

                  {/* Only show Old Password if user is NOT Google OAuth setup */}
                  {!isOAuthUser && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          Mật khẩu hiện tại
                        </label>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          disabled={sendingResetLink}
                          className="text-[11px] font-semibold text-primary hover:underline cursor-pointer disabled:opacity-50"
                        >
                          {sendingResetLink ? "Đang gửi email..." : "Quên mật khẩu hiện tại?"}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showOldPassword ? "text" : "password"}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="••••••••"
                          className="block w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pr-10 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 transition cursor-pointer"
                          tabIndex={-1}
                        >
                          {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      {isOAuthUser ? "Mật khẩu mới (Tối thiểu 8 ký tự)" : "Mật khẩu mới"}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="block w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pr-10 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 transition cursor-pointer"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator Bar */}
                    {newPassword && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Độ mạnh mật khẩu:</span>
                          <span className="font-bold">{passwordStrength.label}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-full transition-all ${
                                step <= passwordStrength.score ? passwordStrength.color : "bg-transparent"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Xác nhận mật khẩu mới
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="block w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pr-10 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 transition cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={passwordUpdating}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {passwordUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>
                      {passwordUpdating
                        ? "Đang xử lý…"
                        : isOAuthUser
                        ? "Thiết lập mật khẩu trực tiếp"
                        : "Cập nhật mật khẩu"}
                    </span>
                  </button>
                </form>
              </div>

              {/* Sub-card 3: Phiên đăng nhập & Thiết bị */}
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        3. Phiên đăng nhập & Thiết bị
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Nhận diện thiết bị và vị trí mạng đang truy cập tài khoản của Thầy/Cô.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-foreground">
                            {deviceInfo.browser} trên {deviceInfo.os}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Thiết bị này
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {deviceInfo.deviceType} • Địa chỉ IP: <strong className="text-foreground">{deviceInfo.ip}</strong>
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Vị trí ước tính: <span className="text-foreground">{deviceInfo.location}</span> • {deviceInfo.lastActive}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleLogoutOthers}
                    disabled={loggingOutOthers}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted transition cursor-pointer disabled:opacity-50"
                  >
                    {loggingOutOthers ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                    <span>{loggingOutOthers ? "Đang xử lý…" : "Đăng xuất khỏi tất cả các thiết bị khác"}</span>
                  </button>
                </div>
              </div>

              {/* Sub-card 4: Xác thực 2 bước (2FA) */}
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        4. Xác thực 2 bước (2FA - TOTP)
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Yêu cầu mã 6 số từ Google Authenticator hoặc Microsoft Authenticator khi đăng nhập.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/20">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">Trạng thái bảo vệ 2FA</span>
                      {twoFactorEnabled ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          Đã kích hoạt
                        </span>
                      ) : (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          Chưa kích hoạt
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {twoFactorEnabled
                        ? "Tài khoản đang được bảo vệ bởi mã TOTP. Thầy/Cô có thể tạo lại mã dự phòng hoặc tắt khi cần."
                        : "Khuyến nghị kích hoạt để ngăn chặn tuyệt đối nguy cơ rò rỉ đề thi và số dư credits."}
                    </p>
                  </div>

                  <div>
                    {twoFactorEnabled ? (
                      <button
                        type="button"
                        onClick={handleRequestDisable2fa}
                        className="px-4 py-2 text-xs font-semibold rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 transition cursor-pointer"
                      >
                        Tắt 2FA…
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowTwoFactorModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Thiết lập 2FA</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-card 5: Xuất dữ liệu cá nhân & Hoạt động */}
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        5. Xuất dữ liệu cá nhân & Hoạt động
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Tải về bản sao toàn bộ hồ sơ, dữ liệu đề thi và biến động ví credits (Nghị định 13/2023/NĐ-CP).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/20">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">Bản sao dữ liệu sư phạm</p>
                    <p className="text-[11px] text-muted-foreground">
                      Hỗ trợ xuất bảng tính <strong>Excel / CSV (.csv)</strong> để mở đọc dễ dàng hoặc <strong>JSON kỹ thuật (.json)</strong>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowExportModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-border bg-card hover:bg-muted transition cursor-pointer shadow-2xs shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Yêu cầu xuất dữ liệu…</span>
                  </button>
                </div>
              </div>

              {/* Sub-card 6: Khu vực nguy hiểm (Xóa tài khoản) */}
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-start gap-2.5 text-destructive">
                  <Trash2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold">Khu vực nguy hiểm: Xóa tài khoản vĩnh viễn</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Toàn bộ dữ liệu đề thi, ma trận đặc tả, điểm số học sinh và số dư credits còn lại sẽ bị hủy vĩnh viễn. Có thời gian ân hạn phục hồi 14 ngày theo Nghị định 13/2023/NĐ-CP.
                    </p>
                  </div>
                </div>

                {deletionPending ? (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                          Tài khoản đang trong thời gian chờ ân hạn xóa (14 ngày)
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Yêu cầu xóa tài khoản đã được tiếp nhận và xử lý. Tài khoản và toàn bộ dữ liệu sẽ bị thanh lọc vĩnh viễn vào ngày:{" "}
                          <strong className="text-foreground">
                            {scheduledPurgeDate
                              ? new Date(scheduledPurgeDate).toLocaleDateString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "sau 14 ngày kể từ ngày yêu cầu"}
                          </strong>
                          . Thầy/Cô có thể hủy yêu cầu bất cứ lúc nào trước thời hạn này.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleCancelDeleteAccount}
                        disabled={cancellingDeletion}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-background border border-amber-500/40 text-foreground hover:bg-muted transition cursor-pointer disabled:opacity-50"
                      >
                        {cancellingDeletion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        <span>Hủy yêu cầu xóa tài khoản</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleRequestDeleteAccount}
                      className="px-4 py-2 text-xs font-bold rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 transition cursor-pointer"
                    >
                      Yêu cầu xóa tài khoản…
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= SECTION 6: GIAO DIỆN (A14) ================= */}
          {currentSubTab === "appearance" && (
            <div className="space-y-6">
              {/* Main Appearance Card */}
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-6">
                {/* Header with Cloud Sync Status */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                      <Palette className="w-5 h-5 text-primary" />
                      <span>Tùy chỉnh giao diện hiển thị</span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Cá nhân hóa chế độ sáng tối, kích thước cỡ chữ, mật độ hiển thị và chế độ máy chiếu trường học.
                    </p>
                  </div>

                  {/* Cloud sync status indicator */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-border bg-muted/60 self-start sm:self-auto shadow-2xs">
                    {cloudSyncStatus === "syncing" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        <span className="text-muted-foreground font-semibold">Đang đồng bộ…</span>
                      </>
                    ) : cloudSyncStatus === "saved" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Đã đồng bộ lên đám mây</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Tự động đồng bộ</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 1. Theme Mode with Wireframe Skeleton Previews */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Chế độ màu hiển thị (Theme)
                    </p>
                    <span className="text-[11px] text-muted-foreground">Đồng bộ 2 chiều với thanh Topbar</span>
                  </div>
                  <div className="grid gap-3.5 sm:grid-cols-3">
                    {[
                      {
                        value: "light" as const,
                        label: "Giao diện Sáng",
                        desc: "Nền dịu mắt, tối ưu làm việc ban ngày & in ấn",
                        icon: Sun,
                      },
                      {
                        value: "dark" as const,
                        label: "Giao diện Tối",
                        desc: "Độ tương phản cao, giảm chói mắt ban đêm",
                        icon: Moon,
                      },
                      {
                        value: "system" as const,
                        label: "Theo hệ thống",
                        desc: "Tự động đổi theo thiết bị & trình duyệt",
                        icon: Laptop,
                      },
                    ].map((theme) => {
                      const isSelected = currentTheme === theme.value;
                      const Icon = theme.icon;
                      return (
                        <button
                          key={theme.value}
                          type="button"
                          onClick={() => applyTheme(theme.value)}
                          className={`rounded-2xl border p-4 text-left transition cursor-pointer relative group ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-2 ring-primary/40 font-bold shadow-xs"
                              : "border-border hover:bg-muted/60 hover:border-border/80"
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute top-3 right-3 rounded-full bg-primary p-0.5 text-white shadow-xs z-10">
                              <Check className="w-3 h-3" />
                            </span>
                          )}

                          {/* Mini-skeleton Visual Wireframe */}
                          {theme.value === "light" && (
                            <div className="h-16 w-full rounded-xl border border-slate-200 bg-white p-2 mb-3 shadow-2xs space-y-1.5 pointer-events-none">
                              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                <div className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                </div>
                                <span className="h-1 w-8 rounded bg-slate-200" />
                              </div>
                              <div className="flex gap-1.5">
                                <div className="w-5 h-8 rounded bg-slate-100 border border-slate-200/50" />
                                <div className="flex-1 space-y-1">
                                  <div className="h-1.5 w-4/5 rounded bg-blue-500/80" />
                                  <div className="h-1.5 w-3/5 rounded bg-slate-200" />
                                  <div className="h-1.5 w-2/3 rounded bg-slate-100" />
                                </div>
                              </div>
                            </div>
                          )}

                          {theme.value === "dark" && (
                            <div className="h-16 w-full rounded-xl border border-slate-800 bg-slate-950 p-2 mb-3 shadow-2xs space-y-1.5 pointer-events-none">
                              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                                <div className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                </div>
                                <span className="h-1 w-8 rounded bg-slate-700" />
                              </div>
                              <div className="flex gap-1.5">
                                <div className="w-5 h-8 rounded bg-slate-900 border border-slate-800" />
                                <div className="flex-1 space-y-1">
                                  <div className="h-1.5 w-4/5 rounded bg-blue-500" />
                                  <div className="h-1.5 w-3/5 rounded bg-slate-700" />
                                  <div className="h-1.5 w-2/3 rounded bg-slate-800" />
                                </div>
                              </div>
                            </div>
                          )}

                          {theme.value === "system" && (
                            <div className="h-16 w-full rounded-xl border border-border overflow-hidden mb-3 shadow-2xs flex pointer-events-none">
                              {/* Left half: Light */}
                              <div className="w-1/2 bg-white p-2 space-y-1.5 border-r border-slate-200">
                                <div className="flex items-center gap-1 pb-1 border-b border-slate-100">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                </div>
                                <div className="h-1.5 w-4/5 rounded bg-blue-500/80" />
                                <div className="h-1.5 w-2/3 rounded bg-slate-200" />
                              </div>
                              {/* Right half: Dark */}
                              <div className="w-1/2 bg-slate-950 p-2 space-y-1.5">
                                <div className="flex items-center justify-end gap-1 pb-1 border-b border-slate-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                </div>
                                <div className="h-1.5 w-4/5 rounded bg-blue-500" />
                                <div className="h-1.5 w-2/3 rounded bg-slate-700" />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                            <p className="text-xs font-bold text-foreground">{theme.label}</p>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{theme.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Font Size - Balanced 3-Column Grid */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Kích thước cỡ chữ hiển thị
                    </p>
                    <span className="text-[11px] text-muted-foreground">Cân bằng tỷ lệ mắt đọc toàn hệ thống</span>
                  </div>
                  <div className="grid gap-3.5 sm:grid-cols-3">
                    {[
                      {
                        id: "small" as const,
                        label: "Nhỏ gọn (90% - 14.5px)",
                        desc: "Tối ưu laptop 13-14 inch & hiển thị nhiều dòng hơn",
                        sampleText: "Aa",
                        sampleSizeClass: "text-sm font-semibold",
                      },
                      {
                        id: "normal" as const,
                        label: "Tiêu chuẩn (100% - 16px)",
                        desc: "Cân đối tỷ lệ mắt đọc chuẩn giao diện giáo dục",
                        sampleText: "Aa",
                        sampleSizeClass: "text-lg font-bold",
                      },
                      {
                        id: "large" as const,
                        label: "Lớn (115% - 18px)",
                        desc: "Chữ to rõ nét, chống mỏi mắt khi soạn giáo án lâu",
                        sampleText: "Aa",
                        sampleSizeClass: "text-2xl font-black text-primary",
                      },
                    ].map((item) => {
                      const isSelected = fontSize === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => applyFontSize(item.id)}
                          className={`rounded-2xl border p-4 text-left transition cursor-pointer relative group ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-2 ring-primary/40 font-bold shadow-xs"
                              : "border-border hover:bg-muted/60 hover:border-border/80"
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute top-3 right-3 rounded-full bg-primary p-0.5 text-white shadow-xs z-10">
                              <Check className="w-3 h-3" />
                            </span>
                          )}

                          {/* Visual Aa Badge Sample */}
                          <div className="h-14 w-full rounded-xl border border-border/60 bg-muted/40 flex items-center justify-center mb-3">
                            <span className={`${item.sampleSizeClass} text-foreground tracking-tight`}>
                              {item.sampleText}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-foreground mb-1">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Live Preview Card with Authentic LaTeX (Math & Chemistry) */}
                <div className="pt-4 border-t border-border">
                  <div className="rounded-2xl border-2 border-primary/25 bg-muted/20 p-4 sm:p-5 shadow-2xs space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Khung xem trước trực tiếp (Live Preview)
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Đổi màu hoặc cỡ chữ ở trên để kiểm tra công thức Toán & Hóa học phản ứng tức thì
                          </p>
                        </div>
                      </div>

                      {/* Subject Switch Tabs */}
                      <div className="inline-flex p-1 rounded-xl bg-card border border-border text-xs self-start sm:self-auto shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setPreviewSubject("math")}
                          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                            previewSubject === "math"
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Toán & Vật lý
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewSubject("chem")}
                          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                            previewSubject === "chem"
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Hóa học
                        </button>
                      </div>
                    </div>

                    {/* Question Interactive Box */}
                    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3 shadow-2xs">
                      {previewSubject === "math" ? (
                        <>
                          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                              Câu 1 (Mức độ Vận dụng)
                            </span>
                            <span className="text-muted-foreground">Toán 12 • GDPT 2025</span>
                          </div>

                          <div className="text-xs sm:text-sm text-foreground leading-relaxed latex-content">
                            <LatexRenderer
                              content="Cho hàm số $y = f(x) = \frac{2x - 1}{x + 1}$ có đồ thị $(C)$. Biết tích phân xác định $I = \int_{0}^{1} \sqrt{x^2 + 1} \, dx = \frac{\sqrt{2} + \ln(1 + \sqrt{2})}{2}$. Khẳng định nào sau đây là đúng về đường tiệm cận của đồ thị hàm số?"
                            />
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2 pt-1">
                            {[
                              { key: "A", content: "Đồ thị $(C)$ có tiệm cận đứng $x = 1$ và $y = 2$" },
                              { key: "B", content: "Đồ thị $(C)$ có tiệm cận đứng $x = -1$ và tiệm cận ngang $y = 2$" },
                              { key: "C", content: "Đồ thị $(C)$ không có tiệm cận ngang" },
                              { key: "D", content: "Đồ thị $(C)$ có tiệm cận đứng $y = -1$ và tiệm cận ngang $x = 2$" },
                            ].map((opt) => {
                              const isChecked = selectedPreviewAnswer === opt.key;
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  onClick={() => setSelectedPreviewAnswer(opt.key)}
                                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                                    isChecked
                                      ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs ring-1 ring-primary"
                                      : "border-border hover:bg-muted/50 text-foreground"
                                  }`}
                                >
                                  <span
                                    className={`flex h-4 w-4 shrink-0 rounded-full border items-center justify-center text-[10px] font-bold mt-0.5 ${
                                      isChecked
                                        ? "border-primary bg-primary text-white"
                                        : "border-muted-foreground/40 text-muted-foreground"
                                    }`}
                                  >
                                    {opt.key}
                                  </span>
                                  <span className="flex-1 latex-content">
                                    <LatexRenderer content={opt.content} />
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                              Câu 2 (Thí nghiệm Hóa học)
                            </span>
                            <span className="text-muted-foreground">Hóa học 12 • Phản ứng oxi hóa khử</span>
                          </div>

                          <div className="text-xs sm:text-sm text-foreground leading-relaxed latex-content">
                            <LatexRenderer
                              content="Hòa tan hoàn toàn $5{,}4\text{ g}$ bột nhôm ($\text{Al}$) trong lượng dư dung dịch $\text{HCl}$, thu được khí $\text{H}_2 \uparrow$. Sục tiếp khí thu được qua dung dịch $\text{Ba(OH)}_2$ thấy xuất hiện kết tủa trắng $\text{BaSO}_4 \downarrow$. Phương trình phản ứng chính: $$2\text{Al} + 6\text{HCl} \longrightarrow 2\text{AlCl}_3 + 3\text{H}_2 \uparrow$$ Thể tích khí $\text{H}_2$ thu được ở điều kiện chuẩn ($25^\circ\text{C}, 1\text{ bar}$) là:"
                            />
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2 pt-1">
                            {[
                              { key: "A", content: "$4{,}48\\text{ lít}$" },
                              { key: "B", content: "$7{,}437\\text{ lít}$" },
                              { key: "C", content: "$2{,}24\\text{ lít}$" },
                              { key: "D", content: "$6{,}72\\text{ lít}$" },
                            ].map((opt) => {
                              const isChecked = selectedPreviewAnswer === opt.key;
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  onClick={() => setSelectedPreviewAnswer(opt.key)}
                                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                                    isChecked
                                      ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs ring-1 ring-primary"
                                      : "border-border hover:bg-muted/50 text-foreground"
                                  }`}
                                >
                                  <span
                                    className={`flex h-4 w-4 shrink-0 rounded-full border items-center justify-center text-[10px] font-bold mt-0.5 ${
                                      isChecked
                                        ? "border-primary bg-primary text-white"
                                        : "border-muted-foreground/40 text-muted-foreground"
                                    }`}
                                  >
                                    {opt.key}
                                  </span>
                                  <span className="flex-1 latex-content">
                                    <LatexRenderer content={opt.content} />
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. UI Density (Mật độ hiển thị) */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Mật độ hiển thị giao diện (UI Density)
                    </p>
                    <span className="text-[11px] text-muted-foreground">Tối ưu thao tác chấm bài & duyệt đề</span>
                  </div>
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    {[
                      {
                        id: "comfortable" as const,
                        label: "Tiêu chuẩn (Thoáng đãng)",
                        desc: "Khoảng cách đệm rộng rãi (padding 16px), dễ thao tác chuột và cảm ứng trên tablet",
                        icon: LayoutGrid,
                      },
                      {
                        id: "compact" as const,
                        label: "Thu gọn (Compact Mode)",
                        desc: "Tối ưu chấm trắc nghiệm OMR & ngân hàng câu hỏi, hiển thị nhiều dữ liệu hơn mà không phải cuộn chuột",
                        icon: Rows,
                      },
                    ].map((item) => {
                      const isSelected = uiDensity === item.id;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => applyUiDensity(item.id)}
                          className={`rounded-2xl border p-4 text-left transition cursor-pointer relative group ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-2 ring-primary/40 font-bold shadow-xs"
                              : "border-border hover:bg-muted/60 hover:border-border/80"
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute top-3 right-3 rounded-full bg-primary p-0.5 text-white shadow-xs z-10">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                          <div className="flex items-center gap-2 mb-1.5">
                            <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                            <p className="text-xs font-bold text-foreground">{item.label}</p>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Accessibility & Classroom Presentation Toggles */}
                <div className="pt-4 border-t border-border space-y-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Trợ năng & Trình chiếu giảng đường
                  </p>

                  {/* Projector / High Contrast Mode */}
                  <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/30">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Presentation className="w-4 h-4 text-amber-500 shrink-0" />
                        <p className="text-xs font-bold text-foreground">
                          Tối ưu cho Máy chiếu trường học (Chữ đậm & Tương phản cao)
                        </p>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Tăng độ dày font chữ (+1 weight), viền khung đen/trắng sắc nét hơn 50% và phóng to công thức LaTeX để học sinh ngồi bàn cuối vẫn nhìn rõ khi chiếu lên màn chiếu lớp học.
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={highContrastProjector}
                      onClick={() => applyHighContrastProjector(!highContrastProjector)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-primary ${
                        highContrastProjector
                          ? "bg-primary"
                          : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          highContrastProjector ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Reduced Motion Toggle with Corrected Visual Knob */}
                  <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/30">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-primary shrink-0" />
                        <p className="text-xs font-bold text-foreground">
                          Giảm hiệu ứng chuyển động (Reduced Motion)
                        </p>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Hạn chế các hiệu ứng chuyển cảnh và chuyển động trên trang cho người dùng nhạy cảm hoặc máy tính cấu hình văn phòng.
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={reducedMotion}
                      onClick={() => applyReducedMotion(!reducedMotion)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-primary ${
                        reducedMotion
                          ? "bg-primary"
                          : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          reducedMotion ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AVATAR CROP MODAL (A5) */}
      {cropImageSrc && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          onCancel={() => setCropImageSrc(null)}
          onConfirm={handleConfirmAvatarCrop}
        />
      )}

      {/* CHANGE EMAIL MODAL (A4, A12) */}
      <ChangeEmailModal
        isOpen={showChangeEmailModal}
        currentEmail={user?.email || ""}
        onClose={() => setShowChangeEmailModal(false)}
        onSuccessToast={(msg) => showToast(msg, "success")}
      />

      {/* UNSAVED CHANGES MODAL (A2) */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        saving={savingProfile}
        onStay={() => {
          setShowUnsavedModal(false);
          setPendingSubTab(null);
        }}
        onDiscard={() => {
          handleDiscardProfileChanges();
          setShowUnsavedModal(false);
          if (pendingSubTab) {
            onSectionChange?.(pendingSubTab);
            setPendingSubTab(null);
          }
        }}
        onSave={async () => {
          await handleSaveProfile();
          setShowUnsavedModal(false);
          if (pendingSubTab) {
            onSectionChange?.(pendingSubTab);
            setPendingSubTab(null);
          }
        }}
      />

      {/* TWO FACTOR SETUP MODAL */}
      <TwoFactorModal
        isOpen={showTwoFactorModal}
        onClose={() => setShowTwoFactorModal(false)}
        onSuccess={handle2faSuccess}
      />

      {/* EXPORT DATA MODAL */}
      <ExportDataModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onConfirmExport={handleConfirmExportFormat}
      />

      {/* RE-AUTHENTICATION MODAL */}
      <ReAuthModal
        isOpen={showReAuthModal}
        onClose={() => {
          setShowReAuthModal(false);
          setReAuthAction(null);
        }}
        onSuccess={handleReAuthSuccess}
        title={reAuthAction?.title}
        description={reAuthAction?.description}
        isDanger={reAuthAction?.isDanger}
        userEmail={user?.email}
        isOAuthOnly={isOAuthUser}
      />

      {/* DELETE ACCOUNT CONFIRMATION MODAL (A11) */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-card text-card-foreground border border-destructive/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteEmailConfirm("");
              }}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 id="delete-account-modal-title" className="text-base font-bold text-foreground mb-1">
              Xác nhận yêu cầu xóa tài khoản
            </h3>

            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Hành động này sẽ lên lịch hủy vĩnh viễn tài khoản. Toàn bộ giáo án, đề thi và credits sẽ bị xóa hoàn toàn sau thời gian ân hạn 14 ngày.
            </p>

            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive space-y-1 mb-4">
              <p className="font-bold">Để xác nhận, vui lòng gõ chính xác email tài khoản của bạn:</p>
              <p className="font-mono font-bold text-foreground">{user?.email}</p>
            </div>

            <input
              type="email"
              value={deleteEmailConfirm}
              onChange={(e) => setDeleteEmailConfirm(e.target.value)}
              placeholder="Gõ email vào đây để xác nhận"
              className="block w-full rounded-xl border border-border bg-background px-4 py-2 text-xs focus:border-destructive focus:outline-none focus:ring-1 focus:ring-destructive mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteEmailConfirm("");
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                disabled={
                  deletingAccount ||
                  deleteEmailConfirm.trim().toLowerCase() !== user?.email?.toLowerCase()
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition shadow-xs cursor-pointer disabled:opacity-40"
              >
                {deletingAccount ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Xác nhận xóa tài khoản</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GeneralTab;

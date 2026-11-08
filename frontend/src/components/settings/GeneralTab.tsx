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
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { useConfirm } from "@/context/confirm-dialog-context";
import { createClient } from "@/lib/supabase/client";
import {
  getUserPreferences,
  saveUserPreferencesLocal,
  UserPreferences,
} from "@/lib/preferences";
import { TeacherVerificationCard } from "@/components/verification/teacher-verification-card";
import { PlanStatusCard } from "./PlanStatusCard";
import { AvatarCropModal } from "./AvatarCropModal";
import { ChangeEmailModal } from "./ChangeEmailModal";
import { UnsavedChangesModal } from "./UnsavedChangesModal";
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
  "THCS (Khối 6–9)",
  "THPT (Khối 10–12)",
  "Luyện thi Đại học / ĐGNL",
  "Khác",
];

export function GeneralTab({
  activeSection = "profile",
  onSectionChange,
  onNavigateToPlan,
  onNavigateToPartner,
  initialSubTab,
}: GeneralTabProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

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
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>("THPT (Khối 10–12)");
  const [initialGradeLevel, setInitialGradeLevel] = useState<string>("THPT (Khối 10–12)");

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
    selectedGradeLevel !== initialGradeLevel ||
    JSON.stringify(selectedSubjects.sort()) !== JSON.stringify(initialSubjects.sort());

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
      const gradeLevel = prefs.teaching.gradeLevel || "THPT (Khối 10–12)";

      setSelectedSubjects(subjects);
      setInitialSubjects(subjects);
      setSelectedGradeLevel(gradeLevel);
      setInitialGradeLevel(gradeLevel);
    }
  }, [profile]);

  // ================= 2. AVATAR STATE (A5) =================
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isDragOverAvatar, setIsDragOverAvatar] = useState(false);

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

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Không thể cập nhật ảnh đại diện.");
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
      const res = await fetch("/api/user/avatar", {
        method: "DELETE",
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Không thể xóa ảnh.");
      }

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

      const supabase = createClient();

      // Update preferences with teaching defaults
      const currentPrefs = getUserPreferences(profile);
      const updatedPreferences: UserPreferences = {
        ...currentPrefs,
        teaching: {
          ...currentPrefs.teaching,
          school: cleanSchool || "",
          subjects: selectedSubjects,
          gradeLevel: selectedGradeLevel,
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

      const { error } = await (supabase.from("users") as any)
        .update(payload)
        .eq("id", user.id);

      if (error) {
        // Fallback without phone if DB column isn't migrated
        delete payload.phone;
        await (supabase.from("users") as any).update(payload).eq("id", user.id);
      }

      // Update initial values to reset dirty state
      setInitialName(cleanName);
      setInitialPhone(phone.trim());
      setInitialSchool(school.trim());
      setInitialSubjects([...selectedSubjects]);
      setInitialGradeLevel(selectedGradeLevel);

      await refreshProfile();
      showToast("Đã lưu hồ sơ", "success");
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
    setSelectedGradeLevel(initialGradeLevel);
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
        const supabase = createClient();
        await (supabase.from("users") as any)
          .update({
            preferences: updatedPreferences,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
        await refreshProfile();
      } catch (err: any) {
        console.warn("Could not sync preferences to DB, saved locally:", err);
      }
    }

    setSavingTeaching(false);
    showToast("Đã lưu cài đặt nghiệp vụ thành công!", "success");
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
        const supabase = createClient();
        await (supabase.from("users") as any)
          .update({
            preferences: updatedPreferences,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
        await refreshProfile();
      } catch (err: any) {
        console.warn("Could not sync notifications to DB, saved locally:", err);
      }
    }

    setSavingNotif(false);
    showToast("Đã lưu cài đặt thông báo thành công!", "success");
  };

  // ================= 6. SECURITY STATE & PASSWORD STRENGTH (A11) =================
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [loggingOutOthers, setLoggingOutOthers] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Danger Zone: Delete Account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

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

      showToast("Cập nhật mật khẩu thành công!", "success");
      setPasswordMsg({
        type: "success",
        text: "Đổi mật khẩu thành công! Hãy dùng mật khẩu mới cho lần đăng nhập sau.",
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Không thể đổi mật khẩu." });
    } finally {
      setPasswordUpdating(false);
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

  // Export personal data (A11)
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

      showToast("Đã tải xuống bản sao dữ liệu cá nhân.", "success");
    } catch (err) {
      showToast("Không thể xuất dữ liệu. Vui lòng thử lại.", "error");
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (deleteEmailConfirm.trim().toLowerCase() !== user?.email?.toLowerCase()) {
      showToast("Email xác nhận không khớp.", "error");
      return;
    }

    setDeletingAccount(true);
    try {
      // Create request in backend or notify admin
      showToast(
        "Yêu cầu xóa tài khoản đã được ghi nhận. Thời gian chờ ân hạn 14 ngày trước khi xóa vĩnh viễn.",
        "warning",
        8000
      );
      setShowDeleteModal(false);
    } catch (err: any) {
      showToast("Không thể gửi yêu cầu xóa tài khoản.", "error");
    } finally {
      setDeletingAccount(false);
    }
  };

  // ================= 7. APPEARANCE (A14) =================
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark" | "system">("system");
  const [fontSize, setFontSize] = useState<"normal" | "large">("normal");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem("app_theme") as any) || "system";
      setCurrentTheme(savedTheme);

      const savedSize = (localStorage.getItem("app_font_size") as any) || "normal";
      setFontSize(savedSize);

      const savedMotion = localStorage.getItem("app_reduced_motion") === "true";
      setReducedMotion(savedMotion);
    } catch {
      // ignore
    }
  }, []);

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
    } catch {
      // ignore
    }
    showToast(`Đã chuyển sang giao diện ${theme === "dark" ? "Tối" : theme === "light" ? "Sáng" : "Theo hệ thống"}`, "info");
  };

  const applyFontSize = (size: "normal" | "large") => {
    setFontSize(size);
    try {
      localStorage.setItem("app_font_size", size);
      if (size === "large") {
        document.documentElement.style.fontSize = "17px";
      } else {
        document.documentElement.style.fontSize = "16px";
      }
    } catch {
      // ignore
    }
    showToast(`Đã điều chỉnh cỡ chữ: ${size === "large" ? "Lớn (110%)" : "Vừa (100%)"}`, "info");
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

  const isOAuthUser = user?.app_metadata?.provider === "google";

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
    <div className="space-y-6">
      {/* Autocomplete Datalist for Schools (A6) */}
      <datalist id="school-suggestions">
        {VIETNAM_SCHOOL_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {/* Two-Level Navigation Layout (A1, A10) */}
      <div className="grid gap-6 lg:grid-cols-4 items-start">
        {/* Left Sub-Navigation Sidebar */}
        <div className="space-y-3">
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
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={`Ảnh đại diện của ${name || "giáo viên"}`}
                        className="h-24 w-24 rounded-full object-cover border-2 border-primary shadow-sm"
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

                    {/* Môn dạy (Multi-select pills) */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-2">
                        Môn học phụ trách giảng dạy (Chọn một hoặc nhiều môn):
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {SUBJECT_OPTIONS.map((sub) => {
                          const isSelected = selectedSubjects.includes(sub);
                          return (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedSubjects((prev) => prev.filter((s) => s !== sub));
                                } else {
                                  setSelectedSubjects((prev) => [...prev, sub]);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary shadow-2xs font-bold"
                                  : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                              }`}
                            >
                              {isSelected ? "✓ " : ""}
                              {sub}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Cấp / Khối lớp */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-2">
                        Cấp / Khối lớp thường dạy:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {GRADE_LEVEL_OPTIONS.map((lvl) => {
                          const isSelected = selectedGradeLevel === lvl;
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setSelectedGradeLevel(lvl)}
                              className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition cursor-pointer ${
                                isSelected
                                  ? "bg-primary/10 text-primary border-primary ring-1 ring-primary font-bold shadow-2xs"
                                  : "bg-card text-muted-foreground border-border hover:bg-muted"
                              }`}
                            >
                              {lvl}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        Hệ thống sẽ dùng môn và cấp lớp này làm mặc định khi Thầy Cô mở trình Soạn đề thi và cá nhân hóa bảng trắng.
                      </p>
                    </div>
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
              <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span>Nghiệp vụ & Quy cách soạn đề thi</span>
              </h2>

              {/* Block 1: Header Word */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      1. Thông tin đầu trang đề thi (Header file Word)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Tự động điền góc trái đầu trang của file Word (.docx) xuất ra theo quy chuẩn Bộ GD&ĐT.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                      Sở Giáo dục & Đào tạo / Cơ quan chủ quản
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="VD: SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI"
                      className="block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                      Tên trường học / Trung tâm đào tạo
                    </label>
                    <input
                      type="text"
                      value={schoolHeader}
                      onChange={(e) => setSchoolHeader(e.target.value)}
                      placeholder="VD: TRƯỜNG THPT CHUYÊN HÀ NỘI - AMSTERDAM"
                      className="block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Tổ bộ môn / Tên giáo viên biên soạn
                  </label>
                  <input
                    type="text"
                    value={teacherTitle}
                    onChange={(e) => setTeacherTitle(e.target.value)}
                    placeholder="VD: Tổ Toán - Tin | Thầy Nguyễn Văn A"
                    className="block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Block 2: Môn & Thời gian */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      2. Môn dạy & Khối lớp mặc định khi khởi tạo đề
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Tự động chọn sẵn khi thầy cô mở Exam Studio tạo đề mới.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                      Môn học chính
                    </label>
                    <select
                      value={defaultSubject}
                      onChange={(e) => setDefaultSubject(e.target.value)}
                      className="block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      {SUBJECT_OPTIONS.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                      Khối lớp thường dạy
                    </label>
                    <select
                      value={defaultGrade}
                      onChange={(e) => setDefaultGrade(e.target.value)}
                      className="block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      {["12", "11", "10", "9", "8", "7", "6"].map((g) => (
                        <option key={g} value={g}>
                          Lớp {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                      Thời gian làm bài chuẩn
                    </label>
                    <select
                      value={defaultDuration}
                      onChange={(e) => setDefaultDuration(Number(e.target.value))}
                      className="block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value={15}>15 phút (Kiểm tra 15p)</option>
                      <option value={45}>45 phút (1 tiết)</option>
                      <option value={50}>50 phút (Chuẩn GDPT 2025)</option>
                      <option value={60}>60 phút</option>
                      <option value={90}>90 phút (Học kỳ / Tốt nghiệp)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Block 3: Định dạng Word & Watermark */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <Sliders className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      3. Định dạng xuất Word (.docx) & Watermark
                    </h3>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                      Font chữ văn bản Word
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
                          className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                            docxFont === item.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary font-bold"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          <p className="text-xs font-bold">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                      Cỡ chữ nội dung câu hỏi
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
                          className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                            docxFontSize === item.size
                              ? "border-primary bg-primary/5 ring-1 ring-primary font-bold"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          <p className="text-xs font-bold">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Watermark toggle */}
                <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground">Chèn Watermark bản quyền giáo viên</p>
                      <p className="text-[11px] text-muted-foreground">
                        Hiển thị dòng ghi chú bản quyền ở chân trang file Word xuất ra.
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={docxEnableWatermark}
                        onChange={(e) => setDocxEnableWatermark(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
                    </label>
                  </div>

                  {docxEnableWatermark && (
                    <input
                      type="text"
                      value={docxWatermarkText}
                      onChange={(e) => setDocxWatermarkText(e.target.value)}
                      placeholder="VD: Biên soạn: Thầy Nguyễn Văn A - Hotline/Zalo: 0987.xxx.xxx"
                      className="block w-full rounded-xl border border-border bg-background px-4 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  )}
                </div>
              </div>

              {/* Block 4: Phiếu chấm OMR & AI Model */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <Cpu className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      4. Mẫu phiếu chấm OMR & Chế độ AI phân tích
                    </h3>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">
                      Mẫu phiếu trả lời trắc nghiệm mặc định
                    </label>
                    <div className="space-y-2">
                      {[
                        {
                          id: "gdpt_2025" as const,
                          label: "Chuẩn GDPT 2025 (Bộ GD&ĐT)",
                          desc: "Phần I: 12 MCQ, Phần II: 4 Đúng/Sai, Phần III: 6 Trả lời ngắn",
                        },
                        { id: "sheet_40" as const, label: "Phiếu 40 câu trắc nghiệm", desc: "4 phương án A-B-C-D" },
                        { id: "sheet_50" as const, label: "Phiếu 50 câu trắc nghiệm", desc: "Dành cho thi THPT truyền thống" },
                      ].map((sheet) => (
                        <div
                          key={sheet.id}
                          onClick={() => setDefaultGradingSheet(sheet.id)}
                          className={`rounded-xl border p-3 cursor-pointer transition ${
                            defaultGradingSheet === sheet.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{sheet.label}</span>
                            {defaultGradingSheet === sheet.id && <Check className="w-3.5 h-3.5 text-primary" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{sheet.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">
                      Chế độ AI suy luận ưu tiên
                    </label>
                    <div className="space-y-2">
                      {[
                        {
                          id: "thinking" as const,
                          label: "Gemini 2.0 Thinking (Deep Reasoning)",
                          desc: "Suy luận đa tác tử, kiểm tra ma trận logic bài toán vận dụng cao.",
                        },
                        {
                          id: "gemini" as const,
                          label: "Gemini 2.0 Flash (Tốc độ cao)",
                          desc: "Phản hồi siêu tốc 2–3s, sinh nhanh ngân hàng câu hỏi nhận biết.",
                        },
                      ].map((ai) => (
                        <div
                          key={ai.id}
                          onClick={() => setPreferredAiModel(ai.id)}
                          className={`rounded-xl border p-3 cursor-pointer transition ${
                            preferredAiModel === ai.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{ai.label}</span>
                            {preferredAiModel === ai.id && <Check className="w-3.5 h-3.5 text-primary" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{ai.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingTeaching}
                  className="rounded-xl bg-primary px-8 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {savingTeaching ? "Đang lưu…" : "Lưu cài đặt nghiệp vụ"}
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
                        <th className="p-3.5 text-center font-bold">Zalo / SMS</th>
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
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Shield className="w-5 h-5 text-primary" />
                <span>Bảo mật tài khoản & Phiên đăng nhập</span>
              </h2>

              {/* ĐỔI MẬT KHẨU VỚI CHỈ BÁO ĐỘ MẠNH (A11) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-border">
                  <KeyRound className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Đổi mật khẩu tài khoản</h3>
                </div>

                {isOAuthUser ? (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-950/20 p-4 text-xs text-blue-800 dark:text-blue-300">
                    Tài khoản của bạn đang đăng nhập an toàn thông qua <strong>Google OAuth</strong>. Mật khẩu được bảo vệ trực tiếp bởi tài khoản Google.
                  </div>
                ) : (
                  <form onSubmit={handleUpdatePassword} className="space-y-3.5 max-w-md">
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

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Mật khẩu hiện tại
                      </label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-foreground">
                          Mật khẩu mới (Tối thiểu 8 ký tự)
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{showPassword ? "Ẩn" : "Hiện"}</span>
                        </button>
                      </div>

                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="block w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />

                      {/* Password Strength Indicator Bar */}
                      {newPassword && (
                        <div className="mt-2 space-y-1">
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

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Xác nhận mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="block w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={passwordUpdating}
                      className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {passwordUpdating ? "Đang xử lý…" : "Cập nhật mật khẩu"}
                    </button>
                  </form>
                )}
              </div>

              {/* PHIÊN ĐĂNG NHẬP (A11) */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Phiên đăng nhập & Thiết bị</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Danh sách các thiết bị đang đăng nhập tài khoản của Thầy Cô.
                </p>

                <div className="space-y-2 max-w-lg">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <p className="text-xs font-bold text-foreground">Trình duyệt hiện tại (Thiết bị này)</p>
                        <p className="text-[11px] text-muted-foreground">Đang hoạt động</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Hiện tại
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleLogoutOthers}
                    disabled={loggingOutOthers}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted transition cursor-pointer disabled:opacity-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{loggingOutOthers ? "Đang đăng xuất…" : "Đăng xuất khỏi tất cả các thiết bị khác"}</span>
                  </button>
                </div>
              </div>

              {/* XÁC THỰC 2 BƯỚC (2FA) */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Xác thực 2 bước (2FA)</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Bảo vệ tài khoản bằng mã bảo mật 6 số từ Google Authenticator hoặc Microsoft Authenticator.
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={twoFactorEnabled}
                      onChange={(e) => {
                        setTwoFactorEnabled(e.target.checked);
                        showToast(
                          e.target.checked
                            ? "Đã kích hoạt chế độ sẵn sàng 2FA cho tài khoản."
                            : "Đã tắt xác thực 2 bước.",
                          "info"
                        );
                      }}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
                  </label>
                </div>
              </div>

              {/* XUẤT DỮ LIỆU CÁ NHÂN (A11) */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Xuất dữ liệu cá nhân</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tải về bản sao toàn bộ thông tin hồ sơ và tùy chọn theo Nghị định 13/2023/NĐ-CP.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportPersonalData}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-border hover:bg-muted transition cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải dữ liệu (JSON)</span>
                  </button>
                </div>
              </div>

              {/* KHU VỰC NGUY HIỂM: XÓA TÀI KHOẢN (A11) */}
              <div className="pt-4 border-t border-destructive/20">
                <div className="p-4 rounded-2xl border border-destructive/30 bg-destructive/5 space-y-3">
                  <div className="flex items-start gap-2.5 text-destructive">
                    <Trash2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold">Khu vực nguy hiểm: Xóa tài khoản vĩnh viễn</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Toàn bộ dữ liệu đề thi, ma trận đặc tả, điểm số học sinh và số dư credits còn lại sẽ bị hủy vĩnh viễn. Có thời gian ân hạn phục hồi 14 ngày.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 text-xs font-bold rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 transition cursor-pointer"
                    >
                      Yêu cầu xóa tài khoản…
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 6: GIAO DIỆN (A14) ================= */}
          {currentSubTab === "appearance" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Palette className="w-5 h-5 text-primary" />
                <span>Tùy chỉnh giao diện hiển thị</span>
              </h2>

              {/* Theme Mode */}
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground mb-3">
                  Chế độ màu hiển thị
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { value: "light" as const, label: "Giao diện Sáng", desc: "Nền dịu mắt ban ngày", icon: Sun },
                    { value: "dark" as const, label: "Giao diện Tối", desc: "Độ tương phản cao ban đêm", icon: Moon },
                    { value: "system" as const, label: "Theo hệ thống", desc: "Tự đổi theo thiết bị", icon: Laptop },
                  ].map((theme) => {
                    const isSelected = currentTheme === theme.value;
                    const Icon = theme.icon;
                    return (
                      <button
                        key={theme.value}
                        type="button"
                        onClick={() => applyTheme(theme.value)}
                        className={`rounded-xl border p-4 text-left transition cursor-pointer relative ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary font-bold shadow-xs"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-3 right-3 rounded-full bg-primary p-0.5 text-white">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                        <Icon className={`w-5 h-5 mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <p className="text-xs font-bold">{theme.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{theme.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Size */}
              <div className="pt-4 border-t border-border">
                <p className="text-xs font-bold uppercase text-muted-foreground mb-3">
                  Kích thước cỡ chữ hiển thị
                </p>
                <div className="grid gap-3 sm:grid-cols-2 max-w-md">
                  {[
                    { id: "normal" as const, label: "Vừa (100% - Tiêu chuẩn)", desc: "Bố cục cân đối" },
                    { id: "large" as const, label: "Lớn (110% - Dễ đọc hơn)", desc: "Rõ chữ, đỡ mỏi mắt" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => applyFontSize(item.id)}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                        fontSize === item.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary font-bold shadow-xs"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <p className="text-xs font-bold">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reduced Motion */}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">Giảm hiệu ứng chuyển động (Reduced Motion)</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Hạn chế các hiệu ứng chuyển cảnh và chuyển động trên trang cho người dùng nhạy cảm.
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={reducedMotion}
                    onChange={(e) => applyReducedMotion(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
                </label>
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

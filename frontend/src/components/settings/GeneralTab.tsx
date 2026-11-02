"use client";

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
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { createClient } from "@/lib/supabase/client";
import {
  getUserPreferences,
  saveUserPreferencesLocal,
  UserPreferences,
  DEFAULT_PREFERENCES,
} from "@/lib/preferences";
import { isProUser, isMaxUser, getTierName } from "@/lib/payment/plans";
import { TeacherVerificationCard } from "@/components/verification/teacher-verification-card";
import { APP_URL, SUPPORT_EMAIL, REFERRAL_BONUS_CREDITS } from "@/lib/constants";

export function GeneralTab({ initialSubTab }: { initialSubTab?: string }) {
  const [activeTab, setActiveTab] = useState(
    initialSubTab && ["profile", "verification", "teaching", "notifications", "security", "appearance"].includes(initialSubTab)
      ? initialSubTab
      : "profile"
  );
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");
      if (tabParam && ["profile", "verification", "teaching", "notifications", "security", "appearance"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [initialSubTab]);
  const { user, profile, refreshProfile } = useAuth();

  // ================= 1. PROFILE STATE =================
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [school, setSchool] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Avatar Upload States
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // ================= 2. TEACHING & EXAM PREFERENCES STATE =================
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

  const [defaultGradingSheet, setDefaultGradingSheet] = useState<"gdpt_2025" | "sheet_40" | "sheet_50" | "sheet_20">("gdpt_2025");
  const [preferredAiModel, setPreferredAiModel] = useState<"thinking" | "gemini">("thinking");

  const [savingTeaching, setSavingTeaching] = useState(false);
  const [teachingMessage, setTeachingMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ================= 3. NOTIFICATIONS STATE =================
  const [emailExamCompleted, setEmailExamCompleted] = useState(true);
  const [emailStudentSubmitted, setEmailStudentSubmitted] = useState(true);
  const [emailLowCredits, setEmailLowCredits] = useState(true);
  const [marketingUpdates, setMarketingUpdates] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifMessage, setNotifMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ================= 4. SECURITY STATE =================
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [loggingOutOthers, setLoggingOutOthers] = useState(false);
  const [logoutOthersMessage, setLogoutOthersMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ================= 5. THEME STATE =================
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark" | "system">("system");

  // Load profile and preferences on mount or profile update
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setSchool(profile.school || "");
      setPhone((profile as any).phone || "");
    }

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
    const savedModel = prefs.gradingAndAi.preferredAiModel;
    setPreferredAiModel(savedModel === "gemini" ? "gemini" : "thinking");

    setEmailExamCompleted(prefs.notifications.emailExamCompleted ?? true);
    setEmailStudentSubmitted(prefs.notifications.emailStudentSubmitted ?? true);
    setEmailLowCredits(prefs.notifications.emailLowCredits ?? true);
    setMarketingUpdates(prefs.notifications.marketingUpdates ?? false);
  }, [profile]);

  // Load theme preference on mount
  useEffect(() => {
    const saved = (localStorage.getItem("app_theme") as "light" | "dark" | "system") || "system";
    setCurrentTheme(saved);
  }, [initialSubTab]);

  function applyTheme(theme: "light" | "dark" | "system") {
    setCurrentTheme(theme);
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
  }

  // Client-side image compression: 256x256, JPEG quality 0.8 (< 35KB)
  async function compressImage(file: File): Promise<{ blob: Blob; dataUrl: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Không thể xử lý ảnh"));
            return;
          }

          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);

          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({ blob, dataUrl });
              } else {
                reject(new Error("Lỗi nén ảnh"));
              }
            },
            "image/jpeg",
            0.8
          );
        };
        img.onerror = () => reject(new Error("Không thể đọc tệp ảnh"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Lỗi đọc file"));
      reader.readAsDataURL(file);
    });
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Vui lòng chọn file định dạng hình ảnh (PNG, JPG, WEBP).");
      return;
    }

    setUploadingAvatar(true);
    setAvatarError(null);

    try {
      const { blob, dataUrl } = await compressImage(file);
      const supabase = createClient();
      let finalAvatarUrl = "";

      const filePath = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (!uploadError) {
        const { data: pubData } = supabase.storage.from("avatars").getPublicUrl(filePath);
        finalAvatarUrl = `${pubData.publicUrl}?t=${Date.now()}`;
      } else {
        console.warn("Storage upload fallback to compressed dataUrl:", uploadError.message);
        finalAvatarUrl = dataUrl;
      }

      const { error: dbError } = await (supabase.from("users") as any)
        .update({
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (dbError) throw dbError;

      await refreshProfile();
      setProfileMessage({ type: "success", text: "Cập nhật ảnh đại diện thành công!" });
    } catch (err: any) {
      setAvatarError(err.message || "Không thể tải ảnh lên.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Save Profile (Name, School, Phone)
  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const supabase = createClient();
      const payload: any = {
        name: name.trim(),
        school: school.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (phone.trim()) {
        payload.phone = phone.trim();
      }

      const { error } = await (supabase.from("users") as any)
        .update(payload)
        .eq("id", user.id);

      if (error) {
        // Fallback without phone if column not yet added
        delete payload.phone;
        await (supabase.from("users") as any).update(payload).eq("id", user.id);
      }

      await refreshProfile();
      setProfileMessage({ type: "success", text: "Cập nhật thông tin hồ sơ thành công!" });
    } catch (err: any) {
      setProfileMessage({ type: "error", text: `Lỗi: ${err.message || "Không thể lưu hồ sơ"}` });
    } finally {
      setSavingProfile(false);
    }
  }

  // Save Teaching & Exam Preferences
  async function handleSaveTeachingPreferences(e: React.FormEvent) {
    e.preventDefault();
    setSavingTeaching(true);
    setTeachingMessage(null);

    const currentPrefs = getUserPreferences(profile);
    const updatedPreferences: UserPreferences = {
      ...currentPrefs,
      teaching: {
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
    setTeachingMessage({
      type: "success",
      text: "Đã lưu cài đặt nghiệp vụ thành công! Các thiết lập này sẽ tự động áp dụng khi soạn đề, xuất Word và chấm thi.",
    });
  }

  // Save Notifications
  async function handleSaveNotifications(e: React.FormEvent) {
    e.preventDefault();
    setSavingNotif(true);
    setNotifMessage(null);

    const currentPrefs = getUserPreferences(profile);
    const updatedPreferences: UserPreferences = {
      ...currentPrefs,
      notifications: {
        emailExamCompleted,
        emailStudentSubmitted,
        emailLowCredits,
        marketingUpdates,
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
    setNotifMessage({ type: "success", text: "Đã lưu tùy chọn thông báo thành công!" });
  }

  // Update Password
  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "Mật khẩu mới phải có ít nhất 8 ký tự để đảm bảo an toàn bảo mật.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Xác nhận mật khẩu mới không khớp." });
      return;
    }

    setPasswordUpdating(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordMessage({
        type: "success",
        text: "Đổi mật khẩu thành công! Hãy sử dụng mật khẩu mới cho lần đăng nhập sau.",
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMessage({ type: "error", text: err.message || "Không thể đổi mật khẩu." });
    } finally {
      setPasswordUpdating(false);
    }
  }

  // Logout other devices
  async function handleLogoutOthers() {
    setLoggingOutOthers(true);
    setLogoutOthersMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) throw error;
      setLogoutOthersMessage({
        type: "success",
        text: "Đã đăng xuất tài khoản an toàn khỏi tất cả các thiết bị và trình duyệt khác!",
      });
    } catch (err: any) {
      setLogoutOthersMessage({
        type: "error",
        text: err.message || "Không thể đăng xuất các thiết bị khác.",
      });
    } finally {
      setLoggingOutOthers(false);
    }
  }

  const isOAuthUser = user?.app_metadata?.provider === "google";

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "GV";

  const referralCode =
    profile?.referral_code ||
    `EDU${(user?.id ? user.id.replace(/-/g, "").slice(0, 5) : "TEACH").toUpperCase()}`;

  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${referralCode}`
      : `${APP_URL}/register?ref=${referralCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const tabs = [
    { id: "profile", label: "Hồ sơ cá nhân", icon: User },
    { id: "verification", label: "Xác thực Thẻ ngành (eKYC)", icon: ShieldCheck },
    { id: "teaching", label: "Nghiệp vụ & Soạn đề", icon: GraduationCap },
    { id: "notifications", label: "Thông báo", icon: Bell },
    { id: "security", label: "Bảo mật", icon: Shield },
    { id: "appearance", label: "Giao diện", icon: Palette },
  ];

  const subjectsList = [
    "Toán",
    "Vật lý",
    "Hóa học",
    "Sinh học",
    "Ngữ văn",
    "Lịch sử",
    "Địa lý",
    "Tiếng Anh",
    "Tin học",
    "GDCD",
    "Công nghệ",
  ];

  const gradesList = ["12", "11", "10", "9", "8", "7", "6"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cài đặt hệ thống</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý thông tin tài khoản, chuẩn hóa quy cách xuất bản đề thi và cá nhân hóa trải nghiệm.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar tabs */}
        <div className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.id === "teaching" && (
                <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Mới
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* ================= TAB 1: HỒ SƠ ================= */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                <h2 className="mb-6 text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Thông tin cá nhân & Giảng dạy
                </h2>

                {profileMessage && (
                  <div
                    className={`mb-4 rounded-xl p-3 text-sm flex items-center gap-2 ${
                      profileMessage.type === "error"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {profileMessage.type === "error" ? (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    )}
                    <span>{profileMessage.text}</span>
                  </div>
                )}

                {avatarError && (
                  <div className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{avatarError}</span>
                  </div>
                )}

                {/* Avatar Section */}
                <div className="mb-6 flex items-center gap-4 border-b border-border pb-6">
                  <div className="relative">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="h-20 w-20 rounded-full object-cover border-2 border-primary shadow-xs"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                        {initials}
                      </div>
                    )}

                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      aria-label="Tải lên ảnh đại diện mới"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition cursor-pointer disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4 text-primary" />
                      {uploadingAvatar ? "Đang nén & tải lên…" : "Thay ảnh đại diện"}
                    </button>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Chuẩn ảnh tự động nén tối ưu (256x256, &lt;35KB) lưu trữ trên CDN tốc độ cao.
                    </p>
                  </div>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium">Họ và tên giáo viên</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="VD: Thầy Nguyễn Văn A"
                        className="mt-1 block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Email tài khoản</label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="mt-1 block w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium">Số điện thoại / Zalo liên hệ</label>
                      <div className="relative mt-1">
                        <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="VD: 0912.345.678"
                          className="block w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Trường học / Đơn vị công tác</label>
                      <div className="relative mt-1">
                        <Building2 className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                        <input
                          type="text"
                          value={school}
                          onChange={(e) => setSchool(e.target.value)}
                          placeholder="VD: THPT Chuyên Hà Nội - Amsterdam"
                          className="block w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Hạng tài khoản:</span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                        (isMaxUser(profile) || isMaxUser(user))
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : (isProUser(profile) || isProUser(user))
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}>
                        <Sparkles className="w-3.5 h-3.5" />
                        {getTierName(profile || user)}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 min-h-[40px] text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition cursor-pointer shadow-xs"
                    >
                      {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}<span>{savingProfile ? "Đang lưu…" : "Lưu hồ sơ"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Referral Box */}
              <div className="rounded-2xl border border-blue-200 bg-linear-to-r from-blue-50/70 to-indigo-50/70 dark:border-blue-900/40 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold text-sm mb-1">
                      <Share2 className="w-4 h-4 text-primary" />
                      <span>Chương trình giới thiệu đồng nghiệp & Nhận Credits</span>
                    </div>
                    <p className="text-xs text-blue-800/80 dark:text-blue-300/80 max-w-xl">
                      Mỗi khi một giáo viên đăng ký tài khoản qua liên kết của bạn và hoàn thành tạo đề thi đầu tiên, cả hai thầy cô đều nhận ngay{" "}
                      <strong>+{REFERRAL_BONUS_CREDITS.toLocaleString("vi-VN")} Credits</strong> vào ví để thoải mái trải nghiệm AI soạn đề thi và chấm điểm.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs font-bold bg-white dark:bg-card px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 text-primary">
                      {referralCode}
                    </span>
                    <button
                      type="button"
                      onClick={copyReferralLink}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition cursor-pointer shadow-xs"
                    >
                      {copiedRef ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedRef ? "Đã chép link" : "Sao chép link mời"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: NGHIỆP VỤ & SOẠN ĐỀ ================= */}
          {activeTab === "verification" && (
          <div className="space-y-6 lg:col-span-3">
            <TeacherVerificationCard />
          </div>
        )}

        {activeTab === "teaching" && (
            <form onSubmit={handleSaveTeachingPreferences} className="space-y-6">
              {teachingMessage && (
                <div
                  className={`rounded-xl p-4 text-sm flex items-center gap-2 ${
                    teachingMessage.type === "error"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {teachingMessage.type === "error" ? (
                    <AlertCircle className="w-5 h-5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                  )}
                  <span>{teachingMessage.text}</span>
                </div>
              )}

              {/* KHỐI 1: THÔNG TIN ĐẦU TRANG ĐỀ THI (HEADER WORD) */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <h2 className="text-base font-semibold">1. Thông tin đầu trang đề thi (Header file Word)</h2>
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
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Xuất hiện dưới tên trường để khẳng định bản quyền tổ chuyên môn khi chia sẻ đề thi.
                  </p>
                </div>
              </div>

              {/* KHỐI 2: THIẾT LẬP MÔN & KHỐI LỚP MẶC ĐỊNH */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <div>
                    <h2 className="text-base font-semibold">2. Môn dạy & Khối lớp mặc định</h2>
                    <p className="text-xs text-muted-foreground">
                      Tự động chọn sẵn khi thầy cô mở Exam Studio tạo đề mới hoặc khởi tạo bài kiểm tra.
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
                      {subjectsList.map((sub) => (
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
                      {gradesList.map((g) => (
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

              {/* KHỐI 3: QUY CHUẨN XUẤT WORD & WATERMARK */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <Sliders className="w-5 h-5 text-primary" />
                  <div>
                    <h2 className="text-base font-semibold">3. Định dạng xuất Word (.docx) & Watermark bản quyền</h2>
                    <p className="text-xs text-muted-foreground">
                      Tùy chỉnh kiểu chữ và dấu ấn cá nhân của giáo viên trên tài liệu đề thi và đáp án.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                      Font chữ mặc định trong Word
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "Times New Roman" as const, label: "Times New Roman", desc: "Chuẩn văn bản Bộ GD" },
                        { id: "Arial" as const, label: "Arial", desc: "Hiện đại, rõ nét" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setDocxFont(item.id)}
                          className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                            docxFont === item.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <p className="text-sm font-bold">{item.label}</p>
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
                          className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                            docxFontSize === item.size
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <p className="text-sm font-bold">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Watermark Section */}
                <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Chèn Watermark bản quyền giáo viên</p>
                      <p className="text-xs text-muted-foreground">
                        Hiển thị dòng ghi chú bản quyền ở chân trang đề thi và bảng đáp án khi xuất file.
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
                    <div className="pt-2 animate-in fade-in duration-200">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Nội dung Watermark chân trang
                      </label>
                      <input
                        type="text"
                        value={docxWatermarkText}
                        onChange={(e) => setDocxWatermarkText(e.target.value)}
                        placeholder="VD: Biên soạn: Thầy Nguyễn Văn A - Hotline/Zalo: 0987.xxx.xxx"
                        className="block w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* KHỐI 4: QUY CHUẨN CHẤM THI & AI */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <Cpu className="w-5 h-5 text-primary" />
                  <div>
                    <h2 className="text-base font-semibold">4. Cấu hình Chấm thi quang học & Chế độ AI</h2>
                    <p className="text-xs text-muted-foreground">
                      Thiết lập mẫu phiếu mặc định và tối ưu hóa tốc độ cũng như chiều sâu lý luận của AI.
                    </p>
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
                          desc: "Phần I: 12 câu MCQ, Phần II: 4 câu Đúng/Sai, Phần III: 6 câu Trả lời ngắn",
                        },
                        { id: "sheet_40" as const, label: "Phiếu 40 câu trắc nghiệm", desc: "4 phương án A-B-C-D" },
                        { id: "sheet_50" as const, label: "Phiếu 50 câu trắc nghiệm", desc: "Dành cho thi THPT truyền thống" },
                        { id: "sheet_20" as const, label: "Phiếu 20 câu nhanh", desc: "Kiểm tra 15 - 45 phút trên lớp" },
                      ].map((sheet) => (
                        <div
                          key={sheet.id}
                          onClick={() => setDefaultGradingSheet(sheet.id)}
                          className={`rounded-xl border p-3 cursor-pointer transition-all ${
                            defaultGradingSheet === sheet.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{sheet.label}</span>
                            {defaultGradingSheet === sheet.id && (
                              <Check className="w-3.5 h-3.5 text-primary" />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{sheet.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">
                      Chế độ AI phân tích & sinh đề ưu tiên
                    </label>
                    <div className="space-y-2">
                      {[
                        {
                          id: "thinking" as const,
                          label: "Mô hình AI Suy luận Đa tác tử (Gemini 2.0 Thinking & Deep Reasoning)",
                          desc: "Tối ưu hóa các bài toán khó (Vận dụng cao), chuỗi suy luận sâu (Thinking Mode) tự kiểm chứng bước giải.",
                        },
                        {
                          id: "gemini" as const,
                          label: "Google Gemini 2.0 Flash (Siêu tốc độ)",
                          desc: "Phản hồi tức thì trong 2-3 giây, phù hợp tạo nhanh ngân hàng đề trắc nghiệm cơ bản và nhận biết.",
                        },
                      ].map((ai) => (
                        <div
                          key={ai.id}
                          onClick={() => setPreferredAiModel(ai.id)}
                          className={`rounded-xl border p-3 cursor-pointer transition-all ${
                            preferredAiModel === ai.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{ai.label}</span>
                            {preferredAiModel === ai.id && (
                              <Check className="w-3.5 h-3.5 text-primary" />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{ai.desc}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-xs text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300 flex items-start gap-2">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                      <span>
                        Hệ thống tự động sử dụng máy chủ AI phân tán kết hợp Gemini 2.0 Thinking & Dual-Agent Verification để bảo đảm tính chuẩn xác học thuật.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingTeaching}
                  className="rounded-xl bg-primary px-8 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition cursor-pointer shadow-sm"
                >
                  {savingTeaching ? "Đang lưu cài đặt…" : "Lưu cài đặt nghiệp vụ"}
                </button>
              </div>
            </form>
          )}

          {/* ================= TAB 3: THÔNG BÁO ================= */}
          {activeTab === "notifications" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Cài đặt thông báo & Cảnh báo ví
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Chọn các sự kiện bạn muốn nhận email hoặc thông báo trực tiếp trên ứng dụng.
                  </p>
                </div>
              </div>

              {notifMessage && (
                <div
                  className={`rounded-xl p-3 text-sm flex items-center gap-2 ${
                    notifMessage.type === "error"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {notifMessage.type === "error" ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                  <span>{notifMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveNotifications} className="space-y-3">
                {[
                  {
                    title: "Email thông báo đề thi hoàn thành",
                    desc: "Nhận email khi AI hoàn thành trích xuất hoặc hoàn thiện bộ câu hỏi",
                    checked: emailExamCompleted,
                    setter: setEmailExamCompleted,
                  },
                  {
                    title: "Thông báo học sinh nộp bài qua QR",
                    desc: "Nhận thông báo tức thì khi có học sinh quét mã nộp bài kiểm tra trực tuyến",
                    checked: emailStudentSubmitted,
                    setter: setEmailStudentSubmitted,
                  },
                  {
                    title: "Cảnh báo số dư credits dưới 20",
                    desc: "Nhắc nhở nạp thêm tín dụng VietQR tự động để không làm gián đoạn việc sinh đề",
                    checked: emailLowCredits,
                    setter: setEmailLowCredits,
                  },
                  {
                    title: "Bản tin cập nhật mẫu đề GDPT 2025",
                    desc: "Nhận thông tin về các mẫu đề, ma trận barem và tính năng mới của Bộ GD&ĐT",
                    checked: marketingUpdates,
                    setter: setMarketingUpdates,
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between rounded-xl border border-border p-4 bg-muted/20 hover:bg-muted/40 transition"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) => item.setter(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                ))}

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={savingNotif}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 min-h-[40px] text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition cursor-pointer shadow-xs"
                  >
                    {savingNotif ? "Đang lưu…" : "Lưu tùy chọn thông báo"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================= TAB 4: BẢO MẬT ================= */}
          {activeTab === "security" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Bảo mật tài khoản & Phiên đăng nhập
              </h2>

              {/* ĐỔI MẬT KHẨU */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Đổi mật khẩu đăng nhập</h3>
                </div>

                {isOAuthUser ? (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-950/20 p-4 text-xs text-blue-800 dark:text-blue-300">
                    Tài khoản của bạn đang đăng nhập an toàn thông qua <strong>Google OAuth</strong>. Mật khẩu được quản lý trực tiếp bởi tài khoản Google của bạn.
                  </div>
                ) : (
                  <form onSubmit={handleUpdatePassword} className="space-y-3 max-w-md">
                    {passwordMessage && (
                      <div
                        className={`rounded-xl p-3 text-xs flex items-center gap-2 ${
                          passwordMessage.type === "error"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {passwordMessage.type === "error" ? (
                          <AlertCircle className="w-4 h-4 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        )}
                        <span>{passwordMessage.text}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Mật khẩu mới (tối thiểu 8 ký tự)
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="block w-full rounded-xl border border-border bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Xác nhận mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="block w-full rounded-xl border border-border bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={passwordUpdating}
                      className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition cursor-pointer"
                    >
                      {passwordUpdating ? "Đang xử lý…" : "Cập nhật mật khẩu"}
                    </button>
                  </form>
                )}
              </div>

              <hr className="border-border" />

              {/* QUẢN LÝ PHIÊN ĐĂNG NHẬP (ACTIVE SESSIONS) */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <LogOut className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Quản lý phiên đăng nhập</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Đăng xuất tài khoản này khỏi các thiết bị hoặc máy tính khác để phòng tránh lộ dữ liệu đề thi.
                </p>

                {logoutOthersMessage && (
                  <div
                    className={`mb-3 rounded-xl p-3 text-xs flex items-center gap-2 max-w-md ${
                      logoutOthersMessage.type === "error"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {logoutOthersMessage.type === "error" ? (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    )}
                    <span>{logoutOthersMessage.text}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleLogoutOthers}
                  disabled={loggingOutOthers}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer disabled:opacity-50"
                >
                  {loggingOutOthers ? "Đang xử lý…" : "Đăng xuất khỏi tất cả các thiết bị khác"}
                </button>
              </div>

              <hr className="border-border" />

              {/* XÓA TÀI KHOẢN */}
              <div>
                <div className="flex items-center gap-2 text-destructive">
                  <Trash2 className="w-4 h-4" />
                  <h3 className="text-sm font-semibold">Xóa tài khoản</h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Hành động này sẽ xóa vĩnh viễn dữ liệu giáo án, đề thi và điểm số học sinh của bạn.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="mt-3 rounded-xl border border-red-300 dark:border-red-900/50 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition cursor-pointer"
                >
                  Xóa tài khoản vĩnh viễn
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 5: GIAO DIỆN ================= */}
          {activeTab === "appearance" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <h2 className="mb-2 text-lg font-semibold flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Tùy chỉnh giao diện hiển thị
              </h2>
              <p className="text-xs text-muted-foreground mb-6">
                Lựa chọn chế độ hiển thị phù hợp với điều kiện ánh sáng và mắt của bạn khi soạn giáo án đêm.
              </p>

              <div>
                <p className="text-sm font-medium mb-3">Chế độ màu hiển thị</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { value: "light" as const, label: "Giao diện Sáng", desc: "Nền xanh nhạt dịu mắt chuẩn", icon: Sun },
                    { value: "dark" as const, label: "Giao diện Tối", desc: "Độ tương phản cao ban đêm", icon: Moon },
                    { value: "system" as const, label: "Theo hệ thống", desc: "Tự động đổi theo thiết bị", icon: Laptop },
                  ].map((theme) => {
                    const isSelected = currentTheme === theme.value;
                    const Icon = theme.icon;
                    return (
                      <button
                        key={theme.value}
                        type="button"
                        onClick={() => applyTheme(theme.value)}
                        className={`rounded-xl border p-4 text-left transition-all cursor-pointer relative ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-3 right-3 rounded-full bg-primary p-0.5 text-white">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                        <Icon className={`w-5 h-5 mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <p className="text-sm font-bold">{theme.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{theme.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Cảnh báo Xóa tài khoản */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-card rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 relative text-left">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              Yêu cầu hủy tài khoản
            </h3>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
              Theo quy định bảo vệ dữ liệu giáo án và điểm thi học sinh của Bộ GD&ĐT, việc xóa vĩnh viễn tài khoản cần được xác thực danh tính để tránh mất mát dữ liệu ngoài ý muốn.
            </p>

            <div className="rounded-xl bg-neutral-50 dark:bg-muted/40 p-3.5 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 space-y-1.5 mb-5">
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">Quy trình xóa tài khoản an toàn:</p>
              <p>• Vui lòng gửi email từ địa chỉ <strong>{user?.email}</strong> đến hòm thư hỗ trợ:</p>
              <p className="font-mono text-primary font-bold">{SUPPORT_EMAIL}</p>
              <p>• Ban quản trị sẽ tiến hành xóa sạch tài khoản và dữ liệu liên quan trong vòng 24 giờ làm việc.</p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold hover:bg-neutral-800 transition cursor-pointer"
              >
                Đã hiểu & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GeneralTab;

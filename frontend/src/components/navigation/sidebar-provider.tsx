"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { usePathname } from "next/navigation";

interface SidebarContextType {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleMobile: () => void;
  setMobileOpen: (open: boolean) => void;
  isManuallySet: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const COOKIE_NAME = "edutest_sidebar_collapsed";
const MANUAL_FLAG_KEY = "edutest_sidebar_manual";

// Các route có canvas lớn cần tự động thu nhỏ nếu người dùng chưa chọn thủ công
const AUTO_COLLAPSE_ROUTES = ["/whiteboard", "/exams/create"];

export function SidebarProvider({
  children,
  initialCollapsed = false,
}: {
  children: React.ReactNode;
  initialCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(initialCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isManuallySet, setIsManuallySet] = useState<boolean>(false);
  const hasInitializedManualRef = useRef(false);

  // Kiểm tra cờ manual override từ localStorage sau khi mount
  useEffect(() => {
    try {
      const savedManual = localStorage.getItem(MANUAL_FLAG_KEY);
      if (savedManual === "true") {
        setIsManuallySet(true);
      }
      hasInitializedManualRef.current = true;
    } catch {
      // ignore
    }
  }, []);

  // Tự động thu nhỏ ở các trang canvas lớn nếu người dùng chưa tự chọn thủ công
  useEffect(() => {
    // Không ghi đè nếu người dùng đã tự chỉnh
    const isManual =
      isManuallySet ||
      (typeof window !== "undefined" &&
        localStorage.getItem(MANUAL_FLAG_KEY) === "true");

    if (isManual) return;

    const isAutoRoute = AUTO_COLLAPSE_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );

    if (isAutoRoute) {
      setIsCollapsed(true);
    } else {
      // Khôi phục về cấu hình ban đầu từ cookie
      setIsCollapsed(initialCollapsed);
    }
  }, [pathname, isManuallySet, initialCollapsed]);

  // Đóng mobile drawer mỗi khi chuyển trang
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Khóa cuộn màn hình khi mobile drawer mở
  useEffect(() => {
    if (isMobileOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileOpen]);

  // Hàm toggle desktop và ghi nhớ vào cookie + localStorage
  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      setIsManuallySet(true);
      try {
        localStorage.setItem(MANUAL_FLAG_KEY, "true");
        // Lưu cookie 1 năm, SameSite=Lax
        document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=31536000; SameSite=Lax`;
      } catch (err) {
        console.warn("Không thể lưu cookie sidebar:", err);
      }
      return next;
    });
  }, []);

  const setCollapsedExplicit = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
    setIsManuallySet(true);
    try {
      localStorage.setItem(MANUAL_FLAG_KEY, "true");
      document.cookie = `${COOKIE_NAME}=${collapsed}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (err) {
      console.warn("Không thể lưu cookie sidebar:", err);
    }
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const setMobileOpen = useCallback((open: boolean) => {
    setIsMobileOpen(open);
  }, []);

  // Lắng nghe phím tắt Ctrl+B / Cmd+B và phím Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Đóng mobile drawer bằng phím Esc
      if (e.key === "Escape" && isMobileOpen) {
        setIsMobileOpen(false);
        return;
      }

      // Phím tắt Ctrl+B hoặc Cmd+B
      if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
        const target = e.target as HTMLElement | null;
        const isEditable =
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement ||
          target?.isContentEditable ||
          target?.getAttribute("contenteditable") === "true";

        if (isEditable) {
          return;
        }

        e.preventDefault();
        toggleCollapse();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, toggleCollapse]);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isMobileOpen,
        toggleCollapse,
        setCollapsed: setCollapsedExplicit,
        toggleMobile,
        setMobileOpen,
        isManuallySet,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

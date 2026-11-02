export interface TeachingPreferences {
  department: string;
  school: string;
  teacherTitle: string;
  defaultSubject: string;
  defaultGrade: string;
  defaultDuration: number;
}

export interface ExportPreferences {
  docxFont: "Times New Roman" | "Arial";
  docxFontSize: 12 | 13;
  docxEnableWatermark: boolean;
  docxWatermarkText: string;
}

export interface GradingAndAiPreferences {
  defaultGradingSheet: "gdpt_2025" | "sheet_40" | "sheet_50" | "sheet_20";
  preferredAiModel: "thinking" | "gemini" | "deepseek";
}

export interface NotificationPreferences {
  emailExamCompleted: boolean;
  emailStudentSubmitted: boolean;
  emailLowCredits: boolean;
  marketingUpdates: boolean;
}

export interface UserPreferences {
  teaching: TeachingPreferences;
  export: ExportPreferences;
  gradingAndAi: GradingAndAiPreferences;
  notifications: NotificationPreferences;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  teaching: {
    department: "SỞ GIÁO DỤC VÀ ĐÀO TẠO",
    school: "",
    teacherTitle: "",
    defaultSubject: "Toán",
    defaultGrade: "12",
    defaultDuration: 45,
  },
  export: {
    docxFont: "Times New Roman",
    docxFontSize: 13,
    docxEnableWatermark: false,
    docxWatermarkText: "",
  },
  gradingAndAi: {
    defaultGradingSheet: "gdpt_2025",
    preferredAiModel: "thinking",
  },
  notifications: {
    emailExamCompleted: true,
    emailStudentSubmitted: true,
    emailLowCredits: true,
    marketingUpdates: false,
  },
};

const STORAGE_KEY = "eduteach_user_preferences";
const LEGACY_STORAGE_KEY = "eduteast_user_preferences";

export function getUserPreferences(profile?: any): UserPreferences {
  let savedLocal: Partial<UserPreferences> | null = null;
  if (typeof window !== "undefined") {
    try {
      const item =
        localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (item) savedLocal = JSON.parse(item);
    } catch {
      // ignore
    }
  }

  const rawPrefs = profile?.preferences || savedLocal || {};

  return {
    teaching: {
      ...DEFAULT_PREFERENCES.teaching,
      school: profile?.school || DEFAULT_PREFERENCES.teaching.school,
      ...(rawPrefs.teaching || {}),
    },
    export: {
      ...DEFAULT_PREFERENCES.export,
      ...(rawPrefs.export || {}),
    },
    gradingAndAi: {
      ...DEFAULT_PREFERENCES.gradingAndAi,
      ...(rawPrefs.gradingAndAi || {}),
    },
    notifications: {
      ...DEFAULT_PREFERENCES.notifications,
      ...(rawPrefs.notifications || {}),
    },
  };
}

export function saveUserPreferencesLocal(prefs: UserPreferences) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }
}

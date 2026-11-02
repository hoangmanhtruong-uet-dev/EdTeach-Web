"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  saveDraftToStorage,
  getDraftFromStorage,
  removeDraftFromStorage,
  AutosaveDraftRecord,
} from "@/lib/storage/indexeddb-store";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export interface AutosaveConflict<T> {
  clientVersion: number;
  serverVersion: number;
  clientData: T;
  serverData?: T;
}

export interface UseAutosaveOptions<T> {
  id: string; // Unique draft key (e.g. 'exam_123', 'attempt_456')
  data: T; // Current state
  onSave: (data: T, version: number) => Promise<{
    success: boolean;
    version?: number;
    conflict?: boolean;
    serverData?: T;
    error?: string;
  }>;
  debounceMs?: number; // default: 2500ms
  enabled?: boolean; // default: true
  initialVersion?: number;
  onConflict?: (conflict: AutosaveConflict<T>) => Promise<T | "keep_client" | "take_server"> | void;
  onSuccess?: (version: number) => void;
  onError?: (error: string) => void;
}

export interface UseAutosaveReturn<T> {
  status: AutosaveStatus;
  version: number;
  isDirty: boolean;
  lastSavedAt: Date | null;
  errorMessage: string | null;
  saveNow: () => Promise<boolean>;
  resetDirty: () => void;
  restoreFromBackup: () => Promise<T | null>;
  clearBackup: () => Promise<void>;
}

export function useAutosave<T>({
  id,
  data,
  onSave,
  debounceMs = 2500,
  enabled = true,
  initialVersion = 1,
  onConflict,
  onSuccess,
  onError,
}: UseAutosaveOptions<T>): UseAutosaveReturn<T> {
  const [status, setStatus] = useState<AutosaveStatus>("saved");
  const [version, setVersion] = useState<number>(initialVersion);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const versionRef = useRef<number>(initialVersion);
  versionRef.current = version;

  const currentDataRef = useRef<T>(data);
  currentDataRef.current = data;

  const lastSavedDataStringRef = useRef<string>(JSON.stringify(data));
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(false);

  // Core save function
  const performSave = useCallback(async (): Promise<boolean> => {
    if (isSavingRef.current || !enabled) return false;

    isSavingRef.current = true;
    setStatus("saving");
    setErrorMessage(null);

    const dataToSave = currentDataRef.current;
    const nextVersion = versionRef.current + 1;

    // 1. Instant local backup (IndexedDB + localStorage) marked as unsynced
    await saveDraftToStorage(id, dataToSave, nextVersion, false);

    try {
      const result = await onSave(dataToSave, nextVersion);

      if (result.conflict) {
        // Conflict resolution
        const resolution = onConflict
          ? await onConflict({
              clientVersion: nextVersion,
              serverVersion: result.version || nextVersion,
              clientData: dataToSave,
              serverData: result.serverData,
            })
          : "keep_client";

        const resolvedVersion = result.version || nextVersion;
        setVersion(resolvedVersion);
        versionRef.current = resolvedVersion;

        await saveDraftToStorage(id, dataToSave, resolvedVersion, true);
        setStatus("saved");
        setIsDirty(false);
        setLastSavedAt(new Date());
        lastSavedDataStringRef.current = JSON.stringify(dataToSave);
        isSavingRef.current = false;
        return true;
      }

      if (!result.success) {
        throw new Error(result.error || "Lỗi lưu dữ liệu tự động.");
      }

      // Mark synced in local backup
      const confirmedVersion = result.version ?? nextVersion;
      setVersion(confirmedVersion);
      versionRef.current = confirmedVersion;

      await saveDraftToStorage(id, dataToSave, confirmedVersion, true);

      setStatus("saved");
      setIsDirty(false);
      setLastSavedAt(new Date());
      lastSavedDataStringRef.current = JSON.stringify(dataToSave);
      onSuccess?.(confirmedVersion);
      isSavingRef.current = false;
      return true;
    } catch (err: any) {
      const msg = err.message || "Lỗi kết nối khi lưu tự động.";
      setStatus("error");
      setErrorMessage(msg);
      onError?.(msg);
      isSavingRef.current = false;
      return false;
    }
  }, [id, enabled, onSave, onConflict, onSuccess, onError]);

  // Immediate save triggered by user (Ctrl+S or manual click)
  const saveNow = useCallback(async (): Promise<boolean> => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    return await performSave();
  }, [performSave]);

  // Detect data changes and schedule debounced save
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      lastSavedDataStringRef.current = JSON.stringify(data);
      return;
    }

    if (!enabled) return;

    const serialized = JSON.stringify(data);
    if (serialized === lastSavedDataStringRef.current) {
      return;
    }

    setIsDirty(true);
    setStatus("idle");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, debounceMs, enabled, performSave]);

  // Listen to browser network reconnection
  useEffect(() => {
    const handleOnline = () => {
      if (isDirty) {
        performSave();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [isDirty, performSave]);

  // Restore previous draft from IndexedDB/localStorage
  const restoreFromBackup = useCallback(async (): Promise<T | null> => {
    const backup = await getDraftFromStorage<T>(id);
    if (backup?.data) {
      return backup.data;
    }
    return null;
  }, [id]);

  const clearBackup = useCallback(async (): Promise<void> => {
    await removeDraftFromStorage(id);
  }, [id]);

  const resetDirty = useCallback(() => {
    setIsDirty(false);
    setStatus("saved");
    lastSavedDataStringRef.current = JSON.stringify(currentDataRef.current);
  }, []);

  return {
    status,
    version,
    isDirty,
    lastSavedAt,
    errorMessage,
    saveNow,
    resetDirty,
    restoreFromBackup,
    clearBackup,
  };
}

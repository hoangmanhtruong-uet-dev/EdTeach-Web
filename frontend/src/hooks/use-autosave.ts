"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  saveToOfflineStore,
  getFromOfflineStore,
  clearOfflineStore,
} from "@/lib/storage/indexed-db";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseAutosaveOptions<T> {
  key: string;
  data: T;
  version?: number;
  debounceMs?: number;
  enabled?: boolean;
  onSave: (
    data: T,
    version: number
  ) => Promise<{ success: boolean; serverVersion?: number; error?: string }>;
  onConflict?: (clientData: T, serverVersion: number) => void;
}

export interface UseAutosaveReturn<T> {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  lastError: string | null;
  pendingChanges: boolean;
  saveNow: () => Promise<boolean>;
  hasOfflineBackup: boolean;
  recoverBackup: () => Promise<T | null>;
  clearBackup: () => Promise<void>;
}

export function useAutosave<T>({
  key,
  data,
  version = 1,
  debounceMs = 1500,
  enabled = true,
  onSave,
  onConflict,
}: UseAutosaveOptions<T>): UseAutosaveReturn<T> {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<boolean>(false);
  const [hasOfflineBackup, setHasOfflineBackup] = useState<boolean>(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestDataRef = useRef<T>(data);
  latestDataRef.current = data;

  const latestVersionRef = useRef<number>(version);
  latestVersionRef.current = version;

  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const isSavingRef = useRef<boolean>(false);
  const lastSerializedDataRef = useRef<string>(JSON.stringify(data));

  // Check existing backup on mount
  useEffect(() => {
    if (!key) return;
    getFromOfflineStore<T>(key).then((record) => {
      if (record && record.data) {
        setHasOfflineBackup(true);
      }
    });
  }, [key]);

  // Core save execution function
  const executeSave = useCallback(async (): Promise<boolean> => {
    if (!enabled || isSavingRef.current) return false;

    const currentPayload = latestDataRef.current;
    const currentVer = latestVersionRef.current;

    isSavingRef.current = true;
    setStatus("saving");
    setLastError(null);

    // 1. Instant offline persistence before network dispatch
    await saveToOfflineStore(key, currentPayload, currentVer);

    try {
      const result = await onSaveRef.current(currentPayload, currentVer);

      if (result.success) {
        lastSerializedDataRef.current = JSON.stringify(currentPayload);
        setStatus("saved");
        setLastSavedAt(new Date());
        setPendingChanges(false);
        setLastError(null);
        isSavingRef.current = false;
        return true;
      } else {
        setStatus("error");
        setLastError(result.error || "Lỗi lưu dữ liệu lên máy chủ");
        if (result.serverVersion && result.serverVersion > currentVer) {
          onConflict?.(currentPayload, result.serverVersion);
        }
        isSavingRef.current = false;
        return false;
      }
    } catch (err: any) {
      console.error("[useAutosave] Network error:", err);
      setStatus("error");
      setLastError(err.message || "Mất kết nối mạng - Đã lưu bản nháp an toàn offline");
      isSavingRef.current = false;
      return false;
    }
  }, [enabled, key, onConflict]);

  // Debounced auto-save listener on data change
  useEffect(() => {
    if (!enabled) return;

    const serialized = JSON.stringify(data);
    if (serialized === lastSerializedDataRef.current) {
      return;
    }

    setPendingChanges(true);
    setStatus("idle");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSave();
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, debounceMs, enabled, executeSave]);

  // Auto-sync when internet reconnects
  useEffect(() => {
    const handleOnline = () => {
      if (pendingChanges) {
        executeSave();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [pendingChanges, executeSave]);

  // Manual save trigger (Ctrl+S or submit button)
  const saveNow = useCallback(async (): Promise<boolean> => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    return await executeSave();
  }, [executeSave]);

  // Recover from offline backup
  const recoverBackup = useCallback(async (): Promise<T | null> => {
    const record = await getFromOfflineStore<T>(key);
    return record?.data || null;
  }, [key]);

  // Clear offline backup
  const clearBackup = useCallback(async (): Promise<void> => {
    await clearOfflineStore(key);
    setHasOfflineBackup(false);
  }, [key]);

  return {
    status,
    lastSavedAt,
    lastError,
    pendingChanges,
    saveNow,
    hasOfflineBackup,
    recoverBackup,
    clearBackup,
  };
}

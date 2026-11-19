import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import type { Band, BandFieldValue, ScheduleDay } from "@/types";
import type { ColumnId, Columns, EditorBands } from "./types";
import { moveBetweenColumns, moveBetweenDays } from "./bandPlacement";
import { loadTimetable, saveTimetable } from "./timetableRepository";

export function useTimetableEditor(scheduleId: string) {
  const [editorBands, setEditorBands] = useState<EditorBands>({
    unscheduled: [],
    byDay: {},
  });
  const [days, setDays] = useState<ScheduleDay[]>([]);
  const [activeDayId, setActiveDayId] = useState("");
  const [version, setVersion] = useState(0);
  const [deletedBreakIds, setDeletedBreakIds] = useState<string[]>([]);
  const persistedBandIds = useRef(new Set<string>());
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [scheduleTitle, setScheduleTitle] = useState("");
  const activeDay = days.find((day) => day.id === activeDayId);
  const startTime = activeDay?.start_time?.slice(0, 5) ?? "";
  const setStartTime = (value: string) => {
    setDays((prev) =>
      prev.map((day) =>
        day.id === activeDayId ? { ...day, start_time: value || null } : day,
      ),
    );
    setDirty(true);
  };
  const columns = useMemo<Columns>(
    () => ({
      unscheduled: editorBands.unscheduled,
      scheduled: editorBands.byDay[activeDayId] ?? [],
    }),
    [editorBands, activeDayId],
  );
  // ドラッグ操作は選択中の日だけを更新し、他の日の編集中データを保持する。
  const setColumns = useCallback(
    (action: SetStateAction<Columns>) => {
      setEditorBands((prev) => {
        const current = {
          unscheduled: prev.unscheduled,
          scheduled: prev.byDay[activeDayId] ?? [],
        };
        const next = typeof action === "function" ? action(current) : action;
        return {
          unscheduled: next.unscheduled,
          byDay: { ...prev.byDay, [activeDayId]: next.scheduled },
        };
      });
    },
    [activeDayId],
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      setToast({ type, message });
      window.setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const result = await loadTimetable(scheduleId);
        if (cancelled) return;
        setScheduleTitle(result.title);
        setVersion(result.version);
        setDays(result.days);
        setActiveDayId(result.days[0].id);
        persistedBandIds.current = result.bandIds;
        setDeletedBreakIds([]);
        setEditorBands(result.editorBands);
        setDirty(false);
      } catch (error) {
        if (!cancelled)
          setLoadError(
            `読み込みに失敗しました: ${error instanceof Error ? error.message : "DBの接続とマイグレーションを確認してください"}`,
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [scheduleId]);
  // 保存前に画面を閉じようとしたら警告する
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  const handleBandChange = (
    id: string,
    field: keyof Band,
    value: BandFieldValue,
  ) => {
    setColumns((prev) => ({
      unscheduled: prev.unscheduled.map((b) =>
        b.id === id ? { ...b, [field]: value } : b,
      ),
      scheduled: prev.scheduled.map((b) =>
        b.id === id ? { ...b, [field]: value } : b,
      ),
    }));
    setDirty(true);
  };

  // ボタンからの移動（ドラッグせずに配置／未配置へ戻す）
  const moveBand = (id: string, to: ColumnId) => {
    setColumns((prev) => moveBetweenColumns(prev, id, to));
    setDirty(true);
  };

  const addBreak = () => {
    const band: Band = {
      id: crypto.randomUUID(),
      schedule_day_id: null,
      band_name: "休憩",
      representative_name: "",
      duration_minutes: 10,
      is_break: true,
      sort_order: null,
      transition_duration: 0,
    };
    setColumns((prev) => ({
      ...prev,
      scheduled: [...prev.scheduled, band],
    }));
    setDirty(true);
  };

  const deleteBreak = (id: string) => {
    if (!window.confirm("この枠を削除しますか？")) return;
    if (persistedBandIds.current.has(id))
      setDeletedBreakIds((prev) => [...prev, id]);
    setColumns((prev) => ({
      unscheduled: prev.unscheduled.filter((b) => b.id !== id),
      scheduled: prev.scheduled.filter((b) => b.id !== id),
    }));
    setDirty(true);
  };

  const moveToDay = (id: string, targetDayId: string) => {
    setEditorBands((prev) =>
      moveBetweenDays(prev, id, activeDayId, targetDayId),
    );
    setDirty(true);
  };
  const handleSave = async () => {
    if (saving || loading || loadError || !days.length) return;
    setSaving(true);
    setSaveError("");

    try {
      const result = await saveTimetable({
        scheduleId,
        version,
        days,
        editorBands,
        deletedBreakIds,
        persistedBandIds: persistedBandIds.current,
      });
      setVersion(result.version);
      persistedBandIds.current = result.bandIds;
      setDeletedBreakIds([]);
      setDirty(false);
      showToast("success", "すべての日程を保存しました");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : "不明なエラーが発生しました";
      console.error(err);
      setSaveError(`保存に失敗しました: ${message}`);
      showToast("error", `保存に失敗しました: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  return {
    columns,
    setColumns,
    editorBands,
    days,
    activeDayId,
    setActiveDayId,
    startTime,
    setStartTime,
    dirty,
    setDirty,
    saving,
    loading,
    loadError,
    saveError,
    scheduleTitle,
    toast,
    handleBandChange,
    addBreak,
    deleteBreak,
    moveBand,
    moveToDay,
    handleSave,
  };
}

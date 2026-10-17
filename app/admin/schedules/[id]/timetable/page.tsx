"use client";

import { createClient } from "@/utils/supabase/client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ChevronLeft,
  Coffee,
  GripVertical,
  Inbox,
  Plus,
  Rows2,
  Rows3,
  Save,
} from "lucide-react";
import { Band, BandFieldValue, ScheduleDay } from "@/types";
import { ScheduledRow } from "@/components/admin/timetable/ScheduledRow";
import { UnscheduledCard } from "@/components/admin/timetable/UnscheduledCard";

const supabase = createClient();

// 2つのドロップ先（未配置リスト／タイムテーブル本体）をまとめて1つの状態として持つ。
// リスト間の移動を1回のsetStateで完結させたいのでオブジェクトにしている
type ColumnId = "unscheduled" | "scheduled";
type Columns = Record<ColumnId, Band[]>;
type EditorBands = { unscheduled: Band[]; byDay: Record<string, Band[]> };

const DEFAULT_START_TIME = "10:00";

// 表示密度の選択はブラウザに覚えさせる（出演数が多い団体は常に詰めたいため）
const COMPACT_STORAGE_KEY = "band-timeline:timetable-compact";

// "HH:MM" -> 0時からの通算分
const timeToMinutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return (hour || 0) * 60 + (minute || 0);
};

// 通算分 -> "HH:MM"（24時を超えたら 25:30 のように深夜表記のまま出す）
const minutesToTime = (minutes: number) => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

// 90 -> "1時間30分"
const formatDuration = (minutes: number) => {
  if (minutes <= 0) return "0分";
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  if (hour === 0) return `${minute}分`;
  if (minute === 0) return `${hour}時間`;
  return `${hour}時間${minute}分`;
};

/** 見出し付きの数値パネル。ヘッダーの統計表示に使う */
function StatCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-center gap-0.5 bg-white px-3 py-2 md:px-4">
      <span className="text-[11px] font-bold tracking-wide text-gray-400">
        {label}
      </span>
      {children}
    </div>
  );
}

/** ドロップを受け付けるエリア。中身が空でも落とせるようにするために必要 */
function DroppableColumn({
  id,
  className,
  children,
}: {
  id: ColumnId;
  className?: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={className}
      data-over={isOver ? "true" : undefined}
    >
      {children}
    </div>
  );
}

/** ドラッグ中に指へ追従する見た目だけのカード */
function DragPreview({ band }: { band: Band }) {
  return (
    <div
      className={`flex items-stretch overflow-hidden rounded-lg border shadow-lg ring-2 ring-blue-500 ${
        band.is_break
          ? "border-amber-200 bg-amber-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <span className="flex w-7 shrink-0 items-center justify-center border-r border-gray-200 bg-gray-50 text-gray-400">
        <GripVertical size={14} />
      </span>
      <span className="flex items-center gap-2 px-3 py-2">
        {band.is_break && <Coffee size={14} className="text-amber-600" />}
        <span className="text-sm font-bold text-gray-900">
          {band.band_name || "（名称未設定）"}
        </span>
        <span className="text-xs text-gray-400">
          {band.duration_minutes ?? 0}分
        </span>
      </span>
    </div>
  );
}

export default function TimetableEditor() {
  const params = useParams();
  const scheduleId = params.id as string;

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
  const setStartTime = (value: string) =>
    setDays((prev) =>
      prev.map((day) =>
        day.id === activeDayId ? { ...day, start_time: value || null } : day,
      ),
    );
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
  const [compact, setCompact] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const sensors = useSensors(
    // 5px以上動かさないとドラッグ開始しない。入力欄のクリックを邪魔しないため
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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
        // 関連データを1リクエストで読み、versionと配置の取得時点をそろえる。
        const { data, error } = await supabase
          .from("schedules")
          .select("title, timetable_version, schedule_days(*), bands(*)")
          .eq("id", scheduleId)
          .single();
        if (error) throw error;
        if (cancelled) return;
        const loadedDays = (data.schedule_days as ScheduleDay[]).sort((a, b) =>
          a.date.localeCompare(b.date),
        );
        if (!loadedDays.length)
          throw new Error(
            "開催日がありません。DBのマイグレーションを確認してください",
          );
        const bands = data.bands as Band[];
        setScheduleTitle(data.title);
        setVersion(data.timetable_version);
        setDays(loadedDays);
        setActiveDayId(loadedDays[0].id);
        persistedBandIds.current = new Set(bands.map((band) => band.id));
        setDeletedBreakIds([]);
        setEditorBands({
          unscheduled: bands.filter((band) => band.schedule_day_id === null),
          byDay: Object.fromEntries(
            loadedDays.map((day) => [
              day.id,
              bands
                .filter((band) => band.schedule_day_id === day.id)
                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
            ]),
          ),
        });
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

  // 前回選んだ表示密度を復元する（サーバー描画と食い違わないよう描画後に読む）
  useEffect(() => {
    setCompact(localStorage.getItem(COMPACT_STORAGE_KEY) === "1");
  }, []);

  const toggleCompact = () =>
    setCompact((prev) => {
      localStorage.setItem(COMPACT_STORAGE_KEY, prev ? "0" : "1");
      return !prev;
    });

  // 保存前に画面を閉じようとしたら警告する
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // 各枠の開始・終了時刻を先頭から積み上げて計算する
  const rows = useMemo(() => {
    let cursor = timeToMinutes(startTime || DEFAULT_START_TIME);

    return columns.scheduled.map((band, index) => {
      const isLast = index === columns.scheduled.length - 1;
      const start = cursor;
      const end = start + (band.duration_minutes ?? 0);
      const transitionMinutes = band.transition_duration ?? 0;

      // 転換は枠と枠の間だけ。最後の枠の後には積まない
      cursor = end + (isLast ? 0 : transitionMinutes);

      return {
        band,
        start: minutesToTime(start),
        end: minutesToTime(end),
        transition: isLast
          ? undefined
          : {
              start: minutesToTime(end),
              end: minutesToTime(end + transitionMinutes),
            },
      };
    });
  }, [columns.scheduled, startTime]);

  const stats = useMemo(() => {
    const startMinutes = timeToMinutes(startTime || DEFAULT_START_TIME);
    const endMinutes =
      rows.length > 0 ? timeToMinutes(rows[rows.length - 1].end) : startMinutes;
    const playMinutes = columns.scheduled.reduce(
      (total, band) => total + (band.duration_minutes ?? 0),
      0,
    );

    return {
      endTime: rows.length > 0 ? rows[rows.length - 1].end : null,
      totalMinutes: endMinutes - startMinutes,
      playMinutes,
      transitionMinutes: endMinutes - startMinutes - playMinutes,
      bandCount: columns.scheduled.filter((b) => !b.is_break).length,
      breakCount: columns.scheduled.filter((b) => b.is_break).length,
    };
  }, [columns.scheduled, rows, startTime]);

  const findColumn = useCallback(
    (id: string): ColumnId | null => {
      if (id === "unscheduled" || id === "scheduled") return id;
      if (columns.unscheduled.some((b) => b.id === id)) return "unscheduled";
      if (columns.scheduled.some((b) => b.id === id)) return "scheduled";
      return null;
    },
    [columns],
  );

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
    setColumns((prev) => {
      const from: ColumnId = to === "scheduled" ? "unscheduled" : "scheduled";
      const item = prev[from].find((b) => b.id === id);
      if (!item) return prev;

      const next = { ...prev };
      next[from] = prev[from].filter((b) => b.id !== id);
      next[to] = [...prev[to], item];
      return next;
    });
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
    setEditorBands((prev) => {
      const source = prev.byDay[activeDayId] ?? [];
      const band = source.find((item) => item.id === id);
      if (!band || targetDayId === activeDayId) return prev;
      return {
        ...prev,
        byDay: {
          ...prev.byDay,
          [activeDayId]: source.filter((item) => item.id !== id),
          [targetDayId]: [...(prev.byDay[targetDayId] ?? []), band],
        },
      };
    });
    setDirty(true);
  };

  // handleDragOver はドラッグ中に実際にリストを書き換えるため、
  // Escキーなどで中止されたときに戻せるよう開始時点の状態を控えておく
  const dragSnapshot = useRef<{ columns: Columns; dirty: boolean } | null>(
    null,
  );

  const handleDragStart = (event: DragStartEvent) => {
    dragSnapshot.current = { columns, dirty };
    setActiveId(event.active.id as string);
  };

  // 中止されたらリスト間の移動ごと巻き戻す（未保存フラグも掴む前の状態に戻す）
  const handleDragCancel = () => {
    if (dragSnapshot.current) {
      setColumns(dragSnapshot.current.columns);
      setDirty(dragSnapshot.current.dirty);
    }
    dragSnapshot.current = null;
    setActiveId(null);
  };

  // ドラッグ中にリストをまたいだら、その場でカードを移し替えて落ちる位置を見せる
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const from = findColumn(active.id as string);
    const to = findColumn(over.id as string);
    if (!from || !to || from === to) return;

    setColumns((prev) => {
      const source = prev[from];
      const target = prev[to];
      const item = source.find((b) => b.id === active.id);
      if (!item) return prev;

      // エリアそのものに重なっているときは末尾、カードに重なっているときはその位置へ
      let insertAt = target.length;
      const overIndex = target.findIndex((b) => b.id === over.id);
      if (overIndex !== -1) {
        const activeRect = active.rect.current.translated;
        const isBelowOverItem =
          !!activeRect && activeRect.top > over.rect.top + over.rect.height / 2;
        insertAt = overIndex + (isBelowOverItem ? 1 : 0);
      }

      const next = { ...prev };
      next[from] = source.filter((b) => b.id !== item.id);
      next[to] = [
        ...target.slice(0, insertAt),
        item,
        ...target.slice(insertAt),
      ];
      return next;
    });
    setDirty(true);
  };

  // 同じリスト内での並び替えを確定する（リスト間の移動はhandleDragOverで済んでいる）
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    dragSnapshot.current = null;
    if (!over) return;

    const from = findColumn(active.id as string);
    const to = findColumn(over.id as string);
    if (!from || !to || from !== to) return;

    const list = columns[from];
    const oldIndex = list.findIndex((b) => b.id === active.id);
    const newIndex =
      over.id === to
        ? list.length - 1
        : list.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    setColumns((prev) => {
      const next = { ...prev };
      next[from] = arrayMove(prev[from], oldIndex, newIndex);
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (saving || loading || loadError || !days.length) return;
    setSaving(true);
    setSaveError("");

    try {
      const serializeBand = (
        band: Band,
        dayId: string | null,
        index: number | null,
      ) => ({
        id: band.id,
        schedule_day_id: dayId,
        sort_order: index,
        band_name: band.band_name,
        duration_minutes: band.duration_minutes ?? 0,
        transition_duration: band.transition_duration ?? 0,
        is_new_break: !persistedBandIds.current.has(band.id) && band.is_break,
      });
      const updates = [
        ...days.flatMap((day) =>
          (editorBands.byDay[day.id] ?? []).map((band, index) =>
            serializeBand(band, day.id, index),
          ),
        ),
        ...editorBands.unscheduled.map((band) =>
          serializeBand(band, null, null),
        ),
      ];
      const { data, error } = await supabase.rpc("save_timetable", {
        p_schedule_id: scheduleId,
        p_version: version,
        p_days: days.map((day) => ({
          id: day.id,
          start_time: day.start_time || null,
        })),
        p_bands: updates,
        p_deleted_break_ids: deletedBreakIds,
      });
      if (error) throw error;
      setVersion(data);
      persistedBandIds.current = new Set(updates.map((band) => band.id));
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

  const activeBand =
    columns.unscheduled.find((b) => b.id === activeId) ||
    columns.scheduled.find((b) => b.id === activeId);

  if (loading) return <p className="p-10 text-center">読み込み中...</p>;
  if (loadError)
    return (
      <div className="p-10 text-center">
        <p role="alert" className="text-red-600">
          {loadError}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded border px-4 py-2"
        >
          再読み込み
        </button>
      </div>
    );

  return (
    <fieldset
      disabled={saving}
      aria-busy={saving}
      className="m-0 flex min-h-screen min-w-0 flex-col border-0 bg-gray-100 p-0 md:h-screen md:flex-row"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {/* 左サイドバー: 未配置のバンド */}
        <aside className="flex w-full shrink-0 flex-col border-b border-gray-200 bg-white md:h-screen md:w-80 md:border-b-0 md:border-r">
          <div className="border-b border-gray-200 px-4 py-3">
            <Link
              href="/admin/schedules"
              className="inline-flex items-center gap-0.5 text-xs text-gray-500 hover:text-gray-800"
            >
              <ChevronLeft size={14} />
              スケジュール一覧
            </Link>

            <div className="mt-2 flex items-baseline gap-2">
              <h2 className="text-sm font-bold text-gray-900">未配置</h2>
              <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-bold tabular-nums text-white">
                {columns.unscheduled.length}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-4 text-gray-400">
              全日程共通の未配置リストです。選択中の日に配置します
            </p>

            <button
              type="button"
              onClick={addBreak}
              className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1 rounded-md border border-dashed border-amber-400 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100"
            >
              <Plus size={14} />
              選択中の日に休憩・自由枠を追加
            </button>
          </div>

          <DroppableColumn
            id="unscheduled"
            className="max-h-80 flex-1 overflow-y-auto px-3 py-3 data-[over=true]:bg-blue-50/60 md:max-h-none"
          >
            <SortableContext
              items={columns.unscheduled.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {columns.unscheduled.map((band) => (
                <UnscheduledCard
                  key={band.id}
                  band={band}
                  onChange={handleBandChange}
                  onSchedule={(id) => moveBand(id, "scheduled")}
                  onDelete={band.is_break ? deleteBreak : undefined}
                />
              ))}
            </SortableContext>

            {!loading && columns.unscheduled.length === 0 && (
              <div className="flex flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-gray-200 px-4 py-8 text-center text-gray-400">
                <Inbox size={20} />
                <span className="text-xs">すべて配置済みです</span>
              </div>
            )}
          </DroppableColumn>
        </aside>

        {/* メイン: 作成中のタイムテーブル */}
        <main className="flex min-w-0 flex-1 flex-col md:h-screen">
          <header className="z-10 shrink-0 border-b border-gray-200 bg-white">
            {saveError && (
              <p
                role="alert"
                className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {saveError}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-gray-900">
                  タイムテーブル作成
                </h1>
                {scheduleTitle && (
                  <p className="truncate text-xs text-gray-400">
                    {scheduleTitle}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleCompact}
                  aria-pressed={compact}
                  title={
                    compact
                      ? "転換時間を展開して表示する"
                      : "行を詰めて全体を見やすくする"
                  }
                  className="flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  {compact ? <Rows3 size={14} /> : <Rows2 size={14} />}
                  {compact ? "通常表示" : "詰めて表示"}
                </button>
                {dirty && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    未保存の変更
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !!activeId}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  <Save size={16} />
                  {saving ? "保存中..." : "全日程を保存"}
                </button>
              </div>
            </div>

            <nav
              aria-label="編集する開催日"
              className="flex gap-2 overflow-x-auto border-t border-gray-100 px-4 py-3 md:px-6"
            >
              {days.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  disabled={!!activeId}
                  aria-pressed={day.id === activeDayId}
                  onClick={() => setActiveDayId(day.id)}
                  className={`shrink-0 rounded-md border px-3 py-2 text-sm font-bold ${day.id === activeDayId ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  {day.date.replaceAll("-", "/")}
                  <span className="ml-2 text-xs font-normal">
                    {
                      (editorBands.byDay[day.id] ?? []).filter(
                        (band) => !band.is_break,
                      ).length
                    }
                    組
                  </span>
                </button>
              ))}
            </nav>
            {!startTime && (
              <p className="px-4 pb-2 text-xs text-amber-700 md:px-6">
                開始時刻は未設定です。編集中は仮に10:00から表示します。
              </p>
            )}

            {/* 開始と終了を一目で確認するためのバー */}
            <div className="grid grid-cols-2 gap-px border-t border-gray-200 bg-gray-200 md:grid-cols-4">
              <StatCell label="開始時刻">
                <input
                  type="time"
                  aria-label="選択中の日の開始時刻"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setDirty(true);
                  }}
                  className="w-fit rounded border border-gray-300 px-1.5 py-0.5 text-xl font-bold tabular-nums text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </StatCell>

              <StatCell label="終了予定">
                <span className="text-xl font-bold tabular-nums text-gray-900">
                  {stats.endTime ?? "--:--"}
                </span>
              </StatCell>

              <StatCell label="出演組数">
                <span className="text-sm tabular-nums text-gray-900">
                  <strong className="text-xl font-bold">
                    {stats.bandCount}
                  </strong>
                  組
                  {stats.breakCount > 0 && (
                    <span className="ml-1.5 text-xs text-gray-400">
                      + 休憩{stats.breakCount}
                    </span>
                  )}
                </span>
              </StatCell>

              <StatCell label="所要時間">
                <span className="text-sm text-gray-900">
                  <strong className="text-xl font-bold tabular-nums">
                    {formatDuration(stats.totalMinutes)}
                  </strong>
                  <span className="ml-1.5 text-xs text-gray-400">
                    転換 {formatDuration(stats.transitionMinutes)}
                  </span>
                </span>
              </StatCell>
            </div>
          </header>

          <DroppableColumn
            id="scheduled"
            className="flex-1 overflow-y-auto px-3 pb-16 data-[over=true]:bg-blue-50/40 md:px-6"
          >
            <div className="mx-auto max-w-5xl">
              {/* 一覧の見出し行。画面幅が広いときだけ出す */}
              {rows.length > 0 && (
                <div className="sticky top-0 z-10 mb-1.5 hidden bg-gray-100/95 pb-1.5 pt-3 backdrop-blur md:flex">
                  <span className="w-7 shrink-0" />
                  <div className="grid flex-1 grid-cols-[1.75rem_8.5rem_minmax(0,1fr)_auto_2rem] gap-x-3 px-2.5 text-[11px] font-bold tracking-wide text-gray-400">
                    <span className="text-center">#</span>
                    <span>開始 → 終了</span>
                    <span>バンド名</span>
                    <span>{compact ? "演奏 / 転換" : "演奏時間"}</span>
                    <span />
                  </div>
                </div>
              )}

              <div className={rows.length > 0 ? "" : "pt-3"}>
                <SortableContext
                  items={columns.scheduled.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {rows.map(({ band, start, end, transition }, index) => (
                    <ScheduledRow
                      key={band.id}
                      band={band}
                      position={index + 1}
                      start={start}
                      end={end}
                      transition={transition}
                      compact={compact}
                      onChange={handleBandChange}
                      onUnschedule={(id) => moveBand(id, "unscheduled")}
                      days={days}
                      activeDayId={activeDayId}
                      onMoveToDay={moveToDay}
                      onDelete={band.is_break ? deleteBreak : undefined}
                    />
                  ))}
                </SortableContext>

                {loading ? (
                  <p className="py-16 text-center text-sm text-gray-400">
                    読み込み中...
                  </p>
                ) : (
                  rows.length === 0 && (
                    <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white/50 px-6 py-20 text-center text-gray-400">
                      <Inbox size={28} />
                      <p className="text-sm font-bold">
                        まだ配置されていません
                      </p>
                      <p className="text-xs">
                        左のリストからここへドラッグしてください
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </DroppableColumn>
        </main>

        <DragOverlay>
          {activeBand ? <DragPreview band={activeBand} /> : null}
        </DragOverlay>
      </DndContext>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md px-4 py-2.5 text-sm font-bold text-white shadow-lg ${
            toast.type === "success" ? "bg-gray-900" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </fieldset>
  );
}

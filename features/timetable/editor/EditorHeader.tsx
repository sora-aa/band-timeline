import { Rows2, Rows3, Save } from "lucide-react";
import type { ScheduleDay } from "@/types";
import type { EditorBands } from "./types";

interface EditorHeaderProps {
  scheduleTitle: string;
  saveError: string;
  saving: boolean;
  dirty: boolean;
  dragging: boolean;
  compact: boolean;
  toggleCompact: () => void;
  handleSave: () => void;
  days: ScheduleDay[];
  byDay: EditorBands["byDay"];
  activeDayId: string;
  setActiveDayId: (id: string) => void;
  children: React.ReactNode;
}
export function EditorHeader({
  scheduleTitle,
  saveError,
  saving,
  dirty,
  dragging,
  compact,
  toggleCompact,
  handleSave,
  days,
  byDay,
  activeDayId,
  setActiveDayId,
  children,
}: EditorHeaderProps) {
  return (
    <header className="z-10 shrink-0 border-b border-gray-200 bg-white">
      {saveError && (
        <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-gray-900">タイムテーブル作成</h1>
          {scheduleTitle && <p className="truncate text-xs text-gray-400">{scheduleTitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleCompact}
            aria-pressed={compact}
            title={compact ? "転換時間を展開して表示する" : "行を詰めて全体を見やすくする"}
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
            disabled={saving || dragging}
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
            disabled={dragging}
            aria-pressed={day.id === activeDayId}
            onClick={() => setActiveDayId(day.id)}
            className={`shrink-0 rounded-md border px-3 py-2 text-sm font-bold ${day.id === activeDayId ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {day.date.replaceAll("-", "/")}
            <span className="ml-2 text-xs font-normal">
              {(byDay[day.id] ?? []).filter((band) => !band.is_break).length}組
            </span>
          </button>
        ))}
      </nav>
      {children}
    </header>
  );
}

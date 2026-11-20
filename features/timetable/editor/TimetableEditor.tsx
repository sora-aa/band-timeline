"use client";

import { useMemo, useState } from "react";
import { DndContext, DragOverlay, MeasuringStrategy, closestCorners } from "@dnd-kit/core";
import { calculateRows } from "../timing";
import { useTimetableEditor } from "./useTimetableEditor";
import { useTimetableDrag } from "./useTimetableDrag";
import { DaySummary } from "./DaySummary";
import { DragPreview } from "./DragPreview";
import { EditorHeader } from "./EditorHeader";
import { ScheduledList } from "./ScheduledList";
import { UnscheduledList } from "./UnscheduledList";

const PREVIEW_START_TIME = "10:00";

// 表示密度の選択はブラウザに覚えさせる（出演数が多い団体は常に詰めたいため）
const COMPACT_STORAGE_KEY = "band-timeline:timetable-compact";

export default function TimetableEditor({ scheduleId }: { scheduleId: string }) {
  const editor = useTimetableEditor(scheduleId);
  const { columns, days, activeDayId, startTime, saving, loading, loadError, toast } = editor;
  const { activeBand, dragging, contextProps } = useTimetableDrag(editor);
  const rows = useMemo(
    () => calculateRows(columns.scheduled, startTime || PREVIEW_START_TIME),
    [columns.scheduled, startTime],
  );
  // 初回描画は読み込み表示なので、編集画面を開く前に表示密度を復元できる。
  const [compact, setCompact] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(COMPACT_STORAGE_KEY) === "1",
  );
  const toggleCompact = () => {
    localStorage.setItem(COMPACT_STORAGE_KEY, compact ? "0" : "1");
    setCompact(!compact);
  };

  if (loading) return <p className="p-10 text-center">読み込み中...</p>;
  if (loadError)
    return (
      <div className="p-10 text-center">
        <p role="alert" className="text-red-600">
          {loadError}
        </p>
        <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded border px-4 py-2">
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
        {...contextProps}
        collisionDetection={closestCorners}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      >
        <UnscheduledList
          bands={columns.unscheduled}
          onChange={editor.handleBandChange}
          onSchedule={(id) => editor.moveBand(id, "scheduled")}
          onAddBreak={editor.addBreak}
          onDeleteBreak={editor.deleteBreak}
        />
        <main className="flex min-w-0 flex-1 flex-col md:h-screen">
          <EditorHeader
            scheduleTitle={editor.scheduleTitle}
            saveError={editor.saveError}
            saving={saving}
            dirty={editor.dirty}
            dragging={dragging}
            compact={compact}
            toggleCompact={toggleCompact}
            handleSave={editor.handleSave}
            days={days}
            byDay={editor.editorBands.byDay}
            activeDayId={activeDayId}
            setActiveDayId={editor.setActiveDayId}
          >
            <DaySummary
              rows={rows}
              startTime={startTime}
              previewStartTime={PREVIEW_START_TIME}
              onStartTimeChange={editor.setStartTime}
            />
          </EditorHeader>
          <ScheduledList
            rows={rows}
            compact={compact}
            days={days}
            activeDayId={activeDayId}
            onChange={editor.handleBandChange}
            onUnschedule={(id) => editor.moveBand(id, "unscheduled")}
            onMoveToDay={editor.moveToDay}
            onDeleteBreak={editor.deleteBreak}
          />
        </main>

        <DragOverlay>{activeBand ? <DragPreview band={activeBand} /> : null}</DragOverlay>
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

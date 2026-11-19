import { useCallback, useRef, useState, type SetStateAction } from "react";
import {
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { moveBetweenColumns } from "./bandPlacement";
import type { ColumnId, Columns } from "./types";

export function useTimetableDrag({
  columns,
  setColumns,
  dirty,
  setDirty,
}: {
  columns: Columns;
  setColumns: (action: SetStateAction<Columns>) => void;
  dirty: boolean;
  setDirty: (value: boolean) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    // 5px以上動かさないとドラッグ開始しない。入力欄のクリックを邪魔しないため
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const findColumn = useCallback(
    (id: string): ColumnId | null => {
      if (id === "unscheduled" || id === "scheduled") return id;
      if (columns.unscheduled.some((b) => b.id === id)) return "unscheduled";
      if (columns.scheduled.some((b) => b.id === id)) return "scheduled";
      return null;
    },
    [columns],
  );
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
      const target = prev[to];

      // エリアそのものに重なっているときは末尾、カードに重なっているときはその位置へ
      let insertAt = target.length;
      const overIndex = target.findIndex((b) => b.id === over.id);
      if (overIndex !== -1) {
        const activeRect = active.rect.current.translated;
        const isBelowOverItem =
          !!activeRect && activeRect.top > over.rect.top + over.rect.height / 2;
        insertAt = overIndex + (isBelowOverItem ? 1 : 0);
      }

      return moveBetweenColumns(prev, active.id as string, to, insertAt);
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
  const activeBand =
    columns.unscheduled.find((b) => b.id === activeId) ||
    columns.scheduled.find((b) => b.id === activeId);

  return {
    activeBand,
    dragging: activeId !== null,
    contextProps: {
      sensors,
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDragEnd: handleDragEnd,
      onDragCancel: handleDragCancel,
    },
  };
}

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { ColumnId } from "./types";

/** 各リストをドロップ先にし、受け取った順序で枠を縦に並べ替える。 */
export function SortableBandList({
  id,
  bandIds,
  className,
  children,
}: {
  id: ColumnId;
  bandIds: string[];
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
      <SortableContext items={bandIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </div>
  );
}

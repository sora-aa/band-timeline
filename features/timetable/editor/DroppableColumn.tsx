import { useDroppable } from "@dnd-kit/core";
import type { ColumnId } from "./types";

/** ドロップを受け付けるエリア。中身が空でも落とせるようにするために必要 */
export function DroppableColumn({
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

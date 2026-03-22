"use client";

import clsx from "clsx";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Band, BandFieldValue } from "@/types";

// 親から渡されるデータの型定義
interface SortableItemProps {
  id: string;
  band: Band;
  isOverlay?: boolean; // ドラッグして持ち上げている状態かどうか

  // 入力欄を書き換えた時に実行する関数
  onChange: (id: string, field: keyof Band, value: BandFieldValue) => void;
}

export function SortableItem({
  id,
  band,
  isOverlay = false,
  onChange,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: "10px",
    backgroundColor: band.is_break ? "#fff7ed" : "white", // 休憩は色を変える
    border: isDragging ? "2px solid #2563eb" : "1px solid #d1d5db",
    borderRadius: "8px",
    opacity: isDragging ? 0.5 : 1,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    position: "relative" as const,
    overflow: "hidden",
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* カード全体ではなく「⋮」をつかんだ時だけドラッグできる */}
      <div
        {...attributes}
        {...listeners}
        className={clsx(
          "absolute bottom-0 left-0 top-0 flex w-6 items-center justify-center text-gray-500",
          band.is_break ? "bg-orange-200" : "bg-gray-200",
          isOverlay ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        ⋮
      </div>

      <div className="px-3 py-3 pl-9">
        <div className="mb-2">
          {band.is_break ? (
            <input
              type="text"
              value={band.band_name}
              onChange={(e) => onChange(id, "band_name", e.target.value)}
              placeholder="項目名 (例: 休憩)"
              className="box-border w-full rounded border border-gray-300 bg-white/50 p-1 text-base font-bold"
            />
          ) : (
            <div className="text-base font-bold">{band.band_name}</div>
          )}
          {!band.is_break && (
            <div className="text-xs text-gray-500">
              代表者: {band.representative_name}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2.5 text-[13px]">
          <div className="flex items-center gap-1">
            <label className="text-gray-500">時間:</label>
            <input
              type="number"
              value={band.duration_minutes ?? 0}
              onChange={(e) =>
                onChange(id, "duration_minutes", Number(e.target.value))
              }
              className="w-[50px] rounded border border-gray-300 p-1"
            />
            <span>分</span>
          </div>
          <div className="ml-auto flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5">
            <label className="text-[11px] text-gray-500">転換時間:</label>
            <input
              type="number"
              value={band.transition_duration ?? 10}
              onChange={(e) =>
                onChange(id, "transition_duration", Number(e.target.value))
              }
              className="w-[45px] rounded border border-gray-300 p-0.5 text-xs"
            />
            <span className="text-[11px]">分</span>
          </div>
        </div>
      </div>
    </div>
  );
}

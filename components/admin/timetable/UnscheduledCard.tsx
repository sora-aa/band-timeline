"use client";

import clsx from "clsx";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Coffee, CornerDownRight, GripVertical, Trash2 } from "lucide-react";
import { Band, BandFieldValue } from "@/types";
import { MinuteInput } from "./MinuteInput";

interface UnscheduledCardProps {
  band: Band;
  onChange: (id: string, field: keyof Band, value: BandFieldValue) => void;
  /** タイムテーブルの末尾へ追加する */
  onSchedule: (id: string) => void;
  /** 休憩枠を削除する（バンドには渡さない） */
  onDelete?: (id: string) => void;
  isOverlay?: boolean;
}

/**
 * 未配置リストの1件。20組を超えても一覧できるよう、1バンド＝1行に収めている。
 * 代表者名は行に出す余裕が無いのでツールチップに逃がしている。
 */
export function UnscheduledCard({
  band,
  onChange,
  onSchedule,
  onDelete,
  isOverlay = false,
}: UnscheduledCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: band.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx(
        "mb-0.5 flex items-stretch overflow-hidden rounded border",
        band.is_break
          ? "border-amber-200 bg-amber-50"
          : "border-gray-200 bg-white",
        isDragging && "opacity-40",
        isOverlay ? "shadow-lg ring-2 ring-blue-500" : "hover:border-gray-300",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`${band.band_name} をドラッグして配置する`}
        className={clsx(
          "flex w-6 shrink-0 touch-none items-center justify-center border-r text-gray-400",
          band.is_break
            ? "border-amber-200 bg-amber-100/70"
            : "border-gray-200 bg-gray-50",
          isOverlay ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        <GripVertical size={13} />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-1.5 px-1.5 py-1">
        {band.is_break ? (
          <>
            <Coffee size={13} className="shrink-0 text-amber-600" />
            <input
              type="text"
              value={band.band_name}
              aria-label="枠の名前"
              placeholder="項目名（例: 休憩）"
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => onChange(band.id, "band_name", e.target.value)}
              className="min-w-0 flex-1 rounded border border-amber-300 bg-white px-1 py-0.5 text-xs font-bold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </>
        ) : (
          <span
            title={
              band.representative_name
                ? `${band.band_name}（${band.representative_name}）`
                : band.band_name
            }
            className="min-w-0 flex-1 truncate text-xs font-bold text-gray-900"
          >
            {band.band_name || "（名称未設定）"}
          </span>
        )}

        <MinuteInput
          size="sm"
          value={band.duration_minutes ?? 0}
          ariaLabel={`${band.band_name} の演奏時間（分）`}
          onChange={(v) => onChange(band.id, "duration_minutes", v)}
        />

        <button
          type="button"
          onClick={() => onSchedule(band.id)}
          aria-label={`${band.band_name} を末尾に配置する`}
          title="末尾に配置"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-blue-50 hover:text-blue-600"
        >
          <CornerDownRight size={13} />
        </button>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(band.id)}
            aria-label={`${band.band_name} を削除する`}
            title="削除"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

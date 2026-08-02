"use client";

import clsx from "clsx";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Coffee, GripVertical, Undo2 } from "lucide-react";
import { Band, BandFieldValue } from "@/types";
import { MinuteInput } from "./MinuteInput";

interface ScheduledRowProps {
  band: Band;
  /** 画面に出す通し番号（1始まり） */
  position: number;
  start: string;
  end: string;
  /** 転換の開始〜終了。最後の枠には転換が無いので渡さない */
  transition?: { start: string; end: string };
  onChange: (id: string, field: keyof Band, value: BandFieldValue) => void;
  onUnschedule: (id: string) => void;
  /** 転換帯を畳んで1行あたりの高さを詰める（出演数が多いとき用） */
  compact?: boolean;
  /** ドラッグ中に指へ追従している複製かどうか */
  isOverlay?: boolean;
}

export function ScheduledRow({
  band,
  position,
  start,
  end,
  transition,
  onChange,
  onUnschedule,
  compact = false,
  isOverlay = false,
}: ScheduledRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition: sortableTransition,
    isDragging,
  } = useSortable({ id: band.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: sortableTransition,
      }}
      className={clsx(
        "overflow-hidden rounded-lg border",
        compact ? "mb-0.5" : "mb-1.5",
        band.is_break
          ? "border-amber-200 bg-amber-50"
          : "border-gray-200 bg-white",
        isDragging && "opacity-40",
        isOverlay
          ? "shadow-lg ring-2 ring-blue-500"
          : "shadow-sm hover:border-gray-300",
      )}
    >
      <div className="flex items-stretch">
        {/* つまみ。ここをつかんだ時だけドラッグが始まる */}
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`${band.band_name} を並び替える`}
          className={clsx(
            "flex w-7 shrink-0 touch-none items-center justify-center border-r text-gray-400",
            band.is_break
              ? "border-amber-200 bg-amber-100/70"
              : "border-gray-200 bg-gray-50",
            isOverlay ? "cursor-grabbing" : "cursor-grab",
          )}
        >
          <GripVertical size={14} />
        </button>

        <div
          className={clsx(
            "grid flex-1 grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-2.5 md:grid-cols-[1.75rem_8.5rem_minmax(0,1fr)_auto_2rem]",
            compact ? "py-1" : "py-1.5",
          )}
        >
          {/* 通し番号 */}
          <span className="col-start-1 row-start-1 text-center text-xs font-bold tabular-nums text-gray-400">
            {position}
          </span>

          {/* 開始 → 終了 */}
          <span className="col-start-2 row-start-1 whitespace-nowrap tabular-nums">
            <span className="text-base font-bold text-gray-900">{start}</span>
            <span className="mx-1 text-gray-300">→</span>
            <span className="text-sm text-gray-500">{end}</span>
          </span>

          {/* バンド名・代表者 */}
          <span className="col-span-2 col-start-2 row-start-2 min-w-0 md:col-span-1 md:col-start-3 md:row-start-1">
            {band.is_break ? (
              <span className="flex items-center gap-1.5">
                <Coffee size={14} className="shrink-0 text-amber-600" />
                <input
                  type="text"
                  value={band.band_name}
                  aria-label="枠の名前"
                  placeholder="項目名（例: 休憩）"
                  onPointerDown={(e) => e.stopPropagation()}
                  onChange={(e) => onChange(band.id, "band_name", e.target.value)}
                  className="w-full min-w-0 max-w-64 rounded border border-amber-300 bg-white px-1.5 py-0.5 text-sm font-bold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </span>
            ) : (
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="truncate text-sm font-bold text-gray-900">
                  {band.band_name || "（名称未設定）"}
                </span>
                {band.representative_name && (
                  <span className="hidden truncate text-xs text-gray-400 sm:inline">
                    {band.representative_name}
                  </span>
                )}
              </span>
            )}
          </span>

          {/* 演奏時間（コンパクト時は転換もここに畳み込む） */}
          <span className="col-span-2 col-start-2 row-start-3 flex items-center gap-1.5 md:col-span-1 md:col-start-4 md:row-start-1">
            <span className="text-[11px] text-gray-400">演奏</span>
            <MinuteInput
              size={compact ? "sm" : "md"}
              value={band.duration_minutes ?? 0}
              ariaLabel={`${band.band_name} の演奏時間（分）`}
              onChange={(v) => onChange(band.id, "duration_minutes", v)}
            />
            {compact && transition && (
              <>
                <span className="ml-1.5 text-[11px] text-gray-400">転換</span>
                <MinuteInput
                  size="sm"
                  value={band.transition_duration ?? 0}
                  ariaLabel={`${band.band_name} の後の転換時間（分）`}
                  onChange={(v) => onChange(band.id, "transition_duration", v)}
                />
              </>
            )}
          </span>

          {/* 未配置に戻す */}
          <button
            type="button"
            onClick={() => onUnschedule(band.id)}
            aria-label={`${band.band_name} を未配置に戻す`}
            title="未配置に戻す"
            className="col-start-3 row-start-1 flex h-7 w-7 items-center justify-center justify-self-end rounded text-gray-300 hover:bg-gray-100 hover:text-gray-600 md:col-start-5"
          >
            <Undo2 size={14} />
          </button>
        </div>
      </div>

      {/* 転換時間の帯。次の枠が何時に始まるかをその場で示す */}
      {!compact && transition && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-dashed border-gray-200 bg-gray-50/80 py-0.5 pl-9 pr-2.5 text-gray-500">
          <span className="whitespace-nowrap text-xs tabular-nums">
            {transition.start}
            <span className="mx-1 text-gray-300">→</span>
            {transition.end}
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="text-[11px]">転換</span>
            <MinuteInput
              size="sm"
              value={band.transition_duration ?? 0}
              ariaLabel={`${band.band_name} の後の転換時間（分）`}
              onChange={(v) => onChange(band.id, "transition_duration", v)}
            />
          </span>
        </div>
      )}
    </div>
  );
}

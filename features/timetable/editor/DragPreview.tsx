import type { Band } from "@/types";
import { GripVertical, Coffee } from "lucide-react";

/** ドラッグ中に指へ追従する見た目だけのカード */
export function DragPreview({ band }: { band: Band }) {
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

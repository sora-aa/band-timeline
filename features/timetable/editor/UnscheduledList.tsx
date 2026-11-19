import Link from "next/link";
import { ChevronLeft, Inbox, Plus } from "lucide-react";
import type { Band } from "@/types";
import type { BandChangeHandler } from "./types";
import { UnscheduledCard } from "./UnscheduledCard";
import { SortableBandList } from "./SortableBandList";

interface UnscheduledListProps {
  bands: Band[];
  onChange: BandChangeHandler;
  onSchedule: (id: string) => void;
  onAddBreak: () => void;
  onDeleteBreak: (id: string) => void;
}

export function UnscheduledList({
  bands,
  onChange,
  onSchedule,
  onAddBreak,
  onDeleteBreak,
}: UnscheduledListProps) {
  return (
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
            {bands.length}
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-4 text-gray-400">
          全日程共通の未配置リストです。選択中の日に配置します
        </p>

        <button
          type="button"
          onClick={onAddBreak}
          className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1 rounded-md border border-dashed border-amber-400 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100"
        >
          <Plus size={14} />
          選択中の日に休憩・自由枠を追加
        </button>
      </div>

      <SortableBandList
        id="unscheduled"
        bandIds={bands.map((band) => band.id)}
        className="max-h-80 flex-1 overflow-y-auto px-3 py-3 data-[over=true]:bg-blue-50/60 md:max-h-none"
      >
        {bands.map((band) => (
          <UnscheduledCard
            key={band.id}
            band={band}
            onChange={onChange}
            onSchedule={onSchedule}
            onDelete={band.is_break ? onDeleteBreak : undefined}
          />
        ))}

        {bands.length === 0 && (
          <div className="flex flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-gray-200 px-4 py-8 text-center text-gray-400">
            <Inbox size={20} />
            <span className="text-xs">すべて配置済みです</span>
          </div>
        )}
      </SortableBandList>
    </aside>
  );
}

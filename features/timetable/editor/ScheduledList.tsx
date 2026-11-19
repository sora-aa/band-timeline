import { Inbox } from "lucide-react";
import type { ScheduleDay } from "@/types";
import type { TimetableRow } from "../timing";
import type { BandChangeHandler } from "./types";
import { SortableBandList } from "./SortableBandList";
import { ScheduledRow } from "./ScheduledRow";

interface ScheduledListProps {
  rows: TimetableRow[];
  compact: boolean;
  onChange: BandChangeHandler;
  onUnschedule: (id: string) => void;
  days: ScheduleDay[];
  activeDayId: string;
  onMoveToDay: (id: string, dayId: string) => void;
  onDeleteBreak: (id: string) => void;
}

export function ScheduledList({
  rows,
  compact,
  onChange,
  onUnschedule,
  days,
  activeDayId,
  onMoveToDay,
  onDeleteBreak,
}: ScheduledListProps) {
  return (
    <SortableBandList
      id="scheduled"
      bandIds={rows.map(({ band }) => band.id)}
      className="flex-1 overflow-y-auto px-3 pb-16 data-[over=true]:bg-blue-50/40 md:px-6"
    >
      <div className="mx-auto max-w-5xl">
        {/* 一覧の見出し行。画面幅が広いときだけ出す */}
        {rows.length > 0 && (
          <div className="sticky top-0 z-10 mb-1.5 hidden bg-gray-100/95 pb-1.5 pt-3 backdrop-blur md:flex">
            <span className="w-7 shrink-0" />
            <div className="grid flex-1 grid-cols-[1.75rem_8.5rem_minmax(0,1fr)_auto_2rem] gap-x-3 px-2.5 text-[11px] font-bold tracking-wide text-gray-400">
              <span className="text-center">#</span>
              <span>開始 → 終了</span>
              <span>バンド名</span>
              <span>{compact ? "演奏 / 転換" : "演奏時間"}</span>
              <span />
            </div>
          </div>
        )}

        <div className={rows.length > 0 ? "" : "pt-3"}>
          {rows.map(({ band, start, end, transition }, index) => (
            <ScheduledRow
              key={band.id}
              band={band}
              position={index + 1}
              start={start}
              end={end}
              transition={transition}
              compact={compact}
              onChange={onChange}
              onUnschedule={onUnschedule}
              days={days}
              activeDayId={activeDayId}
              onMoveToDay={onMoveToDay}
              onDelete={band.is_break ? onDeleteBreak : undefined}
            />
          ))}

          {rows.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white/50 px-6 py-20 text-center text-gray-400">
              <Inbox size={28} />
              <p className="text-sm font-bold">まだ配置されていません</p>
              <p className="text-xs">左のリストからここへドラッグしてください</p>
            </div>
          )}
        </div>
      </div>
    </SortableBandList>
  );
}

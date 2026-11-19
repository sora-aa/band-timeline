import { formatDuration, summarizeRows, type TimetableRow } from "../timing";

/** 見出し付きの数値パネル。ヘッダーの統計表示に使う */
function StatCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-center gap-0.5 bg-white px-3 py-2 md:px-4">
      <span className="text-[11px] font-bold tracking-wide text-gray-400">
        {label}
      </span>
      {children}
    </div>
  );
}

export function DaySummary({
  startTime,
  previewStartTime,
  onStartTimeChange,
  rows,
}: {
  startTime: string;
  previewStartTime: string;
  onStartTimeChange: (value: string) => void;
  rows: TimetableRow[];
}) {
  const stats = summarizeRows(rows);
  return (
    <>
      {!startTime && (
        <p className="px-4 pb-2 text-xs text-amber-700 md:px-6">
          開始時刻は未設定です。編集中は仮に{previewStartTime}から表示します。
        </p>
      )}

      {/* 開始と終了を一目で確認するためのバー */}
      <div className="grid grid-cols-2 gap-px border-t border-gray-200 bg-gray-200 md:grid-cols-4">
        <StatCell label="開始時刻">
          <input
            type="time"
            aria-label="選択中の日の開始時刻"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            className="w-fit rounded border border-gray-300 px-1.5 py-0.5 text-xl font-bold tabular-nums text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </StatCell>

        <StatCell label="終了予定">
          <span className="text-xl font-bold tabular-nums text-gray-900">
            {stats.endTime ?? "--:--"}
          </span>
        </StatCell>

        <StatCell label="出演組数">
          <span className="text-sm tabular-nums text-gray-900">
            <strong className="text-xl font-bold">{stats.bandCount}</strong>組
            {stats.breakCount > 0 && (
              <span className="ml-1.5 text-xs text-gray-400">
                + 休憩{stats.breakCount}
              </span>
            )}
          </span>
        </StatCell>

        <StatCell label="所要時間">
          <span className="text-sm text-gray-900">
            <strong className="text-xl font-bold tabular-nums">
              {formatDuration(stats.totalMinutes)}
            </strong>
            <span className="ml-1.5 text-xs text-gray-400">
              転換 {formatDuration(stats.transitionMinutes)}
            </span>
          </span>
        </StatCell>
      </div>
    </>
  );
}

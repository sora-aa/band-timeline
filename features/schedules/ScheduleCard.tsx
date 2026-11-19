import Link from "next/link";
import type { Schedule } from "@/types";
import type { PublicationColumn } from "./useSchedules";

const formatDate = (start: string, end: string) => {
  // startが空なら空文字を返す
  if (!start) return "";

  const d1 = new Date(start); // 文字列をDateオブジェクトに変換
  const startDate = d1.toLocaleDateString("ja-JP").slice(2);

  if (start === end) {
    // 開始日と終了日が同じ場合は開始日のみ表示
    return startDate;
  } else {
    // 異なる場合は「YY/MM/DD ～ YY/MM/DD」形式で表示
    const d2 = new Date(end);
    const endDate = d2.toLocaleDateString("ja-JP").slice(2);
    return `${startDate} ～ ${endDate}`;
  }
};

export function ScheduleCard({
  schedule,
  onDelete,
  onToggle,
}: {
  schedule: Schedule;
  onDelete: () => void;
  onToggle: (column: PublicationColumn) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-2.5">
        <Link
          href={`/schedules/${schedule.id}/form/`}
          className="cursor-pointer rounded border border-gray-300 bg-gray-50 px-3 py-2 text-center text-sm text-gray-700 hover:bg-gray-200"
        >
          フォーム回答
        </Link>
        <Link
          href={`/schedules/${schedule.id}/timetable/`}
          className="cursor-pointer rounded border border-gray-300 bg-gray-50 px-3 py-2 text-center text-sm text-gray-700 hover:bg-gray-200"
        >
          タイムテーブル閲覧
        </Link>
      </div>
      <div className="flex-1">
        <h3 className="mb-1 text-lg font-semibold text-gray-800">
          {schedule.title}
        </h3>
        <p className="m-0 text-sm text-gray-500">
          📅 {formatDate(schedule.start_date, schedule.end_date)}
        </p>
      </div>

      <div className="flex flex-col gap-1 md:mr-5 md:items-end">
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-gray-500">フォーム</span>
          <button
            onClick={() => onToggle("is_form_open")}
            className={`w-20 rounded px-2.5 py-1.5 text-xs font-bold ${
              schedule.is_form_open
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {schedule.is_form_open ? "公開" : "非公開"}
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-gray-500">タイムテーブル</span>
          <button
            onClick={() => onToggle("is_timetable_open")}
            className={`w-20 rounded px-2.5 py-1.5 text-xs font-bold ${
              schedule.is_timetable_open
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {schedule.is_timetable_open ? "公開" : "非公開"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex flex-col gap-2.5">
          <Link
            href={`/admin/schedules/${schedule.id}/edit-form/`}
            className="cursor-pointer rounded border border-gray-300 bg-gray-50 px-3 py-2 text-center text-sm text-gray-700 hover:bg-gray-200"
          >
            フォーム編集
          </Link>

          <Link
            href={`/admin/schedules/${schedule.id}/timetable/`}
            className="cursor-pointer rounded border border-gray-300 bg-gray-50 px-3 py-2 text-center text-sm text-gray-700 hover:bg-gray-200"
          >
            タイムテーブル編集
          </Link>
        </div>

        <button
          onClick={onDelete}
          className="cursor-pointer rounded border border-red-100 bg-white px-3 py-2 text-sm text-red-500 hover:border-red-200 hover:bg-red-50"
        >
          削除
        </button>
      </div>
    </div>
  );
}

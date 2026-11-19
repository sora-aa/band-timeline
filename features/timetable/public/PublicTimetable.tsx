import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { calculateRows } from "../timing";
import { TimetableGrid } from "./TimetableGrid";

export default async function PublicTimetable({
  scheduleId,
  requestedDate,
}: {
  scheduleId: string;
  requestedDate?: string | string[];
}) {
  const supabase = await createClient();

  const { data: schedule } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", scheduleId)
    .single();

  if (!schedule) {
    return <div>データが見つかりません</div>;
  }

  // タイムテーブルが公開されていない場合は非公開のメッセージを表示
  if (!schedule.is_timetable_open) {
    return (
      <div className="mx-auto my-10 max-w-[600px] rounded-lg bg-gray-100 p-10 text-center">
        <h2>非公開</h2>
        <p>現在、タイムテーブルは公開されていません</p>
      </div>
    );
  }

  const { data: days, error: daysError } = await supabase
    .from("schedule_days")
    .select("id, date, start_time")
    .eq("schedule_id", scheduleId)
    .order("date");
  if (daysError || !days?.length) {
    return (
      <div className="p-10 text-center">開催日の情報を取得できませんでした</div>
    );
  }
  const selectedDay =
    requestedDate === undefined
      ? days[0]
      : days.find((day) => day.date === requestedDate);
  if (!selectedDay)
    return (
      <div className="p-10 text-center">
        <p>指定された開催日はありません</p>
        <Link
          className="text-blue-600 underline"
          href={`/schedules/${scheduleId}/timetable`}
        >
          最初の開催日を表示
        </Link>
      </div>
    );
  const { data: bands, error: bandsError } = await supabase
    .from("bands")
    .select(
      "id, band_name, representative_name, duration_minutes, transition_duration, is_break, sort_order, schedule_day_id",
    )
    .eq("schedule_id", scheduleId)
    .eq("schedule_day_id", selectedDay.id)
    .order("sort_order", { ascending: true });
  if (bandsError || !bands)
    return (
      <div className="p-10 text-center">タイムテーブルの取得に失敗しました</div>
    );

  // 日付表示を「YY/MM/DD」形式にフォーマット
  const displayDate = selectedDay.date.slice(2).replaceAll("-", "/");
  return (
    <div className="min-h-screen bg-gray-50 px-11 py-6 max-[900px]:p-4">
      <div className="mx-auto mb-4 max-w-[1120px]">
        <h1 className="mb-3 text-lg font-bold text-gray-900">
          {schedule.title}
        </h1>
        <nav aria-label="表示する開催日" className="flex gap-2 overflow-x-auto">
          {days.map((day) => (
            <Link
              key={day.id}
              href={`/schedules/${scheduleId}/timetable?date=${day.date}`}
              aria-current={day.id === selectedDay.id ? "page" : undefined}
              className={`shrink-0 rounded-md border px-3 py-2 text-sm font-bold ${day.id === selectedDay.id ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"}`}
            >
              {day.date.replaceAll("-", "/")}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mx-auto max-w-[1120px] bg-white shadow-lg">
        <header className="flex h-[54px] items-center justify-center border border-gray-300 text-3xl font-medium leading-none text-black">
          {displayDate}
        </header>
        {!selectedDay.start_time ? (
          <p className="p-10 text-center text-gray-500">
            この日の開始時刻は未設定です
          </p>
        ) : bands.length === 0 ? (
          <p className="p-10 text-center text-gray-500">
            この日のタイムテーブルはまだ作成されていません
          </p>
        ) : (
          <TimetableGrid rows={calculateRows(bands, selectedDay.start_time)} />
        )}
      </div>
    </div>
  );
}

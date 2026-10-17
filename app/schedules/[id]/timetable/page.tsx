import type { CSSProperties } from "react";
import Link from "next/link";
import { TimetableRow } from "@/types";
import { createClient } from "@/utils/supabase/server";

export default async function TimetablePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const supabase = await createClient();
  const scheduleId = (await params).id;

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
  const requestedDate = (await searchParams).date;
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

  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // 日付表示を「YY/MM/DD」形式にフォーマット
  const displayDate = selectedDay.date.slice(2).replaceAll("-", "/");

  let startTime = timeToMinutes(selectedDay.start_time ?? "00:00");
  const timetableData: TimetableRow[] = [];
  for (const band of bands) {
    const endTime = startTime + band.duration_minutes;
    timetableData.push({
      band,
      start_time: minutesToTime(startTime),
      end_time: minutesToTime(endTime),
    });
    startTime = endTime + (band.transition_duration ?? 0);
  }

  // 最後の出番の後に転換は無いので、その行だけ転換を描画しない
  const lastBandId = timetableData[timetableData.length - 1]?.band.id;

  // 1カラムに収める最大行数。行が増えたときのみ列を追加する
  const maxRowsPerColumn = 12;
  const columnCount = Math.max(
    1,
    Math.ceil(timetableData.length / maxRowsPerColumn),
  );

  // 先頭の列だけを上限まで詰めると列の高さが大きく偏るため、全列へ均等に配る
  // （例: 20組を12/8ではなく10/10に分ける）
  const rowsPerColumn = Math.ceil(timetableData.length / columnCount);

  // 列ごとに表示する行データを分割
  const columns = Array.from({ length: columnCount }, (_, index) => {
    const startIndex = index * rowsPerColumn;
    return timetableData.slice(startIndex, startIndex + rowsPerColumn);
  });

  // grid-template-columns を直接インラインで指定すると、狭い画面で1列に戻す
  // クラス（max-[900px]:grid-cols-1）がインラインstyleに負けてしまう。
  // 列数だけをCSS変数で渡し、実際の指定はクラス側に任せる
  const gridStyle = {
    "--timetable-columns": String(columnCount),
  } as CSSProperties;

  const renderColumn = (rows: TimetableRow[]) => {
    return rows.map((data) => {
      const timeText = `${data.start_time}-${data.end_time}`;
      const bandText = `${data.band.band_name} (${data.band.duration_minutes}分)`;
      const transitionText = `転換 (${data.band.transition_duration}分)`;
      const transitionTimeText = `${data.end_time} - ${minutesToTime(timeToMinutes(data.end_time) + (data.band.transition_duration || 0))}`;

      return (
        <div key={data.band.id}>
          <div className="grid min-h-[41px] grid-cols-[120px_minmax(0,1fr)] border-b border-gray-300">
            <div className="border-r border-gray-300 bg-amber-50 p-2 text-sm leading-5 text-black">
              {timeText}
            </div>
            <div
              className={
                data.band.is_break
                  ? "break-words bg-gray-100 p-2 text-sm leading-5 text-black"
                  : "break-words bg-white p-2 text-sm leading-5 text-black"
              }
            >
              {bandText}
            </div>
          </div>
          {data.band.id !== lastBandId &&
            (data.band.transition_duration ?? 0) > 0 && (
              <div className="grid min-h-[41px] grid-cols-[120px_minmax(0,1fr)] border-b border-gray-300">
                <div className="border-r border-gray-300 bg-amber-50 p-2 text-sm leading-5 text-black">
                  <p>{transitionTimeText}</p>
                </div>
                <div className="break-words bg-white p-2 text-sm leading-5 text-black">
                  {transitionText}
                </div>
              </div>
            )}
        </div>
      );
    });
  };

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
          <section
            className="grid grid-cols-[repeat(var(--timetable-columns),minmax(0,1fr))] border-b border-l border-r border-gray-300 max-[900px]:grid-cols-1"
            style={gridStyle}
          >
            {columns.map((rows, index) => (
              <div
                key={index}
                className="border-r border-gray-300 last:border-r-0 max-[900px]:border-b max-[900px]:border-r-0 max-[900px]:last:border-b-0"
              >
                {renderColumn(rows)}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

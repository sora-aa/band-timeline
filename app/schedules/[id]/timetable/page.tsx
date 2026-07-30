import { TimetableRow } from "@/types";
import { createClient } from "@/utils/supabase/server";

export default async function TimetablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const scheduleId = (await params).id;

  const { data: schedule } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", scheduleId)
    .single();

  const { data: bands } = await supabase
    .from("bands")
    .select("*")
    .eq("schedule_id", scheduleId)
    .not("sort_order", "is", null)
    .order("sort_order", { ascending: true });

  if (!schedule || !bands) {
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

  if (!schedule.start_time) {
    return <div>開始時間が設定されていません</div>;
  }

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
  const displayDate = new Date(schedule.start_date)
    .toLocaleDateString("ja-JP")
    .slice(2);

  let startTime = timeToMinutes(schedule.start_time);
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

  // 1カラムに収める最大行数。行が増えたときのみ列を追加する
  const maxRowsPerColumn = 12;
  const columnCount = Math.max(
    1,
    Math.ceil(timetableData.length / maxRowsPerColumn),
  );

  // 列ごとに表示する行データを分割
  const columns = Array.from({ length: columnCount }, (_, index) => {
    const startIndex = index * maxRowsPerColumn;
    return timetableData.slice(startIndex, startIndex + maxRowsPerColumn);
  });

  const gridStyle = {
    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
  };

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
          {(data.band.transition_duration ?? 0) > 0 && (
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
      <div className="mx-auto max-w-[1120px] bg-white shadow-lg">
        <header className="flex h-[54px] items-center justify-center border border-gray-300 text-3xl font-medium leading-none text-black">
          {displayDate}
        </header>
        <section
          className="grid border-b border-l border-r border-gray-300 max-[900px]:grid-cols-1"
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
      </div>
    </div>
  );
}

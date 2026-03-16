import { TimetableRow } from "@/types";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default async function TimetablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const [hour, minute] = schedule.start_time.split(":").map(Number);

  const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  let startTime = hour * 60 + minute;
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

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>開始時刻</th>
            <th>終了時刻</th>
            <th>バンド名</th>
          </tr>
        </thead>
        <tbody>
          {timetableData.map((data) => (
            <tr key={data.band.id}>
              <td>{data.start_time}</td>
              <td>{data.end_time}</td>
              <td>
                {data.band.band_name} {data.band.is_break && "(休憩)"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

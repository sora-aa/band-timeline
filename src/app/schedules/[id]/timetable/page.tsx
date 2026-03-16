import { TimetableRow } from "@/types";
import { createClient } from "@supabase/supabase-js";
import type { CSSProperties } from "react";
import styles from "./style.module.css";

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

  const displayDate = new Date(schedule.start_date).toLocaleDateString(
    "ja-JP",
    {
      month: "numeric",
      day: "numeric",
    },
  );

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

  // CSS変数で列数を渡し、CSS Modules側でrepeatに使用する
  const gridStyle = {
    "--column-count": columnCount,
  } as CSSProperties;

  const renderColumn = (rows: TimetableRow[]) => {
    return rows.map((data) => {
      const timeText = `${data.start_time}-${data.end_time}`;
      const bandText = `${data.band.band_name} (${data.band.duration_minutes}分)`;
      const transitionText = `転換 (${data.band.transition_duration}分)`;
      const transitionTimeText = `${data.end_time} - ${minutesToTime(timeToMinutes(data.end_time) + (data.band.transition_duration || 0))}`;

      return (
        <div key={data.band.id}>
          <div className={styles.row}>
            <div className={styles.timeCell}>{timeText}</div>
            <div
              className={
                data.band.is_break ? styles.breakCell : styles.bandCell
              }
            >
              {bandText}
            </div>
          </div>
          {(data.band.transition_duration ?? 0) > 0 && (
            <div className={styles.row}>
              <div className={styles.timeCell}>
                <p>{transitionTimeText}</p>
              </div>
              <div className={styles.bandCell}>{transitionText}</div>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>{displayDate}</header>
        <section className={styles.grid} style={gridStyle}>
          {columns.map((rows, index) => (
            <div key={index} className={styles.column}>
              {renderColumn(rows)}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

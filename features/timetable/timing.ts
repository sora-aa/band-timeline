import type { Band } from "@/types";

// "HH:MM" -> 0時からの通算分
const timeToMinutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return (hour || 0) * 60 + (minute || 0);
};

// 通算分 -> "HH:MM"（24時を超えたら 25:30 のように深夜表記のまま出す）
const minutesToTime = (minutes: number) => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

// 90 -> "1時間30分"
export const formatDuration = (minutes: number) => {
  if (minutes <= 0) return "0分";
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  if (hour === 0) return `${minute}分`;
  if (minute === 0) return `${hour}時間`;
  return `${hour}時間${minute}分`;
};

export function calculateRows(bands: Band[], startTime: string) {
  let cursor = timeToMinutes(startTime);
  return bands.map((band, index) => {
    const isLast = index === bands.length - 1;
    const start = cursor;
    const end = start + (band.duration_minutes ?? 0);
    const transitionMinutes = band.transition_duration ?? 0;

    // 転換は枠と枠の間だけ。最後の枠の後には積まない
    cursor = end + (isLast ? 0 : transitionMinutes);

    return {
      band,
      start: minutesToTime(start),
      end: minutesToTime(end),
      transition: isLast
        ? undefined
        : {
            start: minutesToTime(end),
            end: minutesToTime(end + transitionMinutes),
          },
    };
  });
}

export type TimetableRow = ReturnType<typeof calculateRows>[number];

export function summarizeRows(rows: TimetableRow[]) {
  const first = rows[0];
  const last = rows.at(-1);
  const totalMinutes = first && last ? timeToMinutes(last.end) - timeToMinutes(first.start) : 0;
  const playMinutes = rows.reduce((sum, { band }) => sum + (band.duration_minutes ?? 0), 0);
  const breakCount = rows.filter(({ band }) => band.is_break).length;
  return {
    endTime: last?.end,
    totalMinutes,
    transitionMinutes: totalMinutes - playMinutes,
    bandCount: rows.length - breakCount,
    breakCount,
  };
}

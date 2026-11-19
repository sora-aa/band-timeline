import type { Band, ScheduleDay } from "@/types";
import { createClient } from "@/utils/supabase/client";
import type { EditorBands } from "./types";

const supabase = createClient();

export async function loadTimetable(scheduleId: string) {
  // 関連データを1リクエストで読み、versionと配置の取得時点をそろえる。
  const { data, error } = await supabase
    .from("schedules")
    .select("title, timetable_version, schedule_days(*), bands(*)")
    .eq("id", scheduleId)
    .single();
  if (error) throw error;
  const loadedDays = (data.schedule_days as ScheduleDay[]).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  if (!loadedDays.length)
    throw new Error(
      "開催日がありません。DBのマイグレーションを確認してください",
    );
  const bands = data.bands as Band[];

  return {
    title: data.title as string,
    version: data.timetable_version as number,
    days: loadedDays,
    bandIds: new Set(bands.map((band) => band.id)),
    editorBands: {
      unscheduled: bands.filter((band) => band.schedule_day_id === null),
      byDay: Object.fromEntries(
        loadedDays.map((day) => [
          day.id,
          bands
            .filter((band) => band.schedule_day_id === day.id)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
        ]),
      ),
    },
  };
}

interface TimetableSave {
  scheduleId: string;
  version: number;
  days: ScheduleDay[];
  editorBands: EditorBands;
  persistedBandIds: Set<string>;
  deletedBreakIds: string[];
}

export async function saveTimetable({
  scheduleId,
  version,
  days,
  editorBands,
  persistedBandIds,
  deletedBreakIds,
}: TimetableSave) {
  const serializeBand = (
    band: Band,
    dayId: string | null,
    index: number | null,
  ) => ({
    id: band.id,
    schedule_day_id: dayId,
    sort_order: index,
    band_name: band.band_name,
    duration_minutes: band.duration_minutes ?? 0,
    transition_duration: band.transition_duration ?? 0,
    is_new_break: !persistedBandIds.has(band.id) && band.is_break,
  });
  const updates = [
    ...days.flatMap((day) =>
      (editorBands.byDay[day.id] ?? []).map((band, index) =>
        serializeBand(band, day.id, index),
      ),
    ),
    ...editorBands.unscheduled.map((band) => serializeBand(band, null, null)),
  ];
  const { data, error } = await supabase.rpc("save_timetable", {
    p_schedule_id: scheduleId,
    p_version: version,
    p_days: days.map((day) => ({
      id: day.id,
      start_time: day.start_time || null,
    })),
    p_bands: updates,
    p_deleted_break_ids: deletedBreakIds,
  });
  if (error) throw error;

  return {
    version: data as number,
    bandIds: new Set(updates.map((band) => band.id)),
  };
}

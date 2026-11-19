import type { ColumnId, Columns, EditorBands } from "./types";

/** 選択日の配置済みリストと、全日程共通の未配置リストの間で1枠を移す。 */
export function moveBetweenColumns(
  columns: Columns,
  bandId: string,
  destination: ColumnId,
  insertAt = columns[destination].length,
): Columns {
  const source = destination === "scheduled" ? "unscheduled" : "scheduled";
  const band = columns[source].find((item) => item.id === bandId);
  if (!band) return columns;

  const target = columns[destination];
  return {
    ...columns,
    [source]: columns[source].filter((item) => item.id !== bandId),
    [destination]: [
      ...target.slice(0, insertAt),
      band,
      ...target.slice(insertAt),
    ],
  };
}

/** 日付変更メニューでは移動先の出演順の末尾に加える。 */
export function moveBetweenDays(
  bands: EditorBands,
  bandId: string,
  sourceDayId: string,
  targetDayId: string,
): EditorBands {
  const source = bands.byDay[sourceDayId] ?? [];
  const band = source.find((item) => item.id === bandId);
  if (!band || sourceDayId === targetDayId) return bands;

  return {
    ...bands,
    byDay: {
      ...bands.byDay,
      [sourceDayId]: source.filter((item) => item.id !== bandId),
      [targetDayId]: [...(bands.byDay[targetDayId] ?? []), band],
    },
  };
}

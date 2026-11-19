import type { Band, BandFieldValue } from "@/types";

// 2つのドロップ先（未配置リスト／タイムテーブル本体）をまとめて1つの状態として持つ。
// リスト間の移動を1回のsetStateで完結させたいのでオブジェクトにしている
export type ColumnId = "unscheduled" | "scheduled";
export type Columns = Record<ColumnId, Band[]>;
export type EditorBands = {
  unscheduled: Band[];
  byDay: Record<string, Band[]>;
};

export type BandChangeHandler = (
  id: string,
  field: keyof Band,
  value: BandFieldValue,
) => void;

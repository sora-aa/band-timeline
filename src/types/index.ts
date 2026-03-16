export type QuestionType =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "select";

export type QuestionAnswer = string | number | boolean | string[];

export interface QuestionField {
  id: string;
  label: string; //質問文
  type: QuestionType; //入力タイプ
  required: boolean; //必須かどうか
  options?: string[]; //選択肢（selectタイプの場合）
  description?: string; //補足説明
}

export interface Band {
  id: string;
  representative_name: string;
  band_name: string;
  duration_minutes: number;
  is_break: boolean;
  sort_order: number | null;
  transition_duration: number | null;

  custom_answers?: {
    [question_id: string]: QuestionAnswer | undefined;
  };
}

export type Schedule = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  form_schema: QuestionField[];
  is_form_open: boolean;
  is_timetable_open: boolean;
  start_time: string | null;
};

// Band型のフィールド値のユニオン型
export type BandFieldValue = Band[keyof Band];

export interface TimetableRow {
  band: Band;
  start_time: string;
  end_time: string;
}

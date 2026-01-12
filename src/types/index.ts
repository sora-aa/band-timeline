export type QuestionType =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "select";

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
  name: string;
  durationMinutes: number;
  isBreak: boolean;

  customAnswers?: {
    [questionId: string]: string | number | boolean | string[] | undefined;
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
};

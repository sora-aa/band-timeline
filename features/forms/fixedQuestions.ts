import type { QuestionField } from "@/types";

export const FIXED_QUESTION_IDS = {
  representativeName: "fixed-1",
  bandName: "fixed-2",
  durationMinutes: "fixed-3",
} as const;

// デフォルトで表示する固定質問
export const DEFAULT_QUESTIONS: QuestionField[] = [
  {
    id: FIXED_QUESTION_IDS.representativeName,
    label: "代表者名(ひらがなフルネーム)",
    type: "text",
    required: true,
    description: "",
  },
  {
    id: FIXED_QUESTION_IDS.bandName,
    label: "バンド名または演奏予定アーティスト",
    type: "text",
    required: true,
    description: "",
  },
  {
    id: FIXED_QUESTION_IDS.durationMinutes,
    label: "演奏時間(分)",
    type: "number",
    required: true,
    description: "",
  },
];

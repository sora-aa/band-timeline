import type { QuestionAnswer, QuestionField } from "@/types";
import { FIXED_QUESTION_IDS } from "../fixedQuestions";

export function AnswerField({
  question,
  value,
  onChange,
}: {
  question: QuestionField;
  value: QuestionAnswer | undefined;
  onChange: (value: QuestionAnswer) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-bold">
        {question.label} {question.required && <span className="text-red-500">*</span>}
      </label>

      {question.description && <p className="-mt-1 mb-0 text-xs text-gray-600">{question.description}</p>}

      {question.type === "text" && (
        <input
          type="text"
          required={question.required}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md border border-gray-300 p-3 text-base"
        />
      )}

      {question.type === "textarea" && (
        <textarea
          rows={4}
          required={question.required}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md border border-gray-300 p-3 text-base"
        />
      )}

      {question.type === "number" && (
        <input
          type="number"
          min={question.id === FIXED_QUESTION_IDS.durationMinutes ? 0 : undefined}
          step={question.id === FIXED_QUESTION_IDS.durationMinutes ? 1 : undefined}
          required={question.required}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md border border-gray-300 p-3 text-base"
        />
      )}

      {question.type === "select" && (
        <select
          required={question.required}
          defaultValue=""
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md border border-gray-300 bg-white p-3 text-base"
        >
          <option value="" disabled>
            選択してください
          </option>
          {question.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}

      {question.type === "checkbox" && (
        <div className="flex flex-col gap-2">
          {question.options?.map((option) => (
            <label key={option} className="flex items-center gap-2">
              <input
                type="checkbox"
                value={option}
                onChange={(e) => {
                  const current = Array.isArray(value) ? value : [];
                  let next;

                  if (e.target.checked) {
                    next = [...current, option];
                  } else {
                    next = current.filter((v) => v !== option);
                  }

                  onChange(next);
                }}
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

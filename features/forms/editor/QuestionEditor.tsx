import { Lock, Trash2 } from "lucide-react";
import type { QuestionField, QuestionType } from "@/types";
import { QuestionOptions } from "./QuestionOptions";

export function QuestionEditor({
  field,
  index,
  isFixed,
  onChange,
  onRemove,
}: {
  field: QuestionField;
  index: number;
  isFixed: boolean;
  onChange: (updates: Partial<QuestionField>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-6">
      <div className="mb-4 flex items-start justify-between">
        <div className="mb-4 flex-1">
          <label className="mb-2 block font-bold">
            {isFixed && (
              <Lock size={14} className="mr-1 inline-block align-middle" />
            )}
            質問 {index + 1}
            {isFixed && (
              <span className="ml-1.5 text-[10px] font-normal text-gray-500">
                (固定項目)
              </span>
            )}
          </label>
          <input
            type="text"
            className="mt-1 w-full rounded border border-gray-300 p-2 text-base disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
            placeholder="例：バンド名"
            value={field.label}
            readOnly={isFixed}
            disabled={isFixed}
            onChange={(e) => onChange({ label: e.target.value })}
          />
        </div>
        {!isFixed && (
          <button
            onClick={onRemove}
            className="cursor-pointer rounded bg-red-100 px-3 py-1 text-sm text-red-500"
          >
            <Trash2 size={16} />
            削除
          </button>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className="text-[0.9rem] text-gray-500">回答タイプ</label>
          <select
            className="mt-1 w-full rounded border border-gray-300 p-2 text-base disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-70"
            value={field.type}
            disabled={isFixed}
            onChange={(e) =>
              onChange({
                type: e.target.value as QuestionType,
              })
            }
          >
            <option value="text">テキスト</option>
            <option value="textarea">長文テキスト</option>
            <option value="number">数値</option>
            <option value="select">選択式</option>
            <option value="checkbox">複数選択</option>
          </select>
        </div>

        <div className="flex items-end pb-2">
          <label className="flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={field.required}
              disabled={isFixed}
              onChange={(e) => onChange({ required: e.target.checked })}
              className="mr-2"
            />
            必須項目にする
          </label>
        </div>
      </div>

      {(field.type === "select" || field.type === "checkbox") && (
        <QuestionOptions
          options={field.options ?? []}
          onChange={(options) => onChange({ options })}
        />
      )}

      <div>
        <label className="text-[0.9rem] text-gray-500">補足説明（任意）</label>
        <input
          type="text"
          className="mt-1 w-full rounded border border-gray-300 p-2 text-base"
          placeholder="例：バンド名の由来も教えてください"
          value={field.description || ""}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>
    </div>
  );
}

import { Trash2 } from "lucide-react";

export function QuestionOptions({
  options,
  onChange,
}: {
  options: string[];
  onChange: (options: string[]) => void;
}) {
  function updateOption(index: number, value: string) {
    onChange(options.map((option, i) => (i === index ? value : option)));
  }
  return (
    <div className="mb-4">
      <label className="text-[0.9rem] text-gray-500">
        選択肢（各入力欄に1つずつ入力）
      </label>

      <div className="mb-4 mt-3 flex flex-col gap-3">
        {options.map((option, optionIndex) => (
          <div key={optionIndex} className="flex items-center gap-2">
            <input
              type="text"
              className="flex-1 rounded border border-gray-300 p-2 text-base focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              placeholder={`選択肢 ${optionIndex + 1}`}
              value={option}
              onChange={(e) => updateOption(optionIndex, e.target.value)}
            />
            <button
              type="button"
              onClick={() =>
                onChange(options.filter((_, i) => i !== optionIndex))
              }
              className="flex cursor-pointer items-center justify-center rounded border border-red-200 bg-red-100 p-2 text-red-600 hover:bg-red-300"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange([...options, ""])}
        className="cursor-pointer rounded border border-blue-300 bg-blue-100 px-4 py-2 text-sm text-blue-800 hover:bg-blue-200"
      >
        + 選択肢を追加
      </button>
    </div>
  );
}

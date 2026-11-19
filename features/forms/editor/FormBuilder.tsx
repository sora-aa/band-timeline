import { useState } from "react";
import { Plus } from "lucide-react";
import type { QuestionField } from "@/types";
import { DEFAULT_QUESTIONS } from "../fixedQuestions";
import { QuestionEditor } from "./QuestionEditor";

interface FormBuilderProps {
  onSave: (fields: QuestionField[]) => void;
  initialFields?: QuestionField[]; // すでに質問データがあった場合に渡す
}
export default function FormBuilder({ onSave, initialFields = [] }: FormBuilderProps) {
  const [fields, setFields] = useState(initialFields.length ? initialFields : DEFAULT_QUESTIONS);

  function addField() {
    const field: QuestionField = {
      id: crypto.randomUUID(),
      label: "",
      type: "text",
      required: false,
    };
    setFields((current) => [...current, field]);
  }

  return (
    <div className="mx-auto max-w-[800px] rounded-lg bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold">フォーム項目の設定</h2>

      <div className="mb-8 flex flex-col gap-6">
        {fields.map((field, index) => (
          <QuestionEditor
            key={field.id}
            field={field}
            index={index}
            isFixed={index < DEFAULT_QUESTIONS.length}
            onChange={(updates) =>
              setFields((current) => current.map((item) => (item.id === field.id ? { ...item, ...updates } : item)))
            }
            onRemove={() => setFields((current) => current.filter((item) => item.id !== field.id))}
          />
        ))}
      </div>

      <button
        onClick={addField}
        className="w-full cursor-pointer rounded-md border-2 border-dashed border-gray-300 bg-transparent p-4 font-semibold text-gray-500 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-500"
      >
        <Plus size={20} className="mr-2 inline align-middle" />
        新しい質問を追加する
      </button>

      <div className="mt-8 text-right">
        <button
          onClick={() => onSave(fields)}
          className="cursor-pointer rounded-md border-none bg-black px-8 py-3 text-base text-white"
        >
          この設定を保存する
        </button>
      </div>
    </div>
  );
}

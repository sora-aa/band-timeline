"use client";

import { useState } from "react";
import { QuestionField, QuestionType } from "@/types";
import { Plus, Trash2, Lock } from "lucide-react";

// onSaveという関数を渡すよう親コンポーネントに要求
// 引数として質問データの配列を渡す
// voidは返り値がないことを示す
interface FormBuilderProps {
  onSave: (fields: QuestionField[]) => void;
  initialFields?: QuestionField[]; // すでに質問データがあった場合に渡す
}

// デフォルトで表示する固定質問
const DEFAULT_QUESTIONS: QuestionField[] = [
  {
    id: "fixed-1",
    label: "代表者名(ひらがなフルネーム)",
    type: "text",
    required: true,
    description: "",
  },
  {
    id: "fixed-2",
    label: "バンド名または演奏予定アーティスト",
    type: "text",
    required: true,
    description: "",
  },
  {
    id: "fixed-3",
    label: "演奏時間(分)",
    type: "number",
    required: true,
    description: "",
  },
];

export default function FormBuilder({
  onSave,
  initialFields = [],
}: FormBuilderProps) {
  // 質問リストを作成
  const [fields, setFields] = useState<QuestionField[]>(() => {
    // すでに質問データがあればそれを使う
    if (initialFields.length > 0) {
      return initialFields;
    }
    // なければデフォルトの質問を使う
    return DEFAULT_QUESTIONS;
  });

  // 質問を追加する関数
  const addField = () => {
    const newField: QuestionField = {
      id: crypto.randomUUID(), // ID
      label: "", // 質問文
      type: "text", // 入力タイプ
      required: false, // 必須かどうか
    };

    // ...fieldsで既存の質問リストを全て新しい配列の中に並べる
    // その後ろに新しい質問をくっつける
    // setFieldsで状態を更新
    setFields([...fields, newField]);
  };

  // 質問を削除する関数
  const removeField = (idToRemove: string) => {
    const index = fields.findIndex((field) => field.id === idToRemove); // 削除対象の質問のインデックスを取得

    // 固定質問は削除できないようにする
    if (index >= 0 && index < 3) {
      alert("この質問は削除できません");
      return;
    }
    setFields(fields.filter((field) => field.id !== idToRemove));
  };

  // 質問を更新する関数
  const updateField = (idToUpdate: string, updates: Partial<QuestionField>) => {
    const index = fields.findIndex((field) => field.id === idToUpdate);
    const isFixed = index >= 0 && index < 3;

    // 固定質問は内容の更新を制限
    if (isFixed) {
      if (
        // 固定質問の label, type, required は変更不可
        updates.label !== undefined ||
        updates.type !== undefined ||
        updates.required !== undefined
      ) {
        return; // 更新を許可しない
      }
    }

    setFields(
      // mapでfieldsの先頭から順番に質問を取り出してfieldに代入
      fields.map((field) => {
        if (field.id === idToUpdate) {
          // ...fieldで既存の質問データを展開し、updatesで渡された更新内容を上書き
          return { ...field, ...updates };
        }
        return field; // それ以外の質問はそのまま返す
      }),
    );
  };

  // 選択肢を追加する関数
  const addOption = (fieldId: string) => {
    // 指定された質問に新しい空の選択肢を追加
    updateField(fieldId, {
      options: [...(fields.find((f) => f.id === fieldId)?.options || []), ""],
    });
  };

  // 選択肢を更新する関数
  const updateOption = (
    fieldId: string,
    optionIndex: number,
    updates: string,
  ) => {
    // 指定された選択肢のテキストを更新
    const field = fields.find((f) => f.id === fieldId);
    if (field?.options) {
      const newOptions = [...field.options]; // 現在の選択肢をコピーする
      newOptions[optionIndex] = updates; // 指定されたインデックスの選択肢を更新
      updateField(fieldId, { options: newOptions }); // フィールドを更新
    }
  };

  // 選択肢を削除する関数
  const removeOption = (fieldId: string, optionIndex: number) => {
    // 指定された選択肢を配列から削除
    const field = fields.find((f) => f.id === fieldId);
    if (field?.options) {
      const newOptions = field.options.filter((_, idx) => idx !== optionIndex); // 指定されたインデックスの選択肢を除外
      updateField(fieldId, { options: newOptions });
    }
  };

  return (
    <div className="mx-auto max-w-[800px] rounded-lg bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold">フォーム項目の設定</h2>

      <div className="mb-8 flex flex-col gap-6">
        {fields.map((field, index) => {
          const isFixed = index >= 0 && index < 3;
          return (
            <div
              key={field.id}
              className="rounded-md border border-gray-200 bg-gray-50 p-6"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="mb-4 flex-1">
                  <label className="mb-2 block font-bold">
                    {isFixed && (
                      <Lock
                        size={14}
                        className="mr-1 inline-block align-middle"
                      />
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
                    onChange={(e) =>
                      updateField(field.id, { label: e.target.value })
                    }
                  />
                </div>
                {!isFixed && (
                  <button
                    onClick={() => removeField(field.id)}
                    className="cursor-pointer rounded bg-red-100 px-3 py-1 text-sm text-red-500"
                  >
                    <Trash2 size={16} />
                    削除
                  </button>
                )}
              </div>

              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[0.9rem] text-gray-500">
                    回答タイプ
                  </label>
                  <select
                    className="mt-1 w-full rounded border border-gray-300 p-2 text-base disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-70"
                    value={field.type}
                    disabled={isFixed}
                    onChange={(e) =>
                      updateField(field.id, {
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
                      onChange={(e) =>
                        updateField(field.id, { required: e.target.checked })
                      }
                      className="mr-2"
                    />
                    必須項目にする
                  </label>
                </div>
              </div>

              {(field.type === "select" || field.type === "checkbox") && (
                <div className="mb-4">
                  <label className="text-[0.9rem] text-gray-500">
                    選択肢（各入力欄に1つずつ入力）
                  </label>

                  <div className="mb-4 mt-3 flex flex-col gap-3">
                    {field.options?.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          className="flex-1 rounded border border-gray-300 p-2 text-base focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                          placeholder={`選択肢 ${optionIndex + 1}`}
                          value={option}
                          onChange={(e) =>
                            updateOption(field.id, optionIndex, e.target.value)
                          }
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(field.id, optionIndex)}
                          className="flex cursor-pointer items-center justify-center rounded border border-red-200 bg-red-100 p-2 text-red-600 hover:bg-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addOption(field.id)}
                    className="cursor-pointer rounded border border-blue-300 bg-blue-100 px-4 py-2 text-sm text-blue-800 hover:bg-blue-200"
                  >
                    + 選択肢を追加
                  </button>
                </div>
              )}

              <div>
                <label className="text-[0.9rem] text-gray-500">
                  補足説明（任意）
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded border border-gray-300 p-2 text-base"
                  placeholder="例：バンド名の由来も教えてください"
                  value={field.description || ""}
                  onChange={(e) =>
                    updateField(field.id, { description: e.target.value })
                  }
                />
              </div>
            </div>
          );
        })}
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

"use client";

import { useState } from "react";
import { QuestionField, QuestionType } from "@/types";
import { Plus, Trash2 } from "lucide-react";
import styles from "./style.module.css";

// onSaveという関数を渡すよう親コンポーネントに要求
// 引数として質問データの配列を渡す
// voidは返り値がないことを示す
interface FormBuilderProps {
  onSave: (fields: QuestionField[]) => void;
  initialFields?: QuestionField[]; // すでに質問データがあった場合に渡す
}

export default function FormBuilder({
  onSave,
  initialFields = [],
}: FormBuilderProps) {
  // 質問リストを作成
  const [fields, setFields] = useState<QuestionField[]>(initialFields);

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
    // 指定されたIDの質問を除外した新しい配列を作成
    setFields(fields.filter((field) => field.id !== idToRemove));
  };

  // 質問を更新する関数
  const updateField = (idToUpdate: string, updates: Partial<QuestionField>) => {
    setFields(
      // mapでfieldsの先頭から順番に質問を取り出してfieldに代入
      fields.map((field) => {
        if (field.id === idToUpdate) {
          // ...fieldで既存の質問データを展開し、updatesで渡された更新内容を上書き
          return { ...field, ...updates };
        }
        return field; // それ以外の質問はそのまま返す
      })
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
    updates: string
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
    <div className={styles.container}>
      <h2 className={styles.title}>フォーム項目の設定</h2>

      {/* 追加済みの質問項目をリスト表示 */}
      <div className={styles.fieldList}>
        {/* fields 配列を順番に処理し、各質問のUI要素を生成 */}
        {fields.map((field, index) => (
          <div key={field.id} className={styles.fieldItem}>
            {/* 質問文入力フィールドと削除ボタン */}
            <div className={styles.fieldHeader}>
              <div className={styles.questionInputWrapper}>
                <label className={styles.label}>質問 {index + 1}</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="例：バンド名"
                  value={field.label}
                  onChange={(e) =>
                    updateField(field.id, { label: e.target.value })
                  }
                />
              </div>
              <button
                onClick={() => removeField(field.id)}
                className={styles.removeButton}
              >
                <Trash2 size={16} />
                削除
              </button>
            </div>

            {/* 回答タイプと必須チェックボックス */}
            <div className={styles.gridLayout}>
              <div>
                <label className={styles.smallLabel}>回答タイプ</label>
                <select
                  className={styles.select}
                  value={field.type}
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
              <div className={styles.checkboxWrapper}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) =>
                      updateField(field.id, { required: e.target.checked })
                    }
                    className={styles.checkbox}
                  />
                  必須項目にする
                </label>
              </div>
            </div>

            {/* 選択式・複数選択の場合のみ、選択肢入力欄を表示 */}
            {(field.type === "select" || field.type === "checkbox") && (
              <div className={styles.optionsWrapper}>
                <label className={styles.smallLabel}>
                  選択肢（各入力欄に1つずつ入力）
                </label>

                {/* 既存の選択肢をリスト表示 */}
                <div className={styles.optionsList}>
                  {field.options?.map((option, optionIndex) => (
                    <div key={optionIndex} className={styles.optionItem}>
                      <input
                        type="text"
                        className={styles.optionInput}
                        placeholder={`選択肢 ${optionIndex + 1}`}
                        value={option}
                        onChange={(e) =>
                          updateOption(field.id, optionIndex, e.target.value)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(field.id, optionIndex)}
                        className={styles.removeOptionButton}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* 選択肢を追加するボタン */}
                <button
                  type="button"
                  onClick={() => addOption(field.id)}
                  className={styles.addOptionButton}
                >
                  + 選択肢を追加
                </button>
              </div>
            )}

            {/* 補足説明（オプション） */}
            <div>
              <label className={styles.smallLabel}>補足説明（任意）</label>
              <input
                type="text"
                className={styles.input}
                placeholder="例：バンド名の由来も教えてください"
                value={field.description || ""}
                onChange={(e) =>
                  updateField(field.id, { description: e.target.value })
                }
              />
            </div>
          </div>
        ))}
      </div>

      {/* 新しい質問を追加するボタン */}
      <button onClick={addField} className={styles.addButton}>
        <Plus size={20} className={styles.icon} />
        新しい質問を追加する
      </button>

      {/* 設定を保存するボタン */}
      <div className={styles.saveButtonWrapper}>
        <button onClick={() => onSave(fields)} className={styles.saveButton}>
          この設定を保存する
        </button>
      </div>
    </div>
  );
}

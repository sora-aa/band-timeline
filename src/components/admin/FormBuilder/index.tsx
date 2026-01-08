"use client";

import { useState } from "react";
import { QuestionField, QuestionType } from "@/types";
import { Plus, Trash2 } from "lucide-react";
import styles from "./style.module.css";

interface FormBuilderProps {
  onSave: (fields: QuestionField[]) => void;
}

export default function FormBuilder({ onSave }: FormBuilderProps) {
  const [fields, setFields] = useState<QuestionField[]>([]);

  const addField = () => {
    const newField: QuestionField = {
      id: crypto.randomUUID(),
      label: "",
      type: "text",
      required: false,
    };
    setFields([...fields, newField]);
  };

  const removeField = (idToRemove: string) => {
    setFields(fields.filter((field) => field.id !== idToRemove));
  };

  const updateField = (idToUpdate: string, updates: Partial<QuestionField>) => {
    setFields(
      fields.map((field) => {
        if (field.id === idToUpdate) {
          return { ...field, ...updates };
        }
        return field;
      })
    );
  };

  const handleOptionsChange = (id: string, text: string) => {
    const optionArray = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");
    updateField(id, { options: optionArray });
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>フォーム項目の設定</h2>
      <div className={styles.fieldList}>
        {fields.map((field, index) => (
          <div key={field.id} className={styles.fieldItem}>
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
            {(field.type === "select" || field.type === "checkbox") && (
              <div className={styles.optionsWrapper}>
                <label className={styles.smallLabel}>
                  選択肢（1行に1つずつ入力）
                </label>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  placeholder="ギター&#13;&#10;ベース&#13;&#10;ドラム"
                  value={field.options?.join("\n") || ""}
                  onChange={(e) =>
                    handleOptionsChange(field.id, e.target.value)
                  }
                />
              </div>
            )}
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
      <button onClick={addField} className={styles.addButton}>
        <Plus size={20} className={styles.icon} />
        新しい質問を追加する
      </button>
      <div className={styles.saveButtonWrapper}>
        <button onClick={() => onSave(fields)} className={styles.saveButton}>
          この設定を保存する
        </button>
      </div>
    </div>
  );
}

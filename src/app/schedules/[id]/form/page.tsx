"use client";

import { createClient } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Schedule, QuestionAnswer, QuestionField } from "@/types";
import styles from "./style.module.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PublicFormPage() {
  const params = useParams();
  const scheduleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const { data, error } = await supabase
          .from("schedules")
          .select("*")
          .eq("id", scheduleId)
          .single();

        if (error) throw error;
        setSchedule(data);
      } catch (err) {
        console.error(err);
        setErrorMsg("イベント情報の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    if (scheduleId) fetchSchedule();
  }, [scheduleId]);

  // 回答の更新を処理する関数
  const handleAnswerChange = (questionId: string, value: QuestionAnswer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value, // 指定された質問IDの解答だけを更新
    }));
  };

  // フォームの送信を処理する関数
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!confirm("この内容で送信しますか？")) return;

    try {
      // 固定質問だけを抽出
      const representativeName = answers["fixed-1"] as string;
      const bandName = answers["fixed-2"] as string;
      const durationMinutes = Number(answers["fixed-3"]);

      // 固定質問を削除してカスタム質問のみを抽出
      const customAnswers = { ...answers };
      delete customAnswers["fixed-1"];
      delete customAnswers["fixed-2"];
      delete customAnswers["fixed-3"];

      // バンド情報をデータベースに挿入
      const { error } = await supabase.from("bands").insert({
        schedule_id: scheduleId,

        // 固定質問を渡す
        representative_name: representativeName,
        band_name: bandName,
        duration_minutes: durationMinutes,

        // カスタム質問をJSON形式で渡す
        custom_answers: customAnswers,
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "不明なエラーが発生しました";
      console.error(err);
      setErrorMsg("送信エラー： " + errorMessage);
    }
  };

  // 初期読み込み中の状態を表示
  if (loading)
    return <div className={styles.loadingContainer}>読み込み中...</div>;

  // エラーが発生した場合はエラーメッセージを表示
  if (errorMsg) return <div className={styles.errorContainer}>{errorMsg}</div>;

  // フォームが開いていない場合は受付終了のメッセージを表示
  if (!schedule || !schedule.is_form_open) {
    return (
      <div className={styles.closedContainer}>
        <h2>受付終了</h2>
        <p>現在、申し込みは受け付けておりません</p>
      </div>
    );
  }

  // フォーム送信が完了した場合は完了メッセージを表示
  if (submitted) {
    return (
      <div className={styles.successContainer}>
        <h2 className={styles.successTitle}>送信完了</h2>
        <p>フォームの送信を受け付けました</p>
        <button
          onClick={() => window.location.reload()}
          className={styles.resetButton}
        >
          画面に戻る
        </button>
      </div>
    );
  }

  // すべての条件をクリアした場合、フォームを表示
  return (
    <div className={styles.mainContainer}>
      <h1 className={styles.title}>{schedule.title} フォーム</h1>
      <p className={styles.description}>以下のフォームに入力してください</p>

      {/* DB に保存されているフォーム定義に基づいて、動的にフォーム項目をレンダリング */}
      <form className={styles.form} onSubmit={handleSubmit}>
        {schedule.form_schema?.map((q: QuestionField) => (
          <div key={q.id} className={styles.fieldContainer}>
            <label className={styles.label}>
              {q.label}{" "}
              {q.required && <span className={styles.required}>*</span>}
            </label>

            {/* 質問の説明があれば表示 */}
            {q.description && (
              <p className={styles.fieldDescription}>{q.description}</p>
            )}

            {/* テキスト入力フィールド */}
            {q.type === "text" && (
              <input
                type="text"
                required={q.required}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                className={styles.input}
              />
            )}

            {/* 複数行テキスト入力フィールド */}
            {q.type === "textarea" && (
              <textarea
                rows={4}
                required={q.required}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                className={styles.textarea}
              />
            )}

            {/* 数値入力フィールド */}
            {q.type === "number" && (
              <input
                type="number"
                required={q.required}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                className={styles.input}
              />
            )}

            {/* ドロップダウン選択フィールド */}
            {q.type === "select" && (
              <select
                required={q.required}
                defaultValue=""
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                className={styles.select}
              >
                <option value="" disabled>
                  選択してください
                </option>
                {q.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {/* チェックボックスフィールド（複数選択可能） */}
            {q.type === "checkbox" && (
              <div className={styles.checkboxContainer}>
                {q.options?.map((option) => (
                  <label key={option} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      value={option}
                      onChange={(e) => {
                        // 現在の選択値を取得（存在しない場合は空の配列）
                        const current = (answers[q.id] as string[]) || [];
                        let next;

                        // チェックボックスがチェックされた場合は選択肢を追加、
                        // チェックが外された場合は選択肢を削除
                        if (e.target.checked) {
                          next = [...current, option];
                        } else {
                          next = current.filter((v) => v !== option);
                        }

                        handleAnswerChange(q.id, next);
                      }}
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* フォーム送信ボタン */}
        <button type="submit" className={styles.submitButton}>
          送信
        </button>
      </form>
    </div>
  );
}

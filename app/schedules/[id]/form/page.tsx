"use client";

import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Schedule, QuestionAnswer, QuestionField } from "@/types";

const supabase = createClient();

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
  if (loading) return <div className="p-10 text-center">読み込み中...</div>;

  if (errorMsg)
    return <div className="p-10 text-center text-red-500">{errorMsg}</div>;

  // フォームが開いていない場合は受付終了のメッセージを表示
  if (!schedule || !schedule.is_form_open) {
    return (
      <div className="mx-auto my-10 max-w-[600px] rounded-lg bg-gray-100 p-10 text-center">
        <h2>受付終了</h2>
        <p>現在、申し込みは受け付けておりません</p>
      </div>
    );
  }

  // フォーム送信が完了した場合は完了メッセージを表示
  if (submitted) {
    return (
      <div className="mx-auto my-10 max-w-[600px] rounded-lg border border-emerald-500 bg-emerald-50 p-10 text-center">
        <h2 className="text-emerald-700">送信完了</h2>
        <p>フォームの送信を受け付けました</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 cursor-pointer p-2.5"
        >
          画面に戻る
        </button>
      </div>
    );
  }

  // すべての条件をクリアした場合、フォームを表示
  return (
    <div className="mx-auto max-w-[600px] px-5 py-10">
      <h1 className="mb-2.5">{schedule.title} フォーム</h1>
      <p className="mb-8 text-gray-600">以下のフォームに入力してください</p>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        {schedule.form_schema?.map((q: QuestionField) => (
          <div key={q.id} className="flex flex-col gap-2">
            <label className="font-bold">
              {q.label} {q.required && <span className="text-red-500">*</span>}
            </label>

            {q.description && (
              <p className="-mt-1 mb-0 text-xs text-gray-600">
                {q.description}
              </p>
            )}

            {q.type === "text" && (
              <input
                type="text"
                required={q.required}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                className="rounded-md border border-gray-300 p-3 text-base"
              />
            )}

            {q.type === "textarea" && (
              <textarea
                rows={4}
                required={q.required}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                className="rounded-md border border-gray-300 p-3 text-base"
              />
            )}

            {q.type === "number" && (
              <input
                type="number"
                min={q.id === "fixed-3" ? 0 : undefined}
                step={q.id === "fixed-3" ? 1 : undefined}
                required={q.required}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                className="rounded-md border border-gray-300 p-3 text-base"
              />
            )}

            {q.type === "select" && (
              <select
                required={q.required}
                defaultValue=""
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                className="rounded-md border border-gray-300 bg-white p-3 text-base"
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

            {q.type === "checkbox" && (
              <div className="flex flex-col gap-2">
                {q.options?.map((option) => (
                  <label key={option} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={option}
                      onChange={(e) => {
                        const current = (answers[q.id] as string[]) || [];
                        let next;

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

        <button
          type="submit"
          className="mt-5 cursor-pointer rounded-md bg-blue-600 p-4 text-lg font-bold text-white"
        >
          送信
        </button>
      </form>
    </div>
  );
}

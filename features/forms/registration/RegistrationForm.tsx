"use client";

import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { Schedule, QuestionAnswer } from "@/types";

import { AnswerField } from "./AnswerField";
import { submitRegistration } from "./submitRegistration";

const supabase = createClient();

export default function RegistrationForm({ scheduleId }: { scheduleId: string }) {
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const { data, error } = await supabase.from("schedules").select("*").eq("id", scheduleId).single();

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
      await submitRegistration(scheduleId, answers);
      setSubmitted(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました";
      console.error(err);
      setErrorMsg("送信エラー： " + errorMessage);
    }
  };

  // 初期読み込み中の状態を表示
  if (loading) return <div className="p-10 text-center">読み込み中...</div>;

  if (errorMsg) return <div className="p-10 text-center text-red-500">{errorMsg}</div>;

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
        <button onClick={() => window.location.reload()} className="mt-5 cursor-pointer p-2.5">
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
        {schedule.form_schema?.map((question) => (
          <AnswerField
            key={question.id}
            question={question}
            value={answers[question.id]}
            onChange={(value) => handleAnswerChange(question.id, value)}
          />
        ))}

        <button type="submit" className="mt-5 cursor-pointer rounded-md bg-blue-600 p-4 text-lg font-bold text-white">
          送信
        </button>
      </form>
    </div>
  );
}

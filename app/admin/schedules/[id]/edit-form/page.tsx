"use client";

import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import FormBuilder from "@/components/admin/FormBuilder";
import { QuestionField } from "@/types";

const supabase = createClient();

export default function EditFormPage() {
  const params = useParams(); // URLに含まれるパラメータを取得
  const scheduleId = params.id as string; // スケジュールIDを取得
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [initialFields, setInitialFields] = useState<QuestionField[]>([]); // 質問データ
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        // supabaseからデータを取得
        const { data, error } = await supabase
          .from("schedules") // schedulesテーブルから
          .select("title, form_schema") // titleカラムとform_schemaカラムを取得
          .eq("id", scheduleId) // idがscheduleIdと等しいものに絞り込み
          .single(); // かならず1件だけ取得

        if (error) throw error; // エラーならcatchブロックへ飛ばす

        // データが存在すれば状態を更新
        if (data) {
          setScheduleTitle(data.title);
          if (data.form_schema) {
            setInitialFields(data.form_schema as QuestionField[]);
          }
        }
      } catch (error) {
        console.error(error);
        setStatus("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    if (scheduleId) {
      fetchScheduleData();
    }
  }, [scheduleId]);

  // フォームを保存する関数
  const handleSave = async (fields: QuestionField[]) => {
    setStatus("保存中...");

    try {
      const { error } = await supabase
        .from("schedules")
        .update({ form_schema: fields })
        .eq("id", scheduleId);

      if (error) throw error;

      setStatus("✅ フォーム設定を保存しました!");

      setTimeout(() => router.push("/admin/schedules"), 1500); // 1.5秒後に一覧ページに移動
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "不明なエラーが発生しました";
      console.error(err);
      setStatus("❌ 保存エラー： " + errorMessage);
    }
  };

  if (loading) return <div className="p-10">読み込み中...</div>;

  return (
    <div className="mx-auto max-w-[800px] p-4 md:p-10">
      <div className="mb-5">
        <Link
          href="/admin/schedules"
          className="text-sm text-gray-600 hover:underline"
        >
          &lt; スケジュール一覧に戻る
        </Link>
        <h1 className="mb-0 mt-2.5 text-xl md:text-2xl">
          アンケートフォーム編集
        </h1>
        <p className="mb-0 text-gray-600">
          対象イベント： <strong>{scheduleTitle}</strong>
        </p>
      </div>
      {status && (
        <div
          className={`fixed bottom-5 right-5 z-[1000] max-w-[400px] rounded-md px-5 py-4 shadow ${
            status.includes("❌")
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {status}
        </div>
      )}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <FormBuilder initialFields={initialFields} onSave={handleSave} />
      </div>
    </div>
  );
}

"use client";

import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const supabase = createClient();

export default function CreateSchedulePage() {
  const router = useRouter(); // 保存成功後にページを移動させるために使用
  const [loading, setLoading] = useState(false); // 保存中かどうかを管理
  const [errorMsg, setErrorMsg] = useState(""); // エラーメッセージを管理

  // フォームの入力をひとまとめに管理
  const [formData, setFormData] = useState({
    title: "",
    start_date: "",
    end_date: "",
  });

  // 入力フォームの変更を処理する関数
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData, // 以下のformDataの中身を展開
      [e.target.name]: e.target.value, // 入力された箇所のname属性をキーとしてその値を更新
    });
  };

  // フォームの送信を処理する関数
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // ページの自動再読み込みを防止
    setErrorMsg("");
    setLoading(true);

    // バリデーション: 終了日が開始日より前の場合はエラー
    if (formData.start_date > formData.end_date) {
      setErrorMsg("終了日は開始日以降の日付を選択してください");
      setLoading(false);
      return;
    }

    // supabaseに新しいスケジュールを保存
    try {
      const { error } = await supabase.from("schedules").insert({
        title: formData.title,
        start_date: formData.start_date,
        end_date: formData.end_date,
        form_schema: [], // 空のフォームスキーマをセット
      });

      if (error) throw error; // エラーがあればcatchブロックへ飛ばす

      // 保存成功後の処理
      router.push("/admin/schedules"); // 一覧ページに移動
      router.refresh(); // ページのデータを再取得して最新の状態に更新
    } catch (err: unknown) {
      // エラーの内容がちゃんとしてたら表示、そうでなければ不明なエラーと表示
      const errorMessage =
        err instanceof Error ? err.message : "不明なエラーが発生しました";
      console.error(err);
      setErrorMsg("保存に失敗しました： " + errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[600px] p-4 md:p-10">
      <div className="mb-5">
        <Link
          href="/admin/schedules"
          className="text-sm text-gray-600 hover:underline"
        >
          &lt; 一覧に戻る
        </Link>
        <h1 className="mt-2.5 text-xl md:text-2xl">新規スケジュールの作成</h1>
      </div>

      {errorMsg && (
        <div className="mb-5 rounded-md bg-red-100 p-2.5 text-red-800">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col">
          <label className="mb-2 block font-bold">
            イベント名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="夏ライブ"
            className="w-full rounded-md border border-gray-300 p-2.5 text-base outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          <div className="flex-1">
            <label className="mb-2 block font-bold">
              開始日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 p-2.5 text-base outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <div className="flex-1">
            <label className="mb-2 block font-bold">
              終了日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 p-2.5 text-base outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
            <p className="mb-0 mt-1 text-xs text-gray-600">
              ※1日だけのイベントの際は開始日と同じ日付にしてください
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2.5 cursor-pointer rounded-md bg-blue-600 p-3 text-base font-bold text-white enabled:hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loading ? "保存中..." : "作成する"}
        </button>
      </form>
    </div>
  );
}

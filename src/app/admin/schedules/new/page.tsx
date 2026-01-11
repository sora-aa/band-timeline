"use client";

import { createClient } from "@supabase/supabase-js";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./style.module.css";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    <div className={styles.container}>
      {/* ページヘッダー：戻るリンク＋ タイトル */}
      <div className={styles.header}>
        <Link href="/admin/schedules" className={styles.backLink}>
          &lt; 一覧に戻る
        </Link>
        <h1 className={styles.pageTitle}>新規スケジュールの作成</h1>
      </div>

      {/* エラーメッセージ表示 */}
      {errorMsg && <div className={styles.errorMessage}>{errorMsg}</div>}

      {/* スケジュール作成フォーム */}
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* イベント名入力 */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            イベント名 <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="夏ライブ"
            className={styles.input}
          />
        </div>

        {/* 開始日・終了日入力 */}
        <div className={styles.dateGroup}>
          <div className={styles.dateGroupChild}>
            <label className={styles.label}>
              開始日 <span className={styles.required}>*</span>
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.dateGroupChild}>
            <label className={styles.label}>
              終了日 <span className={styles.required}>*</span>
            </label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
              className={styles.input}
            />
            <p className={styles.helpText}>
              ※1日だけのイベントの際は開始日と同じ日付にしてください
            </p>
          </div>
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? "保存中..." : "作成する"}
        </button>
      </form>
    </div>
  );
}

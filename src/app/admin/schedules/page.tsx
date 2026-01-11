"use client";

import { createClient } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Schedule } from "@/types";
import styles from "./style.module.css";

// supabaseへの接続をする
// 関数内に書くと画面が描画されるたびに接続がリセットされてしまうため、関数の外側に書いています
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminScheduleListPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]); // 取得したスケジュールを入れておく箱
  const [loading, setLoading] = useState(true); // 読み込み中かどうかを管理 trueなら読み込み中

  // supabaseからスケジュールデータを取得する関数
  const fetchSchedules = async () => {
    setLoading(true); // 読み込み中に設定
    try {
      // schedulesテーブルから全てのデータを取得し、開始日の昇順でソート
      const { data, error } = await supabase
        .from("schedules") // schedulesテーブルから
        .select("*") // 全てのカラムを取得
        .order("start_date", { ascending: true }); // 開始日の昇順で並び替え

      if (error) throw error; // エラーがあればcatchブロックへ飛ばす
      setSchedules(data || []); // 取得したデータを状態に保存。dataがnullの場合は空配列をセット
    } catch (error) {
      console.error("Error:", error);
      alert("データの読み込みに失敗しました");
    } finally {
      setLoading(false); // 読み込み終了
    }
  };

  // 画面が表示されたときに一度だけfetchSchedulesを実行
  useEffect(() => {
    fetchSchedules();
  }, []);

  // スケジュールを削除する関数
  const handleDelete = async (id: string) => {
    // 削除の確認ダイアログを表示
    // キャンセルされたらそこで処理を終了(return)
    if (!window.confirm("本当に削除しますか？")) return;

    // supabaseに削除リクエストを送信
    const { error } = await supabase.from("schedules").delete().eq("id", id);
    if (error) {
      alert("削除に失敗しました: " + error.message);
    } else {
      // 今のスケジュールから削除したIDのものを取り除く
      setSchedules(schedules.filter((s) => s.id !== id));
    }
  };

  // 日付表示を「MM/DD ～ MM/DD」形式にフォーマットする関数
  const formatDate = (start: string, end: string) => {
    // startが空なら空文字を返す
    if (!start) return "";

    const d1 = new Date(start); // 文字列をDateオブジェクトに変換

    // 日本形式の文字列にした後、先頭の年部分を削除
    // 例: "2024/06/15" → "06/15"
    const sStr = d1.toLocaleDateString("ja-JP").slice(5);

    if (start === end) {
      // 開始日と終了日が同じ場合は開始日のみ表示
      return sStr;
    } else {
      // 異なる場合は「MM/DD ～ MM/DD」形式で表示
      const d2 = new Date(end);
      const eStr = d2.toLocaleDateString("ja-JP").slice(5);
      return `${sStr} ～ ${eStr}`;
    }
  };

  return (
    <div className={styles.container}>
      {/* ページヘッダー：タイトルと新規作成ボタン */}
      <div className={styles.header}>
        <h1 className={styles.title}>スケジュール管理</h1>
        <Link href="/admin/schedules/new" className={styles.createButton}>
          + 新規日程を作成
        </Link>
      </div>

      {/* 条件付きレンダリング：ローディング > 空状態 > スケジュール一覧 の順で表示 */}
      {loading ? (
        // データ取得中の表示
        <p className={styles.loading}>読み込み中...</p>
      ) : schedules.length === 0 ? (
        // スケジュールが1件もない場合の表示
        <div className={styles.emptyState}>
          <p>まだスケジュールが登録されていません</p>
        </div>
      ) : (
        // スケジュール一覧の表示
        <div className={styles.scheduleList}>
          {/* schedulesの配列を順番に処理し、各スケジュール項目を生成 */}
          {schedules.map((schedule) => (
            <div key={schedule.id} className={styles.scheduleItem}>
              {/* 左側：スケジュールの情報（タイトル、日付、フォーム作成状況） */}
              <div className={styles.scheduleInfo}>
                <h3 className={styles.scheduleTitle}>{schedule.title}</h3>
                <p className={styles.scheduleDate}>
                  📅 {formatDate(schedule.start_date, schedule.end_date)}
                </p>

                {/* フォーム作成状況のバッジ表示 */}
                <div className={styles.statusContainer}>
                  {schedule.form_schema ? (
                    // form_schemaが存在=フォーム作成済み
                    <span className={`${styles.badge} ${styles.badgeComplete}`}>
                      ✓ フォーム作成済み
                    </span>
                  ) : (
                    // form_schemaが空=フォーム未作成
                    <span className={`${styles.badge} ${styles.badgePending}`}>
                      ⚠ フォーム未作成
                    </span>
                  )}
                </div>
              </div>

              {/* 右側：アクションボタン（編集・削除） */}
              <div className={styles.actions}>
                <Link
                  href={`/admin/schedules/${schedule.id}/edit-form/`}
                  className={styles.editButton}
                >
                  フォーム編集
                </Link>

                <button
                  onClick={() => handleDelete(schedule.id)}
                  className={styles.deleteButton}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

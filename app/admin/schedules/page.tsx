"use client";

import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Schedule } from "@/types";

// supabaseへの接続をする
// 関数内に書くと画面が描画されるたびに接続がリセットされてしまうため、関数の外側に書いています
const supabase = createClient();

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

  // フォームまたはタイムテーブルの公開・非公開を切り替える関数
  const toggleStatus = async (
    schedule: Schedule,
    column: "is_form_open" | "is_timetable_open",
  ) => {
    const newValue = !schedule[column]; // 現在の値の反対をセット true→false、false→true

    // 画面上の表示はすぐに更新
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === schedule.id ? { ...s, [column]: newValue } : s,
      ),
    );

    // supabaseのデータは後から更新
    try {
      const { error } = await supabase
        .from("schedules")
        .update({ [column]: newValue })
        .eq("id", schedule.id);

      if (error) throw error;
    } catch {
      alert("更新に失敗しました");
      fetchSchedules(); // 失敗したら再度データを取得して画面を最新状態に戻す
    }
  };

  return (
    <div className="mx-auto max-w-[900px] p-4 md:p-10">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="m-0 text-2xl font-bold">スケジュール管理</h1>
        <Link
          href="/admin/schedules/new"
          className="inline-block cursor-pointer rounded-md bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-700"
        >
          + 新規日程を作成
        </Link>
      </div>

      {loading ? (
        <p className="text-base text-gray-500">読み込み中...</p>
      ) : schedules.length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-10 text-center text-gray-500">
          <p>まだスケジュールが登録されていません</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between"
            >
              <div className="flex-1">
                <h3 className="mb-1 text-lg font-semibold text-gray-800">
                  {schedule.title}
                </h3>
                <p className="m-0 text-sm text-gray-500">
                  📅 {formatDate(schedule.start_date, schedule.end_date)}
                </p>

                <div className="mt-2">
                  {schedule.form_schema && schedule.form_schema.length > 0 ? (
                    <span className="inline-block rounded px-1.5 py-0.5 text-xs text-emerald-700 bg-emerald-100">
                      ✓ フォーム作成済み
                    </span>
                  ) : (
                    <span className="inline-block rounded px-1.5 py-0.5 text-xs text-amber-700 bg-amber-100">
                      ⚠ フォーム未作成
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 md:mr-5 md:items-end">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-500">フォーム</span>
                  <button
                    onClick={() => toggleStatus(schedule, "is_form_open")}
                    className={`w-20 rounded px-2.5 py-1.5 text-xs font-bold ${
                      schedule.is_form_open
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {schedule.is_form_open ? "公開" : "非公開"}
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-500">タイムテーブル</span>
                  <button
                    onClick={() => toggleStatus(schedule, "is_timetable_open")}
                    className={`w-20 rounded px-2.5 py-1.5 text-xs font-bold ${
                      schedule.is_timetable_open
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {schedule.is_timetable_open ? "公開" : "非公開"}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href={`/admin/schedules/${schedule.id}/edit-form/`}
                  className="cursor-pointer rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
                >
                  フォーム編集
                </Link>

                <button
                  onClick={() => handleDelete(schedule.id)}
                  className="cursor-pointer rounded border border-red-100 bg-white px-3 py-2 text-sm text-red-500 hover:border-red-200 hover:bg-red-50"
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

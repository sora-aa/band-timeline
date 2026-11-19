import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { Schedule } from "@/types";

export type PublicationColumn = "is_form_open" | "is_timetable_open";
const supabase = createClient();

export function useSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]); // 取得したスケジュールを入れておく箱
  const [loading, setLoading] = useState(true); // 読み込み中かどうかを管理 trueなら読み込み中

  // supabaseからスケジュールデータを取得する関数
  const fetchSchedules = async () => {
    setLoading(true); // 読み込み中に設定
    try {
      // schedulesテーブルから全てのデータを取得し、開始日の降順でソート
      const { data, error } = await supabase
        .from("schedules") // schedulesテーブルから
        .select("*") // 全てのカラムを取得
        .order("start_date", { ascending: false }); // 開始日の降順で並び替え

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
      setSchedules((current) => current.filter((s) => s.id !== id));
    }
  };
  // フォームまたはタイムテーブルの公開・非公開を切り替える関数
  const toggleStatus = async (schedule: Schedule, column: PublicationColumn) => {
    const newValue = !schedule[column]; // 現在の値の反対をセット true→false、false→true

    // 画面上の表示はすぐに更新
    setSchedules((prev) => prev.map((s) => (s.id === schedule.id ? { ...s, [column]: newValue } : s)));

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
  return { schedules, loading, handleDelete, toggleStatus };
}

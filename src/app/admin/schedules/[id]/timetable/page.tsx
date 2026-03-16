"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Band, BandFieldValue } from "@/types";
import { SortableItem } from "@/components/admin/SortableItem";
import styles from "./style.module.css";

// ドロップ可能なエリアを定義するコンポーネント
function DroppableContainer({
  id,
  children,
  className,
  style,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} id={id} className={className} style={style}>
      {children}
    </div>
  );
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function TimetableEditor() {
  // URLからどのスケジュールの編集画面かを取得
  const params = useParams();
  const scheduleId = params.id as string;

  // バンドのリストを「未配置」と「配置済み」に分けて管理
  const [unscheduled, setUnscheduled] = useState<Band[]>([]);
  const [scheduled, setScheduled] = useState<Band[]>([]);

  // ドラッグ中のアイテムのIDを保存
  const [activeId, setActiveId] = useState<string | null>(null);

  // データを保存中かどうか
  const [saving, setSaving] = useState(false);

  // スケジュールの開始時間の管理
  const [startHour, setStartHour] = useState(10);
  const [startMinute, setStartMinute] = useState(0);

  // ドラッグ&ドロップのセンサーを設定
  const sensors = useSensors(
    // 5ピクセル以上動かさないとドラッグを開始しない
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // キーボードでのドラッグも有効にする
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("bands") // "bands"テーブルから
        .select("*") // 全ての項目を取得
        .eq("schedule_id", scheduleId) // このスケジュールのデータだけで絞り込み
        .order("sort_order", { ascending: true }); // sort_orderの昇順で並び替え

      if (!error && data) {
        // sort_orderがnullのものは未配置
        setUnscheduled(data.filter((b) => b.sort_order === null));
        // sort_orderがnullでないものは配置済み
        setScheduled(data.filter((b) => b.sort_order !== null));
      }
    };

    const fetchSchedule = async () => {
      const { data, error } = await supabase
        .from("schedules")
        .select("start_time")
        .eq("id", scheduleId)
        .single();
      if (!error && data) {
        const [hour, minute] = data.start_time?.split(":").map(Number) || [
          10, 0,
        ];
        setStartHour(hour);
        setStartMinute(minute);
      }
    };
    fetchData();
    fetchSchedule();
  }, [scheduleId]);

  // バンドの情報が変更されたときに呼ばれる関数
  const handleBandChange = (
    id: string, // どのバンドを変更するか
    field: keyof Band, // どの項目を変更するか (例: "representative_name")
    value: BandFieldValue, // 新しい値は何か
  ) => {
    // リストを受け取って変更を適応した新しいリストを返す関数
    const updateList = (list: Band[]) =>
      list.map((b) => (b.id === id ? { ...b, [field]: value } : b));

    // 両方のリストを更新する
    setUnscheduled((prev) => updateList(prev));
    setScheduled((prev) => updateList(prev));
  };

  // 休憩や自由枠を追加する関数
  const addBreak = async () => {
    // 新しい休憩のデータを作成
    const newBreak = {
      schedule_id: scheduleId,
      band_name: "休憩",
      representative_name: "",
      duration_minutes: 10,
      is_break: true,
      sort_order: null,
      transition_duration: 0,
    };

    const { data, error } = await supabase
      .from("bands") // "bands"テーブルに
      .insert(newBreak) // データを追加
      .select() // 作成したデータを取得
      .single(); // 1件だけ

    if (error) {
      alert("追加に失敗しました");
      console.log(error);
      return;
    }

    // 画面の更新
    if (data) {
      // 未配置のリストに今作ったデータを追加
      setUnscheduled((prev) => [...prev, data as Band]);
    }
  };

  // ドラッグが終了したときの処理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // つかんでいる状態を解除
    setActiveId(null);

    // 画面外でドロップしていたら何もせず終了
    if (!over) return;

    const activeId = active.id as string; // つかんでいたアイテムのID
    const overId = over.id as string; // ドロップ先のID

    const findBand = (id: string) =>
      unscheduled.find((b) => b.id === id) ||
      scheduled.find((b) => b.id === id);
    const activeItem = findBand(activeId);
    if (!activeItem) return; // データが見つからなかった場合何もしない

    // つかんだものが未配置かつ離した位置が配置済みエリアなら
    if (
      unscheduled.find((b) => b.id === activeId) &&
      (scheduled.find((b) => b.id === overId) || overId === "scheduled-area")
    ) {
      // 未配置リストから削除
      setUnscheduled((prev) => prev.filter((b) => b.id !== activeId));
      // 配置済みリストの末尾に追加
      setScheduled((prev) => [...prev, activeItem]);
      return;
    }

    // つかんだものが配置済みかつ離した位置が未配置エリアなら
    if (
      scheduled.find((b) => b.id === activeId) &&
      (unscheduled.find((b) => b.id === overId) ||
        overId === "unscheduled-area")
    ) {
      // 配置済みリストから削除
      setScheduled((prev) => prev.filter((b) => b.id !== activeId));
      // 未配置リストの末尾に追加
      setUnscheduled((prev) => [...prev, activeItem]);
      return;
    }

    // つかんだものも離した位置も配置済みエリアなら順番を入れ替える
    if (
      scheduled.find((b) => b.id === activeId) &&
      scheduled.find((b) => b.id === overId)
    ) {
      // もともと何番目にいたか
      const oldIndex = scheduled.findIndex((b) => b.id === activeId);
      // どこに移動したいか
      const newIndex = scheduled.findIndex((b) => b.id === overId);
      // 順番を入れ替える
      setScheduled(arrayMove(scheduled, oldIndex, newIndex));
      return;
    }
  };

  // 保存ボタンが押されたときの処理
  const handleSave = async () => {
    // 保存中モードにする
    setSaving(true);

    try {
      // mapを使ってindexを順番に振りながら更新用のデータを作成
      const updates = scheduled.map((band, index) => ({
        id: band.id,
        sort_order: index,
        schedule_id: scheduleId,
        duration_minutes: band.duration_minutes,
        transition_duration: band.transition_duration,
      }));

      // 未配置リストのものはsort_orderをnullにする
      const resets = unscheduled.map((band) => ({
        id: band.id,
        sort_order: null,
        schedule_id: scheduleId,
        duration_minutes: band.duration_minutes,
        transition_duration: band.transition_duration,
      }));

      // 配置済みのバンドを1つずつ更新
      for (const item of updates) {
        await supabase
          .from("bands")
          .update({
            sort_order: item.sort_order,
            duration_minutes: item.duration_minutes,
            transition_duration: item.transition_duration,
          })
          .eq("id", item.id);
      }
      // 未配置のバンドも1つずつ更新
      for (const item of resets) {
        await supabase
          .from("bands")
          .update({
            sort_order: null,
            duration_minutes: item.duration_minutes,
            transition_duration: item.transition_duration,
          })
          .eq("id", item.id);
      }

      await supabase
        .from("schedules")
        .update({
          start_time: `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}:00`,
        })
        .eq("id", scheduleId);

      alert("タイムテーブルを保存しました");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "不明なエラーが発生しました";
      console.error(err);
      alert("保存に失敗しました： " + errorMessage);
    } finally {
      // 保存中モードを解除
      setSaving(false);
    }
  };

  // 開始時間を計算するための変数
  let currentTime = new Date();
  // 開始時間を設定
  currentTime.setHours(startHour, startMinute, 0);

  // 今ドラッグしているカードを探すコード
  const activeItem =
    unscheduled.find((b) => b.id === activeId) ||
    scheduled.find((b) => b.id === activeId);

  return (
    <div className={styles.mainContainer}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(e.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        {/* ===== 未配置バンド表示エリア ===== */}
        <DroppableContainer
          id="unscheduled-area"
          className={styles.unscheduledArea}
        >
          <div className={styles.unscheduledHeader}>
            <Link href={"/admin/schedules"} className={styles.backLink}>
              &lt; 戻る
            </Link>
            <h2 className={styles.unscheduledTitle}>未配置のバンド</h2>
            <button onClick={addBreak} className={styles.addBreakButton}>
              休憩・自由枠を追加
            </button>
            <p className={styles.unscheduledDescription}>
              ドラッグして右側のタイムテーブルに配置してください
            </p>
          </div>
          <div className={styles.unscheduledContent}>
            <SortableContext
              items={unscheduled.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {unscheduled.map((band) => (
                <SortableItem
                  key={band.id}
                  id={band.id}
                  band={band}
                  onChange={handleBandChange}
                />
              ))}
            </SortableContext>
            {unscheduled.length === 0 && (
              <div className={styles.emptyUnscheduled}>全て配置済みです</div>
            )}
          </div>
        </DroppableContainer>

        {/* ===== 配置済みタイムテーブル表示エリア ===== */}
        <DroppableContainer
          id="scheduled-area"
          className={styles.scheduledArea}
        >
          <div className={styles.scheduledHeader}>
            <div className={styles.headerTitleSection}>
              <h1 className={styles.pageTitle}>タイムテーブル作成</h1>
              <div className={styles.headerControlSection}>
                <div className={styles.startTimeGroup}>
                  <label className={styles.startTimeLabel}>開始時間</label>
                  <input
                    type="number"
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className={styles.timeInput}
                  />
                  :
                  <input
                    type="number"
                    value={startMinute}
                    onChange={(e) => setStartMinute(Number(e.target.value))}
                    className={styles.timeInput}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className={styles.saveButton}
            >
              {saving ? "保存中..." : "保存する"}
            </button>
          </div>

          <div className={styles.scheduledContent}>
            <div className={styles.timetableWrapper}>
              <SortableContext
                items={scheduled.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                {scheduled.map((band, index) => {
                  const startStr = currentTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const endTime = new Date(
                    currentTime.getTime() + band.duration_minutes * 60000,
                  );
                  const endStr = endTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const transition = band.transition_duration ?? 10;
                  currentTime = new Date(
                    endTime.getTime() + transition * 60000,
                  );
                  return (
                    <div key={band.id} className={styles.bandRow}>
                      {/* バンド情報の表示 */}
                      <div className={styles.bandInfoRow}>
                        <div className={styles.timeDisplay}>
                          <div className={styles.startTime}>{startStr}</div>
                          <div className={styles.endTime}>~ {endStr}</div>
                        </div>
                        <div className={styles.bandCardContainer}>
                          <SortableItem
                            id={band.id}
                            band={band}
                            onChange={handleBandChange}
                          />
                        </div>
                      </div>

                      {/* 転換時間の表示 */}
                      {index < scheduled.length - 1 && transition > 0 && (
                        <div className={styles.transitionDisplay}>
                          <div className={styles.transitionLineLeft}></div>
                          <div className={styles.transitionText}>
                            転換 ({transition}分)
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </SortableContext>
              {scheduled.length === 0 && (
                <div className={styles.emptyScheduled}>
                  <h3>まだ配置されていません</h3>
                  <p>左側のリストからここへドラッグしてください</p>
                </div>
              )}
            </div>
          </div>
        </DroppableContainer>
        <DragOverlay>
          {activeItem ? (
            <SortableItem
              id={activeItem.id}
              band={activeItem}
              isOverlay
              onChange={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

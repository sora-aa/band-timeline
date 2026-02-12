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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Band } from "@/types";

function DroppableContainer({
  id,
  children,
  style,
}: {
  id: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} id={id} style={style}>
      {children}
    </div>
  );
}

function SortableItem({
  id,
  band,
  isOverlay = false,
}: {
  id: string;
  band: Band;
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: "15px",
    marginBottom: "10px",
    backgroundColor: band.is_break ? "#fff7ed" : "white",
    border: isDragging ? "2px solid #2563eb" : "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: isOverlay ? "grabbing" : "grab",
    opacity: isDragging ? 0.3 : 1,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    position: "relative" as const,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ fontWeight: "bold", fontSize: "16px" }}>
        {band.is_break ? "休憩" : band.band_name}
      </div>
      <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
        {band.is_break ? "" : `${band.representative_name} / `}{" "}
        {band.duration_minutes}分
      </div>
    </div>
  );
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function TimetableEditor() {
  const params = useParams();
  const scheduleId = params.id as string;
  const [unscheduled, setUnscheduled] = useState<Band[]>([]);
  const [scheduled, setScheduled] = useState<Band[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [startHour, setStartHour] = useState(10);
  const [startMinute, setStartMinute] = useState(0);
  const [intervalMinutes, setIntervalMinutes] = useState(10);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("bands")
        .select("*")
        .eq("schedule_id", scheduleId)
        .order("sort_order", { ascending: true });
      if (!error && data) {
        setUnscheduled(data.filter((b) => b.sort_order === null));
        setScheduled(data.filter((b) => b.sort_order !== null));
      }
    };
    fetchData();
  }, [scheduleId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const findBand = (id: string) =>
      unscheduled.find((b) => b.id === id) ||
      scheduled.find((b) => b.id === id);
    const activeItem = findBand(activeId);
    if (!activeItem) return;
    if (
      unscheduled.find((b) => b.id === activeId) &&
      (scheduled.find((b) => b.id === overId) || overId === "scheduled-area")
    ) {
      setUnscheduled((prev) => prev.filter((b) => b.id !== activeId));
      setScheduled((prev) => [...prev, activeItem]);
      return;
    }
    if (
      scheduled.find((b) => b.id === activeId) &&
      (unscheduled.find((b) => b.id === overId) ||
        overId === "unscheduled-area")
    ) {
      setScheduled((prev) => prev.filter((b) => b.id !== activeId));
      setUnscheduled((prev) => [...prev, activeItem]);
      return;
    }
    if (
      scheduled.find((b) => b.id === activeId) &&
      scheduled.find((b) => b.id === overId)
    ) {
      const oldIndex = scheduled.findIndex((b) => b.id === activeId);
      const newIndex = scheduled.findIndex((b) => b.id === overId);
      setScheduled(arrayMove(scheduled, oldIndex, newIndex));
      return;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = scheduled.map((band, index) => ({
        id: band.id,
        sort_order: index,
        schedule_id: scheduleId,
      }));
      const resets = unscheduled.map((band) => ({
        id: band.id,
        sort_order: null,
        schedule_id: scheduleId,
      }));
      for (const item of updates) {
        await supabase
          .from("bands")
          .update({ sort_order: item.sort_order })
          .eq("id", item.id);
      }
      for (const item of resets) {
        await supabase
          .from("bands")
          .update({ sort_order: null })
          .eq("id", item.id);
      }
      alert("タイムテーブルを保存しました");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "不明なエラーが発生しました";
      console.error(err);
      alert("保存に失敗しました： " + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  let currentTime = new Date();
  currentTime.setHours(startHour, startMinute, 0);
  const activeItem =
    unscheduled.find((b) => b.id === activeId) ||
    scheduled.find((b) => b.id === activeId);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "sans-serif",
        backgroundColor: "#f9fafb",
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(e.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <DroppableContainer
          id="unscheduled-area"
          style={{
            width: "320px",
            backgroundColor: "#fff",
            borderRight: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
            boxShadow: "2px 0 5px rgba(0,0,0,0.03)",
            zIndex: 10,
          }}
        >
          <div style={{ padding: "20px", borderBottom: "1px solid #e5e7eb" }}>
            <Link
              href={"/admin/schedules"}
              style={{
                textDecoration: "none",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              &lt; 戻る
            </Link>
            <h2 style={{ fontSize: "18px", margin: "10px 0 5px" }}>
              未配置のバンド
            </h2>
            <p style={{ fontSize: "12px", color: "#6b7280" }}>
              ドラッグして右側のタイムテーブルに配置してください
            </p>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
            <SortableContext
              items={unscheduled.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {unscheduled.map((band) => (
                <SortableItem key={band.id} id={band.id} band={band} />
              ))}
            </SortableContext>
            {unscheduled.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "#9ca3af",
                  border: "2px dashed #e5e7eb",
                  borderRadius: "8px",
                }}
              >
                全て配置済みです
              </div>
            )}
          </div>
        </DroppableContainer>

        <DroppableContainer
          id="scheduled-area"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100vh",
          }}
        >
          <div
            style={{
              padding: "20px 40px",
              backgroundColor: "#fff",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h1 style={{ fontSize: "24px", margin: "0 0 10px 0" }}>
                タイムテーブル作成
              </h1>
              <div
                style={{ display: "flex", gap: "20px", alignItems: "center" }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <label style={{ fontSize: "14px", fontWeight: "bold" }}>
                    開始時間
                  </label>
                  <input
                    type="number"
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    style={{
                      width: "50px",
                      padding: "5px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  />
                  :
                  <input
                    type="number"
                    value={startMinute}
                    onChange={(e) => setStartMinute(Number(e.target.value))}
                    style={{
                      width: "50px",
                      padding: "5px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  />
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <label style={{ fontSize: "14px", fontWeight: "bold" }}>
                    転換:
                  </label>
                  <input
                    type="number"
                    value={intervalMinutes}
                    onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                    style={{
                      width: "50px",
                      padding: "5px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  />
                  <span style={{ fontSize: "14px" }}>分</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "12px 24px",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                fontSize: "16px",
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: "0 2px 5px rgba(37,99,235,0.3)",
              }}
            >
              {saving ? "保存中..." : "保存する"}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "40px" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
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
                  currentTime = new Date(
                    endTime.getTime() + intervalMinutes * 60000,
                  );
                  return (
                    <div
                      key={band.id}
                      style={{ display: "flex", flexDirection: "column" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          marginBottom: "0",
                        }}
                      >
                        <div
                          style={{
                            width: "120px",
                            paddingTop: "15px",
                            textAlign: "right",
                            paddingRight: "20px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: "bold",
                              color: "#374151",
                            }}
                          >
                            {startStr}
                          </div>
                          <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                            ~ {endStr}
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <SortableItem id={band.id} band={band} />
                        </div>
                      </div>
                      {index < scheduled.length - 1 && intervalMinutes > 0 && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            height: "30px",
                            margin: "0 0 10px 0",
                          }}
                        >
                          <div
                            style={{
                              width: "120px",
                              borderRight: "2px solid #e5e7eb",
                              height: "100%",
                              marginRight: "20px",
                            }}
                          ></div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#9ca3af",
                              fontStyle: "italic",
                              paddingLeft: "10px",
                              borderLeft: "2px solid #e5e7eb",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            転換 ({intervalMinutes}分)
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </SortableContext>
              {scheduled.length === 0 && (
                <div
                  style={{
                    padding: "60px",
                    textAlign: "center",
                    color: "#9ca3af",
                    border: "3px dashed #e5e7eb",
                    borderRadius: "12px",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  <h3>まだ配置されていません</h3>
                  <p>左側のリストからここへドラッグしてください</p>
                </div>
              )}
            </div>
          </div>
        </DroppableContainer>
        <DragOverlay>
          {activeItem ? (
            <SortableItem id={activeItem.id} band={activeItem} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

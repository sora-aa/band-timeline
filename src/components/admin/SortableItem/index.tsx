"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Band, BandFieldValue } from "@/types";

interface SortableItemProps {
  id: string;
  band: Band;
  isOverlay?: boolean;
  onChange: (id: string, field: keyof Band, value: BandFieldValue) => void;
}

export function SortableItem({
  id,
  band,
  isOverlay = false,
  onChange,
}: SortableItemProps) {
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
    marginBottom: "10px",
    backgroundColor: band.is_break ? "#fff7ed" : "white", // 休憩は色を変える
    border: isDragging ? "2px solid #2563eb" : "1px solid #d1d5db",
    borderRadius: "8px",
    opacity: isDragging ? 0.5 : 1,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    position: "relative" as const,
    overflow: "hidden",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        {...attributes}
        {...listeners}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "24px",
          backgroundColor: band.is_break ? "#fed7aa" : "#e5e7eb",
          cursor: isOverlay ? "grabbing" : "grab",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
        }}
      >
        ⋮
      </div>
      <div style={{ padding: "12px 12px 12px 36px" }}>
        <div style={{ marginBottom: "8px" }}>
          {band.is_break ? (
            <input
              type="text"
              value={band.band_name}
              onChange={(e) => onChange(id, "band_name", e.target.value)}
              placeholder="項目名 (例: 休憩)"
              style={{
                width: "100%",
                fontWeight: "bold",
                fontSize: "16px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                padding: "4px",
                backgroundColor: "rgba(255,255,255,0.5)",
              }}
            />
          ) : (
            <div style={{ fontWeight: "bold", fontSize: "16px" }}>
              {band.band_name}
            </div>
          )}
          {!band.is_break && (
            <div style={{ fontSize: "12px", color: "#666" }}>
              Rep: {band.representative_name}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <label style={{ color: "#666" }}>時間:</label>
            <input
              type="number"
              value={band.duration_minutes}
              onChange={(e) =>
                onChange(id, "duration_minutes", Number(e.target.value))
              }
              style={{
                width: "50px",
                padding: "4px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
            <span>分</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginLeft: "auto",
              backgroundColor: "#f3f4f6",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            <label style={{ color: "#666", fontSize: "11px" }}>転換時間:</label>
            <input
              type="number"
              value={band.transition_duration ?? 10}
              onChange={(e) =>
                onChange(id, "transition_duration", Number(e.target.value))
              }
              style={{
                width: "45px",
                padding: "2px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "12px",
              }}
            />
            <span style={{ fontSize: "11px" }}>分</span>
          </div>
        </div>
      </div>
    </div>
  );
}

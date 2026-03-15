"use client";

import clsx from "clsx";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Band, BandFieldValue } from "@/types";
import styles from "./style.module.css";

// 親から渡されるデータの型定義
interface SortableItemProps {
  id: string;
  band: Band;
  isOverlay?: boolean; // ドラッグして持ち上げている状態かどうか

  // 入力欄を書き換えた時に実行する関数
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
      {/* カード全体ではなく「⋮」をつかんだ時だけドラッグできる */}
      <div
        {...attributes}
        {...listeners}
        className={clsx(
          styles.dragHandle,
          band.is_break && styles.break,
          isOverlay && styles.grabbing,
        )}
      >
        ⋮
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.headerWrapper}>
          {/* 休憩だった時の表示 */}
          {band.is_break ? (
            <input
              type="text"
              value={band.band_name}
              onChange={(e) => onChange(id, "band_name", e.target.value)}
              placeholder="項目名 (例: 休憩)"
              className={styles.bandNameInput}
            />
          ) : (
            // 休憩でないときの表示
            <div className={styles.bandNameText}>{band.band_name}</div>
          )}
          {/* 休憩ではないときだけ代表者名を表示 */}
          {!band.is_break && (
            <div className={styles.representativeName}>
              代表者: {band.representative_name}
            </div>
          )}
        </div>
        <div className={styles.timeContainer}>
          <div className={styles.durationGroup}>
            <label className={styles.label}>時間:</label>
            <input
              type="number"
              value={band.duration_minutes ?? 0}
              onChange={(e) =>
                onChange(id, "duration_minutes", Number(e.target.value))
              }
              className={styles.timeInput}
            />
            <span>分</span>
          </div>
          <div className={styles.transitionGroup}>
            <label className={clsx(styles.label, styles.transitionLabel)}>
              転換時間:
            </label>
            <input
              type="number"
              value={band.transition_duration ?? 10}
              onChange={(e) =>
                onChange(id, "transition_duration", Number(e.target.value))
              }
              className={styles.transitionInput}
            />
            <span className={styles.transitionUnit}>分</span>
          </div>
        </div>
      </div>
    </div>
  );
}

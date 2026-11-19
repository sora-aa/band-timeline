import type { CSSProperties } from "react";
import type { TimetableRow } from "../timing";

function PerformanceRow({ band, start, end, transition }: TimetableRow) {
  return (
    <div>
      <div className="grid min-h-[41px] grid-cols-[120px_minmax(0,1fr)] border-b border-gray-300">
        <div className="border-r border-gray-300 bg-amber-50 p-2 text-sm leading-5 text-black">
          {start}-{end}
        </div>
        <div
          className={
            band.is_break
              ? "break-words bg-gray-100 p-2 text-sm leading-5 text-black"
              : "break-words bg-white p-2 text-sm leading-5 text-black"
          }
        >
          {band.band_name} ({band.duration_minutes}分)
        </div>
      </div>
      {transition && (band.transition_duration ?? 0) > 0 && (
        <div className="grid min-h-[41px] grid-cols-[120px_minmax(0,1fr)] border-b border-gray-300">
          <div className="border-r border-gray-300 bg-amber-50 p-2 text-sm leading-5 text-black">
            <p>
              {transition.start} - {transition.end}
            </p>
          </div>
          <div className="break-words bg-white p-2 text-sm leading-5 text-black">
            転換 ({band.transition_duration}分)
          </div>
        </div>
      )}
    </div>
  );
}

export function TimetableGrid({ rows }: { rows: TimetableRow[] }) {
  // 1カラムに収める最大行数。行が増えたときのみ列を追加する
  const maxRowsPerColumn = 12;
  const columnCount = Math.max(1, Math.ceil(rows.length / maxRowsPerColumn));

  // 先頭の列だけを上限まで詰めると列の高さが大きく偏るため、全列へ均等に配る
  // （例: 20組を12/8ではなく10/10に分ける）
  const rowsPerColumn = Math.ceil(rows.length / columnCount);

  // 列ごとに表示する行データを分割
  const columns = Array.from({ length: columnCount }, (_, index) => {
    const startIndex = index * rowsPerColumn;
    return rows.slice(startIndex, startIndex + rowsPerColumn);
  });

  // grid-template-columns を直接インラインで指定すると、狭い画面で1列に戻す
  // クラス（max-[900px]:grid-cols-1）がインラインstyleに負けてしまう。
  // 列数だけをCSS変数で渡し、実際の指定はクラス側に任せる
  const gridStyle = {
    "--timetable-columns": String(columnCount),
  } as CSSProperties;
  return (
    <section
      className="grid grid-cols-[repeat(var(--timetable-columns),minmax(0,1fr))] border-b border-l border-r border-gray-300 max-[900px]:grid-cols-1"
      style={gridStyle}
    >
      {columns.map((rows, index) => (
        <div
          key={index}
          className="border-r border-gray-300 last:border-r-0 max-[900px]:border-b max-[900px]:border-r-0 max-[900px]:last:border-b-0"
        >
          {rows.map((row) => (
            <PerformanceRow key={row.band.id} {...row} />
          ))}
        </div>
      ))}
    </section>
  );
}

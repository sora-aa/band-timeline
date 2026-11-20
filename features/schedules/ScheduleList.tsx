"use client";

import Link from "next/link";
import { ScheduleCard } from "./ScheduleCard";
import { useSchedules } from "./useSchedules";

export default function ScheduleList() {
  const { schedules, loading, handleDelete, toggleStatus } = useSchedules();
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
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onDelete={() => handleDelete(schedule.id)}
              onToggle={(column) => toggleStatus(schedule, column)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

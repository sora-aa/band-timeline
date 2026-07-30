"use client";

// import { createClient } from "@/utils/supabase/client";
// import { useEffect, useState } from "react";
import Link from "next/link";

// const supabase = createClient();

// interface ScheduleId {
//   id: string;
// }

export default function Home() {
  // const [schedules, setSchedules] = useState([] as ScheduleId[]);
  // const fetchData = async () => {
  //   try {
  //     const { data, error } = await supabase.from("schedules").select("id");
  //     if (error) throw error;
  //     console.log("Fetched schedules:", data);
  //     setSchedules(data);
  //   } catch (error) {
  //     console.error("Error fetching schedules:", error);
  //   }
  // };

  // useEffect(() => {
  //   fetchData();
  // }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-6">
      <h1>band-timeline</h1>
      <Link
        href="/admin/schedules"
        className="w-fit rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        幹部用スケジュール一覧
      </Link>
      {/* {schedules.map((schedule) => (
        <section key={schedule.id} className="rounded-lg border p-4">
          <h2 className="mb-3 text-lg font-semibold">
            Schedule ID: {schedule.id}
          </h2>
          <div className="flex flex-wrap gap-3 text-sm underline">
            <Link href={`/schedules/${schedule.id}/form`}>form</Link>
            <Link href={`admin/schedules/${schedule.id}/timetable`}>
              editTimetable
            </Link>
            <Link href={`schedules/${schedule.id}/timetable`}>timetable</Link>
          </div>
        </section>
      ))} */}
      <p>ホーム画面です</p>
    </main>
  );
}

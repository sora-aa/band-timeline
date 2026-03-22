"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import Link from "next/link";

const supabase = createClient();

interface ScheduleId {
  id: string;
}

export default function Home() {
  const [schedules, setSchedules] = useState([] as ScheduleId[]);
  const fetchData = async () => {
    try {
      const { data, error } = await supabase.from("schedules").select("id");
      if (error) throw error;
      console.log("Fetched schedules:", data);
      setSchedules(data);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <Link href="/admin/schedules">スケジュール一覧</Link>
      {schedules.map((schedule) => (
        <div key={schedule.id}>
          <h2>Schedule ID: {schedule.id}</h2>
          <Link href={`/schedules/${schedule.id}/form`}>form</Link>
          <br />
          <Link href={`admin/schedules/${schedule.id}/timetable`}>
            editTimetable
          </Link>
          <br />
          <Link href={`schedules/${schedule.id}/timetable`}>timetable</Link>
        </div>
      ))}
    </div>
  );
}

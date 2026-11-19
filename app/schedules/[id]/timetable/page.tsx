import PublicTimetable from "@/features/timetable/public/PublicTimetable";

export default async function Page({ params, searchParams }: PageProps<"/schedules/[id]/timetable">) {
  const [{ id }, { date }] = await Promise.all([params, searchParams]);
  return <PublicTimetable scheduleId={id} requestedDate={date} />;
}

import TimetableEditor from "@/features/timetable/editor/TimetableEditor";

export default async function Page({
  params,
}: PageProps<"/admin/schedules/[id]/timetable">) {
  const { id } = await params;
  return <TimetableEditor key={id} scheduleId={id} />;
}

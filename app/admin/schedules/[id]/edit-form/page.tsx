import EditForm from "@/features/forms/editor/EditForm";

export default async function Page({ params }: PageProps<"/admin/schedules/[id]/edit-form">) {
  const { id } = await params;
  return <EditForm key={id} scheduleId={id} />;
}

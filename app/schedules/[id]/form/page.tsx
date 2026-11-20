import RegistrationForm from "@/features/forms/registration/RegistrationForm";

export default async function Page({ params }: PageProps<"/schedules/[id]/form">) {
  const { id } = await params;
  return <RegistrationForm key={id} scheduleId={id} />;
}

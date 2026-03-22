import LoginClient from "./login-client";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextParam = params.next;
  const next = Array.isArray(nextParam) ? nextParam[0] : nextParam;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <LoginClient nextPath={next ?? "/"} />
    </main>
  );
}

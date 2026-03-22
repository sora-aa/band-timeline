"use client";

import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type LoginClientProps = {
  nextPath: string;
};

export default function LoginClient({ nextPath }: LoginClientProps) {
  const handleGoogleLogin = async () => {
    const safeNext = nextPath.startsWith("/") ? nextPath : "/";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) {
      console.error("ログインに失敗:", error.message);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
    >
      Googleでログイン
    </button>
  );
}

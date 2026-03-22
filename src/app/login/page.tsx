"use client";

import { createClient } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const handleGoogleLogin = async () => {
    const next = searchParams.get("next") ?? "/";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) {
      console.error("ログインに失敗:", error.message);
    }
  };

  return <button onClick={handleGoogleLogin}>Googleでログイン</button>;
}

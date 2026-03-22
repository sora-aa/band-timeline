import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./keys";

// サーバー（Server Component / Route Handler）用のSupabaseクライアントを作るファイル。
// Next.jsのcookies()と連携し、サーバー側でセッションCookieを扱えるようにする。
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Componentsで呼ばれた場合は書き込みできないため無視
        }
      },
    },
  });
}

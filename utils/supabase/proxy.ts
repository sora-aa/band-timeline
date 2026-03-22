import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseEnv } from "./keys";

// Next.jsのproxy(ミドルウェア)から呼び出す、セッション更新専用ユーティリティ。
// Cookieの同期とclaims取得をまとめ、認証判定に必要な情報を返す。
type SessionUpdateResult = {
  response: NextResponse;
  claims: Record<string, unknown> | null;
};

const AUTH_COOKIE_NAME_PATTERN = /-auth-token(?:\.\d+)?$/;

export async function updateSession(
  request: NextRequest,
): Promise<SessionUpdateResult> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );

        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const authCookieNames = request.cookies
    .getAll()
    .map(({ name }) => name)
    .filter((name) => AUTH_COOKIE_NAME_PATTERN.test(name));

  if (authCookieNames.length === 0) {
    return { response: supabaseResponse, claims: null };
  }

  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String((error as { code?: string }).code ?? "")
        : "";

    if (code === "refresh_token_not_found") {
      authCookieNames.forEach((name) => {
        request.cookies.delete(name);
        supabaseResponse.cookies.delete(name);
      });

      return { response: supabaseResponse, claims: null };
    }

    console.error("Auth claims取得エラー:", error.message);
    return { response: supabaseResponse, claims: null };
  }

  return { response: supabaseResponse, claims: data?.claims ?? null };
}

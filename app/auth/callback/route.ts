import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function getAllowedRedirectHosts() {
  return new Set(
    (process.env.AUTH_REDIRECT_ALLOWED_HOSTS ?? "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  );
}

function normalizeForwardedHost(value: string | null) {
  if (!value) return null;

  const firstHost = value.split(",")[0]?.trim().toLowerCase();
  if (!firstHost) return null;

  if (!/^[a-z0-9.-]+(?::\d+)?$/i.test(firstHost)) {
    return null;
  }

  return firstHost;
}

// Google OAuthのコールバックを受け取り、認可コードをセッションに交換する。
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // ログイン後に戻したい相対パス（安全のため先頭/のみ許可）
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) {
    next = "/";
  }

  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // DBトリガー等によるエラーのハンドリング
  if (error) {
    console.error("OAuthエラー:", error, errorDescription);
    return NextResponse.redirect(`${origin}/login?error=unauthorized_domain`);
  }

  if (code) {
    // サーバー側クライアントで認可コードをセッションへ交換し、Cookieに保存する
    const supabase = await createClient();

    const { error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!sessionError) {
      // x-forwarded-host は詐称可能なため、許可リストに一致する場合のみ信用する
      const allowedRedirectHosts = getAllowedRedirectHosts();
      const forwardedHost = normalizeForwardedHost(
        request.headers.get("x-forwarded-host"),
      );

      if (forwardedHost && allowedRedirectHosts.has(forwardedHost)) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}

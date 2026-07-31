import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/proxy";

// 開発環境で認証をスキップするかどうか。
// NEXT_PUBLIC_DISABLE_AUTH=true は .env.development にのみ定義しており、
// 本番ビルド(next build)ではそのファイルが読み込まれないため常にfalseになる。
// 念のため NODE_ENV でも二重にガードし、本番では絶対にスキップしないようにする。
const isAuthDisabled =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_DISABLE_AUTH === "true";

// Next.jsのproxyエントリ。
// ここでは詳細実装を持たず、セッション更新とアクセス制御だけを行う。
export async function proxy(request: NextRequest) {
  // 開発環境で認証を無効化している場合は、ログイン判定を行わず素通りさせる。
  if (isAuthDisabled) {
    return NextResponse.next({ request });
  }

  // Cookieを同期しつつ認証claimsを取得
  const { response, claims } = await updateSession(request);

  const { pathname } = request.nextUrl;
  const requestedPathWithSearch = `${pathname}${request.nextUrl.search}`;

  const isPublicRoute =
    pathname.startsWith("/login") || pathname.startsWith("/auth");

  // 未ログインで保護ページに来た場合はログイン画面へ
  if (!claims && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", requestedPathWithSearch);
    return NextResponse.redirect(url);
  }

  // ログイン済みでログイン画面に来た場合はトップへ
  if (claims && pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // 認証状態に問題がなければ通常レスポンスを返す
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./keys";

// ブラウザ（Client Component）用のSupabaseクライアントを作るファイル。
// 画面側はこのcreateClient()だけを呼び出すことで初期化を共通化できる。
export function createClient() {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient(url, key);
}

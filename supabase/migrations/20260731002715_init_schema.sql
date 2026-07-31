-- 初期スキーマ: schedules / bands
-- 本番Supabaseと同じ構造をローカル開発用に再現するためのマイグレーション。
-- 開発用途のためRLSは有効化せず、anonロールに直接テーブル権限を付与する
-- （開発では認証をスキップしanonロールでアクセスするため）。
-- 本番のRLS/権限設定はSupabaseダッシュボード側で管理している。

-- 日程（イベント）
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_date date not null,
  end_date date not null,
  form_schema jsonb not null default '[]'::jsonb,
  is_form_open boolean not null default false,
  is_timetable_open boolean not null default false,
  start_time time without time zone,
  created_at timestamptz not null default now()
);

-- 各日程への出演申し込み（バンド／休憩枠）
create table if not exists public.bands (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules (id) on delete cascade,
  representative_name text not null default '',
  band_name text not null default '',
  duration_minutes integer not null default 0,
  is_break boolean not null default false,
  sort_order integer,
  transition_duration integer,
  custom_answers jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bands_schedule_id_idx on public.bands (schedule_id);
create index if not exists bands_sort_order_idx on public.bands (schedule_id, sort_order);

-- 開発用のアクセス権限付与。
-- ローカルSupabaseではRLSを無効化しただけでは anon/authenticated ロールに
-- テーブル権限が付かないため、明示的に付与する（SELECT/INSERT/UPDATE/DELETE 全て）。
-- これは開発用ローカルDB限定の設定であり、本番には適用されない。
grant all on public.schedules to anon, authenticated;
grant all on public.bands to anon, authenticated;

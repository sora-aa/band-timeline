-- 初期スキーマ: schedules / schedule_days / bands
-- 空のローカルDBから日別タイムテーブルを構築する。既存データの移行は行わない。
-- 開発用途のためRLSは有効化せず、anonロールに直接テーブル権限を付与する
-- （開発では認証をスキップしanonロールでアクセスするため）。
-- 本番のRLS/権限設定はSupabaseダッシュボード側で管理している。

-- 日程（イベント）
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_date date not null,
  end_date date not null,
  form_schema jsonb not null default '[]'::jsonb,
  is_form_open boolean not null default false,
  is_timetable_open boolean not null default false,
  timetable_version integer not null default 0,
  created_at timestamptz not null default now(),
  constraint schedules_date_range check (end_date >= start_date)
);

-- 各開催日。開始時刻は日ごとに設定する。
create table public.schedule_days (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  date date not null,
  start_time time without time zone,
  unique (schedule_id, date),
  unique (schedule_id, id)
);

-- イベントへの出演申し込み（バンド／休憩枠）
create table public.bands (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules (id) on delete cascade,
  schedule_day_id uuid,
  representative_name text not null default '',
  band_name text not null default '',
  duration_minutes integer not null default 0,
  is_break boolean not null default false,
  sort_order integer,
  transition_duration integer,
  custom_answers jsonb,
  created_at timestamptz not null default now(),
  constraint bands_schedule_day_fkey foreign key (schedule_id, schedule_day_id)
    references public.schedule_days(schedule_id, id),
  constraint bands_placement check (
    (schedule_day_id is null and sort_order is null) or
    (schedule_day_id is not null and sort_order is not null and sort_order >= 0)
  ),
  -- 並び替え中の一時的な重複は許容し、トランザクション完了時に検証する。
  constraint bands_day_sort_unique unique (schedule_day_id, sort_order)
    deferrable initially deferred
);

create index bands_schedule_id_idx on public.bands (schedule_id);
create index bands_sort_order_idx on public.bands (schedule_id, sort_order);

create function public.create_schedule_days() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.schedule_days (schedule_id, date)
  select new.id, new.start_date + offset_days
  from generate_series(0, new.end_date - new.start_date) as offset_days;
  return new;
end;
$$;
create trigger schedules_create_days after insert on public.schedules
for each row execute function public.create_schedule_days();

create function public.validate_schedule_day() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (select 1 from public.schedules s where s.id = new.schedule_id
    and new.date between s.start_date and s.end_date) then
    raise exception '開催期間内の日付を指定してください';
  end if;
  return new;
end;
$$;
create trigger schedule_days_validate before insert or update on public.schedule_days
for each row execute function public.validate_schedule_day();

-- 日付変更UIは現時点で存在しない。直接更新で開催日と期間が食い違うことを防ぐ。
create function public.protect_schedule_date_range() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.start_date is distinct from old.start_date or new.end_date is distinct from old.end_date then
    raise exception '開催期間の変更には開催日の再設定が必要です';
  end if;
  return new;
end;
$$;
create trigger schedules_protect_dates before update of start_date, end_date on public.schedules
for each row execute function public.protect_schedule_date_range();

-- 全日程の編集内容を一括保存する。公開状態やフォーム回答は変更しない。
-- 同時に届いた新規申し込みは、payloadに含まれないためそのまま残る。
create function public.save_timetable(
  p_schedule_id uuid,
  p_version integer,
  p_days jsonb,
  p_bands jsonb,
  p_deleted_break_ids uuid[] default '{}'
) returns integer
language plpgsql security invoker set search_path = '' as $$
declare
  current_version integer;
  item record;
  affected integer;
begin
  select timetable_version into current_version from public.schedules
    where id = p_schedule_id for update;
  if not found then raise exception 'イベントが見つかりません'; end if;
  if p_version is distinct from current_version then
    raise exception '他の画面で更新されています。変更内容を控えてから再読み込みしてください';
  end if;
  if p_days is null or jsonb_typeof(p_days) <> 'array'
    or p_bands is null or jsonb_typeof(p_bands) <> 'array' then
    raise exception '保存データの形式が不正です';
  end if;
  if jsonb_array_length(p_days) <> (select count(*) from public.schedule_days where schedule_id = p_schedule_id)
    or (select count(distinct x.id) from jsonb_to_recordset(p_days) as x(id uuid)) <> jsonb_array_length(p_days) then
    raise exception '開催日の情報が一致しません';
  end if;
  if (select count(distinct x.id) from jsonb_to_recordset(p_bands) as x(id uuid)) <> jsonb_array_length(p_bands) then
    raise exception '出演枠のIDが重複しているか未設定です';
  end if;

  for item in select * from jsonb_to_recordset(p_days) as x(id uuid, start_time time) loop
    update public.schedule_days set start_time = item.start_time
      where id = item.id and schedule_id = p_schedule_id;
    if not found then raise exception '開催日がイベントに属していません'; end if;
  end loop;

  if exists (
    select 1 from unnest(coalesce(p_deleted_break_ids, '{}')) as deleted(id)
    where not exists (select 1 from public.bands b where b.id = deleted.id
      and b.schedule_id = p_schedule_id and b.is_break)
      or exists (select 1 from jsonb_to_recordset(p_bands) as x(id uuid) where x.id = deleted.id)
  ) then raise exception '削除できるのはこのイベントの休憩・自由枠だけです'; end if;
  delete from public.bands where schedule_id = p_schedule_id and is_break
    and id = any(coalesce(p_deleted_break_ids, '{}'));

  for item in select * from jsonb_to_recordset(p_bands) as x(
    id uuid, schedule_day_id uuid, sort_order integer, band_name text,
    duration_minutes integer, transition_duration integer, is_new_break boolean
  ) loop
    if item.band_name is null or item.duration_minutes is null or item.duration_minutes < 0
      or item.transition_duration is null or item.transition_duration < 0 then
      raise exception '演奏時間・転換時間には0以上の分数を指定してください';
    end if;
    if item.is_new_break is true then
      insert into public.bands (id, schedule_id, schedule_day_id, sort_order,
        band_name, duration_minutes, transition_duration, is_break)
      values (item.id, p_schedule_id, item.schedule_day_id, item.sort_order,
        item.band_name, item.duration_minutes, item.transition_duration, true);
    else
      update public.bands set schedule_day_id = item.schedule_day_id, sort_order = item.sort_order,
        band_name = item.band_name, duration_minutes = item.duration_minutes,
        transition_duration = item.transition_duration
      where id = item.id and schedule_id = p_schedule_id;
      get diagnostics affected = row_count;
      if affected <> 1 then raise exception '出演枠が見つかりません。再読み込みしてください'; end if;
    end if;
  end loop;

  update public.schedules set timetable_version = timetable_version + 1
    where id = p_schedule_id returning timetable_version into current_version;
  return current_version;
end;
$$;

-- 開発用のアクセス権限付与。
-- ローカルSupabaseではRLSを無効化しただけでは anon/authenticated ロールに
-- テーブル権限が付かないため、明示的に付与する（SELECT/INSERT/UPDATE/DELETE 全て）。
-- 本番ではこの権限設定をそのまま使用せず、運営者権限とRLSを別途設定すること。
grant all on public.schedules to anon, authenticated;
grant all on public.bands to anon, authenticated;
grant select, insert, update, delete on public.schedule_days to anon, authenticated;
revoke all on function public.save_timetable(uuid, integer, jsonb, jsonb, uuid[]) from public;
grant execute on function public.save_timetable(uuid, integer, jsonb, jsonb, uuid[]) to anon, authenticated;

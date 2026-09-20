-- 実行例: docker exec -i supabase_db_band-timeline psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/tests/daily_timetables.sql
-- すべてROLLBACKするため、既存データには影響しない。
begin;
set local role anon;
do $$
declare
  event_id uuid := gen_random_uuid();
  other_event uuid := gen_random_uuid();
  first_day uuid;
  second_day uuid;
  other_day uuid;
  band_a uuid := gen_random_uuid();
  band_b uuid := gen_random_uuid();
  new_submission uuid := gen_random_uuid();
  break_id uuid := gen_random_uuid();
  day_payload jsonb;
  band_payload jsonb;
  next_version integer;
  rejected boolean;
begin
  insert into public.schedules (id, title, start_date, end_date)
    values (event_id, 'transaction test', '2026-09-18', '2026-09-20');
  if (select count(*) from public.schedule_days where schedule_id = event_id) <> 3 then
    raise exception 'FAIL: automatic creation of all days';
  end if;
  select id into first_day from public.schedule_days where schedule_id = event_id and date = '2026-09-18';
  select id into second_day from public.schedule_days where schedule_id = event_id and date = '2026-09-19';
  if exists (select 1 from public.schedule_days where schedule_id = event_id and start_time is not null) then
    raise exception 'FAIL: initial start times';
  end if;
  insert into public.schedules (id, title, start_date, end_date)
    values (other_event, 'other event', '2026-09-18', '2026-09-18');
  select id into other_day from public.schedule_days where schedule_id = other_event;
  insert into public.bands (id, schedule_id, band_name, duration_minutes, custom_answers)
    values (band_a, event_id, 'A', 20, '{"answer":"preserve"}'), (band_b, event_id, 'B', 30, null);
  select jsonb_agg(jsonb_build_object('id', id, 'start_time',
    case when id = first_day then '10:00' when id = second_day then '13:00' else null end))
    into day_payload from public.schedule_days where schedule_id = event_id;
  band_payload := jsonb_build_array(
    jsonb_build_object('id', band_a, 'schedule_day_id', first_day, 'sort_order', 0,
      'band_name', 'A', 'duration_minutes', 20, 'transition_duration', 5),
    jsonb_build_object('id', band_b, 'schedule_day_id', second_day, 'sort_order', 0,
      'band_name', 'B', 'duration_minutes', 30, 'transition_duration', 0),
    jsonb_build_object('id', break_id, 'schedule_day_id', first_day, 'sort_order', 1,
      'band_name', '休憩', 'duration_minutes', 10, 'transition_duration', 0, 'is_new_break', true)
  );
  -- 読み込み後に届いた申し込みは保存payloadに含まれなくても消えない。
  insert into public.bands (id, schedule_id, band_name) values (new_submission, event_id, 'new submission');
  next_version := public.save_timetable(event_id, 0, day_payload, band_payload);
  if next_version <> 1 or (select schedule_day_id from public.bands where id = band_b) <> second_day
    or not exists (select 1 from public.bands where id = new_submission and sort_order is null)
    or (select custom_answers->>'answer' from public.bands where id = band_a) <> 'preserve' then
    raise exception 'FAIL: save/preserve submissions and answers';
  end if;
  set constraints all immediate;
  set constraints all deferred;

  -- 同じ日の順序交換。中間状態で順序が重複しても一括保存できる。
  band_payload := jsonb_set(band_payload, '{2,is_new_break}', 'false');
  band_payload := jsonb_set(band_payload, '{0,sort_order}', '1');
  band_payload := jsonb_set(band_payload, '{2,sort_order}', '0');
  next_version := public.save_timetable(event_id, 1, day_payload, band_payload);
  set constraints all immediate;
  set constraints all deferred;
  if next_version <> 2 or (select sort_order from public.bands where id = band_a) <> 1 then
    raise exception 'FAIL: reorder';
  end if;

  -- 別イベントへの配置を拒否し、先に更新した時刻・休憩削除も巻き戻す。
  rejected := false;
  begin
    perform public.save_timetable(event_id, 2,
      (select jsonb_agg(jsonb_build_object('id', id, 'start_time', '22:00'))
        from public.schedule_days where schedule_id = event_id),
      jsonb_set(band_payload - 2, '{0,schedule_day_id}', to_jsonb(other_day)), array[break_id]);
  exception when foreign_key_violation then rejected := true;
  end;
  if not rejected or (select start_time from public.schedule_days where id = first_day) <> '10:00'::time
    or not exists (select 1 from public.bands where id = break_id)
    or (select timetable_version from public.schedules where id = event_id) <> 2 then
    raise exception 'FAIL: cross-event placement rollback';
  end if;

  rejected := false;
  begin
    perform public.save_timetable(event_id, 0, day_payload, band_payload);
  exception when raise_exception then rejected := true;
  end;
  if not rejected then raise exception 'FAIL: stale version accepted'; end if;

  rejected := false;
  begin
    perform public.save_timetable(event_id, 2, day_payload, band_payload - 0, array[band_a]);
  exception when raise_exception then rejected := true;
  end;
  if not rejected then raise exception 'FAIL: deleted a submitted band'; end if;

  -- 重複した出演順を拒否。
  rejected := false;
  begin
    perform public.save_timetable(event_id, 2, day_payload,
      jsonb_set(band_payload, '{0,sort_order}', '0'));
    set constraints all immediate;
  exception when unique_violation then rejected := true;
  end;
  if not rejected or (select timetable_version from public.schedules where id = event_id) <> 2 then
    raise exception 'FAIL: duplicate order rollback';
  end if;
  set constraints all deferred;

  -- 日をまたぐ移動と未配置への戻し、休憩の削除を同時に保存。
  band_payload := jsonb_set(band_payload - 2, '{0,schedule_day_id}', to_jsonb(second_day));
  band_payload := jsonb_set(band_payload, '{0,sort_order}', '0');
  band_payload := jsonb_set(band_payload, '{1,schedule_day_id}', 'null');
  band_payload := jsonb_set(band_payload, '{1,sort_order}', 'null');
  next_version := public.save_timetable(event_id, 2, day_payload, band_payload, array[break_id]);
  set constraints all immediate;
  if next_version <> 3 or (select schedule_day_id from public.bands where id = band_a) <> second_day
    or (select schedule_day_id from public.bands where id = band_b) is not null
    or exists (select 1 from public.bands where id = break_id) then
    raise exception 'FAIL: move/unplace/delete';
  end if;

  rejected := false;
  begin
    update public.bands set sort_order = 0 where id = band_b;
  exception when check_violation then rejected := true;
  end;
  if not rejected then raise exception 'FAIL: partial placement accepted'; end if;
  rejected := false;
  begin
    insert into public.schedule_days (schedule_id, date) values (event_id, '2026-09-21');
  exception when raise_exception then rejected := true;
  end;
  if not rejected then raise exception 'FAIL: date outside event accepted'; end if;
  rejected := false;
  begin
    update public.schedules set end_date = '2026-09-18' where id = event_id;
  exception when raise_exception then rejected := true;
  end;
  if not rejected then raise exception 'FAIL: inconsistent date range update'; end if;
  delete from public.schedules where id = event_id;
  if exists (select 1 from public.schedule_days where schedule_id = event_id)
    or exists (select 1 from public.bands where schedule_id = event_id) then
    raise exception 'FAIL: cascade delete';
  end if;
  raise notice 'PASS: creation, save, reorder, rollback, conflict, move, delete, constraints and cascade';
end;
$$;
rollback;

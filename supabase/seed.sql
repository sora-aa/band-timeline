-- ローカル開発用のサンプルデータ。
-- `supabase start` / `supabase db reset` 実行時に自動で投入される。
-- フォーム・タイムテーブルを公開済みの単日・3日間開催のイベントを用意する。
--
-- form_schema は本番アプリ（components/admin/FormBuilder）が出力する構造に合わせている:
--   先頭3つは固定質問 fixed-1(代表者名) / fixed-2(バンド名) / fixed-3(演奏時間) で必ず含まれ、
--   4つ目以降が幹部の追加したカスタム質問（id は UUID）。
-- bands.custom_answers はカスタム質問の id をキーに持つ（固定質問は
--   representative_name / band_name / duration_minutes カラムへ展開されるため含まない）。

insert into public.schedules (id, title, start_date, end_date, form_schema, is_form_open, is_timetable_open)
values (
  '00000000-0000-0000-0000-000000000001',
  'サンプルライブ（開発用）',
  '2026-08-01',
  '2026-08-01',
  '[
    {"id": "fixed-1", "label": "代表者名(ひらがなフルネーム)", "type": "text", "required": true, "description": ""},
    {"id": "fixed-2", "label": "バンド名または演奏予定アーティスト", "type": "text", "required": true, "description": ""},
    {"id": "fixed-3", "label": "演奏時間(分)", "type": "number", "required": true, "description": ""},
    {"id": "c1a1e2b0-0000-4000-8000-000000000101", "label": "意気込みを教えてください", "type": "textarea", "required": false},
    {"id": "c1a1e2b0-0000-4000-8000-000000000102", "label": "使用アンプ", "type": "select", "required": true, "options": ["JC-120", "Twin Reverb", "持ち込み"]}
  ]'::jsonb,
  true,
  true
);

update public.schedule_days set start_time = '18:00'
where schedule_id = '00000000-0000-0000-0000-000000000001' and date = '2026-08-01';

insert into public.bands (schedule_id, representative_name, band_name, duration_minutes, is_break, sort_order, transition_duration, custom_answers, schedule_day_id)
values
  ('00000000-0000-0000-0000-000000000001', 'やまだ たろう', 'サンプルバンドA', 20, false, 0, 5,
    '{"c1a1e2b0-0000-4000-8000-000000000101": "頑張ります", "c1a1e2b0-0000-4000-8000-000000000102": "JC-120"}'::jsonb,
    (select id from public.schedule_days where schedule_id = '00000000-0000-0000-0000-000000000001' and date = '2026-08-01')),
  ('00000000-0000-0000-0000-000000000001', 'すずき はなこ', 'サンプルバンドB', 25, false, 1, 5,
    '{"c1a1e2b0-0000-4000-8000-000000000101": "楽しみます", "c1a1e2b0-0000-4000-8000-000000000102": "持ち込み"}'::jsonb,
    (select id from public.schedule_days where schedule_id = '00000000-0000-0000-0000-000000000001' and date = '2026-08-01')),
  ('00000000-0000-0000-0000-000000000001', '', '休憩', 10, true, 2, 0, null,
    (select id from public.schedule_days where schedule_id = '00000000-0000-0000-0000-000000000001' and date = '2026-08-01')),
  ('00000000-0000-0000-0000-000000000001', 'さとう じろう', '未配置バンドC', 30, false, null, null,
    '{"c1a1e2b0-0000-4000-8000-000000000101": "初参加です", "c1a1e2b0-0000-4000-8000-000000000102": "Twin Reverb"}'::jsonb, null);

-- 複数日サンプル: 1日目・2日目は配置済み、3日目は未設定。
insert into public.schedules (id, title, start_date, end_date, form_schema, is_form_open, is_timetable_open)
select '00000000-0000-0000-0000-000000000002', '3日間ライブ（開発用）',
  '2026-09-18', '2026-09-20', form_schema, true, true
from public.schedules where id = '00000000-0000-0000-0000-000000000001';

update public.schedule_days set start_time = case date
  when '2026-09-18' then '10:00'::time when '2026-09-19' then '13:00'::time end
where schedule_id = '00000000-0000-0000-0000-000000000002';

insert into public.bands (schedule_id, schedule_day_id, representative_name, band_name,
  duration_minutes, is_break, sort_order, transition_duration)
select d.schedule_id, d.id, '', v.band_name, v.duration_minutes, v.is_break, v.sort_order, v.transition_duration
from (values
  ('2026-09-18'::date, '1日目バンドA', 20, false, 0, 5),
  ('2026-09-18'::date, '休憩', 10, true, 1, 0),
  ('2026-09-19'::date, '2日目バンドB', 30, false, 0, 0)
) as v(date, band_name, duration_minutes, is_break, sort_order, transition_duration)
join public.schedule_days d on d.date = v.date
where d.schedule_id = '00000000-0000-0000-0000-000000000002';

insert into public.bands (schedule_id, band_name, duration_minutes)
values ('00000000-0000-0000-0000-000000000002', '出演日未定バンドC', 25);

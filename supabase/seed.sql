-- ローカル開発用のサンプルデータ。
-- `supabase start` / `supabase db reset` 実行時に自動で投入される。
-- 動作確認しやすいよう、フォーム・タイムテーブルを公開済みの日程を1件用意している。
--
-- form_schema は本番アプリ（components/admin/FormBuilder）が出力する構造に合わせている:
--   先頭3つは固定質問 fixed-1(代表者名) / fixed-2(バンド名) / fixed-3(演奏時間) で必ず含まれ、
--   4つ目以降が幹部の追加したカスタム質問（id は UUID）。
-- bands.custom_answers はカスタム質問の id をキーに持つ（固定質問は
--   representative_name / band_name / duration_minutes カラムへ展開されるため含まない）。

insert into public.schedules (id, title, start_date, end_date, form_schema, is_form_open, is_timetable_open, start_time)
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
  true,
  '18:00:00'
);

insert into public.bands (schedule_id, representative_name, band_name, duration_minutes, is_break, sort_order, transition_duration, custom_answers)
values
  ('00000000-0000-0000-0000-000000000001', 'やまだ たろう', 'サンプルバンドA', 20, false, 0, 5,
    '{"c1a1e2b0-0000-4000-8000-000000000101": "頑張ります", "c1a1e2b0-0000-4000-8000-000000000102": "JC-120"}'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'すずき はなこ', 'サンプルバンドB', 25, false, 1, 5,
    '{"c1a1e2b0-0000-4000-8000-000000000101": "楽しみます", "c1a1e2b0-0000-4000-8000-000000000102": "持ち込み"}'::jsonb),
  ('00000000-0000-0000-0000-000000000001', '', '休憩', 10, true, 2, 0, null),
  ('00000000-0000-0000-0000-000000000001', 'さとう じろう', '未配置バンドC', 30, false, null, null,
    '{"c1a1e2b0-0000-4000-8000-000000000101": "初参加です", "c1a1e2b0-0000-4000-8000-000000000102": "Twin Reverb"}'::jsonb);

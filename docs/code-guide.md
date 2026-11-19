# コードの読み方と変更箇所

最初に、変えたい画面の `page.tsx` を開くと、どのコンポーネントが入口か分かります。たとえば、公開タイムテーブルの列数は `TimetableGrid.tsx`、編集・公開の両方に出る出演時刻は `timing.ts` が決めています。

## 変更したいことから探す

| やりたいこと | 最初に開くファイル | 確認する動作 |
| --- | --- | --- |
| 休憩を追加したときの初期時間を変える | [useTimetableEditor.ts の `addBreak`](../features/timetable/editor/useTimetableEditor.ts) | 追加直後の分数、当日の終了予定、保存して開き直した後の分数 |
| ボタンでバンドを配置する位置を変える | [bandPlacement.ts の `moveBetweenColumns`](../features/timetable/editor/bandPlacement.ts) | ボタンは既定で末尾へ移動する。ドラッグではマウスの位置から求めた挿入位置を渡す |
| ドラッグをどこまで動かせば開始するか変える | [useTimetableDrag.ts の `sensors`](../features/timetable/editor/useTimetableDrag.ts) | 行のハンドルでドラッグが始まること、分数欄をクリックして入力できること |
| 転換時間の足し方を変える | [timing.ts の `calculateRows`](../features/timetable/timing.ts) | 2組を配置した日の各枠、最後の枠の直後、日付をまたぐ場合の終了時刻を編集・公開の両画面で確認 |
| 申込フォームに新しい回答タイプを加える | [共通の質問型](../types/index.ts)、[管理側のタイプ選択](../features/forms/editor/QuestionEditor.tsx)、[申込側の入力欄](../features/forms/registration/AnswerField.tsx) | 管理者が選んで保存でき、申込者が回答できること。追加質問の回答は質問 ID をキーに `custom_answers` へ保存される |
| 新規フォームの固定質問の文言を変える | [fixedQuestions.ts の `DEFAULT_QUESTIONS`](../features/forms/fixedQuestions.ts) | 空のフォームを初めて編集したときの表示。保存済みのフォームは各日程の `form_schema` から読み込む |

## 画面の入口

`app/` のフォルダー名が URL を決めます。以下の6ファイルは URL と画面を結びます。`[id]` は日程の ID です。

| ファイル | 内容 | 変更するとどうなるか |
| --- | --- | --- |
| [app/admin/schedules/page.tsx](../app/admin/schedules/page.tsx) | 日程一覧の入口。ScheduleList を表示する。 | 管理一覧の URL で開く画面が変わる。 |
| [app/admin/schedules/new/page.tsx](../app/admin/schedules/new/page.tsx) | 新規日程の入口。CreateScheduleForm を表示する。 | 新規作成リンクから開く画面が変わる。 |
| [app/admin/schedules/[id]/edit-form/page.tsx](../app/admin/schedules/[id]/edit-form/page.tsx) | URL の ID を EditForm に渡し、日程ごとに編集画面を初期化する。 | どの日程の質問設定を開くかが変わる。 |
| [app/admin/schedules/[id]/timetable/page.tsx](../app/admin/schedules/[id]/timetable/page.tsx) | URL の ID を TimetableEditor に渡す。 | 管理者が開く編集対象と、日程をまたいで移動したときの画面の初期化が変わる。 |
| [app/schedules/[id]/form/page.tsx](../app/schedules/[id]/form/page.tsx) | URL の ID を RegistrationForm に渡す。 | 申込リンクから開くイベントと、画面を初期化する単位が変わる。 |
| [app/schedules/[id]/timetable/page.tsx](../app/schedules/[id]/timetable/page.tsx) | URL の ID とクエリの date を PublicTimetable に渡す。 | 日付付きの共有リンクをどう読み取るかが変わる。 |

## 日程管理

一覧を読む順序は `ScheduleList` → `ScheduleCard` → `useSchedules` です。最初の2つでボタンの位置を、最後のファイルでクリック後の処理を追えます。

| ファイル | 内容 | 変更するとどうなるか |
| --- | --- | --- |
| [ScheduleList.tsx](../features/schedules/ScheduleList.tsx) | 一覧画面の枠、新規作成リンク、読み込み中・0件・一覧の表示を組み立てる。 | 一覧全体の配置や、日程がないときの案内が変わる。 |
| [ScheduleCard.tsx](../features/schedules/ScheduleCard.tsx) | 1日程のタイトル、開催期間、公開状態ボタン、編集・閲覧リンク、削除ボタンを表示する。 | 各カードの日付表記、ボタンの文言や配置、リンク先が変わる。 |
| [useSchedules.ts](../features/schedules/useSchedules.ts) | 開始日順に一覧を取得し、削除と公開状態の更新を行う。公開切り替えは画面に先に反映し、失敗時に再取得する。 | 一覧の順序、削除確認、公開ボタンを押した後の表示と DB 更新が変わる。 |
| [CreateScheduleForm.tsx](../features/schedules/CreateScheduleForm.tsx) | イベント名・期間を入力し、日付の前後を検証して日程を登録する。 | 入力項目、受け付ける期間、登録する値、作成後の移動先が変わる。 |

## フォーム編集と出演申込

管理者が保存するのは質問の定義（`schedules.form_schema`）、申込者が送信するのはバンドと回答（`bands`）です。両者を結ぶのが質問 ID です。固定質問の ID を変更する場合は、すでに保存してあるフォームとの対応も確認します。

| ファイル | 内容 | 変更するとどうなるか |
| --- | --- | --- |
| [fixedQuestions.ts](../features/forms/fixedQuestions.ts) | 代表者名・バンド名・演奏時間の固定 ID と、初回編集時の質問定義を持つ。 | 初期ラベルや入力タイプが変わる。ID は申込側の演奏時間の入力条件と、回答の保存先にも使われる。 |
| [editor/EditForm.tsx](../features/forms/editor/EditForm.tsx) | 対象日程のタイトルと保存済みの質問を取得し、編集結果を form_schema に保存する。 | どの設定を読み書きするか、保存結果の通知、保存後の移動先が変わる。 |
| [editor/FormBuilder.tsx](../features/forms/editor/FormBuilder.tsx) | 編集中の質問配列を持ち、追加・更新・削除して保存ボタンから親に渡す。先頭の固定質問数に応じて編集を制限する。 | 新しい質問の初期値、固定扱いの範囲、保存ボタンに渡す質問一覧が変わる。 |
| [editor/QuestionEditor.tsx](../features/forms/editor/QuestionEditor.tsx) | 管理者が1問の質問文・回答タイプ・必須指定・補足説明を編集するカード。 | 各設定の入力方法や、固定質問で操作できる欄が変わる。 |
| [editor/QuestionOptions.tsx](../features/forms/editor/QuestionOptions.tsx) | 選択式・複数選択の候補を追加、編集、削除して親に返す。 | 管理者が候補リストを作る操作が変わる。保存した候補が申込画面に並ぶ。 |
| [registration/RegistrationForm.tsx](../features/forms/registration/RegistrationForm.tsx) | 日程の受付状態を確認し、質問ごとの回答、送信確認、完了・受付終了画面を管理する。 | 申込者が入力から送信完了までに見る画面と操作の順番が変わる。 |
| [registration/AnswerField.tsx](../features/forms/registration/AnswerField.tsx) | 1問をタイプに応じて入力欄にし、入力結果を親に返す。演奏時間欄の最小値・刻みや複数選択の扱いもここにある。 | 申込画面で入力できる値と、各質問が親に渡す回答の形式が変わる。 |
| [registration/submitRegistration.ts](../features/forms/registration/submitRegistration.ts) | 固定回答を代表者名・バンド名・演奏時間の列に、残りを custom_answers に分けて bands に登録する。 | 申込1件から DB に書き込む列と値が変わる。演奏時間の数値変換もここで行う。 |

## タイムテーブル

編集画面では、未配置リストを全日程で共有し、配置済みの出演順を日別に保持します。たとえば「未配置バンドを今日の末尾へ配置」の処理は、`UnscheduledCard` のボタン → `useTimetableEditor` の `moveBand` → `bandPlacement` の順に追えます。この操作は画面上の編集内容に反映され、「全日程を保存」を押すと `timetableRepository` が DB に送ります。

### 画面の組み立てと編集状態

| ファイル | 内容 | 変更するとどうなるか |
| --- | --- | --- |
| [editor/TimetableEditor.tsx](../features/timetable/editor/TimetableEditor.tsx) | 左右のリスト、ヘッダー、ドラッグ領域を組み立てる。表示密度の記憶と、開始時刻未設定時の仮の計算開始時刻も扱う。 | 画面全体の配置、通常・詰めて表示の復元、編集中の仮時刻が変わる。仮時刻の変更は DaySummary の案内にも反映される。 |
| [editor/EditorHeader.tsx](../features/timetable/editor/EditorHeader.tsx) | タイトル、保存・表示密度ボタン、未保存表示、日別の出演組数付きタブを描画する。 | 保存操作や日付選択の見せ方、ドラッグ中に無効にするボタンが変わる。 |
| [editor/DaySummary.tsx](../features/timetable/editor/DaySummary.tsx) | 選択日の開始時刻入力と、終了予定・出演組数・所要時間・転換時間を表示する。 | 時刻の入力方法、集計欄の見出し・配置や開始時刻未設定時の案内が変わる。 |
| [editor/useTimetableEditor.ts](../features/timetable/editor/useTimetableEditor.ts) | 日別の編集中データ、選択日、休憩の初期値と削除、未保存フラグ、読み込み・保存の成否を管理する。 | 休憩追加や枠編集の結果、日を切り替えたときの状態、保存後・失敗時の画面の振る舞いが変わる。 |
| [editor/bandPlacement.ts](../features/timetable/editor/bandPlacement.ts) | 配置先と挿入位置を受け取り、移動後の配列を返す。別日への移動では移動先の日の末尾へ加える。 | ボタンとドラッグに共通するリスト間の移動規則、別日に移した枠の順番が変わる。 |
| [editor/types.ts](../features/timetable/editor/types.ts) | 未配置と選択日の2列、全開催日の配置、行から親へ渡す変更通知の型を定義する。 | 編集部品が受け渡せる値と、型チェックで確認できる範囲が変わる。 |
| [editor/timetableRepository.ts](../features/timetable/editor/timetableRepository.ts) | 日程・開催日・バンド・保存バージョンをまとめて取得する。保存時は全日程の開始時刻、順番、休憩の追加削除を save_timetable に渡す。 | DB から編集状態を復元する順序や、保存リクエストの内容が変わる。引数の変更は DB 側の同名関数と対応させる。 |
| [timing.ts](../features/timetable/timing.ts) | 出演順と開始時刻から各枠・転換の時刻を計算する。最終枠の後の転換を除き、24時以降も通算時刻で表す。集計と所要時間の書式も担当する。 | calculateRows の変更は編集・公開の両画面に、summarizeRows と formatDuration の変更は編集側の集計欄に反映される。 |

### リスト・出演枠・ドラッグ操作

| ファイル | 内容 | 変更するとどうなるか |
| --- | --- | --- |
| [UnscheduledList.tsx](../features/timetable/editor/UnscheduledList.tsx) | 左側に全日程共通の未配置リスト、件数、休憩追加ボタンを表示する。 | サイドバーの配置や、全件配置済みのときの案内が変わる。 |
| [UnscheduledCard.tsx](../features/timetable/editor/UnscheduledCard.tsx) | 未配置の1枠に名前、分数入力、ドラッグハンドル、末尾に配置するボタンを表示する。 | 未配置の枠で見える情報や、その場で操作できる項目が変わる。 |
| [ScheduledList.tsx](../features/timetable/editor/ScheduledList.tsx) | 選択日の行を出演順に並べ、列見出し、行番号、空リストの案内を付ける。 | 配置済みリスト全体のレイアウトや、0組のときの表示が変わる。 |
| [ScheduledRow.tsx](../features/timetable/editor/ScheduledRow.tsx) | 配置済みの1枠に時刻、演奏・転換時間、別日へ移す操作、未配置へ戻す操作を表示する。休憩には名前編集と削除も用意する。 | 1行の表示と操作、詰めて表示したときの転換欄が変わる。 |
| [MinuteInput.tsx](../features/timetable/editor/MinuteInput.tsx) | 演奏・転換時間に共通の「分」入力欄。空欄を0として扱い、負の値を0に丸める。 | 左右のリストで分数を入力する際の刻み、見た目、値の扱いが一緒に変わる。 |
| [SortableBandList.tsx](../features/timetable/editor/SortableBandList.tsx) | 左右のリストをドロップ先として登録し、各リストのバンド ID と縦方向の並べ替え設定を dnd-kit に渡す。 | 空のリストでの受け入れ、ドラッグが重なったときの状態、両リストの並べ替え表示が変わる。 |
| [useTimetableDrag.ts](../features/timetable/editor/useTimetableDrag.ts) | ポインター・キーボードの操作から移動先と挿入位置を決める。リスト内の並べ替えを確定し、取り消し時は配置と未保存状態を復元する。 | ドラッグ開始の感度、カードの前後の判定、Esc で取り消したときの動作が変わる。 |
| [DragPreview.tsx](../features/timetable/editor/DragPreview.tsx) | ドラッグ中にポインターやキーボード操作に追従するカードを描画する。 | 掴んでいる間に表示する名前、分数、休憩の色が変わる。 |

### 公開画面

| ファイル | 内容 | 変更するとどうなるか |
| --- | --- | --- |
| [PublicTimetable.tsx](../features/timetable/public/PublicTimetable.tsx) | サーバー側で公開状態・開催日・その日の出演順を取得する。日付の指定がなければ初日を選ぶ。 | 日付タブと共有リンク、日付が無効な場合や開始未設定・未配置・非公開の場合の表示が変わる。 |
| [TimetableGrid.tsx](../features/timetable/public/TimetableGrid.tsx) | 計算済みの行を表にする。列の目安は12枠で、複数列に均等に配る。画面が狭いときは1列にする。 | 公開表の列数、時間・バンド名の配置、休憩や転換の見た目が変わる。 |

## 共通の型とデータベース

| ファイル | 内容 | 変更するとどうなるか |
| --- | --- | --- |
| [types/index.ts](../types/index.ts) | 日程、開催日、バンド、質問、回答など、複数機能が共有する TypeScript の型を定義する。 | 関係する画面や保存処理に対してコンパイラーが検査する項目が変わる。DB の列を変えるときは SQL も合わせて確認する。 |
| [supabase/migrations/20260731002715_init_schema.sql](../supabase/migrations/20260731002715_init_schema.sql) | テーブル、開催日の自動生成、全日程を一度に保存する関数などの初期定義。 | この SQL から構築した DB の保存規則が変わる。適用済みの DB を更新する場合は新しいマイグレーションで差分を適用する。 |
| [supabase/seed.sql](../supabase/seed.sql) | 開発用の単日・複数日イベント、質問、バンド、休憩を投入する。 | 次回のシード投入で動作確認に使えるデータが変わる。 |
| [supabase/tests/daily_timetables.sql](../supabase/tests/daily_timetables.sql) | 日別の配置や一括保存を SQL で検証し、最後にロールバックする。 | DB の回帰テストが検出するケースが変わる。 |

## 旧構成から探すとき

- `components/admin/FormBuilder/index.tsx` にあった質問一覧は `editor/FormBuilder.tsx`、1問の設定は `QuestionEditor.tsx`、選択肢は `QuestionOptions.tsx` にあります。いずれも `features/forms/` 配下です。
- `components/admin/timetable/` の `ScheduledRow`、`UnscheduledCard`、`MinuteInput` は、同名のまま `features/timetable/editor/` に移りました。旧 `DroppableColumn` が担っていた空リストへのドロップは `SortableBandList` にあります。
- 以前の各 `page.tsx` にあった画面本体は、現在の各ルートの先頭にある import または export から開けます。

## 認証・共通画面・開発設定

<details>
<summary>ホーム、ログイン、Supabase 接続のファイルを開く</summary>

| ファイル | 内容と変更の影響 |
| --- | --- |
| [app/page.tsx](../app/page.tsx) | ホームの本文と管理一覧へのリンクを表示する。変更はトップページに反映される。 |
| [app/layout.tsx](../app/layout.tsx) | 全画面の外枠、ページ情報、言語、フォントを設定する。タイトルや共通レイアウトの変更は各画面に及ぶ。 |
| [app/globals.css](../app/globals.css) | Tailwind CSS の読み込み、テーマ色、本文の基本スタイルを定義する。個別の画面で上書きされていない部分に効く。 |
| [app/favicon.ico](../app/favicon.ico) | ブラウザーのタブなどに使うサイトアイコン。差し替えるとサイトを識別する画像が変わる。 |
| [app/login/page.tsx](../app/login/page.tsx) | ログインページを表示し、URL の `next` をボタンに渡す。ログイン後の戻り先の初期値や画面の配置が変わる。 |
| [app/login/login-client.tsx](../app/login/login-client.tsx) | ログインボタンから Google 認証を開始する。ボタンの見た目や Google に渡すアカウント選択の指定が変わる。 |
| [app/auth/callback/route.ts](../app/auth/callback/route.ts) | Google から戻った際に認可コードをセッションに交換する。成功・失敗後の移動先や転送元ホストの扱いが変わる。 |
| [proxy.ts](../proxy.ts) | リクエストごとに認証の要否と移動先を決める。ログインを求める URL や開発時の認証スキップ条件が変わる。 |
| [utils/supabase/proxy.ts](../utils/supabase/proxy.ts) | セッションの Cookie を同期し、ログイン判定に使う情報を返す。期限切れなどで更新できない Cookie の扱いが変わる。 |
| [utils/supabase/client.ts](../utils/supabase/client.ts) | ブラウザー用の接続を作る。編集・申込・一覧・ログインから Supabase を使う際の共通設定に効く。 |
| [utils/supabase/server.ts](../utils/supabase/server.ts) | Cookie を使うサーバー用の接続を作る。公開タイムテーブルの取得と認証コールバックに効く。 |
| [utils/supabase/keys.ts](../utils/supabase/keys.ts) | 接続先 URL と公開キーを環境変数から選ぶ。ブラウザー・サーバー・認証用の接続が参照する設定名や優先順位が変わる。 |

</details>

<details>
<summary>環境設定、開発資料、静的ファイルを開く</summary>

| ファイル | 内容と変更の影響 |
| --- | --- |
| [README.md](../README.md) | 画面一覧、環境構築、開発コマンドの入口。変更すると、開発者が初めに読む手順が変わる。 |
| [qa-2026-09-20.md](qa-2026-09-20.md) | 当時の動作確認と修正候補を記録した資料。当時のファイル名・行番号を含み、過去の判断をたどるときに使う。 |
| [package.json](../package.json) | npm コマンドと依存ライブラリの範囲を指定する。起動・検査・ビルド手順や利用可能なライブラリが変わる。 |
| [package-lock.json](../package-lock.json) | npm が解決したバージョンを記録する。依存更新の差分を確認すると、次回のインストールで変わるライブラリが分かる。 |
| [next.config.ts](../next.config.ts) | Next.js のプロジェクト設定。追加したオプションが開発サーバーやビルドに反映される。 |
| [tsconfig.json](../tsconfig.json) | TypeScript の検査対象・厳密さ・パス別名を指定する。`@/` から始まる import の解決や型チェックに効く。 |
| [eslint.config.mjs](../eslint.config.mjs) | コードの静的検査ルールと除外先を指定する。`npm run lint` で報告される項目が変わる。 |
| [postcss.config.mjs](../postcss.config.mjs) | Tailwind CSS 用の PostCSS プラグインを指定する。ビルド時の CSS 変換に効く。 |
| [.env.development](../.env.development) | ローカル開発用の接続先と認証スキップの既定値。開発サーバーが読み込む接続・認証設定に効く。 |
| [supabase/config.toml](../supabase/config.toml) | ローカル Supabase のサービスやポートなどを設定する。開発者が起動する DB・API 環境が変わる。 |
| [.gitignore](../.gitignore) | 依存パッケージや個人用の環境設定など、Git が新規ファイルの追跡候補から除く対象を指定する。 |
| [supabase/.gitignore](../supabase/.gitignore) | Supabase CLI の一時ファイルやローカル設定を Git の追跡候補から除く。変更の範囲はこのディレクトリ配下。 |
| [.github/CODEOWNERS](../.github/CODEOWNERS) | パスごとのコード所有者を指定する。GitHub のプルリクエストでレビューを依頼される人が変わる。 |
| [AGENTS.md](../AGENTS.md) | このリポジトリでコードを書くエージェントへの指示。Next.js の同梱ガイドを確認する手順などを定める。 |
| [CLAUDE.md](../CLAUDE.md) | AGENTS.md を参照し、Claude にも同じ作業指示を渡す。参照先を変えると読み込む指示が変わる。 |
| [file.svg](../public/file.svg)・[globe.svg](../public/globe.svg)・[next.svg](../public/next.svg)・[vercel.svg](../public/vercel.svg)・[window.svg](../public/window.svg) | 公開ディレクトリの画像。各ファイルを差し替えると、同名の URL から配信する画像が変わる。 |

</details>

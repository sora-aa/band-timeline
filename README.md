# band-timeline

軽音サークルのライブ運営を支援する Web アプリです。
幹部が日程（イベント）ごとに出演申し込みフォームを作り、集まったバンド情報を並べ替えてタイムテーブルを作成・公開します。一般メンバーはフォームから出演申し込みをし、公開されたタイムテーブルを閲覧できます。

## できること

### 幹部（運営側）

- 日程（イベント）の作成・削除
- 日程ごとの申し込みフォームの作成・編集（質問項目を自由に追加できます）
- 集まったバンドをドラッグ＆ドロップで並べ替え、転換時間を設定してタイムテーブルを作成
- フォーム／タイムテーブルの公開・非公開の切り替え

### 一般メンバー

- 公開中のフォームから出演申し込み（代表者名・バンド名・演奏時間＋幹部が追加した質問に回答）
- 公開中のタイムテーブルの閲覧

> フォーム・タイムテーブルは幹部が「公開」にしている間だけ表示されます。非公開のときは案内メッセージが出ます。

> **ログインについて**: `/login`・`/auth` を除くすべてのページで Google ログインが必要です。フォーム回答やタイムテーブル閲覧も含め、未ログインの場合はログイン画面にリダイレクトされます。

## 画面構成

`/login`・`/auth` 以外はすべてログインが必要です（「認証」列を参照）。

| URL                               | 役割                         | 主な利用者   | 認証 |
| --------------------------------- | ---------------------------- | ------------ | ---- |
| `/`                               | ホーム                       | 全員         | 必要 |
| `/login`                          | Google ログイン              | 全員         | 不要 |
| `/auth/callback`                  | ログイン後のコールバック処理 | （システム） | 不要 |
| `/admin/schedules`                | 日程一覧・管理               | 幹部         | 必要 |
| `/admin/schedules/new`            | 日程の新規作成               | 幹部         | 必要 |
| `/admin/schedules/[id]/edit-form` | フォーム編集                 | 幹部         | 必要 |
| `/admin/schedules/[id]/timetable` | タイムテーブル編集           | 幹部         | 必要 |
| `/schedules/[id]/form`            | 出演申し込みフォーム         | 一般メンバー | 必要 |
| `/schedules/[id]/timetable`       | タイムテーブル閲覧           | 一般メンバー | 必要 |

## 技術スタック

- [Next.js](https://nextjs.org) 16（App Router）/ React 19 / TypeScript
- [Supabase](https://supabase.com)（データベース・認証）
- [Tailwind CSS](https://tailwindcss.com) v4
- [dnd-kit](https://dndkit.com)（タイムテーブルのドラッグ＆ドロップ）

## 開発環境のセットアップ

開発時は**ローカルの Supabase**（Docker）に接続し、**認証もスキップ**してログインなしで動作確認できます。本番のデータベースには接続しません。

### 1. 必要なもの

- Node.js 20 以上
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)（ローカル Supabase の起動に必要）

> 本番の Supabase 接続情報は開発では不要です。本番ビルドをローカルで試す場合のみ後述の `.env.production.local` を用意します。

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. 環境変数について

環境ごとの設定はリポジトリにコミット済みで、追加の設定は基本的に不要です。

- `.env.development`（コミット済み）: `next dev` 実行時に読み込まれる。ローカル Supabase への接続と認証スキップ（`NEXT_PUBLIC_DISABLE_AUTH=true`）を設定済み。
- `.env.local`（gitignore）: 個人用の上書き。通常は空のままで良い。
- `.env.production.local`（gitignore）: ローカルで本番ビルドを試すときだけ用意する本番 Supabase の接続情報。

> `.env.local` は開発・本番の両方で最優先に読み込まれるため、ここに本番の接続情報を書くと開発でも本番 DB を向いてしまいます。接続情報は上記の環境別ファイルに置いてください。

本番デプロイ（Vercel 等）では、ホスティング側の環境変数に次を設定します。

```bash
NEXT_PUBLIC_SUPABASE_URL=（本番 Supabase プロジェクトの URL）
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=（本番 Supabase の公開キー）
AUTH_REDIRECT_ALLOWED_HOSTS=（ログイン後のリダイレクトを許可するホスト名をカンマ区切りで）
```

### 4. ローカル Supabase の起動

Docker Desktop を起動した状態で、次のコマンドでローカルの Supabase（Postgres・認証・Studio 一式）を立ち上げます。初回は Docker イメージのダウンロードに時間がかかります。

```bash
npm run db:start
```

`supabase/migrations` のスキーマと `supabase/seed.sql` のサンプルデータが自動で投入されます。Studio（管理画面）は [http://127.0.0.1:54323](http://127.0.0.1:54323) で開けます。

> 起動時に表示される `anon key` が `.env.development` の値と異なる場合は、表示されたキーで `NEXT_PUBLIC_SUPABASE_ANON_KEY` を上書きしてください（既定値はどの環境でも同じ固定値です）。

### 5. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開くと、ログインなしでそのまま動作を確認できます。

## よく使うコマンド

| コマンド            | 内容                                             |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | 開発サーバーを起動                               |
| `npm run build`     | 本番用にビルド                                   |
| `npm run start`     | ビルド済みアプリを起動                           |
| `npm run lint`      | Lint チェック                                    |
| `npm run db:start`  | ローカル Supabase を起動                         |
| `npm run db:stop`   | ローカル Supabase を停止                         |
| `npm run db:reset`  | ローカル DB をマイグレーション＋シードで作り直す |
| `npm run db:status` | ローカル Supabase の接続情報を表示               |

## ログインについて

本番環境では `/login`・`/auth` を除く**すべてのページ**で Google アカウントによるログインが必要です。幹部の管理画面はもちろん、一般メンバーが使うフォーム回答・タイムテーブル閲覧のページも認証必須で、未ログインでアクセスすると自動的にログイン画面へリダイレクトされます（ログイン後は元のページに戻ります）。

ログイン可能なアカウントは Supabase 側で制限されています。ログインできない場合は幹部の代表者に連絡してください。

> **開発環境では認証はスキップされます**（`.env.development` の `NEXT_PUBLIC_DISABLE_AUTH=true`）。`next dev` ではログインなしで全ページにアクセスできます。この設定は本番ビルドでは読み込まれないため、本番の認証には影響しません。

## データ構成（概要）

- **schedules**: 日程（イベント）。タイトル・開催日・開始時刻・フォーム定義・公開状態を持ちます。
- **bands**: 各日程への出演申し込み。代表者名・バンド名・演奏時間・並び順・転換時間などを持ちます。フォームで追加された質問の回答は `custom_answers` に保存されます。

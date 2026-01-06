# プロジェクト仕様書 & コーディングガイドライン

このプロジェクトは、大学の軽音サークル向けのタイムテーブル作成アプリです。
以下のルールを厳格に守ってコードを提案してください。

## 1. 技術スタック (Tech Stack)

- **フレームワーク:** Next.js (App Router)
- **言語:** TypeScript
- **スタイリング:** CSS Modules (`*.module.css`) と通常の CSS を使用する。
  - **重要:** Tailwind CSS は使用しないこと。
- **データベース:** Supabase
- **アイコン:** Lucide React

## 2. ディレクトリ構成と CSS 戦略

- **コロケーション (Colocation) を採用する:**
  - コンポーネントファイル (`index.tsx`) とそのスタイル (`style.module.css`) を同じディレクトリに配置する。
  - 例: `src/components/ui/Button/index.tsx` と `src/components/ui/Button/style.module.css`
- **スタイルのインポート:**
  - `import styles from './style.module.css'` の形式を使用する。
- **クラスの切り替え:**
  - 条件付きのクラス適用には `clsx` ライブラリを使用する。

## 3. 主要機能の実装ルール

- **CSV インポート機能:**
  - ライブラリ: `papaparse` を使用する。
  - ソース: Google フォームからエクスポートされた CSV。
  - ロジック: 日本語の列名（例: 'バンド名'）を英語のオブジェクトキーにマッピングして取り込む。
- **ドラッグ＆ドロップ機能:**
  - ライブラリ: `@dnd-kit/core` と `@dnd-kit/sortable` を使用する。
- **タイムテーブル計算ロジック:**
  - ライブラリ: `date-fns` を使用して時間計算を行う。
  - 計算式: `開始時間` + `演奏時間` + `転換時間(デフォルト10分)` = `次のバンドの開始時間`

## 4. 認証と権限 (Auth & Permissions)

- **管理者ページ:** `/admin/*`
  - Middleware によって保護され、ログイン済み管理者のみアクセス可能。
- **公開ページ:** `/events/*`
  - ログイン不要で誰でも閲覧可能（Read-only）。

## 5. コーディングスタイル

- 関数コンポーネント (Functional Components) を優先する。
- Props や State には明示的な型定義 (Type) を行う。
- 複雑なビジネスロジックは `src/utils/` やカスタムフックに切り出し、UI コンポーネント内に書かない。

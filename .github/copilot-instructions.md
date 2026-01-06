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

- **動的フォーム機能 (Form Builder):**
  - **管理者側:** イベントごとに質問項目（`QuestionField[]`）を定義し、JSON として DB (`events.form_config`) に保存する UI を作成する。
  - **ユーザー側:** DB から質問定義を取得し、動的にフォームをレンダリングする。
  - **保存先:** 固定フィールド（名前、時間など）以外は、JSON カラム `bands.customAnswers` に保存する。
  - **バリデーション:** HTML 標準の `required` 属性などを活用する。

## 4. 認証と権限 (Auth & Permissions)

- **管理者ページ:** `/admin/*`
  - Middleware によって保護され、ログイン済み管理者のみアクセス可能。
- **公開ページ:** `/events/*`
  - ログイン不要で誰でも閲覧可能（Read-only）。

## 5. コーディングスタイル

- 関数コンポーネント (Functional Components) を優先する。
- Props や State には明示的な型定義 (Type) を行う。
- 複雑なビジネスロジックは `src/utils/` やカスタムフックに切り出し、UI コンポーネント内に書かない。

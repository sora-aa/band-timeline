This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Supabase / Googleログイン設定

`.env.local` に以下を設定してください。

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
# 推奨: Publishable key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
# 互換: まだPublishable keyを使っていない場合
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# 任意: Proxy配下でx-forwarded-hostを使う場合の許可ホスト（カンマ区切り）
AUTH_REDIRECT_ALLOWED_HOSTS=example.com,app.example.com
```

Google OAuth を使う場合は、Supabaseダッシュボードの Google Provider を有効化した上で、Google Cloud 側の OAuth Client に以下を設定してください。

- Authorized JavaScript origins: `http://localhost:3000`（本番URLも追加）
- Authorized redirect URI: Supabaseの Google Provider 画面に表示される Callback URL

また、Supabase Auth の Redirect URLs に `http://localhost:3000/auth/callback`（本番URLも追加）を含めてください。

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

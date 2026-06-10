<a href="https://chats.is/">
  <img alt="Chats.is — multi-provider AI chatbot." src="https://chats.is/opengraph-image.png">
  <h1 align="center">Chats.is</h1>
</a>

<p align="center">
  An open-source, multi-provider AI chatbot built with Next.js and the Vercel AI SDK.
  Chat, image, video, and speech generation across OpenAI, Azure OpenAI, Google Gemini,
  Vertex AI, Anthropic Claude, AWS Bedrock, xAI Grok, and DeepSeek — all configured
  from a built-in admin console instead of code.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#admin-console"><strong>Admin Console</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- **Multi-modal generation** — streaming chat plus image, video, and audio/speech generation routes
- **Artifacts canvas** — the model creates code/document artifacts that render in a side panel with
  source/preview switching, a sandboxed live preview for React/HTML/SVG (Tailwind included), a JSON
  table view, and a runtime console
- **Admin-configurable platform** — providers, models, prompts, plans, pricing, and quotas live in
  the database and are managed in `/console`, not hardcoded
- **Billing & quotas** — per-model pricing (manual or synced from [models.dev](https://models.dev)
  and [llm-metadata](https://basellm.github.io/llm-metadata/)), usage tracking with cost snapshots,
  and rolling 5-hour/7-day quota windows per user/plan
- **Provider failover** — a model can be bound to multiple providers and fails over automatically
- [Next.js](https://nextjs.org) App Router (React Server Components, Turbopack)
- [Vercel AI SDK](https://sdk.vercel.ai/docs) for streaming chat and tool calls
- [tRPC](https://trpc.io) end-to-end typesafe APIs with [TanStack Query](https://tanstack.com/query)
- [NextAuth.js](https://authjs.dev) — Google, GitHub, and email one-time-code login (via
  [Resend](https://resend.com)); the first user to sign up becomes admin
- [Drizzle ORM](https://orm.drizzle.team) + Postgres ([Neon](https://neon.tech) /
  [Supabase](https://supabase.com) / [Vercel Postgres](https://vercel.com/storage/postgres))
- [Vercel Blob](https://vercel.com/storage/blob) for generated and uploaded media
- [shadcn/ui](https://ui.shadcn.com) over [Radix UI](https://radix-ui.com), styled with
  [Tailwind CSS v4](https://tailwindcss.com), icons from [Lucide](https://lucide.dev) and
  [@lobehub/icons](https://icons.lobehub.com)

## Model Providers

API keys are entered in the admin console (stored AES-encrypted in the database) — no provider env
vars needed:

- [OpenAI](https://platform.openai.com/account/api-keys) and Azure OpenAI
- [Google Gemini](https://aistudio.google.com/app/apikey) and Google Vertex AI
- [Anthropic Claude](https://console.anthropic.com/settings/keys) and AWS Bedrock
- [xAI Grok](https://console.x.ai/)
- [DeepSeek](https://platform.deepseek.com/)

## Admin Console

`/console` (admin-only) manages everything the app reads at runtime:

- **Providers** — credentials and endpoints per provider type
- **Models** — chat/image/video/audio models with UI options and API parameters
- **Pricing** — per-unit rates, entered manually or synced from public datasets
- **Plans & Quotas** — cost windows and model allowlists per plan or per user
- **Prompts, Users, Usage, Settings** — system prompts, user roles, usage analytics, app metadata

## Deploy Your Own

You can deploy your own version of Chats.is to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?demo-title=Chats.is&demo-description=An+open-source%2C+multi-provider+AI+chatbot&demo-url=https%3A%2F%2Fchats.is%2F&project-name=chats-is&repository-name=chats.is&repository-url=https%3A%2F%2Fgithub.com%2Fchats-is%2Fchats.is&skippable-integrations=1&env=AUTH_SECRET%2CAPP_SECRET%2CDATABASE_URL%2CBLOB_READ_WRITE_TOKEN&envDescription=How+to+get+these+env+vars&envLink=https%3A%2F%2Fgithub.com%2Fchats-is%2Fchats.is%2Fblob%2Fmain%2F.env.example&teamCreateStatus=hidden&stores=[{"type":"postgres"}]&buildCommand=pnpm+vercel-build)

## Running locally

You will need the environment variables defined in [`.env.example`](.env.example) — a local `.env`
file is all that is necessary:

- `AUTH_SECRET` / `APP_SECRET` — random secrets (`openssl rand -base64 32`); `APP_SECRET` encrypts
  provider API keys at rest
- `DATABASE_URL` — Postgres connection string (Neon / Supabase / Vercel Postgres)
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob store token (for media generation and uploads)
- Optional login providers: `AUTH_GITHUB_*`, `AUTH_GOOGLE_*`, or email code via `RESEND_API_KEY` +
  `EMAIL_FROM`

> Note: You should not commit your `.env` file or it will expose secrets that allow others to
> control access to your database and authentication provider accounts.

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

Your app should now be running on [localhost:3000](http://localhost:3000/). Sign up — the first
account is auto-promoted to admin — then open [/console](http://localhost:3000/console) to add a
provider and models.

## Support

If you find this project helpful, consider supporting the development:

<a href="https://buymeacoffee.com/debugging" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" >
</a>

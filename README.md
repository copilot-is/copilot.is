<a href="https://copilot.is/">
  <img alt="Next.js and App Router-ready AI chatbot." src="https://copilot.is/opengraph-image.png">
  <h1 align="center">Next.js AI Chatbot</h1>
</a>

<p align="center">
  An open-source AI chatbot built with Next.js and Vercel AI SDK, supporting multiple AI models:
  OpenAI, Google Gemini, Google Vertex AI, Claude AI, Grok.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
- React Server Components (RSCs), Suspense, and Server Actions
- [Vercel AI SDK](https://sdk.vercel.ai/docs) for streaming chat UI
- Support for OpenAI, Google Gemini, Claude AI, Grok
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - [Radix UI](https://radix-ui.com) for headless component primitives
  - Icons from [Phosphor Icons](https://phosphoricons.com)
- [NextAuth.js](https://github.com/nextauthjs/next-auth) for authentication
- [Vercel Postgres](https://vercel.com/storage/postgres) or [Neon Postgres](https://neon.tech) for database
- [tRPC](https://github.com/trpc/trpc) for End-to-end APIs

## Model Providers

- [ChatGPT](https://platform.openai.com/account/api-keys) for OpenAI and Azure OpenAI
- [Gemini Pro](https://makersuite.google.com/app/apikey) for Google and Google Vertex AI
- [Claude AI](https://console.anthropic.com/settings/keys) for Anthropic and Google Vertex AI
- [Grok](https://console.x.ai/) for xAI

## Deploy Your Own

You can deploy your own version of the Next.js AI Chatbot to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?demo-title=Next.js+AI+Chatbot&demo-description=A+full-featured%2C+hackable+Next.js+AI+chatbot&demo-url=https%3A%2F%2Fcopilot.is%2F&project-name=Next.js+AI+Chatbot&repository-name=ai-chatbot&repository-url=https%3A%2F%2Fgithub.com%2Fcopilot-is%2Fcopilot.is&skippable-integrations=1&env=AUTH_GITHUB_ID%2CAUTH_GITHUB_SECRET%2CAUTH_SECRET&envDescription=How+to+get+these+env+vars&envLink=https%3A%2F%2Fgithub.com%2Fcopilot-is%2Fcopilot.is%2Fblob%2Fmain%2F.env.example&teamCreateStatus=hidden&stores=[{"type":"postgres"}]&buildCommand=pnpm+vercel-build)

## Creating a Vercel Postgres Instance

Follow the steps outlined in the [quick start guide](https://vercel.com/docs/storage/vercel-postgres/quickstart) provided by Vercel. This guide will assist you in creating and configuring your postgres database instance on Vercel, enabling your application to interact with it.

## Running locally

You will need to use the environment variables defined in [`.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

For local development, it's recommended to use [Supabase database](https://supabase.com) as your database. Add connection string in your  `DATABASE_URL`.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various OpenAI and authentication provider accounts.

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

Your app should now be running on [localhost:3000](http://localhost:3000/).

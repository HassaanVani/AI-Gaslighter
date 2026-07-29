# AI-Gaslighter

## Project description

Chat-style web experiment with a server-side API route and configurable client interaction.

## Architecture

`src/app/page.tsx` owns the screen; reusable chat components compose messages and input; `src/app/api/chat/route.ts` provides the server boundary.

## Technology

Next.js • TypeScript • React

## Run locally

`npm install && npm run dev`

## Repository guide

The implementation is organized so that entry points remain thin and domain-specific logic stays in the modules named above. Configuration, assets, and deployment files are kept separate from application code. Review the source tree before changing behavior, and keep secrets in local environment files rather than committing them.

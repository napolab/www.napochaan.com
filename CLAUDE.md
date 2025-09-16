# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portfolio and blog website for @naporin0624 built with Next.js 14, TypeScript, and deployed on Cloudflare Pages at https://napochaan.com.

## Development Commands

- `npx next dev` - Start development server (preferred)
- `pnpm dev` - Alternative development server command
- `pnpm preview` - Preview with OpenNext Cloudflare build
- `pnpm build` - Build for production
- `pnpm type-check` - TypeScript type checking (uses tsgo)
- `pnpm lint` - Run all linting (ESLint, Prettier, Markuplint)
- `pnpm fmt` - Format code
- `pnpm test` - Run Vitest tests
- `pnpm knip` - Find unused dependencies
- `pnpm typegen` - Generate Cloudflare types

## Code Standards

- **Formatting**: Prettier (2 spaces, 120 width, trailing commas)
- **Linting**: ESLint with @naporin0624/eslint-config
- **Types**: interface for behavior, type for structure
- **Components**: Directory structure with index.tsx + styles.css.ts
- **Naming**: Use "Root" instead of "Wrapper" for containers
- **Client Boundaries**: Minimize "use client" scope for SSR
- **Imports**: No relative imports with "../" patterns; use path aliases

## Tech Stack

- **Framework**: Next.js 14 with App Router + TypeScript
- **Styling**: vanilla-extract/css for CSS-in-JS
- **UI Components**: Radix UI primitives (@radix-ui/react-\*)
- **Animation**: motion/react (replaced react-spring)
- **Theme**: next-themes for light/dark mode switching
- **Typography**: BudouX for Japanese text wrapping
- **Deployment**: Cloudflare Pages with @opennextjs/cloudflare
- **Testing**: Vitest with @testing-library/react
- **Package Manager**: pnpm@10.16.1

## Architecture

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── _components/        # Page-specific components
│   └── page.tsx           # Root page
├── components/            # Shared UI components
├── theme/                 # Design system and vanilla-extract themes
├── hooks/                 # Custom React hooks
├── utils/                 # Pure utility functions
└── adapters/              # External API adapters
```

### Path Aliases (tsconfig.json)

- `@theme` → `./src/theme/index.ts`
- `@theme/*` → `./src/theme/*`
- `@components/*` → `./src/components/*`
- `@hooks/*` → `./src/hooks/*`
- `@utils/*` → `./src/utils/*`
- `@adapters/*` → `./src/adapters/*`
- `@assets/*` → `./src/assets/*`

### Component Architecture

- Component directories contain `index.tsx` + `styles.css.ts`
- Fine-grained "use client" boundaries for optimal SSR
- All components must be SSR/SSG compatible
- WAI-ARIA attributes required for accessibility

### Cloudflare Deployment

- Uses OpenNext for Cloudflare Pages compatibility
- Configured with R2 buckets for Next.js cache
- D1 database for tag-based cache invalidation
- Durable Objects for cache queue handling
- Environment-specific configs: development, staging, production

## Task Completion Checklist

1. Run `pnpm type-check` after changes
2. Run `pnpm lint` for code quality
3. Test `pnpm build` for production
4. Verify dev server with `npx next dev`
5. Ensure SSR compatibility for all components
6. Test accessibility with screen readers

# Claude Code Configuration for www.napochaan.com

This is the configuration file for Claude Code to work effectively with the www.napochaan.com project.

## Project Overview
Portfolio and blog website for @naporin0624 built with Next.js 14, TypeScript, and deployed on Cloudflare Pages.

## Development Commands
- `npx next dev` - Start development server (preferred)
- `pnpm dev` - Alternative development server command
- `pnpm build` - Build for production
- `pnpm type-check` - TypeScript type checking
- `pnpm lint` - Run all linting (ESLint, Prettier, Markuplint)
- `pnpm fmt` - Format code
- `pnpm test` - Run tests

## Code Standards
- **Formatting**: Prettier (2 spaces, 120 width, trailing commas)
- **Linting**: ESLint with @naporin0624/eslint-config
- **Types**: interface for behavior, type for structure
- **Components**: Directory structure with index.tsx + styles.css.ts
- **Naming**: Use "Root" instead of "Wrapper" for containers
- **Client Boundaries**: Minimize "use client" scope for SSR

## Tech Stack
- Next.js 14 + TypeScript
- vanilla-extract/css for styling
- motion/react for animations
- Radix UI for components
- Cloudflare Pages deployment

## Task Completion Checklist
1. Run `pnpm type-check` after changes
2. Run `pnpm lint` for code quality
3. Test `pnpm build` for production
4. Verify dev server with `npx next dev`
5. Ensure SSR compatibility for all components

## Architecture Notes
- SSR/SSG compatible components required
- Fine-grained "use client" boundaries
- WAI-ARIA attributes for accessibility
- Edge Runtime compatibility for Cloudflare Pages
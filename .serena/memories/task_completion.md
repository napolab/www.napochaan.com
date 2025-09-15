# Task Completion Guidelines for www.napochaan.com

## Required Testing Steps

1. **Type Check**: Always run `pnpm type-check` after code changes
2. **Linting**: Run `pnpm lint` to ensure code quality standards
3. **Build Test**: Run `pnpm build` to verify production build works
4. **Dev Server**: Test with `npx next dev` (preferred) or `pnpm dev`

## Component Development Workflow

1. Create component in directory structure: `_components/component-name/`
2. Include index.tsx and styles.css.ts
3. Follow interface/type conventions
4. Add proper WAI-ARIA attributes for accessibility
5. Minimize "use client" scope for SSR compatibility

## Animation Implementation

- Use motion/react for all animations
- Isolate client-side animation logic in boundary components
- Ensure SSR compatibility

## Before Completing Tasks

- Verify no TypeScript errors with `pnpm type-check`
- Ensure all linting passes with `pnpm lint`
- Test production build with `pnpm build`
- Confirm development server starts successfully

## Deployment Considerations

- Uses Cloudflare Pages for deployment
- Edge Runtime compatibility required
- SSR/SSG compatibility essential for all components

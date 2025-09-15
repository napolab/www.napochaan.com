# Style Conventions for www.napochaan.com

## Code Style Configuration

- **Prettier**: 2 spaces, 120 line width, trailing commas, semicolons
- **ESLint**: Uses @naporin0624/eslint-config with React and Next.js rules
- **TypeScript**: Strict mode enabled, ES2018 target

## Component Architecture

- Components organized in directory structure: `_components/xxx/index.tsx` and `_components/xxx/styles.css.ts`
- Use "Root" naming instead of "Wrapper" for container components
- Minimize "use client" scope by creating fine-grained boundary components

## Type Definitions

- **interface**: Use for behavior definitions and component props
- **type**: Use for structural type definitions and unions

## Import Organization

1. External libraries
2. Internal components and utilities
3. CSS imports (last)
4. Relative imports restricted (no "../" patterns)

## CSS-in-JS

- Uses vanilla-extract for styling
- Separate styles.css.ts files for component styles
- Theme system with light/dark mode support

## Animation Library

- Uses motion/react (replaced react-spring)
- Client-side animations isolated in boundary components

## Accessibility

- Proper WAI-ARIA attributes required
- Role attributes for custom elements replacing semantic HTML

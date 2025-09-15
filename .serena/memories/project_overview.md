# Project Overview: www.napochaan.com

## Purpose
Portfolio and blog website for @naporin0624, deployed at https://napochaan.com

## Tech Stack
- **Framework**: Next.js 14 with TypeScript
- **Styling**: vanilla-extract/css for CSS-in-JS
- **UI Components**: Radix UI primitives
- **Animation**: motion/react (migrated from react-spring)
- **Theme**: next-themes for light/dark mode
- **Typography**: BudouX for Japanese text wrapping
- **Deployment**: Cloudflare Pages with Edge Runtime

## Key Features
- Responsive design with light/dark themes
- Portfolio showcase with animated interactions
- Blog functionality
- Accessibility-focused with WAI-ARIA compliance
- SSR/SSG compatible architecture

## Project Structure
```
src/
├── app/                    # Next.js app directory
│   ├── _components/        # Page-specific components
│   └── page.tsx           # Main page
├── components/            # Shared components
├── theme/                 # Design system and themes
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions
└── adapters/              # External API adapters
```

## Development Notes
- Uses pnpm@10.15.1 as package manager
- Strict TypeScript configuration
- Comprehensive linting with ESLint, Prettier, Markuplint
- Component architecture emphasizes SSR compatibility
- Fine-grained "use client" boundaries for optimal performance
---
description: GLSL shaders must be separate .vert/.frag/.glsl files, colocated with components
paths:
  - "src/**/*.{ts,tsx}"
---

## Shader Code Organization

Always split GLSL shader code into separate `.vert` / `.frag` / `.glsl` files.
Never embed shaders as string literals or dynamically generate them in TypeScript.

### Colocation

Shader files must be colocated with the component that uses them:

```
component-name/
  index.tsx          ← 'use client' component
  shader.vert        ← vertex shader
  shader.frag        ← fragment shader
  noise.glsl         ← shared utility (if needed)
```

### Import

Import as raw strings (typed via `src/types/shaders.d.ts`):

```ts
// Good
import vertexShader from "./shader.vert";
import fragmentShader from "./shader.frag";
```

### Shared Utility Functions

Extract reusable GLSL code (noise, easing, math) into `.glsl` files.
Compose with the main shader via template literals:

```ts
import noiseUtils from "./noise.glsl";
import baseFrag from "./shader.frag";

const fragmentShader = `${noiseUtils}\n${baseFrag}`;
```

### Anti-patterns

```ts
// Bad — inline string literal (no syntax highlighting, hard to maintain)
const vertexShader = `
  void main() { gl_Position = projectionMatrix * ...; }
`;

// Bad — template-based generation (breaks static analysis)
const createShader = (type: string) => `
  uniform float u_${type};
  void main() { ... }
`;

// Bad — dynamic runtime loading (breaks build-time optimization)
const shader = await fetch("/shaders/custom.glsl").then((r) => r.text());
```

All shaders must be static imports resolved at build time.

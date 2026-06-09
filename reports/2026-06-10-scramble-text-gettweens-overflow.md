# ScrambleText: `RangeError: Maximum call stack size exceeded at Context.getTweens` on navigation

Date: 2026-06-10
Status: Fixed in `src/components/scramble-text/index.tsx` + regression test added
(`scramble-text.test.tsx`, "unmounts without a getTweens stack overflow on the
mobile breakpoint"). Reproduced and verified in browser-mode vitest.

## Symptom

Navigating between pages from the menu throws:

```
RangeError: Maximum call stack size exceeded
  at Context.getTweens (gsap-core)
  ... (Context.getTweens / Array.forEach repeating) ...
  at ScrambleText
```

Reloading the page clears it; it recurs after navigating again.

## Root cause

`gsap.Context.getTweens()` recurses over `context.data`:

```js
getTweens() {
  const a = [];
  this.data.forEach((e) =>
    e instanceof Context ? a.push(...e.getTweens()) : /* tween */ a.push(e),
  );
  return a;
}
```

It can only overflow if the context tree contains a **cycle**
(`U.data → C` and `C.data → U`). `getTweens` is called by `Context.kill()`,
which runs on `context.revert()` — i.e. when `useGSAP` cleans up as the page
unmounts during navigation. That is why the crash fires on navigation and a
reload (fresh context, no cycle yet) hides it.

### How the cycle forms in `ScrambleText`

`src/components/scramble-text/index.tsx`:

```js
useGSAP((_context, contextSafe) => {
  const decode = contextSafe(() => { gsap.to(fill, { scrambleText: ... }) }); // owner = useGSAP ctx U
  const mm = gsap.matchMedia();
  mm.add(DESKTOP, () => { target.addEventListener('pointerenter', () => decode()) });
  mm.add(MOBILE,  () => { ScrollTrigger.create({ start: 'top 90%', once: true, onEnter: () => decode() }) });
}, { scope: rootRef, dependencies: [children, host] });
```

GSAP's `Context.add` wrapper runs `prev.data.push(self)` — it links the
context that is _active when a function runs_ (`self`) into the
_previously active_ context (`prev`).

- `decode` is created with the **useGSAP context's** `contextSafe`, so its
  owner (`self`) is `U`.
- On a viewport where the **MOBILE** branch matches, `ScrollTrigger.create()`
  fires `onEnter` **synchronously during creation** when the element is already
  in view (`once: true`, e.g. a title/link near the top of the page).
- That synchronous `onEnter` runs **inside the matchMedia condition body**,
  where gsap's active `_context` is the conditional child context `C` — and `C`
  is already in `U.data`.
- `decode()` then runs with `self = U`, `prev = C`, so `C.data.push(U)`.

Now `U.data` contains `C` and `C.data` contains `U` → cycle → `getTweens`
overflows on the next `revert()`.

```
   U (useGSAP context)
   ├─ data: [ matchMedia, C(mobile) ]
   │                         │
   C(mobile)                 │  decode() runs while _context = C,
   └─ data: [ ..., U ] ◄─────┘  but decode is owned by U  →  C.data.push(U)

   U ──► C ──► U ──► C ──► …   (getTweens recursion never terminates)
```

The DESKTOP branch is safe on its own: `pointerenter` fires asynchronously with
`_context = null`, so `decode` (owner `U`) just adds its tween to `U.data` with
no cross-context push. The bug is specific to the **MOBILE / ScrollTrigger**
branch firing `onEnter` synchronously inside the matchMedia condition.

`EchoText` uses the same `contextSafe` decode but **no** `matchMedia` /
`ScrollTrigger`, so it never invokes `decode` while another context is active —
it is not affected.

## Evidence

Reproduced in the project's chromium (browser-mode vitest) with three cases:

1. **Mechanism** — a `contextSafe` fn (owner `U`) called inside a
   `mm.add('all', …)` body → `revert()` throws the exact `RangeError`.
2. **Realistic** — same shape using a real `ScrollTrigger.create({ once: true,
onEnter })` over an in-view element → `revert()` throws the same
   `RangeError`. This confirms `onEnter` fires synchronously during `create`.
3. **Fix** — `decode` created with the **matchMedia condition's own**
   context-safe wrapper → `revert()` does **not** throw.

## Fix

Own `decode` with the conditional context instead of the outer `useGSAP`
context. GSAP passes each matchMedia condition function `(context, contextSafe)`
where that `contextSafe` owns tweens with the conditional context `C`. Then
`decode` invoked while `_context = C` has `self === prev` → no push → no cycle,
and the tween is still reverted (the condition context is in `U.data`).

```js
useGSAP(() => {
  const mm = gsap.matchMedia();

  mm.add(DESKTOP, (_ctx, contextSafe) => {
    const decode = contextSafe(buildDecode());
    const target = props.trigger === 'group' ? props.host : rootRef.current;
    if (target === null) return;
    const onPointerEnter = (e) => { if (e.pointerType !== 'touch') decode(); };
    target.addEventListener('pointerenter', onPointerEnter);
    return () => target.removeEventListener('pointerenter', onPointerEnter);
  });

  mm.add(MOBILE, (_ctx, contextSafe) => {
    const decode = contextSafe(buildDecode());
    const trigger = rootRef.current;
    if (trigger === null) return;
    const st = ScrollTrigger.create({ trigger, start: 'top 90%', once: true, onEnter: () => decode() });
    return () => st.kill();
  });
}, { scope: rootRef, dependencies: [children, host] });
```

(`buildDecode` = the existing decode body; defined once and instantiated per
branch via that branch's `contextSafe`.)

Regression guard: keep a browser-mode test asserting that the
matchMedia-condition-owned `decode` shape does not overflow on `revert()`.

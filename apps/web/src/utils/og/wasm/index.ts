// The OG renderer's two wasm modules, imported statically. workerd refuses to compile
// wasm from bytes at runtime ("Wasm code generation disallowed by embedder"), so the
// Cloudflare Vite plugin's `CompiledWasm` rule (`*.wasm` imports) uploads each file as
// a precompiled module and the import evaluates to a `WebAssembly.Module`.
// Under vitest (node) this module is mocked with modules compiled from the same files.
import resvg from '@resvg/resvg-wasm/index_bg.wasm';
import yoga from 'satori/yoga.wasm';

export type OgWasm = { yoga: WebAssembly.Module; resvg: WebAssembly.Module };

export const OG_WASM: OgWasm = { yoga, resvg };

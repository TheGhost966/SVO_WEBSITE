/**
 * Thin runtime dispatcher — the actual logic lives in instrumentation.node.ts.
 *
 * Next.js's own guidance ("Specifying the runtime" in the instrumentation.js docs) is to split
 * node-only logic into its own file and only reach it via a branch keyed on
 * `process.env.NEXT_RUNTIME`, rather than importing node-only modules directly in this file and
 * gating them with a runtime check inside the function body. The difference matters here: a
 * runtime `if (...) return` guard only skips *executing* the imports that follow it — it doesn't
 * stop Turbopack from statically including everything reachable from this file (including
 * `payload.config.ts` → `Media.ts` → the native `sharp` addon) in the separate "Edge
 * Instrumentation" bundle it always builds alongside the Node one. Confirmed the hard way:
 * `npm run build` failed with "non-ecmascript placeable asset" on `sharp` even with an early
 * `if (process.env.NEXT_RUNTIME === 'edge') return` at the top of a single-file register() — a
 * native addon can never be represented in an edge/ESM chunk, guard or no guard, as long as it's
 * still *reachable* from this file. Only physically moving it into a separate file that this one
 * merely dynamically imports actually keeps it out of the edge bundle's module graph.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    return
  }
  const { register: registerNode } = await import('./instrumentation.node')
  await registerNode()
}

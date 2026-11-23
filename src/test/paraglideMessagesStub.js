// Test stub for the generated Paraglide messages, aliased in vitest.config.js.
// Paraglide 3 compiles messages.js to a re-export of a `virtual:paraglide/…`
// module that only its Vite plugin serves, and the unit suite runs without that
// plugin. Every message returns its own key, so code that merely touches `m`
// loads; tests asserting specific copy still `vi.mock` this module themselves.
export const m = new Proxy({}, { get: (_, key) => () => String(key) });

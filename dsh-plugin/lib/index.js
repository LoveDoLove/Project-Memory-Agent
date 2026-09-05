/**
 * @lovedolove/dsh-project-memory
 *
 * Runtime glue for the DSH bundle. The real logic lives in dsh/plugin.mjs
 * (loaded as a separate Cordis row via cordis.patch.yml). This file exists
 * only to satisfy the package entry-point requirement.
 */
export const name = "dsh-project-memory";
export const inject = [];

/**
 * Minimal no-op apply. All behavior is in dsh/plugin.mjs.
 * @param {object} ctx
 */
export function apply(ctx) {
  // Patch-only bundle — dynamic skill registration and lifecycle hooks
  // are handled by the dsh/plugin.mjs Cordis row.
}

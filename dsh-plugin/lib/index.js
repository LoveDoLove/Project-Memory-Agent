/**
 * @lovedolove/dsh-plugin
 *
 * Runtime glue for the DSH bundle. Currently minimal — all configuration
 * lives in cordis.patch.yml. This module exists so the package has a valid
 * entry point and can grow (e.g. runtime skill registration) without
 * restructuring later.
 */
export const name = "project-memory-plugin";
export const inject = [];

/**
 * Plugin apply function called by the Cordis Loader when this bundle is
 * mounted into a DSH profile. Intentionally empty: the patch layer handles
 * all configuration; no runtime services are registered here.
 *
 * @param {import('\''@deepseek-ai/cordis'\'').Context} ctx
 */
export function apply(ctx) {
  // Patch-only bundle — no runtime glue needed today.
}

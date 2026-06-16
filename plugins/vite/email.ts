import { spawn, type ChildProcess } from "child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "fs";
import { resolve } from "path";
import type { Plugin, ResolvedConfig } from "vite";

/**
 * Options for the Maizzle email Vite plugin.
 */
export interface EmailPluginOptions {
  /**
   * Port for the Maizzle dev server.
   * @default 3030
   */
  devPort?: number;
}

/**
 * Guard key to prevent re-spawning Maizzle on Vite HMR re-evaluation.
 */
const MAIZZLE_PROCESS_KEY = "___tsse_elysia_maizzle_process";

/**
 * Guard key to prevent running Maizzle build twice (once per environment).
 */
const MAIZZLE_BUILD_KEY = "___tsse_elysia_maizzle_built";

const _globalStore = globalThis as Record<string, unknown>;

/**
 * Vite plugin that manages the Maizzle email template build lifecycle.
 *
 * Maizzle configuration is at the project root (maizzle.config.ts).
 * Templates and build output reside in src/email/.
 *
 * - Dev mode: spawns `maizzle serve` alongside Vite dev server
 * - Build mode: runs `maizzle build` before Vite build completes
 * - HMR safe: uses globalThis guard to avoid duplicate process spawning
 *
 * @param options - Plugin configuration
 * @returns Vite plugin instance
 */
export function emailPlugin(options: EmailPluginOptions = {}): Plugin {
  const { devPort = 3030 } = options;

  let config: ResolvedConfig;
  let maizzleProcess: ChildProcess | null = null;

  return {
    name: "vite-plugin-maizzle",

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    configureServer() {
      // Guard: skip if already spawned (HMR re-evaluation)
      if (MAIZZLE_PROCESS_KEY in _globalStore) {
        return;
      }

      maizzleProcess = spawn("bun", ["maizzle", "serve", "--port", String(devPort)], {
        cwd: config.root,
        stdio: "inherit",
        shell: true,
      });

      _globalStore[MAIZZLE_PROCESS_KEY] = maizzleProcess;

      maizzleProcess.on("exit", (code) => {
        if (code !== null && code !== 0 && !maizzleProcess?.killed) {
          console.error(`[email-plugin] Maizzle dev server exited with code ${code}`);
        }
        delete _globalStore[MAIZZLE_PROCESS_KEY];
        maizzleProcess = null;
      });
    },

    async buildEnd() {
      // Guard: run only once, even though buildEnd fires per-environment
      if (MAIZZLE_BUILD_KEY in _globalStore) {
        return;
      }
      _globalStore[MAIZZLE_BUILD_KEY] = true;

      // Run the Maizzle build
      await new Promise<void>((resolve, reject) => {
        const buildProcess = spawn("bun", ["maizzle", "build"], {
          cwd: config.root,
          stdio: "inherit",
          shell: true,
        });

        buildProcess.on("exit", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Maizzle build failed with exit code ${code}`));
          }
        });

        buildProcess.on("error", (err) => {
          reject(err);
        });
      });

      // Copy Maizzle build output to dist/email/ for production
      const sourceDir = resolve(config.root, "src/email/build");
      const targetDir = resolve(config.root, "dist/email");

      if (existsSync(sourceDir)) {
        if (existsSync(targetDir)) {
          rmSync(targetDir, { recursive: true, force: true });
        }
        mkdirSync(targetDir, { recursive: true });
        cpSync(sourceDir, targetDir, { recursive: true });
        console.log(`[email-plugin] Copied email templates to ${targetDir}`);
      } else {
        console.warn(`[email-plugin] No build output found at ${sourceDir}`);
      }
    },

    closeBundle() {
      // Use global store if available (handles HMR re-spawn case),
      // fall back to closure variable for first-run cleanup.
      const process =
        (_globalStore[MAIZZLE_PROCESS_KEY] as ChildProcess | undefined) ?? maizzleProcess;
      if (process && !process.killed) {
        process.kill();
      }
    },
  };
}
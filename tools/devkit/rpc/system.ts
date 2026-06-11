import { defineRpcFunction } from "./helpers";

/**
 * System info RPC.
 * Gets system information including app version, runtime, uptime, and environment details.
 */
export const systemInfoRpc = defineRpcFunction({
  name: "system:info",
  type: "query",
  args: [],
  returns: undefined,
  agent: {
    description:
      "Get system information including app version, runtime, uptime, and environment details.",
    title: "System Info",
    safety: "read",
  },
  handler: async () => {
    const { APP_VERSION, APP_NAME, HOST, PORT, isProduction } = await import("~/config/index");
    return {
      appName: APP_NAME,
      version: APP_VERSION,
      host: HOST,
      port: PORT,
      runtime: typeof Bun !== "undefined" ? "bun" : "node",
      runtimeVersion:
        typeof Bun !== "undefined" ? Bun.version : (process.versions?.node ?? "unknown"),
      isProduction,
      uptime: process.uptime(),
    };
  },
});
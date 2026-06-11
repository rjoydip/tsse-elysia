#!/usr/bin/env bun
/**
 * TSSE Elysia DevKit CLI.
 * Provides developer administration commands for database health, cache stats, and system info.
 *
 * Usage:
 *   bun run devkit                       List available commands
 *   bun run devkit db:health             Check database health
 *   bun run devkit db:stats              Get database table stats
 *   bun run devkit cache:health          Check cache health
 *   bun run devkit cache:stats           Get cache backend stats
 *   bun run devkit system:info           Get system information
 */

import { rpcMap, rpcNames } from "./index";

/**
 * Main CLI entry point.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  // Show help if no command provided
  if (!command || command === "--help" || command === "-h") {
    console.log("\n  TSSE Elysia DevKit — Developer Administration Toolkit\n");
    console.log("  Usage:");
    console.log("    bun run devkit <command>  Run a devkit command\n");
    console.log("  Commands:");
    for (const name of rpcNames) {
      const rpc = rpcMap[name];
      const description = rpc.agent?.description ?? "";
      console.log(`    ${name.padEnd(20)} ${description}`);
    }
    console.log("\n  MCP Server:");
    console.log("    bun run devkit:mcp         Start MCP server for AI agents\n");
    return;
  }

  // Look up the RPC
  if (command in rpcMap) {
    const rpc = rpcMap[command as keyof typeof rpcMap];
    try {
      const handler = (rpc as unknown as { handler?: (...args: unknown[]) => Promise<unknown> })
        .handler;
      if (!handler) {
        console.error(`Error: No handler registered for '${command}'`);
        process.exit(1);
      }
      const result = await handler();
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(
        `Error executing '${command}':`,
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
    return;
  }

  console.error(`Unknown command: '${command}'`);
  console.error(`Available commands: ${rpcNames.join(", ")}`);
  process.exit(1);
}

await main();
import { afterEach } from "bun:test";
import { registerSetup } from "./helpers/db-setup";

// Register database setup for files loaded via --preload
registerSetup();

// Hint memory management
if (global.gc) {
  afterEach(() => {
    global.gc!();
  });
}
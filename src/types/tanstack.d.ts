declare module "@tanstack/react-start/server-entry" {
  import type { FetchHandler } from "@tanstack/react-start";
  export function createServerEntry(config: { fetch: FetchHandler }): { fetch: FetchHandler };
  const handler: { fetch: FetchHandler };
  export default handler;
}
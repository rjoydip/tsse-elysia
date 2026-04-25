declare global {
  interface Fetch {
    preconnect?: boolean;
  }

  var fetch: ((...args: unknown[]) => Promise<Response>) & Fetch;
}
export {};
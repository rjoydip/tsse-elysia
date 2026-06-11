/**
 * Type declarations for @usebruno/converters.
 */
declare module "@usebruno/converters" {
  /**
   * Converts an OpenAPI spec to Bruno collection format.
   */
  export function openApiToBruno(
    spec: Record<string, unknown>,
    options?: { format?: "yaml" | "json" },
  ): Promise<Record<string, unknown>>;

  /**
   * Converts Bruno collection files to OpenAPI spec.
   */
  export function convertToOpenApi(
    collectionDir: string,
    options?: { format?: "yaml" | "json" },
  ): Promise<string>;
}
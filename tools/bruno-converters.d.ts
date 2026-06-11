/**
 * Type declarations for @usebruno/converters.
 */
declare module "@usebruno/converters" {
  /**
   * Converts an OpenAPI specification to a Bruno collection.
   */
  export function openApiToBruno(spec: Record<string, unknown>): Record<string, unknown>;
}
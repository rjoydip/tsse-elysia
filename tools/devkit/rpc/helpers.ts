/**
 * Minimal RPC function type definition.
 * Replaces devframe's defineRpcFunction — an identity wrapper
 * that provides type inference for RPC definitions.
 */

export interface RpcAgentMeta {
  description: string;
  title?: string;
  safety?: "read" | "write";
}

export interface RpcFunctionDefinition {
  name: string;
  type: "query" | "mutation";
  args: unknown[];
  returns: undefined;
  agent?: RpcAgentMeta;
  handler: (...args: unknown[]) => Promise<unknown>;
}

/**
 * Identity function that validates the shape of an RPC definition.
 * Type-safe replacement for devframe's defineRpcFunction.
 */
export function defineRpcFunction<T extends RpcFunctionDefinition>(definition: T): T {
  return definition;
}
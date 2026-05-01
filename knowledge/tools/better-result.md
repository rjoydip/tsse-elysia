# Better Result - Type-Safe Error Handling

## Official Links

| Resource          | Link                                                                     |
| ----------------- | ------------------------------------------------------------------------ |
| **Website**       | [better-result.dev](https://better-result.dev/)                          |
| **GitHub**        | [dmmulroy/better-result](https://github.com/dmmulroy/better-result)      |
| **NPM**           | [better-result](https://www.npmjs.com/package/better-result)             |
| **Documentation** | [better-result.dev/introduction](https://better-result.dev/introduction) |

---

## Overview

`better-result` provides a type-safe `Result<T, E>` type (Ok/Err) to replace try/catch, with:

- **Generator-based composition** (`Result.gen()`)
- **Tagged errors** for exhaustive matching
- **Async operation support** with retry logic
- **Serialization** for RPC/storage

Instead of throwing exceptions, functions return `Result` instances that you can chain, transform, and compose using a clean, functional API.

---

## Core Concepts

### Result Type

The `Result<T, E>` type is a discriminated union representing either success (`Ok<T, E>`) or failure (`Err<T, E>`):

```typescript
type Result<T, E> = Ok<T, E> | Err<T, E>;
```

Both variants use a `status` property for TypeScript narrowing:

- `Ok`: `status: "ok"` with `value: T`
- `Err`: `status: "error"` with `error: E`

### Tagged Errors

Tagged errors provide runtime `_tag` properties for exhaustive pattern matching:

```typescript
import { TaggedError } from "better-result";

class DatabaseError extends TaggedError("DatabaseError")<{
  message: string;
  query?: string;
}>() {}

class NotFoundError extends TaggedError("NotFoundError")<{
  resource: string;
  id: string;
}>() {}

// Usage
const error = new NotFoundError({ resource: "User", id: "123" });
console.log(error._tag); // "NotFoundError"
```

---

## Creating Results

### Result.ok(value) - Success

Creates an `Ok` instance wrapping a successful value:

```typescript
import { Result } from "better-result";

// With value
const success: Result<number, string> = Result.ok(42);
console.log(success.value); // 42

// Without value (void operations)
const voidResult = Result.ok();
```

### Result.err(error) - Failure

Creates an `Err` instance wrapping an error value:

```typescript
// With custom error
const failure: Result<number, string> = Result.err("Something went wrong");
console.log(failure.error); // "Something went wrong"

// With tagged error
const dbError = Result.err(new DatabaseError({ message: "Connection failed" }));
```

### Result.try() - Wrap Sync Functions

Wraps a synchronous function that may throw:

```typescript
const parsed = Result.try({
  try: () => JSON.parse('{"test": true}'),
  catch: (e) => new ValidationError({ field: "body", message: String(e) }),
});

if (Result.isOk(parsed)) {
  console.log(parsed.value.test); // true
} else {
  console.error(parsed.error.message);
}
```

### Result.tryPromise() - Wrap Async Functions

Wraps an async function with optional retry support:

```typescript
// Basic usage
const result = await Result.tryPromise({
  try: async () => {
    const response = await fetch("https://api.example.com/users/1");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  catch: (e) =>
    new NetworkError({
      url: "https://api.example.com/users/1",
      message: e instanceof Error ? e.message : String(e),
    }),
});

// With retry configuration
const resultWithRetry = await Result.tryPromise(
  {
    try: () => fetch(url),
    catch: (e) => new NetworkError({ url, message: String(e) }),
  },
  {
    retry: {
      times: 3,
      delayMs: 100,
      backoff: "exponential", // or "linear" | "constant"
    },
  },
);
```

---

## Type Guards

### Result.isOk(result)

Returns `true` if the result is `Ok`:

```typescript
if (Result.isOk(result)) {
  // TypeScript narrows to Ok<T, E>
  console.log(result.value);
}
```

### Result.isError(result)

Returns `true` if the result is `Err`:

```typescript
if (Result.isError(result)) {
  // TypeScript narrows to Err<T, E>
  console.error(result.error);
}
```

### Instance Methods: isOk() and isErr()

```typescript
const result: Result<number, string> = Result.ok(42);

if (result.isOk()) {
  console.log(result.value); // 42
}

if (result.isErr()) {
  console.error(result.error);
}
```

---

## Instance Methods

### map(fn) - Transform Success Value

Transforms the success value if `Ok`, passes through if `Err`:

```typescript
const result = Result.ok(2)
  .map((x) => x * 2) // Ok(4)
  .map((x) => x.toString()); // Ok("4")

// Err passes through unchanged
const error = Result.err<string, string>("failed").map((x) => x.toUpperCase()); // Still Err("failed")
```

### mapError(fn) - Transform Error Value

Transforms the error value if `Err`, passes through if `Ok`:

```typescript
const result = Result.err("not found").mapError((msg) => new Error(msg)); // Err(Error("not found"))
```

### andThen(fn) - Chain Result-Returning Functions

Chains a function that returns a `Result` (flatMap/bind):

```typescript
const result = Result.ok(2).andThen((x) => (x > 0 ? Result.ok(x * 2) : Result.err("negative")));
// result: Ok(4)

// Short-circuits on error
const failed = Result.err<number, string>("failed").andThen((x) => Result.ok(x * 2));
// Still Err("failed")
```

### andThenAsync(fn) - Async Chain

Chains an async function that returns a `Result`:

```typescript
const result = await Result.ok(1).andThenAsync(async (id) => {
  const user = await fetchUser(id);
  return Result.ok(user);
});
```

### match({ ok, err }) - Pattern Matching

Pattern matches on the Result, executing the appropriate handler:

```typescript
const result: Result<number, string> = performOperation();

const output = result.match({
  ok: (value) => `Success: ${value}`,
  err: (error) => `Error: ${error}`,
});
```

### unwrap() - Extract or Throw

Extracts the value from `Ok` or throws the error:

```typescript
const result = Result.ok(42);
const value = result.unwrap(); // 42

const failed = Result.err("error");
failed.unwrap(); // Throws "error"
```

### unwrapOr(fallback) - Extract or Return Fallback

Extracts the value from `Ok` or returns a fallback:

```typescript
const result = Result.err<number, string>("failed");
const value = result.unwrapOr(0); // 0 (fallback)
```

### tap(fn) / tapAsync(fn) - Side Effects on Success

Runs a side effect on success and returns the original result:

```typescript
Result.ok(42)
  .tap((value) => console.log(`Value: ${value}`))
  .map((x) => x * 2); // Original result preserved
```

### tapError(fn) / tapErrorAsync(fn) - Side Effects on Error

Runs a side effect on error and returns the original result:

```typescript
Result.err("failed")
  .tapError((error) => console.error(`Error: ${error}`))
  .map((x) => x * 2); // Original error preserved
```

---

## Generator Composition (Result.gen)

Chain multiple Results using generator syntax — no nested callbacks or complex error handling logic:

```typescript
import { Result } from "better-result";

// Helper functions returning Results
function fetchUser(id: number): Promise<Result<Response, NetworkError>> {
  return Result.tryPromise({
    try: () => fetch(`https://api.example.com/users/${id}`),
    catch: (e) =>
      new NetworkError({
        url: `https://api.example.com/users/${id}`,
        message: e instanceof Error ? e.message : String(e),
      }),
  });
}

function parseJSON(text: string): Result<unknown, ParseError> {
  return Result.try({
    try: () => JSON.parse(text),
    catch: (e) =>
      new ParseError({
        message: e instanceof Error ? e.message : String(e),
      }),
  });
}

function validateUser(data: unknown): Result<User, ValidationError> {
  if (!data || typeof data !== "object") {
    return Result.err(new ValidationError({ field: "data", message: "Invalid data" }));
  }
  return Result.ok(data as User);
}

// Compose with Result.gen
export async function getUserProfile(
  id: number,
): Promise<Result<User, NetworkError | ParseError | ValidationError>> {
  return await Result.gen(async function* () {
    // yield* unwraps Ok or short-circuits on Err
    const response = yield* fetchUser(id);

    if (!response.ok) {
      return Result.err(
        new NetworkError({
          url: response.url,
          message: `HTTP ${response.status}`,
        }),
      );
    }

    const text = yield* Result.await(parseJSON(await response.text()));
    const json = yield* parseJSON(text);
    const user = yield* validateUser(json);

    return Result.ok(user);
  });
}
```

The `yield*` keyword automatically unwraps `Ok` values and short-circuits on `Err` values.

---

## Advanced Features

### Retry Configuration

`Result.tryPromise()` supports configurable retry with backoff strategies:

```typescript
const result = await Result.tryPromise(
  {
    try: () => fetch(url),
    catch: (e) => new NetworkError({ url, message: String(e) }),
  },
  {
    retry: {
      times: 3, // Max retry attempts
      delayMs: 100, // Base delay in ms
      backoff: "exponential", // "exponential" | "linear" | "constant"
    },
    shouldRetry: (error) => error instanceof NetworkError, // Conditional retry
  },
);
```

### Serialization

Convert Results to plain objects for RPC/storage:

```typescript
const result = Result.ok({ id: 1, name: "Alice" });

// Serialize
const serialized = Result.serialize(result);
// { status: "ok", value: { id: 1, name: "Alice" } }

// Deserialize
const deserialized = Result.deserialize(serialized);
// Result.ok({ id: 1, name: "Alice" })
```

### Partition Results

Split an array of Results into successes and errors:

```typescript
const results = [Result.ok(1), Result.err("failed"), Result.ok(2), Result.err("error")];

const [okValues, errValues] = Result.partition(results);
// okValues: [1, 2]
// errValues: ["failed", "error"]
```

### Flatten Nested Results

Flatten nested Result structures:

```typescript
const nested: Result<Result<number, string>, string> = Result.ok(Result.ok(42));

const flattened = Result.flatten(nested);
// Result.ok(42)
```

---

## Common Patterns

### Replace Try/Catch

```typescript
// Before
try {
  const data = JSON.parse(input);
  return process(data);
} catch (e) {
  return handleError(e);
}

// After
const result = Result.try({
  try: () => JSON.parse(input),
  catch: (e) => new ParseError({ message: String(e) }),
});

return result.match({
  ok: (data) => process(data),
  err: (error) => handleError(error),
});
```

### Async Operation with Error Handling

```typescript
const result = await Result.tryPromise({
  try: async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  catch: (e) =>
    new ApiError({
      url,
      message: e instanceof Error ? e.message : String(e),
    }),
});

if (Result.isOk(result)) {
  console.log("Data:", result.value);
} else {
  console.error("API Error:", result.error.message);
}
```

### Exhaustive Error Matching

```typescript
const result: Result<User, DatabaseError | NotFoundError | ValidationError> = getUser();

result.match({
  ok: (user) => `User: ${user.name}`,
  err: (error) => {
    switch (error._tag) {
      case "DatabaseError":
        return `DB Error: ${error.message}`;
      case "NotFoundError":
        return `Not found: ${error.resource}`;
      case "ValidationError":
        return `Invalid ${error.field}: ${error.message}`;
    }
  },
});
```

---

## Integration with tsse-elysia

### Library Setup

```bash
bun add better-result
```

### Creating Tagged Errors (src/lib/result.ts)

```typescript
import { Result, TaggedError } from "better-result";

export class DatabaseError extends TaggedError("DatabaseError")<{
  message: string;
  query?: string;
}>() {}

export class NotFoundError extends TaggedError("NotFoundError")<{
  resource: string;
  id: string;
}>() {}

export class ValidationError extends TaggedError("ValidationError")<{
  field: string;
  message: string;
}>() {}
```

### Repository Layer (src/repositories/)

```typescript
async findById(id: string): Promise<Result<User, DatabaseError | NotFoundError>> {
  return Result.tryPromise({
    try: () => db.query.users.findFirst({ where: { id } }),
    catch: (e) => new DatabaseError({ message: e instanceof Error ? e.message : String(e) }),
  }).andThen((user) => {
    if (!user) {
      return Result.err(new NotFoundError({ resource: "User", id }));
    }
    return Result.ok(user);
  });
}
```

### Service Layer (src/services/)

```typescript
async getUserProfile(id: string): Promise<Result<User, AppError>> {
  const result = await this.repository.findById(id);

  return result.andThen((user) => {
    // Additional business logic
    if (user.status === "inactive") {
      return Result.err(new ValidationError({
        field: "status",
        message: "User is inactive",
      }));
    }
    return Result.ok(user);
  });
}
```

### Controller Layer (src/controllers/)

```typescript
.get("/users/:id", async ({ params, error }) => {
  const result = await userService.getUserProfile(params.id);

  return result.match({
    ok: (user) => user,
    err: (e) => {
      if (e._tag === "NotFoundError") {
        return error(404, { message: "User not found" });
      }
      if (e._tag === "ValidationError") {
        return error(400, { message: e.message });
      }
      return error(500, { message: "Internal server error" });
    },
  });
})
```

---

## Documentation Index

| Page                 | Link                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------ |
| **Introduction**     | [better-result.dev/introduction](https://better-result.dev/introduction)                   |
| **Quickstart**       | [better-result.dev/quickstart](https://better-result.dev/quickstart)                       |
| **API Reference**    | [better-result.dev/api/result](https://better-result.dev/api/result)                       |
| **Static Methods**   | [better-result.dev/api/static-methods](https://better-result.dev/api/static-methods)       |
| **Instance Methods** | [better-result.dev/api/instance-methods](https://better-result.dev/api/instance-methods)   |
| **Creating Results** | [better-result.dev/core/creating-results](https://better-result.dev/core/creating-results) |
| **ok() and err()**   | [better-result.dev/api/ok-and-err](https://better-result.dev/api/ok-and-err)               |

---

## Benefits for tsse-elysia

1. **Type-Safe Error Handling**: Explicit error types in function signatures
2. **Eliminate Try/Catch**: No unhandled exceptions
3. **Consistent Patterns**: Same error handling across all layers
4. **Generator Composition**: Clean chaining without nesting
5. **Retry Support**: Built-in retry with exponential backoff
6. **Phantom Types**: Proper type inference in generator composition
7. **Serialization**: Results can be serialized for RPC/storage
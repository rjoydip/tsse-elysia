# Implementation Plan - Contract Testing with Pact and Roadmap

This plan outlines the steps to introduce contract testing using Pact to ensure the reliability of communication between the frontend (consumer) and backend (provider). It also includes the creation of a comprehensive project roadmap.

## User Review Required

> [!IMPORTANT]
> Contract testing requires maintaining a set of "pacts" (JSON files). We will initially store these locally in a `pacts/` directory. For a production environment, a Pact Broker (like PactFlow) is recommended.

> [!NOTE]
> We will focus on the Auth and User Management endpoints as the initial targets for contract testing.

## Proposed Changes

### [Contract Testing]

#### [NEW] [pact.test.ts](file:///c:/Users/rjoydip/codebase/tsse-elysia/test/contract/auth.pact.test.ts)

- Implement consumer-side tests for `GET /api/auth/get-session` and `POST /api/auth/login`.
- Generate pact files in `pacts/`.

#### [NEW] [pact.verify.ts](file:///c:/Users/rjoydip/codebase/tsse-elysia/test/contract/provider.verify.ts)

- Implement provider-side verification using the Pact Verifier.
- Set up state handlers for "authenticated session" and "user exists".

### [Planning & Documentation]

#### [MODIFY] [PLAN.md](file:///c:/Users/rjoydip/codebase/tsse-elysia/knowledge/PLAN.md)

- Add Phase 13: Contract Testing.
- Update goals and tasks to include Pact integration.

#### [NEW] [roadmap.md](file:///c:/Users/rjoydip/codebase/tsse-elysia/docs/guides/roadmap.md)

- Create a high-level roadmap based on the updated `PLAN.md`.
- Include visual progress indicators (e.g., status badges or emoji).

## Open Questions

- Should we use a public Pact Broker or keep pacts in the repository for now? (Initial approach: in-repo `pacts/` folder).
- Are there specific edge cases in Auth (e.g., 2FA, OAuth) that should be prioritized for contract testing?

## Verification Plan

### Automated Tests

- Run consumer tests: `bun test test/contract/auth.pact.test.ts`
- Run provider verification: `bun test test/contract/provider.verify.ts`
- Ensure pact files are generated and verified successfully.

### Manual Verification

- Verify that `PLAN.md` is updated correctly.
- Check that `docs/guides/roadmap.md` is readable and accurate.
import { Elysia } from "elysia";
import { emailRenderRoutes } from "./-render";

/**
 * Combined email route group.
 * Mounts email render routes under `/api/email`.
 */
export const emailRoutes = new Elysia({ name: "api.routes.email" }).use(emailRenderRoutes);
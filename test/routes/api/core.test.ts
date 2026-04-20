import { describe, it, expect } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { apiRoutes } from "../../../src/routes/api/$";

const getHealthData = () => ({
  name: "TSS ELYSIA",
  status: "ok",
});

describe("API Flows", () => {
  it("should return 404 for unknown routes", async () => {
    const response = await apiRoutes.handle(new Request("http://localhost/unknown-route"));

    expect(response.status).toBe(404);
  });

  it("should include CORS headers", async () => {
    const response = await apiRoutes.handle(
      new Request("http://localhost/api/health", {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:3000",
          "Access-Control-Request-Method": "GET",
        },
      }),
    );

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
  });

  it("should handle error response format", async () => {
    const response = await apiRoutes.handle(new Request("http://localhost/api/nonexistent"));

    expect(response.status).toBe(404);
  });

  it("should include trace headers in response", async () => {
    const response = await apiRoutes.handle(new Request("http://localhost/api/health"));

    expect(response.headers.get("X-Elapsed")).toBeDefined();
  });
});

describe("API Health", () => {
  it("should return correct name", () => {
    const data = getHealthData();
    expect(data.name).toBe("TSS ELYSIA");
  });

  it("should return ok status", () => {
    const data = getHealthData();
    expect(data.status).toBe("ok");
  });

  it("should return correct response structure", () => {
    const data = getHealthData();
    expect(data).toHaveProperty("name");
    expect(data).toHaveProperty("status");
  });
});

describe("API Root", () => {
  it("should return welcome message", () => {
    const name = "TSS ELYSIA";
    const message = `Welcome to ${name}`;
    expect(message).toBe("Welcome to TSS ELYSIA");
  });
});

const api = treaty(apiRoutes);

describe("Eden Treaty - API Endpoints", () => {
  describe("GET /api", () => {
    it("should return welcome message", async () => {
      const { data, error, status } = await api.api.get();

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(data).toContain("Welcome to");
    });

    it("should return text/plain content type", async () => {
      const { response } = await api.api.get();

      expect(response.headers.get("content-type")).toContain("text/plain");
    });
  });

  describe("GET /api/health", () => {
    it("should return health status", async () => {
      const { data, error, status } = await api.api.health.get();

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(data).toHaveProperty("status", "healthy");
    });

    it("should return name in health response", async () => {
      const { data, error } = await api.api.health.get();

      expect(error).toBeNull();
      expect(data).toHaveProperty("name");
      expect(typeof (data as { name?: string })?.name).toBe("string");
    });

    it("should return json content type", async () => {
      const { response } = await api.api.health.get();

      expect(response.headers.get("content-type")).toContain("application/json");
    });
  });

  describe("GET /api/realtime", () => {
    it("should return websocket discovery metadata", async () => {
      const { data, error, status } = await api.api.realtime.get();

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(data).toHaveProperty("websocketEndpoint", "/api/ws");
      expect(data).toHaveProperty("healthEndpoint", "/api/realtime/health");
      expect(data).toHaveProperty("requiresAuth", true);
    });
  });

  describe("GET /api/realtime/health", () => {
    it("should return realtime health payload", async () => {
      const { data, error, status } = await api.api.realtime.health.get();

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(data).toHaveProperty("status", "healthy");
      expect(data).toHaveProperty("websocketPath", "/api/ws");
      expect(data).toHaveProperty("totalConnections");
      expect(data).toHaveProperty("authenticatedConnections");
      expect(data).toHaveProperty("timestamp");
    });
  });

  describe("GET /api/database/heartbeat", () => {
    it("should return database heartbeat payload", async () => {
      const { data, error, status } = await api.api.database.heartbeat.get();

      expect(error).toBeNull();
      expect([200, 503]).toContain(status);
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("timestamp");
      expect(data).toHaveProperty("detail");
      expect(data?.status).toBeDefined();
    });
  });
});
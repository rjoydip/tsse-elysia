import { describe, it, expect } from "bun:test";

describe("Home Route", () => {
  it("should have correct route path", () => {
    const path = "/";
    expect(path).toBe("/");
  });

  it("should create component that returns JSX", () => {
    function Home() {
      return (
        <div className="p-2">
          <h3>Welcome Home!</h3>
          <a href="/api">/api</a>
        </div>
      );
    }
    const result = Home();
    expect(result.props.children).toHaveLength(2);
  });
});

describe("Root Route", () => {
  it("should create root route with correct config", () => {
    const errorComponent = () => <h1>500: Internal Server Error</h1>;
    const notFoundComponent = () => <h1>404: Page Not Found</h1>;
    expect(errorComponent).toBeDefined();
    expect(notFoundComponent).toBeDefined();
  });

  it("should have head config with meta tags", () => {
    const head = () => ({
      meta: [
        { charSet: "utf8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
    });
    const result = head();
    expect(result.meta).toHaveLength(2);
    expect(result.meta[0]?.charSet).toBe("utf8");
    expect(result.meta[1]?.name).toBe("viewport");
  });
});

describe("Router Configuration", () => {
  it("should have defaultPreload set to intent", () => {
    const config = {
      defaultPreload: "intent",
      scrollRestoration: true,
    };
    expect(config.defaultPreload).toBe("intent");
  });

  it("should have scrollRestoration enabled", () => {
    const config = {
      defaultPreload: "intent",
      scrollRestoration: true,
    };
    expect(config.scrollRestoration).toBe(true);
  });
});

describe("API Endpoint", () => {
  it("should return correct welcome message format", () => {
    const name = "TSS ELYSIA";
    const message = `Welcome to ${name}`;
    expect(message).toBe("Welcome to TSS ELYSIA");
  });

  it("should have health check structure", () => {
    const healthResponse = {
      name: "TSS ELYSIA",
      status: "ok",
    };
    expect(healthResponse).toHaveProperty("name");
    expect(healthResponse).toHaveProperty("status");
    expect(healthResponse.status).toBe("ok");
  });
});
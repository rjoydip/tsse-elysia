import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  parseDockerfile,
  extractBaseImages,
  usesBaseImage,
  getFinalBaseImage,
  countStages,
  getStartupCommand,
  parseDockerCompose,
  getServiceNames,
  getBuildServices,
  validateDockerCompose,
} from "~/lib/docker/index";

const SAMPLE_DOCKERFILE = readFileSync(
  resolve(import.meta.dir, "../../../../docker/Dockerfile"),
  "utf8",
);

const SAMPLE_DOCKER_COMPOSE = readFileSync(
  resolve(import.meta.dir, "../../../../docker/docker-compose.yml"),
  "utf8",
);

describe("parseDockerfile", () => {
  it("should parse all stages", () => {
    const result = parseDockerfile(SAMPLE_DOCKERFILE);
    expect(result.stages).toHaveLength(4);
    expect(result.stages[0].name).toBe("DEPS");
    expect(result.stages[1].name).toBe("BUILDER");
    expect(result.stages[2].name).toBe("RUNTIME-DEPS");
    expect(result.stages[3].name).toBe("PRODUCTION");
  });

  it("should identify scratch base image", () => {
    const result = parseDockerfile(SAMPLE_DOCKERFILE);
    expect(result.hasScratchBase).toBe(true);
  });

  it("should parse FROM image for each stage", () => {
    const result = parseDockerfile(SAMPLE_DOCKERFILE);
    expect(result.stages[0].fromImage).toBe("oven/bun:alpine");
    expect(result.stages[3].fromImage).toBe("scratch");
  });

  it("should collect commands for each stage", () => {
    const result = parseDockerfile(SAMPLE_DOCKERFILE);
    expect(result.stages[0].commands.length).toBeGreaterThan(0);
    expect(result.stages[3].commands).toContain("COPY --from=runtime-deps /app/bun /app/bun");
  });

  it("should mark final stage correctly", () => {
    const result = parseDockerfile(SAMPLE_DOCKERFILE);
    expect(result.stages[3].isFinalStage).toBe(true);
  });
});

describe("extractBaseImages", () => {
  it("should extract all unique base images", () => {
    const images = extractBaseImages(SAMPLE_DOCKERFILE);
    expect(images).toContain("oven/bun:alpine");
    expect(images).toContain("scratch");
    expect(images.filter((img) => img === "oven/bun:alpine")).toHaveLength(1);
  });

  it("should return empty array for empty content", () => {
    const images = extractBaseImages("");
    expect(images).toHaveLength(0);
  });

  it("should handle platform-specific FROM statements", () => {
    const content = "FROM --platform=linux/amd64 node:20-alpine AS builder";
    const images = extractBaseImages(content);
    expect(images).toContain("node:20-alpine");
  });
});

describe("usesBaseImage", () => {
  it("should detect oven/bun:alpine usage", () => {
    expect(usesBaseImage(SAMPLE_DOCKERFILE, "oven/bun:alpine")).toBe(true);
  });

  it("should detect scratch usage", () => {
    expect(usesBaseImage(SAMPLE_DOCKERFILE, "scratch")).toBe(true);
  });

  it("should return false for unused images", () => {
    expect(usesBaseImage(SAMPLE_DOCKERFILE, "nginx")).toBe(false);
  });

  it("should be case-insensitive", () => {
    expect(usesBaseImage(SAMPLE_DOCKERFILE, "OVEN/BUN:ALPINE")).toBe(true);
  });
});

describe("getFinalBaseImage", () => {
  it("should return the final FROM image", () => {
    const image = getFinalBaseImage(SAMPLE_DOCKERFILE);
    expect(image).toBe("scratch");
  });

  it("should return null for empty content", () => {
    const image = getFinalBaseImage("");
    expect(image).toBeNull();
  });
});

describe("countStages", () => {
  it("should count all FROM statements", () => {
    const count = countStages(SAMPLE_DOCKERFILE);
    expect(count).toBe(4);
  });

  it("should return 0 for empty content", () => {
    const count = countStages("");
    expect(count).toBe(0);
  });
});

describe("getStartupCommand", () => {
  it("should extract CMD instruction", () => {
    const result = getStartupCommand(SAMPLE_DOCKERFILE);
    expect(result.cmd).toEqual(["/app/bun", "run", "start"]);
  });

  it("should return null for missing CMD", () => {
    const content = "FROM alpine";
    const result = getStartupCommand(content);
    expect(result.cmd).toBeNull();
  });

  it("should handle shell form CMD", () => {
    const content = "FROM alpine\nCMD echo hello";
    const result = getStartupCommand(content);
    expect(result.cmd).toEqual(["echo", "hello"]);
  });
});

describe("parseDockerCompose", () => {
  it("should parse services from real file", () => {
    const config = parseDockerCompose(SAMPLE_DOCKER_COMPOSE);
    expect(Object.keys(config.services).length).toBeGreaterThan(0);
  });
});

describe("getServiceNames", () => {
  it("should return service names from real file", () => {
    const config = parseDockerCompose(SAMPLE_DOCKER_COMPOSE);
    const names = getServiceNames(config);
    expect(names.length).toBeGreaterThan(0);
  });
});

describe("getBuildServices", () => {
  it("should find build services from real file", () => {
    const config = parseDockerCompose(SAMPLE_DOCKER_COMPOSE);
    const buildServices = getBuildServices(config);
    expect(Array.isArray(buildServices)).toBe(true);
  });
});

it("should detect missing image and build", () => {
  const content = `
services:
  badservice:
    ports:
      - "3000:3000"
`;
  const config = parseDockerCompose(content);
  const errors = validateDockerCompose(config);
  expect(errors).toContain(
    'Service "badservice" must have either "image" or "build" configuration',
  );
});

it("should detect missing depends_on service", () => {
  const content = `
services:
  app:
    image: nginx
    depends_on:
      - nonexistent
`;
  const config = parseDockerCompose(content);
  const errors = validateDockerCompose(config);
  expect(errors).toContain('Service "app" depends on non-existent service "nonexistent"');
});

describe("Edge cases", () => {
  it("should handle empty lines and comments", () => {
    const content = `

# Comment
FROM alpine

# Another comment
CMD echo test
`;
    const result = parseDockerfile(content);
    expect(result.stages).toHaveLength(1);
  });

  it("should handle multiline YAML values", () => {
    const content = `services:
  app:
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
`;
    const config = parseDockerCompose(content);
    expect(config.services.app).toBeDefined();
  });
});
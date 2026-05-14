import type { DockerComposeConfig, DockerComposeService } from "./types";

/**
 * Parses a Dockerfile and extracts stage information
 * @param content - Dockerfile content as string
 * @returns Parsed Dockerfile with stages and metadata
 */
export function parseDockerfile(content: string): {
  stages: Array<{
    name: string;
    fromImage: string | null;
    commands: string[];
    isFinalStage: boolean;
  }>;
  hasScratchBase: boolean;
  finalStageName: string;
} {
  const lines = content.split("\n");
  const stages: Array<{
    name: string;
    fromImage: string | null;
    commands: string[];
    isFinalStage: boolean;
  }> = [];

  let currentStage: { name: string; fromImage: string | null; commands: string[] } | null = null;
  let stageIndex = 0;
  let finalStageName = "";
  let hasScratchBase = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const upperLine = trimmed.toUpperCase();

    if (upperLine.startsWith("FROM ")) {
      if (currentStage) {
        stages.push({ ...currentStage, isFinalStage: false });
      }

      const fromMatch = trimmed.match(/^FROM\s+(?:--platform=[^\s]+\s+)?(\S+)(?:\s+AS\s+(\S+))?/i);
      const fromImage = fromMatch?.[1] ?? null;
      const stageName = fromMatch?.[2]?.toUpperCase() ?? `stage${stageIndex}`;

      if (fromImage?.toLowerCase() === "scratch") {
        hasScratchBase = true;
      }

      currentStage = { name: stageName, fromImage, commands: [] };
      stageIndex++;
      finalStageName = stageName;
    } else if (currentStage) {
      if (trimmed && !trimmed.startsWith("#")) {
        currentStage.commands.push(trimmed);
      }
    }
  }

  if (currentStage) {
    stages.push({ ...currentStage, isFinalStage: true });
  }

  if (stages.length === 0) {
    finalStageName = stages[stages.length - 1]?.name ?? "";
  }

  return {
    stages,
    hasScratchBase,
    finalStageName,
  };
}

/**
 * Extracts all FROM images referenced in a Dockerfile
 * @param content - Dockerfile content as string
 * @returns Array of base images used
 */
export function extractBaseImages(content: string): string[] {
  const images: string[] = [];
  const fromRegex = /^FROM\s+(?:--platform=[^\s]+\s+)?(\S+)/gim;

  let match;
  while ((match = fromRegex.exec(content)) !== null) {
    const image = match[1];
    if (!images.includes(image)) {
      images.push(image);
    }
  }

  return images;
}

/**
 * Checks if a Dockerfile uses a specific base image
 * @param content - Dockerfile content
 * @param imageName - Image name to check (e.g., "scratch", "oven/bun:alpine")
 * @returns True if the image is used as a base
 */
export function usesBaseImage(content: string, imageName: string): boolean {
  const images = extractBaseImages(content);
  return images.some((img) => img.toLowerCase() === imageName.toLowerCase());
}

/**
 * Gets the final base image of a Dockerfile
 * @param content - Dockerfile content
 * @returns The final FROM image, or null if none found
 */
export function getFinalBaseImage(content: string): string | null {
  const images = extractBaseImages(content);
  return images[images.length - 1] ?? null;
}

/**
 * Counts the number of build stages in a Dockerfile
 * @param content - Dockerfile content
 * @returns Number of stages
 */
export function countStages(content: string): number {
  const fromRegex = /^FROM\s+/gim;
  const matches = content.match(fromRegex);
  return matches?.length ?? 0;
}

/**
 * Extracts CMD and ENTRYPOINT from Dockerfile
 * @param content - Dockerfile content
 * @returns Object with cmd and entrypoint arrays
 */
export function getStartupCommand(content: string): {
  cmd: string[] | null;
  entrypoint: string[] | null;
} {
  let cmd: string[] | null = null;
  let entrypoint: string[] | null = null;

  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toUpperCase().startsWith("CMD ")) {
      cmd = parseDockerInstruction(trimmed.substring(4));
    } else if (trimmed.toUpperCase().startsWith("ENTRYPOINT ")) {
      entrypoint = parseDockerInstruction(trimmed.substring(11));
    }
  }

  return { cmd, entrypoint };
}

function parseDockerInstruction(value: string): string[] {
  const jsonMatch = value.match(/^\[(.*)\]$/s);
  if (jsonMatch) {
    return jsonMatch[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
  }
  return shellSplit(value);
}

function shellSplit(input: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuote: string | null = null;

  for (const char of input) {
    if (inQuote) {
      if (char === inQuote) {
        inQuote = null;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      inQuote = char;
    } else if (char === " ") {
      if (current) {
        result.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current) {
    result.push(current);
  }

  return result;
}

function unquote(value: string): string {
  return value.replace(/^["']|["']$/g, "");
}

/**
 * Parses a docker-compose.yml file content
 * @param content - YAML content as string
 * @returns Parsed Docker Compose configuration
 */
export function parseDockerCompose(content: string): DockerComposeConfig {
  const services: Record<string, DockerComposeService> = {};
  let volumes: Record<string, unknown> = {};
  let networks: Record<string, unknown> = {};

  const lines = content.split("\n");
  let currentService: string | null = null;
  let currentSection: "services" | "volumes" | "networks" | null = null;
  let servicesIndent = -1;
  let currentIndent = 0;
  let currentListKey: string | null = null;
  const serviceData: Record<string, Record<string, unknown>> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    currentIndent = line.length - trimmed.length;

    if (currentSection === null) {
      if (trimmed === "services:") {
        currentSection = "services";
        servicesIndent = currentIndent;
      } else if (trimmed === "volumes:") {
        currentSection = "volumes";
      } else if (trimmed === "networks:") {
        currentSection = "networks";
      }
    } else if (currentSection === "services") {
      if (servicesIndent === -1) {
        servicesIndent = currentIndent;
      }

      if (trimmed === "volumes:" || trimmed === "networks:") {
        currentSection = trimmed === "volumes:" ? "volumes" : "networks";
        currentService = null;
        currentListKey = null;
      } else if (
        trimmed.endsWith(":") &&
        (currentIndent === servicesIndent + 2 || (servicesIndent === 0 && currentIndent === 2))
      ) {
        currentService = trimmed.slice(0, -1);
        currentListKey = null;
        if (currentService) {
          serviceData[currentService] = {};
        }
      } else if (
        currentService !== null &&
        (currentIndent === servicesIndent + 4 || (servicesIndent === 0 && currentIndent === 4))
      ) {
        currentListKey = null;
        const keyMatch = trimmed.match(/^(\w[\w-]*):\s*(.*)$/);
        if (keyMatch) {
          const [, key, value] = keyMatch;
          const trimmedValue = value.trim();

          if (key === "image") {
            serviceData[currentService]!.image = unquote(trimmedValue);
          } else if (key === "build") {
            serviceData[currentService]!.build = { context: ".", dockerfile: "Dockerfile" };
          } else if (key === "context") {
            if (serviceData[currentService]?.build) {
              (
                serviceData[currentService]!.build as { context: string; dockerfile: string }
              ).context = unquote(trimmedValue);
            }
          } else if (key === "dockerfile") {
            if (serviceData[currentService]?.build) {
              (
                serviceData[currentService]!.build as { context: string; dockerfile: string }
              ).dockerfile = unquote(trimmedValue);
            }
          } else if (key === "ports") {
            serviceData[currentService]!.ports = [];
            currentListKey = "ports";
          } else if (key === "environment") {
            serviceData[currentService]!.environment = [];
            currentListKey = "environment";
          } else if (key === "depends_on") {
            serviceData[currentService]!.depends_on = [];
            currentListKey = "depends_on";
          } else if (key === "volumes") {
            serviceData[currentService]!.volumes = [];
            currentListKey = "volumes";
          } else if (key === "healthcheck") {
            serviceData[currentService]!.healthcheck = { test: [] };
          } else if (key === "restart") {
            serviceData[currentService]!.restart = unquote(trimmedValue);
          }
        }
      } else if (
        currentService !== null &&
        (currentIndent === servicesIndent + 6 || (servicesIndent === 0 && currentIndent === 6))
      ) {
        if (trimmed.startsWith("- ")) {
          const item = unquote(trimmed.substring(2));
          if (currentListKey) {
            (serviceData[currentService]![currentListKey] as string[]).push(item);
          }
        } else if (trimmed.match(/^(context|dockerfile):/)) {
          const kvMatch = trimmed.match(/^(context|dockerfile):\s*(.*)$/);
          if (kvMatch && serviceData[currentService]?.build) {
            const [, kvKey, kvValue] = kvMatch;
            if (kvKey === "context" || kvKey === "dockerfile") {
              (serviceData[currentService]!.build as Record<string, string>)[kvKey] =
                unquote(kvValue);
            }
          }
        } else if (trimmed.startsWith("test:")) {
          const testItems: string[] = [];
          let j = i + 1;
          while (j < lines.length) {
            const testLine = lines[j].trim();
            if (testLine.startsWith("- ")) {
              testItems.push(testLine.substring(2));
              j++;
            } else {
              break;
            }
          }
          if (serviceData[currentService]?.healthcheck && testItems.length > 0) {
            serviceData[currentService].healthcheck = { test: testItems };
          }
        }
      } else if (currentService !== null && currentIndent <= 2) {
        currentService = null;
        currentListKey = null;
      }
    } else if (currentSection === "volumes") {
      if ((currentIndent === 0 || currentIndent === 2) && trimmed.endsWith(":")) {
        const volName = trimmed.slice(0, -1);
        volumes[volName] = {};
      }
    } else if (currentSection === "networks") {
      if (currentIndent === 0 && trimmed.endsWith(":")) {
        const netName = trimmed.slice(0, -1);
        networks[netName] = {};
      }
    }
  }

  for (const [name, data] of Object.entries(serviceData)) {
    const svc = data as Record<string, unknown>;
    services[name] = {
      image: svc.image as string | undefined,
      build: svc.build as { context: string; dockerfile: string } | undefined,
      ports: svc.ports as string[] | undefined,
      environment: svc.environment as string[] | undefined,
      depends_on: svc.depends_on as string[] | undefined,
      volumes: svc.volumes as string[] | undefined,
      healthcheck: svc.healthcheck as { test: string[] } | undefined,
      restart: svc.restart as string | undefined,
    };
  }

  return { services, volumes, networks };
}

/**
 * Gets all service names from a docker-compose configuration
 * @param config - Parsed Docker Compose config
 * @returns Array of service names
 */
export function getServiceNames(config: DockerComposeConfig): string[] {
  return Object.keys(config.services);
}

/**
 * Gets services that have build configuration
 * @param config - Parsed Docker Compose config
 * @returns Array of service names with build configs
 */
export function getBuildServices(config: DockerComposeConfig): string[] {
  return Object.entries(config.services)
    .filter(([, service]) => service.build !== undefined)
    .map(([name]) => name);
}

/**
 * Gets services that have health checks
 * @param config - Parsed Docker Compose config
 * @returns Array of service names with health checks
 */
export function getHealthCheckedServices(config: DockerComposeConfig): string[] {
  return Object.entries(config.services)
    .filter(([, service]) => service.healthcheck !== undefined)
    .map(([name]) => name);
}

/**
 * Validates docker-compose configuration
 * @param config - Parsed Docker Compose config
 * @returns Array of validation errors
 */
export function validateDockerCompose(config: DockerComposeConfig): string[] {
  const errors: string[] = [];

  for (const [name, service] of Object.entries(config.services)) {
    if (!service.image && !service.build) {
      errors.push(`Service "${name}" must have either "image" or "build" configuration`);
    }

    if (service.build) {
      if (!service.build.context) {
        errors.push(`Service "${name}" build context is required`);
      }
    }

    if (service.depends_on) {
      for (const dep of service.depends_on) {
        if (!config.services[dep]) {
          errors.push(`Service "${name}" depends on non-existent service "${dep}"`);
        }
      }
    }
  }

  return errors;
}
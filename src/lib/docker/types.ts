/**
 * Docker-related type definitions
 */

export interface DockerStage {
  name: string;
  fromImage: string | null;
  commands: string[];
  comment?: string;
}

export interface ParsedDockerfile {
  stages: DockerStage[];
  finalStage: string;
  hasScratchBase: boolean;
  baseImages: string[];
}

export interface DockerComposeService {
  image?: string;
  build?: {
    context: string;
    dockerfile: string;
  };
  ports?: string[];
  environment?: Record<string, string | number | undefined> | string[];
  depends_on?: string[];
  volumes?: string[];
  healthcheck?: {
    test: string[];
    interval?: string;
    timeout?: string;
    retries?: number;
    start_period?: string;
  };
  restart?: string;
}

export interface DockerComposeConfig {
  version?: string;
  services: Record<string, DockerComposeService>;
  volumes?: Record<string, unknown>;
  networks?: Record<string, unknown>;
}
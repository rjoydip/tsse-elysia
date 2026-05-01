/**
 * Display settings service.
 * Encapsulates display business logic, uses repository for DB operations.
 */

import type { DisplayResponse, UpdateDisplayInput } from "./types";
import {
  displayRepository,
  type IDisplayRepository,
} from "~/repositories/settings/display.repository";
import { Result } from "~/lib/result";
import { settingsLogger } from "~/lib/logger";

/**
 * Display service interface.
 */
export interface IDisplayService {
  getDisplay(userId: string): Promise<DisplayResponse>;
  updateDisplay(userId: string, input: UpdateDisplayInput): Promise<DisplayResponse>;
}

/**
 * Display service implementation.
 */
export class DisplayService implements IDisplayService {
  private repository: IDisplayRepository;

  constructor(repository: IDisplayRepository = displayRepository) {
    this.repository = repository;
  }

  /**
   * Gets a user's display settings, returning defaults if not found.
   */
  async getDisplay(userId: string): Promise<DisplayResponse> {
    const displayResult = await this.repository.findDisplayByUserId(userId);

    if (Result.isOk(displayResult) && displayResult.value) {
      return {
        items: JSON.parse(displayResult.value.items || '["recents","home"]'),
      };
    }

    // Display not found, return defaults
    return {
      items: ["recents", "home"],
    };
  }

  /**
   * Updates a user's display settings.
   */
  async updateDisplay(userId: string, input: UpdateDisplayInput): Promise<DisplayResponse> {
    const { items } = input;
    const existingResult = await this.repository.findDisplayByUserId(userId);
    const now = new Date();
    const itemsJson = JSON.stringify(items || ["recents", "home"]);

    if (Result.isOk(existingResult) && existingResult.value) {
      // Display exists, update it
      await this.repository.updateDisplay(userId, { items: itemsJson, updatedAt: now });
      settingsLogger.debug("Display updated", { userId });
    } else {
      // Display doesn't exist, create it
      await this.repository.createDisplay({
        userId,
        items: itemsJson,
        createdAt: now,
        updatedAt: now,
      });
      settingsLogger.debug("Display created", { userId });
    }

    return {
      items: items || ["recents", "home"],
    };
  }
}

/**
 * Singleton instance of the display service.
 */
export const displayService = new DisplayService();

// Re-export types
export type { DisplayResponse, UpdateDisplayInput };
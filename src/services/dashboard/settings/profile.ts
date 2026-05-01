/**
 * Profile settings service.
 * Encapsulates profile business logic, uses repository for DB operations.
 */

import type { ProfileResponse, UpdateProfileInput } from "./types";
import {
  profileRepository,
  type IProfileRepository,
} from "~/repositories/settings/profile.repository";
import { Result } from "~/lib/result";
import { settingsLogger } from "~/lib/logger";

/**
 * Profile service interface.
 */
export interface IProfileService {
  getProfile(userId: string): Promise<ProfileResponse>;
  updateProfile(userId: string, input: UpdateProfileInput): Promise<ProfileResponse>;
}

/**
 * Profile service implementation.
 */
export class ProfileService implements IProfileService {
  private repository: IProfileRepository;

  constructor(repository: IProfileRepository = profileRepository) {
    this.repository = repository;
  }

  /**
   * Gets a user's profile, creating default if not found.
   */
  async getProfile(userId: string): Promise<ProfileResponse> {
    const profileResult = await this.repository.findProfileByUserId(userId);

    if (Result.isOk(profileResult) && profileResult.value) {
      return {
        username: profileResult.value.username,
        email: profileResult.value.email,
        bio: profileResult.value.bio,
        urls: JSON.parse(profileResult.value.urls || "[]"),
      };
    }

    // Profile not found, create default
    const userResult = await this.repository.findUserById(userId);
    const userName = Result.isOk(userResult) ? userResult.value?.name || "" : "";
    const userEmail = Result.isOk(userResult) ? userResult.value?.email || "" : "";

    await this.repository.createProfile({
      userId,
      username: userName,
      email: userEmail,
      bio: "",
      urls: "[]",
    });

    return {
      username: userName,
      email: userEmail,
      bio: "",
      urls: [],
    };
  }

  /**
   * Updates a user's profile.
   */
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<ProfileResponse> {
    const { username, bio, urls } = input;
    const existingResult = await this.repository.findProfileByUserId(userId);
    const now = new Date();

    if (Result.isOk(existingResult) && existingResult.value) {
      await this.repository.updateProfile(userId, {
        username,
        bio: bio || "",
        urls: JSON.stringify(urls || []),
        updatedAt: now,
      });
      settingsLogger.debug("Profile updated", { userId });
    } else {
      const userResult = await this.repository.findUserById(userId);
      const userEmail = Result.isOk(userResult) ? userResult.value?.email || "" : "";
      await this.repository.createProfile({
        userId,
        username,
        email: userEmail,
        bio: bio || "",
        urls: JSON.stringify(urls || []),
      });
      settingsLogger.debug("Profile created", { userId });
    }

    const updatedResult = await this.repository.findProfileByUserId(userId);
    if (Result.isOk(updatedResult) && updatedResult.value) {
      return {
        username: updatedResult.value.username,
        email: updatedResult.value.email,
        bio: updatedResult.value.bio,
        urls: JSON.parse(updatedResult.value.urls || "[]"),
      };
    }

    // Fallback
    return {
      username,
      email: "",
      bio: bio || "",
      urls: urls || [],
    };
  }
}

/**
 * Singleton instance of the profile service.
 */
export const profileService = new ProfileService();

// Re-export types
export type { ProfileResponse, UpdateProfileInput };
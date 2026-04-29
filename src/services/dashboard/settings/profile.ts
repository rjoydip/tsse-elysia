/**
 * Profile settings service.
 * Encapsulates profile business logic, uses repository for DB operations.
 */

import type { ProfileResponse, UpdateProfileInput } from "./types";
import {
  profileRepository,
  type IProfileRepository,
} from "~/repositories/settings/profile.repository";
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
    const profile = await this.repository.findProfileByUserId(userId);

    if (!profile) {
      const user = await this.repository.findUserById(userId);
      await this.repository.createProfile({
        userId,
        username: user?.name || "",
        email: user?.email || "",
        bio: "",
        urls: "[]",
      });

      return {
        username: user?.name || "",
        email: user?.email || "",
        bio: "",
        urls: [],
      };
    }

    return {
      username: profile.username,
      email: profile.email,
      bio: profile.bio,
      urls: JSON.parse(profile.urls || "[]"),
    };
  }

  /**
   * Updates a user's profile.
   */
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<ProfileResponse> {
    const { username, bio, urls } = input;
    const existing = await this.repository.findProfileByUserId(userId);
    const now = new Date();

    if (existing) {
      await this.repository.updateProfile(userId, {
        username,
        bio: bio || "",
        urls: JSON.stringify(urls || []),
        updatedAt: now,
      });
      settingsLogger.debug("Profile updated", { userId });
    } else {
      const user = await this.repository.findUserById(userId);
      await this.repository.createProfile({
        userId,
        username,
        email: user?.email || "",
        bio: bio || "",
        urls: JSON.stringify(urls || []),
      });
      settingsLogger.debug("Profile created", { userId });
    }

    const updated = await this.repository.findProfileByUserId(userId);
    return {
      username: updated!.username,
      email: updated!.email,
      bio: updated!.bio,
      urls: JSON.parse(updated!.urls || "[]"),
    };
  }
}

/**
 * Singleton instance of the profile service.
 */
export const profileService = new ProfileService();

// Re-export types
export type { ProfileResponse, UpdateProfileInput };
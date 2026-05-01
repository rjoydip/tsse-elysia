/**
 * Account settings service.
 * Encapsulates account business logic, uses repository for DB operations.
 */

import type { AccountResponse, UpdateAccountInput } from "./types";
import {
  accountRepository,
  type IAccountRepository,
} from "~/repositories/settings/account.repository";
import { Result } from "~/lib/result";
import { settingsLogger } from "~/lib/logger";

/**
 * Account service interface.
 */
export interface IAccountService {
  getAccount(userId: string): Promise<AccountResponse>;
  updateAccount(userId: string, input: UpdateAccountInput): Promise<AccountResponse>;
}

/**
 * Account service implementation.
 */
export class AccountService implements IAccountService {
  private repository: IAccountRepository;

  constructor(repository: IAccountRepository = accountRepository) {
    this.repository = repository;
  }

  /**
   * Gets a user's account settings, returning defaults if not found.
   */
  async getAccount(userId: string): Promise<AccountResponse> {
    const accountResult = await this.repository.findAccountByUserId(userId);

    if (Result.isOk(accountResult) && accountResult.value) {
      return {
        name: accountResult.value.name,
        dob: accountResult.value.dob ? new Date(accountResult.value.dob).toISOString() : null,
        language: accountResult.value.language,
      };
    }

    // Account not found, return defaults
    const userResult = await this.repository.findUserById(userId);
    const userName = Result.isOk(userResult) ? userResult.value?.name || "" : "";

    return {
      name: userName,
      dob: null,
      language: "en",
    };
  }

  /**
   * Updates a user's account settings.
   */
  async updateAccount(userId: string, input: UpdateAccountInput): Promise<AccountResponse> {
    const { name, dob, language } = input;
    const now = new Date();

    const existingResult = await this.repository.findAccountByUserId(userId);

    if (Result.isOk(existingResult) && existingResult.value) {
      // Account exists, update it
      await this.repository.updateAccount(userId, {
        name: name || "",
        dob: dob ? new Date(dob) : null,
        language: language || "en",
        updatedAt: now,
      });
      settingsLogger.debug("Account updated", { userId });
    } else {
      // Account doesn't exist, create it
      await this.repository.createAccount({
        userId,
        name: name || "",
        dob: dob ? new Date(dob) : null,
        language: language || "en",
        createdAt: now,
        updatedAt: now,
      });
      settingsLogger.debug("Account created", { userId });
    }

    return {
      name: name ?? "",
      dob: dob ?? null,
      language: language || "en",
    };
  }
}

/**
 * Singleton instance of the account service.
 */
export const accountService = new AccountService();

// Re-export types
export type { AccountResponse, UpdateAccountInput };
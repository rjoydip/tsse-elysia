/**
 * Account settings service.
 * Encapsulates account business logic, uses repository for DB operations.
 */

import type { AccountResponse, UpdateAccountInput } from "./types";
import {
  accountRepository,
  type IAccountRepository,
} from "~/repositories/settings/account.repository";
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
    const account = await this.repository.findAccountByUserId(userId);

    if (!account) {
      const user = await this.repository.findUserById(userId);
      return {
        name: user?.name || "",
        dob: null,
        language: "en",
      };
    }

    return {
      name: account.name,
      dob: account.dob ? new Date(account.dob).toISOString() : null,
      language: account.language,
    };
  }

  /**
   * Updates a user's account settings.
   */
  async updateAccount(userId: string, input: UpdateAccountInput): Promise<AccountResponse> {
    const { name, dob, language } = input;
    const existing = await this.repository.findAccountByUserId(userId);
    const now = new Date();

    if (existing) {
      await this.repository.updateAccount(userId, {
        name: name || "",
        dob: dob ? new Date(dob) : null,
        language: language || "en",
        updatedAt: now,
      });
      settingsLogger.debug("Account updated", { userId });
    } else {
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
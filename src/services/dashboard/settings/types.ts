/**
 * Settings types.
 * Shared type definitions for settings services and repositories.
 */

export interface ProfileResponse {
  username: string;
  email: string;
  bio: string;
  urls: Array<{ value: string }>;
}

export interface UpdateProfileInput {
  username: string;
  bio?: string;
  urls?: Array<{ value: string }>;
}

export interface AccountResponse {
  name: string;
  dob: string | null;
  language: string;
}

export interface UpdateAccountInput {
  name?: string;
  dob?: string | null;
  language?: string;
}

export interface DisplayResponse {
  items: string[];
}

export interface UpdateDisplayInput {
  items: string[];
}

export interface NotificationsResponse {
  type: "all" | "mentions" | "none";
  mobile: boolean;
  communication_emails: boolean;
  social_emails: boolean;
  marketing_emails: boolean;
  security_emails: boolean;
}

export interface UpdateNotificationsInput {
  type: "all" | "mentions" | "none";
  mobile: boolean;
  communication_emails: boolean;
  social_emails: boolean;
  marketing_emails: boolean;
  security_emails: boolean;
}
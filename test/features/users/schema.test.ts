/**
 * Unit tests for user form schemas and utilities.
 * Tests validation rules and helper functions.
 */

import { describe, test, expect } from "bun:test";
import { z } from "zod";

const createFormSchema = z
  .object({
    name: z.string().min(1, "Name is required."),
    username: z.string().optional(),
    email: z.email({
      error: (iss) => (iss.input === "" ? "Please enter your email" : undefined),
    }),
    password: z
      .string()
      .min(1, "Password is required.")
      .refine((pwd) => pwd.length >= 8, { message: "Password must be at least 8 characters long." })
      .refine((pwd) => /[a-z]/.test(pwd), {
        message: "Password must contain at least one lowercase letter.",
      })
      .refine((pwd) => /\d/.test(pwd), { message: "Password must contain at least one number." }),
    role: z.string().min(1, "Role is required."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

const editFormSchema = z.object({
  name: z.string().min(1, "Name is required."),
  username: z.string().optional(),
  email: z.email({
    error: (iss) => (iss.input === "" ? "Please enter your email" : undefined),
  }),
  role: z.string().min(1, "Role is required."),
});

function generateUsername(name: string, usernameInput?: string): string {
  if (usernameInput?.trim()) return usernameInput.trim();

  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

  return `${firstName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${lastName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
}

function parseName(name: string): { firstName: string; lastName: string } {
  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
  return { firstName, lastName };
}

describe("User Form Schemas", () => {
  describe("Create Form Schema", () => {
    test("should validate valid create form data", () => {
      const validData = {
        name: "John Doe",
        username: "johndoe",
        email: "john@example.com",
        password: "Password123",
        role: "admin",
        confirmPassword: "Password123",
      };

      const result = createFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test("should fail when name is empty", () => {
      const invalidData = {
        name: "",
        email: "john@example.com",
        password: "Password123",
        role: "admin",
        confirmPassword: "Password123",
      };

      const result = createFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test("should fail when email is invalid", () => {
      const invalidData = {
        name: "John Doe",
        email: "not-an-email",
        password: "Password123",
        role: "admin",
        confirmPassword: "Password123",
      };

      const result = createFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test("should fail when password is too short", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        password: "short",
        role: "admin",
        confirmPassword: "short",
      };

      const result = createFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test("should fail when password has no lowercase letter", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        password: "PASSWORD123",
        role: "admin",
        confirmPassword: "PASSWORD123",
      };

      const result = createFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test("should fail when password has no number", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Passwordonly",
        role: "admin",
        confirmPassword: "Passwordonly",
      };

      const result = createFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test("should fail when passwords don't match", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
        role: "admin",
        confirmPassword: "Different123",
      };

      const result = createFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error?.issues || [];
        const confirmPasswordError = issues.find((e: any) => e.path.includes("confirmPassword"));
        expect(confirmPasswordError?.message).toBe("Passwords don't match.");
      }
    });

    test("should fail when role is empty", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
        role: "",
        confirmPassword: "Password123",
      };

      const result = createFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("Edit Form Schema", () => {
    test("should validate valid edit form data", () => {
      const validData = {
        name: "Jane Doe",
        username: "janedoe",
        email: "jane@example.com",
        role: "manager",
      };

      const result = editFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test("should fail when name is empty", () => {
      const invalidData = {
        name: "",
        email: "jane@example.com",
        role: "manager",
      };

      const result = editFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test("should fail when role is empty", () => {
      const invalidData = {
        name: "Jane Doe",
        email: "jane@example.com",
        role: "",
      };

      const result = editFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe("Username Generation", () => {
  test("should generate username from name with spaces", () => {
    expect(generateUsername("John Doe")).toBe("john_doe");
    expect(generateUsername("Mary Jane")).toBe("mary_jane");
    expect(generateUsername("Alice Bob Charlie")).toBe("alice_bobcharlie"); // lastName joins remaining parts
  });

  test("should generate username from name with special characters", () => {
    expect(generateUsername("John O'Brien")).toBe("john_obrien");
    expect(generateUsername("Mary-Jane Watson")).toBe("maryjane_watson");
    expect(generateUsername("Jean-Pierre Dupont")).toBe("jeanpierre_dupont");
  });

  test("should use provided username if given", () => {
    expect(generateUsername("John Doe", "custom_user")).toBe("custom_user");
    expect(generateUsername("John Doe", "  ")).toBe("john_doe"); // whitespace only uses name
  });

  test("should handle single name", () => {
    expect(generateUsername("John")).toBe("john_");
    expect(generateUsername("Madonna")).toBe("madonna_");
  });

  test("should handle unicode names", () => {
    expect(generateUsername("José García")).toBe("jos_garca");
    expect(generateUsername("张三")).toBe("_");
  });
});

describe("Name Parsing", () => {
  test("should parse first and last name correctly", () => {
    expect(parseName("John Doe")).toEqual({ firstName: "John", lastName: "Doe" });
    expect(parseName("Mary Jane Watson")).toEqual({ firstName: "Mary", lastName: "Jane Watson" });
  });

  test("should handle single name", () => {
    expect(parseName("John")).toEqual({ firstName: "John", lastName: "" });
  });

  test("should trim whitespace", () => {
    expect(parseName("  John   Doe  ")).toEqual({ firstName: "John", lastName: "Doe" });
  });

  test("should handle multiple spaces", () => {
    expect(parseName("John    Doe")).toEqual({ firstName: "John", lastName: "Doe" });
  });
});
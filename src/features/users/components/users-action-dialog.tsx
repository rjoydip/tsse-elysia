"use client";

import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-store";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { PasswordInput } from "~/components/password-input";
import { SelectDropdown } from "~/components/select-dropdown";
import { roles } from "../data/data";
import { type User } from "../data/schema";

interface PasswordRequirement {
  label: string;
  test: (pwd: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (pwd) => pwd.length >= 8 },
  { label: "One uppercase letter", test: (pwd) => /[A-Z]/.test(pwd) },
  { label: "One lowercase letter", test: (pwd) => /[a-z]/.test(pwd) },
  { label: "One number", test: (pwd) => /[0-9]/.test(pwd) },
];

const createFormSchema = z
  .object({
    name: z.string().min(1, "Name is required."),
    username: z.string().optional(),
    email: z.email({
      error: (iss) => (iss.input === "" ? "Please enter your email" : undefined),
    }),
    password: z
      .string()
      .min(1, "Please enter your password")
      .refine((pwd) => pwd.length >= 8, { message: "At least 8 characters" })
      .refine((pwd) => /[A-Z]/.test(pwd), { message: "One uppercase letter" })
      .refine((pwd) => /[a-z]/.test(pwd), { message: "One lowercase letter" })
      .refine((pwd) => /[0-9]/.test(pwd), { message: "One number" }),
    role: z.string().min(1, "Role is required."),
    confirmPassword: z.string().min(1, "Please confirm your password"),
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

type UserActionDialogProps = {
  currentRow?: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

const PASSWORD_REQUIREMENTS_LABELS: Record<number, string> = {
  0: "Weak",
  1: "Weak",
  2: "Fair",
  3: "Good",
  4: "Strong",
};

const getPasswordStrength = (pwd: string): number => {
  return PASSWORD_REQUIREMENTS.filter((req) => req.test(pwd)).length;
};

const getStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return "bg-destructive";
    case 2:
      return "bg-yellow-500";
    case 3:
      return "bg-blue-500";
    case 4:
      return "bg-green-500";
    default:
      return "bg-muted";
  }
};

const getStrengthLabel = (score: number): string => {
  return PASSWORD_REQUIREMENTS_LABELS[score] ?? "";
};

export function UsersActionDialog({
  currentRow,
  open,
  onOpenChange,
  onSuccess,
}: UserActionDialogProps) {
  const isEdit = !!currentRow;
  const form = useForm({
    defaultValues: isEdit
      ? {
          name: `${currentRow.firstName ?? ""} ${currentRow.lastName ?? ""}`.trim(),
          username: currentRow.username ?? "",
          email: currentRow.email ?? "",
          role: currentRow.role ?? "",
        }
      : {
          name: "",
          username: "",
          email: "",
          role: "",
          password: "",
          confirmPassword: "",
        },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validators: {
      onChange: isEdit ? (editFormSchema as any) : (createFormSchema as any),
    },
    onSubmit: async ({ value }) => {
      try {
        const nameParts = value.name.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
        const username =
          value.username?.trim() ||
          `${firstName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${lastName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
        const requestData = {
          firstName,
          lastName,
          username,
          email: value.email,
          role: value.role,
          ...(!isEdit && { password: value.password }),
        };

        const endpoint = isEdit ? `/api/users/${currentRow.id}` : "/api/users";
        const method = isEdit ? "PATCH" : "POST";

        const response = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const error = await response.json();
          toast.error(error.error || `Failed to ${isEdit ? "update" : "create"} user`);
          return;
        }

        toast.success(`User ${isEdit ? "updated" : "created"} successfully`);

        form.reset();
        onOpenChange(false);
        onSuccess?.();
      } catch (error) {
        console.error("Save user error:", error);
        toast.error(error instanceof Error ? error.message : "Failed to save user");
      }
    },
  });

  const isSubmitting = useStore(form.baseStore, (state) => state.isSubmitting);

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset();
        onOpenChange(state);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-start">
          <DialogTitle>{isEdit ? "Edit User" : "Add New User"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the user here. " : "Create new user here. "}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="h-105 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3">
          <Form form={form} id="user-form">
            <div className="space-y-4 px-0.5">
              <FormField
                name="name"
                children={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        className="col-span-4"
                        autoComplete="off"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
              <FormField
                name="email"
                children={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="john.doe@gmail.com"
                        className="col-span-4"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />

              <FormField
                name="role"
                children={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">Role</FormLabel>
                    <SelectDropdown
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                      isControlled
                      placeholder="Select a role"
                      className="col-span-4"
                      items={roles.map(({ label, value }) => ({
                        label,
                        value,
                      }))}
                    />
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
              {!isEdit && (
                <>
                  <FormField
                    name="password"
                    children={({ field }) => (
                      <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                        <FormLabel className="col-span-2 text-end">Password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="e.g., S3cur3P@ssw0rd"
                            className="col-span-4"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            onBlur={field.onBlur}
                          />
                        </FormControl>
                        <div className="col-span-4 col-start-3">
                          {field.value && field.value.length > 0 && (
                            <div className="space-y-2 mt-2">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4].map((level) => (
                                  <div
                                    key={level}
                                    className={`h-1 flex-1 rounded-full transition-colors ${
                                      level <= getPasswordStrength(field.value)
                                        ? getStrengthColor(getPasswordStrength(field.value))
                                        : "bg-muted"
                                    }`}
                                  />
                                ))}
                              </div>
                              <p
                                className={`text-xs ${
                                  getPasswordStrength(field.value) === 4
                                    ? "text-green-600"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {getStrengthLabel(getPasswordStrength(field.value))}
                              </p>
                            </div>
                          )}
                          <FormMessage />
                          <form.Subscribe selector={(state) => state.values.password}>
                            {(password) =>
                              password &&
                              password.length > 0 && (
                                <div className="space-y-1 mt-1">
                                  {PASSWORD_REQUIREMENTS.map((req, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                      {req.test(password) ? (
                                        <svg
                                          className="w-3 h-3 text-green-500 shrink-0"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                        >
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      ) : (
                                        <div className="w-3 h-3 rounded-full border border-muted-foreground/30 shrink-0" />
                                      )}
                                      <span
                                        className={
                                          req.test(password)
                                            ? "text-green-600"
                                            : "text-muted-foreground"
                                        }
                                      >
                                        {req.label}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )
                            }
                          </form.Subscribe>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="confirmPassword"
                    children={({ field }) => (
                      <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                        <FormLabel className="col-span-2 text-end">Confirm Password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="e.g., S3cur3P@ssw0rd"
                            className="col-span-4"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            onBlur={field.onBlur}
                          />
                        </FormControl>
                        <div className="col-span-4 col-start-3">
                          <FormMessage />
                          <form.Subscribe
                            selector={(state) => [
                              state.values.password,
                              state.values.confirmPassword,
                            ]}
                          >
                            {([password, confirmPwd]) => {
                              if (!confirmPwd || confirmPwd.length === 0) return null;
                              const passwordsMatch = confirmPwd === password;
                              return (
                                <div className="flex items-center gap-2 text-xs mt-1">
                                  {passwordsMatch ? (
                                    <svg
                                      className="w-3 h-3 text-green-500 shrink-0"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  ) : (
                                    <svg
                                      className="w-3 h-3 text-red-500 shrink-0"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <line x1="18" y1="6" x2="6" y2="18" />
                                      <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                  )}
                                  <span
                                    className={passwordsMatch ? "text-green-600" : "text-red-500"}
                                  >
                                    {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                                  </span>
                                </div>
                              );
                            }}
                          </form.Subscribe>
                        </div>
                      </FormItem>
                    )}
                  />
                </>
              )}
              <div className="flex justify-end pt-4">
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
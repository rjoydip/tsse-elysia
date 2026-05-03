"use client";

import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-store";
import { showSubmittedData } from "~/components/show-submitted-data";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

const formSchema = z
  .object({
    firstName: z.string().min(1, "First Name is required."),
    lastName: z.string().min(1, "Last Name is required."),
    username: z.string().min(1, "Username is required."),
    phoneNumber: z.string().min(1, "Phone number is required."),
    email: z.email({
      error: (iss) => (iss.input === "" ? "Email is required." : undefined),
    }),
    password: z.string().transform((pwd) => pwd.trim()),
    role: z.string().min(1, "Role is required."),
    confirmPassword: z.string().transform((pwd) => pwd.trim()),
    isEdit: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.isEdit && !data.password) return true;
      return data.password.length > 0;
    },
    {
      message: "Password is required.",
      path: ["password"],
    },
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true;
      return password.length >= 8;
    },
    {
      message: "Password must be at least 8 characters long.",
      path: ["password"],
    },
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true;
      return /[a-z]/.test(password);
    },
    {
      message: "Password must contain at least one lowercase letter.",
      path: ["password"],
    },
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true;
      return /\d/.test(password);
    },
    {
      message: "Password must contain at least one number.",
      path: ["password"],
    },
  )
  .refine(
    ({ isEdit, password, confirmPassword }) => {
      if (isEdit && !password) return true;
      return password === confirmPassword;
    },
    {
      message: "Passwords don't match.",
      path: ["confirmPassword"],
    },
  );
type UserActionDialogProps = {
  currentRow?: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UsersActionDialog({ currentRow, open, onOpenChange }: UserActionDialogProps) {
  const isEdit = !!currentRow;
  const form = useForm({
    defaultValues: isEdit
      ? {
          ...currentRow,
          password: "",
          confirmPassword: "",
          isEdit,
        }
      : {
          firstName: "",
          lastName: "",
          username: "",
          email: "",
          role: "",
          phoneNumber: "",
          password: "",
          confirmPassword: "",
          isEdit,
        },
    validators: {
      onChange: formSchema as any,
    },
    onSubmit: async ({ value }) => {
      form.reset();
      showSubmittedData(value);
      onOpenChange(false);
    },
  });

  const isPasswordTouched = useStore(form.baseStore, (state) => !!state.values.password);

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
          <Form form={form}>
            <div id="user-form" className="space-y-4 px-0.5">
              <FormField
                name="firstName"
                children={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">First Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John"
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
                name="lastName"
                children={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">Last Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Doe"
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
                name="username"
                children={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="john_doe"
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
                name="phoneNumber"
                children={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+123456789"
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
                    <FormMessage className="col-span-4 col-start-3" />
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
                        disabled={!isPasswordTouched}
                        placeholder="e.g., S3cur3P@ssw0rd"
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
            </div>
          </Form>
        </div>
        <DialogFooter>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form="user-form" disabled={isSubmitting}>
                Save changes
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
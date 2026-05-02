import { z } from "zod";
import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useSession } from "~/lib/auth/client";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { showSubmittedData } from "~/components/show-submitted-data";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandItem,
} from "~/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { DatePicker } from "~/components/date-picker";
import { settingsActions } from "~/lib/stores/dashboard/settings";

/**
 * Available language options for the application.
 */
const languages = [
  { label: "English", value: "en" },
  { label: "French", value: "fr" },
  { label: "German", value: "de" },
  { label: "Spanish", value: "es" },
  { label: "Portuguese", value: "pt" },
  { label: "Russian", value: "ru" },
  { label: "Japanese", value: "ja" },
  { label: "Korean", value: "ko" },
  { label: "Chinese", value: "zh" },
] as const;

/**
 * Type for account form values inferred from schema.
 */
type AccountFormValues = {
  name: string;
  dob: Date | undefined;
  language: string;
};

/**
 * Schema for validating account form data.
 */
const accountFormSchema = z.object({
  /**
   * Name must be 1-30 characters
   */
  name: z
    .string()
    .min(1, "Please enter your name.")
    .min(2, "Name must be at least 2 characters.")
    .max(30, "Name must not be longer than 30 characters."),
  /**
   * Date of birth must be a valid date
   */
  dob: z.date("Please select your date of birth."),
  /**
   * Language must be selected from available options
   */
  language: z.string("Please select a language."),
});

/**
 * Type for account form values inferred from schema.
 */
/**
 * Account form component for editing user account settings.
 * Handles name, date of birth, and language preferences.
 * @param {{ initialAccount: any, isLoading: boolean }} props - Component props
 */
export function AccountForm({
  initialAccount,
  isLoading,
}: {
  initialAccount: any;
  isLoading: boolean;
}) {
  const { data: session } = useSession();
  const { updateAccount, submitAccount } = settingsActions;

  const form = useForm({
    defaultValues: {
      name: "",
      dob: undefined,
      language: "en",
    },
    validators: {
      onChange: accountFormSchema as any,
    },
    onSubmit: async ({ value }) => {
      updateAccount(value as any);
      submitAccount(value as any);
      showSubmittedData(value);
    },
  });

  // Update form values when initialAccount changes
  useEffect(() => {
    // Use initialAccount from route loader if available, otherwise fall back to session or empty values
    const accountData = initialAccount || {
      name: session?.user?.name || "",
      dob: undefined,
      language: "en",
    };

    const userDefaultValues: Partial<AccountFormValues> = {
      name: accountData.name || session?.user?.name || "",
      dob: accountData.dob || undefined,
      language: accountData.language || "en",
    };

    form.setFieldValue("name" as any, userDefaultValues.name || "");
    form.setFieldValue("dob" as any, userDefaultValues.dob);
    form.setFieldValue("language" as any, userDefaultValues.language || "en");
  }, [initialAccount, session]);

  return (
    <Form form={form}>
      <div className="space-y-8">
        <FormField
          name="name"
          children={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Your name"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormDescription>
                This is the name that will be displayed on your profile and in emails.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="dob"
          children={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of birth</FormLabel>
              <DatePicker selected={field.value} onSelect={(date) => field.onChange(date)} />
              <FormDescription>Your date of birth is used to calculate your age.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="language"
          children={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Language</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-50 justify-between",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value
                        ? languages.find((language) => language.value === field.value)?.label
                        : "Select language"}
                      <CaretSortIcon className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-50 p-0">
                  <Command>
                    <CommandInput placeholder="Search language..." />
                    <CommandEmpty>No language found.</CommandEmpty>
                    <CommandGroup>
                      <CommandList>
                        {languages.map((language) => (
                          <CommandItem
                            value={language.label}
                            key={language.value}
                            onSelect={() => {
                              field.onChange(language.value);
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                "size-4",
                                language.value === field.value ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {language.label}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>
                This is the language that will be used in the dashboard.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isLoading || isSubmitting}>
              {isSubmitting ? "Updating..." : "Update account"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </Form>
  );
}
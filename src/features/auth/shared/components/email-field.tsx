import { FormField, FormControl, FormItem, FormLabel, FormMessage } from "~/components/ui/form";

interface EmailFieldProps {
  fieldName: string;
  label?: string;
  placeholder?: string;
}

/**
 * Email field component that uses TanStack Form context.
 * Must be used within a `<Form>` component.
 */
export function EmailField({
  fieldName,
  label = "Email",
  placeholder = "name@example.com",
}: EmailFieldProps) {
  return (
    <FormField
      name={fieldName}
      children={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <input
              type="email"
              placeholder={placeholder}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
import { UseFormReturn } from "react-hook-form";
import { Input } from "~/components/ui/input";
import { FormField, FormControl, FormItem, FormLabel, FormMessage } from "~/components/ui/form";

interface EmailFieldProps {
  form: UseFormReturn<any>;
  fieldName: string;
  label?: string;
  placeholder?: string;
}

export function EmailField({
  form,
  fieldName,
  label = "Email",
  placeholder = "name@example.com",
}: EmailFieldProps) {
  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
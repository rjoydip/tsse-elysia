import * as React from "react";
import type { AnyFieldApi } from "@tanstack/react-form";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "~/lib/utils";
import { Label } from "~/components/ui/label";

/**
 * Context to provide the TanStack form instance across the form hierarchy.
 */
const FormContext = React.createContext<any>(null);

/**
 * Hook to access the TanStack form instance from context.
 * @returns The TanStack form instance.
 * @throws If used outside of a `<Form>` component.
 */
const useFormContext = <TFormValues = any>(): TFormValues => {
  const form = React.useContext(FormContext);
  if (!form) {
    throw new Error("useFormContext should be used within a <Form> component");
  }
  return form as TFormValues;
};

/**
 * Props for the Form component.
 */
interface FormProps {
  form: any;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

/**
 * Form component that provides the TanStack form instance via context.
 * Wrap your form with this component and pass the `form` instance.
 */
function Form({ form, children, className, ...props }: FormProps) {
  return (
    <FormContext.Provider value={form}>
      <form
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        {...props}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
}

/**
 * Context to provide field-specific information (field name, field API).
 */
const FormFieldContext = React.createContext<{
  name: string;
  fieldApi?: AnyFieldApi;
} | null>(null);

/**
 * Hook to access field state and helpers.
 * Must be used within a `<FormField>` component.
 */
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const fieldApi = fieldContext.fieldApi;
  if (!fieldApi) {
    throw new Error("useFormField must be used within a FormField with a valid field API");
  }

  const { id } = React.useContext(FormItemContext);
  const meta = fieldApi.state.meta;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    error: meta.errors.length > 0 ? { message: meta.errors.join(", ") } : undefined,
    isTouched: meta.isTouched,
    isValidating: meta.isValidating,
  };
};

/**
 * Context for FormItem to provide a unique ID.
 */
const FormItemContext = React.createContext<{ id: string }>({ id: "" });

/**
 * FormItem component that groups a form field with its label, control, description, and message.
 */
function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" className={cn("grid gap-2", className)} {...props} />
    </FormItemContext.Provider>
  );
}

/**
 * FormLabel component that renders a label associated with the form field.
 */
function FormLabel({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { formItemId } = useFormField();

  return <Label data-slot="form-label" className={className} htmlFor={formItemId} {...props} />;
}

/**
 * FormControl component that wraps the input element and associates it with the field.
 */
function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  );
}

/**
 * FormDescription component for rendering helper text.
 */
function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

/**
 * FormMessage component for rendering validation errors.
 */
function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : props.children;

  if (!body) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-sm", error && "text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
}

/**
 * Props for FormField component.
 */
interface FormFieldProps {
  name: string;
  children: (props: {
    field: { value: any; onChange: (value: any) => void; onBlur: () => void };
  }) => React.ReactNode;
}

/**
 * FormField component that connects a field to the TanStack form.
 * Must be used within a `<Form>` component.
 * Uses form.Subscribe to access field state reactively.
 */
function FormField({ name, children }: FormFieldProps) {
  const form = useFormContext();

  return (
    <FormFieldContext.Provider value={{ name }}>
      <form.Subscribe
        selector={(state: any) => ({
          value: state.values[name],
          errors: state.errors?.[name] || [],
        })}
      >
        {(fieldState: { value: any; errors: any[] }) => {
          const handleChange = (newValue: any) => {
            form.setFieldValue(name, newValue);
          };

          const handleBlur = () => {
            form.setFieldMeta(name, (prev: any) => ({ ...prev, isTouched: true }));
          };

          return (
            <FormFieldContext.Provider
              value={{
                name,
                fieldApi: {
                  state: {
                    value: fieldState.value,
                    meta: {
                      errors: fieldState.errors,
                      isTouched: false,
                      isValidating: false,
                    },
                  },
                  handleChange,
                  handleBlur,
                } as AnyFieldApi,
              }}
            >
              {children({
                field: {
                  value: fieldState.value,
                  onChange: handleChange,
                  onBlur: handleBlur,
                },
              })}
            </FormFieldContext.Provider>
          );
        }}
      </form.Subscribe>
    </FormFieldContext.Provider>
  );
}

export {
  useFormField,
  useFormContext,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
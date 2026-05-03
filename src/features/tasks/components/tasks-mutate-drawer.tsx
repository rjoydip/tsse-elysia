import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { showSubmittedData } from "~/components/show-submitted-data";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { SelectDropdown } from "~/components/select-dropdown";
import { type Task } from "../data/schema";

type TaskMutateDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow?: Task;
};

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  status: z.string().min(1, "Please select a status."),
  label: z.string().min(1, "Please select a label."),
  priority: z.string().min(1, "Please choose a priority."),
});
export function TasksMutateDrawer({ open, onOpenChange, currentRow }: TaskMutateDrawerProps) {
  const isUpdate = !!currentRow;

  const form = useForm({
    defaultValues: currentRow ?? {
      title: "",
      status: "",
      label: "",
      priority: "",
    },
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      // do something with the form data
      onOpenChange(false);
      form.reset();
      showSubmittedData(value);
    },
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        form.reset();
      }}
    >
      <SheetContent className="flex flex-col">
        <SheetHeader className="text-start">
          <SheetTitle>{isUpdate ? "Update" : "Create"} Task</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? "Update the task by providing necessary info."
              : "Add a new task by providing necessary info."}
            Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <Form form={form}>
          <div id="tasks-form" className="flex-1 space-y-6 overflow-y-auto px-4">
            <FormField
              name="title"
              children={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter a title"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="status"
              children={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <SelectDropdown
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                    isControlled
                    placeholder="Select dropdown"
                    items={[
                      { label: "In Progress", value: "in progress" },
                      { label: "Backlog", value: "backlog" },
                      { label: "Todo", value: "todo" },
                      { label: "Canceled", value: "canceled" },
                      { label: "Done", value: "done" },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="label"
              children={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center">
                        <FormControl>
                          <RadioGroupItem value="documentation" />
                        </FormControl>
                        <FormLabel className="font-normal">Documentation</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center">
                        <FormControl>
                          <RadioGroupItem value="feature" />
                        </FormControl>
                        <FormLabel className="font-normal">Feature</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center">
                        <FormControl>
                          <RadioGroupItem value="bug" />
                        </FormControl>
                        <FormLabel className="font-normal">Bug</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="priority"
              children={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center">
                        <FormControl>
                          <RadioGroupItem value="high" />
                        </FormControl>
                        <FormLabel className="font-normal">High</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center">
                        <FormControl>
                          <RadioGroupItem value="medium" />
                        </FormControl>
                        <FormLabel className="font-normal">Medium</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center">
                        <FormControl>
                          <RadioGroupItem value="low" />
                        </FormControl>
                        <FormLabel className="font-normal">Low</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>
        <SheetFooter className="gap-2">
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button form="tasks-form" type="submit" disabled={isSubmitting}>
                Save changes
              </Button>
            )}
          </form.Subscribe>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
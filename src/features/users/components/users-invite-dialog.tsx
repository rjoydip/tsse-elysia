import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { MailPlus, Send } from "lucide-react";
import { showSubmittedData } from "~/components/show-submitted-data";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
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
import { Textarea } from "~/components/ui/textarea";
import { SelectDropdown } from "~/components/select-dropdown";
import { roles } from "../data/data";

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === "" ? "Please enter an email to invite." : undefined),
  }),
  role: z.string().min(1, "Role is required."),
  desc: z.string().optional(),
});

type UserInviteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UsersInviteDialog({ open, onOpenChange }: UserInviteDialogProps) {
  const form = useForm({
    defaultValues: { email: "", role: "", desc: "" },
    validators: {
      onChange: formSchema as any,
    },
    onSubmit: async ({ value }) => {
      form.reset();
      showSubmittedData(value);
      onOpenChange(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset();
        onOpenChange(state);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-start">
          <DialogTitle className="flex items-center gap-2">
            <MailPlus /> Invite User
          </DialogTitle>
          <DialogDescription>
            Invite new user to join your team by sending them an email invitation. Assign a role to
            define their access level.
          </DialogDescription>
        </DialogHeader>
        <Form form={form}>
          <div id="user-invite-form" className="space-y-4">
            <FormField
              name="email"
              children={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="eg: john.doe@gmail.com"
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
              name="role"
              children={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <SelectDropdown
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                    isControlled
                    placeholder="Select a role"
                    items={roles.map(({ label, value }) => ({
                      label,
                      value,
                    }))}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="desc"
              children={({ field }) => (
                <FormItem className="">
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none"
                      placeholder="Add a personal note to your invitation (optional)"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>
        <DialogFooter className="gap-y-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form="user-invite-form" disabled={isSubmitting}>
                Invite <Send />
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
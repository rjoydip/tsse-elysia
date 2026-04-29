import { useNavigate } from "@tanstack/react-router";
import { authActions } from "~/lib/stores/auth";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { signOut } from "~/lib/auth/client";
import { toast } from "sonner";

interface SignOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      authActions.reset();
      toast.success("Signed out successfully");
      navigate({
        to: "/",
        replace: true,
      });
    } catch (error) {
      toast.error("Failed to sign out");
      console.error("Sign out error:", error);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Sign out"
      desc="Are you sure you want to sign out? You will need to sign in again to access your account."
      confirmText="Sign out"
      destructive
      handleConfirm={handleSignOut}
      className="sm:max-w-sm"
    />
  );
}
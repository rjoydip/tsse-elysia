import { toast } from "sonner";
import { extractAuthErrorMessage } from "~/features/auth/shared/auth-error-utils";

interface HandleSocialSignInProps {
  setLoadingProvider: (providerId: string | null) => void;
  authClient: any;
  BASE_URL: string;
}

export function createHandleSocialSignIn({
  setLoadingProvider,
  authClient,
  BASE_URL,
}: HandleSocialSignInProps): (providerId: string) => Promise<void> {
  return async function (providerId: string): Promise<void> {
    setLoadingProvider(providerId);
    try {
      const result = await authClient.signIn.social({
        provider: providerId,
        callbackURL: `${BASE_URL}/dashboard`,
      });

      if (result.error) {
        toast.error(extractAuthErrorMessage(result.error));
      }
    } catch (error) {
      toast.error(extractAuthErrorMessage(error));
    } finally {
      setLoadingProvider(null);
    }
  };
}
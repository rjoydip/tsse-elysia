import { Button } from "~/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface SocialSignInProps {
  enabledProviders: {
    id: string;
    name: string;
    icon: React.ElementType;
  }[];
  loadingProvider: string | null;
  handleSocialSignIn: (providerId: string) => Promise<void> | void;
}

export function SocialSignIn({
  enabledProviders,
  loadingProvider,
  handleSocialSignIn,
}: SocialSignInProps) {
  if (enabledProviders.length === 0) {
    return null;
  }

  return (
    <>
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <div
        className={cn("grid gap-2", {
          "grid-cols-2": enabledProviders.length > 1,
          "grid-cols-1": enabledProviders.length === 1,
        })}
      >
        {enabledProviders.map((provider) => (
          <Button
            key={provider.id}
            variant="outline"
            type="button"
            className="border-2"
            disabled={loadingProvider !== null}
            onClick={() => handleSocialSignIn(provider.id)}
          >
            {loadingProvider === provider.id ? (
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
            ) : (
              <provider.icon className="h-4 w-4 mr-2" />
            )}{" "}
            {provider.name}
          </Button>
        ))}
      </div>
    </>
  );
}
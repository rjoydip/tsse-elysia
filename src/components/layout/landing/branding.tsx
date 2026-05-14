/**
 * Branding Component
 * Provides customizable branding sections for authentication pages.
 * Supports various layouts, sizes, and visibility options.
 */

import { memo } from "react";
import { useScramble } from "@scrambl/react";

import { Logo } from "~/assets/logo";
import { APP_NAME } from "~/config";

export interface BrandTitleProps {
  /** Font size for the title */
  size?: string;
  /** Custom title text (defaults to "Start building today") */
  children?: React.ReactNode;
}

export interface BrandDescriptionProps {
  /** Font size for the description */
  size?: string;
  /** Custom description text */
  children?: React.ReactNode;
  /** Maximum width of the description */
  maxWidth?: string;
}

/**
 * ScrambledText - Applies scrambl text effect to a word/phrase
 * @example
 * <ScrambledText text="TypeScript" />
 */
const ScrambledText = memo(function ScrambledText({
  text,
  speed = 0.5,
  duration = 600,
}: {
  text: string;
  speed?: number;
  duration?: number;
}) {
  const { ref, replay } = useScramble({
    text,
    chars: "blocks",
    from: "left",
    duration: duration,
    speed: speed,
    trigger: "hover",
  });

  return (
    <span
      ref={ref}
      onClick={replay}
      className="text-primary font-medium cursor-pointer inline-block"
    />
  );
});

export interface BrandingProps {
  /** Custom title props */
  title?: BrandTitleProps;
  /** Custom description props */
  description?: BrandDescriptionProps;
  /** Visibility settings for different breakpoints */
  hidden?: {
    /** Hide on mobile (default false - shows on lg and above) */
    mobile?: boolean;
  };
  /** Content alignment */
  align?: "start" | "center" | "end";
  /** Vertical positioning */
  justify?: "start" | "center" | "end" | "between";
  /** Padding */
  padding?: string;
  /** Custom className */
  className?: string;
  /** Show default branding content */
  showDefaultContent?: boolean;
}

/**
 * BrandTitle - Customizable brand title component
 * @example
 * <BrandTitle size="5xl">Custom Title</BrandTitle>
 */
export function BrandTitle({ size = "4xl", children }: BrandTitleProps) {
  const getMobileSize = (): string => {
    switch (size) {
      case "5xl":
        return "3xl";
      case "4xl":
        return "2xl";
      case "3xl":
        return "xl";
      default:
        return size;
    }
  };

  return (
    <div className={`text-${size} md:text-${getMobileSize()} font-bold tracking-tight`}>
      {children || (
        <>
          Build faster with{" "}
          <span className="text-primary">
            <ScrambledText text={APP_NAME} speed={0.2} />
          </span>{" "}
          template
        </>
      )}
    </div>
  );
}

/**
 * BrandDescription - Customizable brand description component
 * @example
 * <BrandDescription size="xl" maxWidth="xl">Custom description text</BrandDescription>
 */
export function BrandDescription({
  size = "xl",
  children,
  maxWidth = "2xl",
}: BrandDescriptionProps) {
  const getMobileSize = (): string => {
    switch (size) {
      case "xl":
        return "md";
      default:
        return size;
    }
  };

  return (
    <p
      className={`text-${size} md:text-${getMobileSize()} max-w-${maxWidth} text-muted-foreground mx-auto mb-10 leading-relaxed`}
    >
      {children || (
        <>
          The modern full-stack framework combining <ScrambledText text="TypeScript" /> safety with{" "}
          <ScrambledText text="ElysiaJS" /> performance. Ship production-ready applications with
          confidence.
        </>
      )}
    </p>
  );
}

/**
 * Branding - Full branding section component for authentication pages
 * @example
 * <Branding />
 * <Branding align="center" justify="center" />
 * <Branding title={{ size: "5xl" }} description={{ size: "lg", maxWidth: "xl" }} />
 */
export function Branding({
  hidden = { mobile: false },
  align = "start",
  justify = "between",
  padding = "p-12",
  className = "",
  showDefaultContent = true,
  title = {},
  description = {},
}: BrandingProps) {
  /**
   * Shared auth-side panel gradient.
   * Keeping this centralized ensures login/register/forgot-password always match visually.
   */
  const brandingPanelClassName =
    "bg-gradient-to-br from-primary/20 via-primary/10 to-background/95 dark:from-primary/25 dark:via-primary/12 dark:to-background/90";

  const getHiddenClass = (): string => {
    if (hidden.mobile) {
      return "hidden lg:flex";
    }
    return "hidden lg:flex";
  };

  const getJustifyClass = (): string => {
    switch (justify) {
      case "start":
        return "justify-start";
      case "center":
        return "justify-center";
      case "end":
        return "justify-end";
      case "between":
        return "justify-between";
      default:
        return "justify-between";
    }
  };

  const getAlignClass = (): string => {
    switch (align) {
      case "start":
        return "items-start";
      case "center":
        return "items-center";
      case "end":
        return "items-end";
      default:
        return "items-start";
    }
  };

  return (
    <div
      className={`
                lg:w-1/2
                ${brandingPanelClassName}
                ${padding}
                ${getHiddenClass()}
                ${getJustifyClass()}
                ${getAlignClass()}
                flex-col
                ${className}
            `}
    >
      {showDefaultContent && (
        <div className="space-y-4">
          <BrandTitle {...title} />
          <BrandDescription {...description} />
        </div>
      )}
    </div>
  );
}

/**
 * BrandLogo - Simple logo component for branding sections
 */
export function BrandLogo({
  size = "lg",
  showName = true,
}: {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showName?: boolean;
}) {
  const sizeClasses = {
    xs: "w-6 h-6 text-lg",
    sm: "w-8 h-8 text-xl",
    md: "w-10 h-10 text-2xl",
    lg: "w-12 h-12 text-3xl",
    xl: "w-16 h-16 text-4xl",
  };

  return (
    <>
      <div
        className={`
          rounded-lg flex items-center justify-center
          ${sizeClasses[size]}
        `}
      >
        <Logo className="me-2" />
      </div>
      {showName && (
        <span className={`font-bold ${sizeClasses[size].split(" ")[1]}`}>{APP_NAME}</span>
      )}
    </>
  );
}
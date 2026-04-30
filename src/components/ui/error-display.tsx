/**
 * Error Display Component
 * Reusable component for displaying error states with icon and optional actions.
 */

import type { ReactNode } from "react";

/**
 * Props for the ErrorDisplay component.
 *
 * @property title - Optional title for the error (defaults to "Authentication Error")
 * @property message - The error message to display
 * @property children - Optional action buttons or additional content
 * @property className - Optional additional CSS classes for the container
 */
export interface ErrorDisplayProps {
  title?: string;
  message: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Displays an error state with a warning icon, title, message, and optional action buttons.
 * Used in auth guard and email verification pages.
 *
 * @example
 * <ErrorDisplay title="Verification Failed" message={errorMessage}>
 *   <Button onClick={retry}>Try Again</Button>
 * </ErrorDisplay>
 */
export function ErrorDisplay({
  title = "Authentication Error",
  message,
  children,
  className,
}: ErrorDisplayProps) {
  return (
    <div className={`flex flex-col items-center gap-4 text-center ${className ?? ""}`.trim()}>
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-destructive"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-muted-foreground text-sm mt-1">{message}</p>
      </div>
      {children}
    </div>
  );
}
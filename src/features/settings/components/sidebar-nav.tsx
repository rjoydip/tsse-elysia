import { useState, type JSX } from "react";
import { useLocation, useNavigate, Link } from "@tanstack/react-router";
import { cn } from "~/lib/utils";
import { toast } from "sonner";
import { buttonVariants } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

type SidebarNavProps = React.HTMLAttributes<HTMLElement> & {
  items: {
    href: string;
    title: string;
    icon: JSX.Element;
    disabled?: boolean;
    disabledMessage?: string;
  }[];
};

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [val, setVal] = useState(pathname ?? "/dashboard/settings");

  const handleSelect = (href: string, disabled?: boolean, disabledMessage?: string) => {
    if (disabled) {
      toast.info(disabledMessage || "This feature is not available yet");
      return;
    }
    setVal(href);
    navigate({ to: href });
  };

  return (
    <>
      <div className="p-1 md:hidden">
        <Select
          value={val}
          onValueChange={(value) => {
            const item = items.find((i) => i.href === value);
            handleSelect(value, item?.disabled, item?.disabledMessage);
          }}
        >
          <SelectTrigger className="h-12 sm:w-48">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.href} value={item.href} disabled={item.disabled}>
                <div className="flex gap-x-4 px-2 py-1">
                  <span className="scale-125">{item.icon}</span>
                  <span className="text-md">{item.title}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea
        orientation="horizontal"
        type="always"
        className="hidden w-full min-w-40 bg-background px-1 py-2 md:block"
      >
        <nav
          className={cn("flex space-x-2 py-1 lg:flex-col lg:space-y-1 lg:space-x-0", className)}
          {...props}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              to={item.disabled ? "#" : item.href}
              onClick={(e) => {
                if (item.disabled) {
                  e.preventDefault();
                  toast.info(item.disabledMessage || "This feature is not available yet");
                }
              }}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                pathname === item.href
                  ? "bg-muted hover:bg-accent"
                  : "hover:bg-accent hover:underline",
                "justify-start",
                item.disabled && "cursor-not-allowed opacity-50 pointer-events-none",
              )}
            >
              <span className="me-2">{item.icon}</span>
              {item.title}
            </Link>
          ))}
        </nav>
      </ScrollArea>
    </>
  );
}
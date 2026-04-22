/**
 * Docs Layout Route
 * Shared layout for all documentation pages
 * Provides Header, Footer, Sidebar, and breadcrumbs
 */

import { Outlet, useLocation } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { docsConfig } from "~/config/docs";
import { Header } from "~/components/layout/landing/header";
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "~/components/ui/sidebar";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { DocsSidebar } from "~/components/docs/sidebar";
import { Footer } from "~/components/layout/landing/footer";
import { AnimatedPageBackground } from "~/components/animated-page-background";
import { useScrollDirection } from "~/hooks/use-scroll-direction";
import { cn } from "~/lib/utils";

function useBreadcrumbs(pathname: string) {
  const [breadcrumbs, setBreadcrumbs] = useState<{ label: string; href?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    const items: { label: string; href?: string }[] = [];
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0 || segments[0] !== "docs") {
      setBreadcrumbs([]);
      setIsLoading(false);
      return;
    }

    items.push({ label: "Docs", href: "/docs" });

    for (const section of docsConfig) {
      const matchingItem =
        section.items.find((item) => item.href === pathname) ??
        section.items.find((item) => item.href !== "/docs" && pathname.startsWith(item.href));

      if (matchingItem) {
        items.push({ label: section.title, href: undefined });
        items.push({ label: matchingItem.name, href: matchingItem.href });
        break;
      }
    }

    setBreadcrumbs(items);
    setIsLoading(false);
  }, [pathname]);

  return { breadcrumbs, isLoading };
}

export function DocsLayout() {
  const currentPath = useLocation({ select: (location) => location.pathname });
  const { breadcrumbs, isLoading } = useBreadcrumbs(currentPath);
  const { state } = useSidebar();
  const isExpanded = state === "expanded";
  const isHeaderVisible = useScrollDirection();

  const headerMargin = isExpanded
    ? "mx-[var(--sidebar-width)]"
    : "mx-[calc(var(--sidebar-width-icon)+2rem)]";
  const contentMargin = isExpanded
    ? "mx-[var(--sidebar-width)]"
    : "mx-[calc(var(--sidebar-width-icon)+2rem)]";

  return (
    <SidebarProvider defaultOpen>
      <div className="relative isolate flex min-h-screen flex-col">
        <AnimatedPageBackground />
        <Header />
        <>
          <DocsSidebar
            className={cn(
              "transition-all duration-300 ease-in-out",
              isHeaderVisible ? "pt-12" : "pt-0",
            )}
          />
          <SidebarInset
            className={cn(
              "flex transition-all duration-300 ease-in-out",
              isHeaderVisible ? "pt-12" : "pt-0",
            )}
          >
            <header className={`flex h-16 shrink-0 items-center gap-2 ${headerMargin}`}>
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : breadcrumbs.length > 0 ? (
                <Breadcrumb>
                  <BreadcrumbList>
                    {breadcrumbs.map((item, index) => (
                      <React.Fragment key={item.label}>
                        <BreadcrumbItem
                          className={
                            index === breadcrumbs.length - 1 ? "hidden md:block" : "hidden md:block"
                          }
                        >
                          {item.href && index < breadcrumbs.length - 1 ? (
                            <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                          ) : (
                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                          )}
                        </BreadcrumbItem>
                        {index < breadcrumbs.length - 1 && (
                          <BreadcrumbSeparator className="hidden md:block" />
                        )}
                      </React.Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              ) : null}
            </header>
            <div className={`flex flex-col p-4 pt-0 transition-all duration-200 ${contentMargin}`}>
              <Outlet />
              <Footer />
            </div>
          </SidebarInset>
        </>
      </div>
    </SidebarProvider>
  );
}
import { Separator } from "~/components/ui/separator";

/**
 * Props for ContentSection component.
 */
type ContentSectionProps = {
  /** Section title */
  title: string;
  /** Section description */
  desc: string;
  /** Child components to render */
  children: React.JSX.Element;
};

/**
 * Content section wrapper component for settings pages.
 * Provides consistent styling with title, description, and content area.
 * @param {ContentSectionProps} props - Component props
 */
export function ContentSection({ title, desc, children }: ContentSectionProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-none">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <Separator className="my-4 flex-none" />
      <div className="faded-bottom h-full w-full overflow-y-auto scroll-smooth pe-4 pb-12">
        <div className="-mx-1 px-1.5 lg:max-w-xl">{children}</div>
      </div>
    </div>
  );
}
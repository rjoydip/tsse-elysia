import { type SVGProps } from "react";
import { cn } from "~/lib/utils";
import { type Direction } from "~/context/direction-provider";
import { IconBase } from "~/assets/shared/icon-base";

type IconDirProps = SVGProps<SVGSVGElement> & {
  dir: Direction;
};

export function IconDir({ dir, className, ...props }: IconDirProps) {
  return (
    <IconBase
      data-name={`icon-dir-${dir}`}
      className={cn(dir === "rtl" && "rotate-y-180", className)}
      backgroundOpacity={0.15}
      widthAdjustment={51.92}
      isRtl={dir === "rtl"}
      {...props}
    >
      <path
        fill="none"
        opacity={0.62}
        strokeLinecap="round"
        strokeMiterlimit={10}
        strokeWidth="3px"
        d="M29.41 7.4L34.67 7.4"
      />
    </IconBase>
  );
}
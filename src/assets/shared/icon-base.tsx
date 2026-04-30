import { type SVGProps } from "react";
import { cn } from "~/lib/utils";

interface IconBaseProps extends SVGProps<SVGSVGElement> {
  /** Opacity for the first background path */
  backgroundOpacity?: number;
  /** Horizontal size adjustment for the first path */
  widthAdjustment?: number;
  /** Whether to apply RTL rotation */
  isRtl?: boolean;
  /** Additional className */
  className?: string;
  /** Extra paths to render after the base icon */
  children?: React.ReactNode;
}

export function IconBase({
  backgroundOpacity = 0.15,
  widthAdjustment = 51.92,
  isRtl = false,
  className = "",
  children,
  ...props
}: IconBaseProps) {
  return (
    <svg
      data-name="icon-base"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 79.86 51.14"
      className={cn(isRtl && "rotate-y-180", className)}
      {...props}
    >
      <path
        d={`M23.42.51h${widthAdjustment}c2.21 0 4 1.79 4 4v42.18c0 2.21-1.79 4-4 4H23.42s-.04-.02-.04-.04V.55s.02-.04.04-.04z`}
        opacity={backgroundOpacity}
      />
      <path
        fill="none"
        opacity={0.72}
        strokeLinecap="round"
        strokeMiterlimit={10}
        strokeWidth="2px"
        d="M5.56 14.88L17.78 14.88"
      />
      <path
        fill="none"
        opacity={0.48}
        strokeLinecap="round"
        strokeMiterlimit={10}
        strokeWidth="2px"
        d="M5.56 22.09L16.08 22.09"
      />
      <path
        fill="none"
        opacity={0.55}
        strokeLinecap="round"
        strokeMiterlimit={10}
        strokeWidth="2px"
        d="M5.56 18.38L14.93 18.38"
      />
      <g strokeLinecap="round" strokeMiterlimit={10}>
        <circle cx={7.51} cy={7.4} r={2.54} opacity={0.8} />
        <path fill="none" opacity={0.8} strokeWidth="2px" d="M12.06 6.14L17.78 6.14" />
        <path fill="none" opacity={0.6} d="M11.85 8.79L16.91 8.79" />
      </g>
      {children}
    </svg>
  );
}
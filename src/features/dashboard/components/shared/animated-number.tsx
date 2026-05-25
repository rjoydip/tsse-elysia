/**
 * AnimatedNumber component.
 * Displays a number with smooth enter/exit transitions when the value changes.
 * Uses AnimatePresence from motion for the animation.
 * Forces an initial 0→value animation on mount so the transition is always visible.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type Transition } from "motion/react";

/** Animation presets for number transitions. */
const PRESETS: Record<string, Transition> = {
  fadeScale: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] },
  bounce: { type: "spring", stiffness: 300, damping: 12, mass: 0.8 },
  slideUp: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  pop: { type: "spring", stiffness: 400, damping: 15, mass: 0.5 },
  gentle: { duration: 0.45, ease: "easeInOut" },
};

export type AnimationPreset = keyof typeof PRESETS;

export interface AnimatedNumberProps {
  /** The numeric value to display. */
  value: number;
  /** Named animation preset or custom motion Transition object. Defaults to "bounce". */
  animation?: AnimationPreset | Transition;
  /** Optional formatting function. Defaults to locale string formatting. */
  format?: (n: number) => string;
  /** Optional className for the span. */
  className?: string;
  /** Delay in ms before the initial 0→value transition starts. Use to align with parent entrance animations. */
  enterDelay?: number;
}

export function AnimatedNumber({
  value: raw,
  animation = "bounce",
  format = (n) => n.toLocaleString(),
  className,
  enterDelay = 0,
}: AnimatedNumberProps) {
  // Force initial render with 0 so AnimatePresence always has a visible transition
  const [displayValue, setDisplayValue] = useState(0);
  const prevRaw = useRef(raw);
  const hasMounted = useRef(false);

  useEffect(() => {
    // On mount, always animate 0 → raw. On subsequent updates, skip if value hasn't changed.
    if (hasMounted.current && raw === prevRaw.current) {
      return;
    }

    hasMounted.current = true;
    prevRaw.current = raw;

    // Delay the RAF to align with parent card entrance animations
    let raf: number | null = null;

    const timer = setTimeout(() => {
      raf = requestAnimationFrame(() => {
        setDisplayValue(raw);
      });
    }, enterDelay);

    return () => {
      clearTimeout(timer);
      if (raf !== null) {
        cancelAnimationFrame(raf);
      }
    };
    // We only want this to re-fire when raw changes (enterDelay is fixed per usage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, enterDelay]);

  // Resolve the transition config from preset or custom; default is bounce
  const motionTransition: Transition =
    typeof animation === "string" ? (PRESETS[animation] ?? PRESETS.bounce) : animation;

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={String(displayValue)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={motionTransition}
        className={className}
      >
        {format(displayValue)}
      </motion.span>
    </AnimatePresence>
  );
}
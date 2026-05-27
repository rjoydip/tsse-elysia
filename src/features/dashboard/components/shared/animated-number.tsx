/**
 * AnimatedNumber component.
 * Displays a number with smooth enter/exit transitions when the value changes.
 * Uses AnimatePresence from motion for the animation.
 * Forces an initial 0→value animation on mount so the transition is always visible.
 */

import { useEffect, useState } from "react";
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

  useEffect(() => {
    // Animate from 0 → raw whenever the value changes (or on mount).
    // No hasMounted guard: under React StrictMode, the ref would persist across
    // double-mount, causing the effect to bail on the second mount and leaving
    // displayValue stuck at 0.
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
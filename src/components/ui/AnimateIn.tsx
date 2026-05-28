"use client";

import type { ReactNode, CSSProperties, ElementType } from "react";

type Animation = "fade-in" | "fade-up" | "fade-down" | "slide-right" | "slide-left" | "scale-in";

interface AnimateInProps {
  children: ReactNode;
  animation?: Animation;
  delay?: number;       // ms
  duration?: number;    // ms
  className?: string;
  as?: ElementType;
}

const ANIMATION_CLASS: Record<Animation, string> = {
  "fade-in": "animate-fade-in",
  "fade-up": "animate-fade-up",
  "fade-down": "animate-fade-down",
  "slide-right": "animate-slide-right",
  "slide-left": "animate-slide-left",
  "scale-in": "animate-scale-in",
};

export default function AnimateIn({
  children,
  animation = "fade-up",
  delay = 0,
  duration,
  className = "",
  as: Tag = "div",
}: AnimateInProps) {
  const style: CSSProperties = {};
  if (delay > 0) style.animationDelay = `${delay}ms`;
  if (duration) style.animationDuration = `${duration}ms`;

  return (
    <Tag className={`${ANIMATION_CLASS[animation]} ${className}`} style={style}>
      {children}
    </Tag>
  );
}

/** Helper to generate staggered delays for lists */
export function staggerDelay(index: number, base: number = 50): number {
  return index * base;
}

"use client";

import React from "react";

type AnimatedNavyCardProps<T extends React.ElementType = "div"> = {
  as?: T;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export default function AnimatedNavyCard<T extends React.ElementType = "div">({
  as,
  className = "",
  children,
  ...rest
}: AnimatedNavyCardProps<T>) {
  const Component = as || "div";
  const classes = ["contact-card", className].filter(Boolean).join(" ");

  return (
    <Component className={classes} {...rest}>
      {children}
      <style jsx>{`
        @keyframes contactCardSweep {
          0% {
            background-position: 0% 0;
          }
          50% {
            background-position: 100% 0;
          }
          100% {
            background-position: 0% 0;
          }
        }

        .contact-card {
          background: linear-gradient(90deg, #05070d, #0b1c32, #05070d);
          background-size: 200% 100%;
          animation: contactCardSweep 10s ease-in-out infinite;
        }
      `}</style>
    </Component>
  );
}

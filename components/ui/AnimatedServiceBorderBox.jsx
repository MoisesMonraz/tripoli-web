"use client";

import React from "react";

export default function AnimatedServiceBorderBox({
  as: Component = "div",
  className = "",
  children,
  ...rest
}) {
  const classes = ["services-card", className].filter(Boolean).join(" ");

  return (
    <Component className={classes} {...rest}>
      {children}
      <style jsx>{`
        @keyframes tmServiceFlow {
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
        .services-card {
          position: relative;
          overflow: hidden;
        }
        .services-card::before {
          content: "";
          position: absolute;
          inset: 0;
          padding: 1px;
          background-image: linear-gradient(
            90deg,
            #c9e8fb,
            #9cd8f6,
            #6cc6f0,
            #36b3e8,
            #009fe3,
            #36b3e8,
            #6cc6f0,
            #9cd8f6,
            #c9e8fb
          );
          background-size: 300% 100%;
          animation: tmServiceFlow 10s linear infinite;
          -webkit-mask:
            linear-gradient(#000, #000) content-box,
            linear-gradient(#000, #000);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>
    </Component>
  );
}

import React from "react";
import { cn } from "@/lib/utils";

export default function PageHeader({ title, subtitle, right }) {
  return (
    <div
      data-testid="page-header"
      className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
    >
      <div className="min-w-0">
        <h1
          data-testid="page-header-title"
          className={cn(
            "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight",
            "text-white"
          )}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            data-testid="page-header-subtitle"
            className="mt-2 max-w-2xl text-base md:text-lg text-white/85"
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {right ? <div data-testid="page-header-right">{right}</div> : null}
    </div>
  );
}

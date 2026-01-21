import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StatCard({ title, value, hint, testid }) {
  return (
    <Card
      data-testid={testid}
      className="rounded-2xl border-white/10 bg-white/5 backdrop-blur-md"
    >
      <CardHeader className="pb-2">
        <CardTitle
          data-testid={`${testid}-title`}
          className="text-sm font-medium text-zinc-200/70"
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          data-testid={`${testid}-value`}
          className="text-2xl font-semibold tracking-tight"
        >
          {value}
        </div>
        {hint ? (
          <div
            data-testid={`${testid}-hint`}
            className="mt-1 text-xs text-zinc-200/60"
          >
            {hint}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

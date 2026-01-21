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
          className="text-sm font-medium text-white"
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          data-testid={`${testid}-value`}
          className="text-2xl font-semibold tracking-tight text-white"
        >
          {value}
        </div>
        {hint ? (
          <div
            data-testid={`${testid}-hint`}
            className="mt-1 text-xs text-white/85"
          >
            {hint}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
